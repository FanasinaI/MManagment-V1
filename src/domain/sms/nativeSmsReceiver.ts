import type { RawSmsMessage } from './types';

/**
 * The single boundary the future Android/Kotlin SMS-receiver module (CDC P5)
 * must implement. Nothing else in the app should talk to native SMS APIs
 * directly — `smsListenerService.ts` is the only file that needs to change
 * when a real implementation exists.
 */
export interface SmsReceiver {
  requestPermission(): Promise<boolean>;
  isPermissionGranted(): Promise<boolean>;
  /** Returns an unsubscribe function. */
  subscribe(onMessage: (msg: RawSmsMessage) => void): () => void;
}

/**
 * Fallback used whenever the real native module isn't linked: in Expo Go, in
 * the web bundle, or on a native Android build that hasn't been rebuilt yet
 * with `modules/sms-receiver` included. That module (Kotlin, Expo Modules
 * API) now exists but was written without any Android SDK/Kotlin compiler
 * available (see CLAUDE.md) — it's selected automatically by
 * `src/services/sms/smsListenerService.ts` once `eas build --profile
 * development` (or a local `expo run:android`) actually compiles it in;
 * until then, or if that build turns out to need fixes, this stub keeps the
 * rest of the app working with SMS detection simply inactive.
 */
export class UnavailableSmsReceiver implements SmsReceiver {
  async requestPermission(): Promise<boolean> {
    return false;
  }

  async isPermissionGranted(): Promise<boolean> {
    return false;
  }

  subscribe(): () => void {
    console.warn(
      '[sms] Native SMS receiver unavailable (modules/sms-receiver not linked in this build). ' +
        'SMS-based transaction detection is inactive; manual transactions are unaffected.'
    );
    return () => {};
  }
}
