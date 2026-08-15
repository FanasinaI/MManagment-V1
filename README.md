# MManagment

Application personnelle de gestion d'argent pour Android, pensée pour fonctionner **entièrement hors ligne**.
Aucun serveur, aucune API bancaire externe : les comptes, transactions, budgets et objectifs sont gérés localement,
avec une détection optionnelle des SMS financiers (MVola, Airtel Money, Orange Money, banques) selon une politique
stricte de liste blanche.

## Fonctionnalités

- **Comptes** multi-supports : mobile money, banque, espèces, carte, épargne
- **Transactions** manuelles (revenu, dépense, transfert, frais, retrait, dépôt) et détectées automatiquement par SMS
- **Tableau de bord** : solde total, soldes par compte, cash-flow
- **Budgets** par catégorie et période, avec alertes de seuil
- **Épargne** : poches et objectifs avec suivi de progression
- **Notifications locales** (rappels d'épargne, alertes de budget, échéances) — aucun serveur push requis
- **Détection SMS** en liste blanche stricte : seuls les expéditeurs explicitement autorisés sont analysés, avec
  double filtrage sur le contenu (montant, devise, type d'opération) et anti-doublon
- **Sauvegarde chiffrée** (AES-256-GCM) exportable et restaurable, avec code PIN et déverrouillage biométrique

## Stack technique

| Composant | Technologie |
|---|---|
| Application | React Native + Expo (SDK 57) + TypeScript |
| Navigation | Expo Router |
| État | Zustand |
| Base de données | SQLite (expo-sqlite), migrations versionnées |
| Sécurité | expo-secure-store, expo-crypto (AES-GCM), PIN + biométrie |
| Notifications | expo-notifications (locales) |
| Validation | Zod |
| Tests | Vitest |
| Distribution | EAS Build (APK) |

## Sécurité

- Toutes les données financières restent sur l'appareil ; aucune n'est envoyée à un service tiers.
- Un SMS provenant d'une source non explicitement autorisée n'est **jamais** analysé ni stocké.
- Le contenu brut des SMS n'est pas conservé après traitement, sauf activation explicite d'un mode diagnostic.
- Les sauvegardes sont chiffrées (AES-256-GCM) avant export.
- Aucune donnée financière ni sauvegarde (`*.mmbak`, `*.db`, `*.sqlite`) ne doit être commitée dans ce dépôt — elles
  sont exclues via `.gitignore`.
- Accès protégé par code PIN et biométrie.

## Démarrage

```bash
npm install
npx expo start           # nécessite un appareil/émulateur, ou Expo Go
npx expo start --web     # aperçu web
```

Scripts utiles :

```bash
npx tsc --noEmit    # vérification des types
npx vitest run       # tests unitaires
npx expo-doctor       # cohérence des dépendances/config
```

## Build Android (développement)

Le module de réception SMS est natif (Android/Kotlin) et nécessite un **Development Build** — Expo Go seul ne
suffit pas pour cette partie.

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

Une fois le build terminé, télécharge et installe l'APK généré sur ton téléphone, puis :

```bash
npx expo start --dev-client
```

## État du projet

🚧 **En maintenance et évolutif.** Le socle (comptes, transactions, budgets, épargne, objectifs, notifications,
sécurité, sauvegarde chiffrée) est fonctionnel. Le module de réception SMS natif est en cours de validation sur
device. La distribution via GitHub Releases n'est pas encore automatisée.

## Licence

MIT — voir [LICENSE](./LICENSE).
