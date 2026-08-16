# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MManagment: an offline-first personal finance Android app (React Native + Expo + TypeScript). No backend, no external
API in the MVP. SQLite is the only source of truth on-device. The full spec is
`CDC_MManagment_Offline_SMS_Whitelist_Complet.pdf` (French) — read it before making product-level decisions; it
defines the SMS allowlist rules, the DB schema field names, and the roadmap phases (P0–P10) referenced throughout the
code as `CDC §N` / `PN` in comments.

## Commands

```bash
npm install                 # after any dependency change — this repo uses .npmrc legacy-peer-deps=true
                             # because expo-router@57 pulls optional web deps (@expo/ui/radix/vaul) with
                             # peer ranges that otherwise fail npm's resolver; harmless for this native app.

npx tsc --noEmit             # typecheck the whole project
npx vitest run                # run all unit tests (domain layer only — see Testing below)
npx vitest run <path>          # run a single test file, e.g. npx vitest run src/domain/sms/pipeline.test.ts
npx vitest                    # watch mode

npx expo start                 # dev server (needs a device/emulator or Expo Go for full native modules)
npx expo start --web            # Metro web preview — the only way to sanity-check the app without Android tooling
npx expo export --platform web   # one-shot static web bundle; fastest way to prove the whole route tree still
                                  # resolves after a refactor (no server, no browser needed)
npx expo-doctor                  # dependency/config sanity check
```

There is no Android SDK, Java, or Expo/EAS account configured in this repo's original dev environment — `npx expo
run:android` and `eas build` were never exercised here. If you're now in an environment that has them, that's new
information; don't assume they're still missing.

## Architecture

**`app/`** is Expo Router file-based routing only — screens, navigation, and wiring UI to state. **`src/`** is
everything else, layered so the SMS/finance business logic never depends on React Native or Expo:

- `src/domain/` — pure TypeScript (allowlist, parsers, dedupe, pipeline, finance calculations, backup payload
  shaping). No RN/Expo imports except `domain/backup/crypto.ts` and `domain/sms/nativeSmsReceiver.ts`'s stub, which
  are the two deliberate native-adapter exceptions (see below). This is the only layer with `*.test.ts` files —
  everything here runs under Vitest with zero device/emulator needed.
- `src/db/` — `client.ts` opens the singleton `expo-sqlite` connection and runs migrations; `migrations/` is an
  ordered, versioned list (`schema_migrations` table tracks what's applied — each migration is its own transaction,
  so a failure doesn't roll back prior ones); `repositories/` are thin per-table CRUD wrappers over a `DbConnection`
  interface (not `expo-sqlite` directly), which is what makes `migrationRunner.test.ts` fakeable in Vitest.
- `src/state/` — one Zustand store per entity, each a thin cache over `db/repositories` (`getRepositories()` is a
  lazy singleton). Cross-store effects are explicit: e.g. `transactionsStore.addManual` calls
  `useAccountsStore.getState().load()` afterward to refresh balances — there's no global event bus.
  `securityStore`/`smsSettingsStore` wrap `services/security` and `services/settings` instead of a repository, since
  PIN/biometric/detection-toggle state lives in `expo-secure-store`, not SQLite.
- `src/services/` — the RN/Expo-facing adapters: notifications scheduling, PIN + biometric auth, SMS
  permission/listener wiring, small `expo-secure-store`-backed app settings.
- `src/validation/` — Zod schemas doubling as the canonical entity types (`z.infer<>`). Note: the "stored record"
  schemas (`accountSchema`, `transactionSchema`, etc.) use `.nullable()` **without** `.optional()` on nullable
  columns — a DB row always has the column present, so widening to `| undefined` there just breaks callers. Separate
  `new*Schema` types (for creation) can be `.optional()` where a caller may omit a field.
- `src/components/ui/` — small style-only primitives (`Button`, `Card`, `ListItem`, `ChoiceChips`, ...) built on
  plain `StyleSheet` + `src/theme/`, not NativeWind (deliberately — see below).

### The SMS pipeline and its native boundary (CDC §3–§8, roadmap P5–P7)

`src/domain/sms/pipeline.ts`'s `processIncomingSms()` is the whole flow in one pure function: global toggle →
`allowlist.ts` (exact, case-normalized sender match — CDC §3, rejects immediately with no further inspection) →
`contentValidator.ts` (§5 "double filtrage": amount + currency + operation-verb markers must all be present before a
parser ever runs, which is what makes a promotional SMS from an authorized sender get rejected) → `parsers/` (one per
provider — `mvolaParser`/`airtelMoneyParser`/`orangeMoneyParser`/`bankParser`, dispatched via
`parsers/index.ts`'s `getParserFor`) → `dedupe.ts` (`buildDedupeKey` is pure; the actual hash function is injected as
`PipelineDeps.hashFn` so the pipeline never imports `expo-crypto`) → a discriminated `PipelineOutcome`.

**SMS reception is implemented but unverified.** `src/domain/sms/nativeSmsReceiver.ts` defines the `SmsReceiver`
interface (`requestPermission`/`isPermissionGranted`/`subscribe`); `modules/sms-receiver/` is a local Expo Module
(Kotlin, scaffolded with the real `create-expo-module` CLI so the Gradle/manifest/DSL boilerplate is authentic, not
guessed) implementing it as a dynamically-registered `BroadcastReceiver` on `SMS_RECEIVED_ACTION`. It was written
**without any Android SDK, JDK, or Kotlin compiler available** — the permission-handling flow
(`appContext.permissions`, `Events`/`OnCreate`/`OnDestroy`/`sendEvent`) was cross-checked against the real
expo-notifications/expo-local-authentication Kotlin sources in this repo's `node_modules`, not written from memory,
but it has never compiled. `src/services/sms/androidSmsReceiver.ts` wraps it via `requireOptionalNativeModule` (never
throws — returns `null` if the module isn't linked) and `smsListenerService.ts` picks it automatically over
`UnavailableSmsReceiver` once it resolves. **Do not assume it works** until it's been through `eas build --profile
development` (or local `expo run:android`) and tested on-device; the broadcast-registration flags
(`ContextCompat.RECEIVER_EXPORTED`) and `Telephony.Sms.Intents` parsing are the most likely spots to need a fix.
`smsListenerService.ts` remains the **single file** that chooses which `SmsReceiver` implementation is active — don't
add SMS-native calls anywhere else.

The parser regexes (`src/domain/sms/parsers/parser.ts`'s `extractAmount`/`extractReference`/`matchOperationType` and
each provider's verb map) are best-effort placeholders written without access to real captured SMS — CDC roadmap P6
explicitly expects these to be refined once real messages are available. Don't treat their current behavior as
authoritative.

`sms_sources` (CDC §11) has no `accountId` column of its own, but `006_add_sms_source_account.ts` adds one anyway
(nullable) so a source can be pinned to a specific account — needed once a user has two accounts of the same
provider, since the SMS sender alone can't tell them apart. `smsListenerService.processMessage` prefers
`source.accountId` when set, falling back to matching `account.provider === source.provider` (first match) when it's
NULL, which is still how a fresh single-account-per-provider setup resolves. Settings > Sources SMS surfaces the
picker only once a provider actually has more than one account.

Some mobile money/bank SMS report the post-transaction balance themselves (e.g. "Nouveau solde: 150000 Ar").
`parser.ts`'s `extractReportedBalance()` (alongside `extractAmount()`) pulls that figure when present, stored on the
pending transaction (`transactions.reportedBalance`, migration `009_add_transaction_reported_balance.ts`).
`transactionsRepository.confirm()` uses it to set the account balance directly to that reported value instead of
adding the transaction's own delta — self-healing any prior drift — unless the account was corrected to a different
one at confirm time, in which case it falls back to the normal delta. `update()`/`remove()` don't need special-casing:
they're relative deltas against whatever the balance now is, reconciled or not.

### Encrypted backup (CDC §16, roadmap P8)

`domain/backup/exportBackup.ts` / `importBackup.ts` are pure orchestration (gather → JSON → zod-validate), taking
injected `encrypt`/`decrypt` functions — tested in `backup.test.ts` with identity functions, no native crypto
involved. `domain/backup/crypto.ts` is the real adapter, using `expo-crypto`'s AES-GCM API
(`AESEncryptionKey`/`aesEncryptAsync`/`aesDecryptAsync` — added in a recent SDK; don't assume older expo-crypto docs
apply). `app/(tabs)/settings/backup.tsx` wires export fully (encrypt → write via the new `expo-file-system`
`File`/`Paths` API → `expo-sharing` share sheet) and import fully: it decrypts and zod-validates a picked `.mmbak`
file, shows a summary, and only on explicit user confirmation calls `src/db/restore.ts`'s `restoreDatabase()`.
That function **replaces** all local data (not a merge — the CDC doesn't specify a conflict policy, and replace is
the least surprising behavior for a personal single-user "go back to this backup" flow), deleting every table
child-to-parent and re-inserting the payload's rows with their original ids (preserving FK relationships like
`transactions.accountId`), all inside one `withTransactionAsync` so a failure can't leave a half-restored DB. Tested
in `restore.test.ts` with the same fake-`DbConnection` pattern as `migrationRunner.test.ts`. If that replace-not-merge
decision turns out to be wrong for how this app gets used, that's the one function to revisit.

### Everything else not implemented

- **P9 (EAS Build / GitHub Release):** an Expo account and project now exist (`app.config.ts`'s
  `extra.eas.projectId`), and `.github/workflows/build-apk.yml` builds the chosen `eas.json` profile
  (development/preview/production) on EAS's servers, downloads the resulting APK, and publishes it as a GitHub
  Release — but it's `workflow_dispatch`-only (manual trigger from the Actions tab) and still needs an `EXPO_TOKEN`
  repo secret before it can run; as of this writing it has never actually been executed, so treat the
  `eas build:list --json` parsing step as unverified the same way the native module below is. The `development`
  profile is the one that actually tests `modules/sms-receiver` (a Development Build); `preview`/`production` build a
  normal standalone APK (the native module still compiles into those too, just without the dev-client wrapper).
- **P10 (optional cloud sync):** out of scope, not started.
- Real device behavior (biometric prompts, Android notification delivery, actual file I/O to Drive/PC, and the new
  native SMS module) is unverified — this environment has no Android SDK/emulator. What's verified: `tsc --noEmit`,
  `vitest run` (the full domain layer, `restore.test.ts` included), and `expo export --platform web` bundling the
  entire route tree — including `modules/sms-receiver`'s web fallback — successfully.

## Styling and testing choices (and why)

- **Plain `StyleSheet` + `src/theme/`, not NativeWind.** The CDC leaves the choice open; without a device to check
  rendering, minimizing build-tool surface (no Babel/Tailwind config) between "compiles" and "renders correctly" in
  the web preview was the deciding factor. Revisit once real device testing is possible — either is fine.
- **Vitest, not Jest/jest-expo**, for `src/domain/**/*.test.ts`. Those files have zero RN/Expo imports by
  construction, so there's nothing to mock — Vitest runs them directly under Node. Don't add `jest-expo` /
  `react-native-testing-library` component tests without a real reason; they'd be the first tests needing an
  actual RN runtime, which this repo has deliberately avoided so far.
- `vitest.config.mts` (not `.ts`) — avoids a CJS/ESM loader warning without touching `package.json`'s module type,
  which Metro/Expo care about.

## Database schema

Table/column names in `src/db/migrations/001_init.ts` follow CDC §11 exactly. `transactions.hash` has a partial
unique index (`WHERE hash IS NOT NULL`) enforcing anti-doublon (§7) at the DB level, not just in application code.
`sms_events` intentionally has no raw-message column by default (§6 privacy rule); `002_add_sms_diagnostics.ts` adds
an opt-in `diagnosticContent` column that must stay NULL unless the user explicitly enables diagnostic mode.
