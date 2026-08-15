# MManagment

Application personnelle de gestion d'argent pour Android — hors ligne, sans backend, avec détection sélective des
SMS financiers en liste blanche stricte. Spécification complète : `CDC_MManagment_Offline_SMS_Whitelist_Complet.pdf`.

## Stack

React Native + Expo (SDK 57) + TypeScript · Expo Router · Zustand · expo-sqlite · expo-secure-store ·
expo-notifications · expo-crypto (chiffrement AES-GCM) · Zod · Vitest.

## Démarrage

```bash
npm install
npx expo start          # nécessite un appareil/émulateur Android ou Expo Go
npx expo start --web    # aperçu web (le seul mode testable sans outillage Android)
```

Vérifications :

```bash
npx tsc --noEmit          # types
npx vitest run             # tests unitaires de la couche métier
npx expo-doctor            # cohérence des dépendances
```

## État du projet

Le cœur de l'application (comptes, transactions manuelles, tableau de bord, budgets, épargne, objectifs,
notifications locales, moteur de détection SMS, sauvegarde chiffrée avec restauration) est implémenté et testé.

Le module natif Android (`modules/sms-receiver/`) qui reçoit réellement les SMS est **écrit mais non vérifié** :
cette machine n'a ni Android Studio ni JDK, donc ce code Kotlin n'a jamais été compilé. La logique de filtrage/parsing
en amont (allowlist, double filtrage, parsers, anti-doublon) est en revanche complète et testée
(`src/domain/sms/`). Voir la section suivante pour le tester réellement.

## Prochaine étape : tester le module SMS sur ton téléphone

Pas besoin d'Android Studio — EAS Build compile dans le cloud. Étapes :

```bash
npm install -g eas-cli        # ou npx eas-cli à chaque commande
eas login                      # crée un compte sur expo.dev si tu n'en as pas encore
eas init                       # lie ce projet à ton compte (ajoute un projectId à app.config.ts)
eas build --profile development --platform android
```

`eas build` te donne un lien/QR code : télécharge l'APK généré et installe-le sur ton téléphone (à la place d'Expo
Go pour ce projet — Expo Go seul ne peut pas charger le module natif). Ensuite :

```bash
npx expo start --dev-client
```

et ouvre le lien depuis l'app installée. Si le module SMS plante ou ne reçoit rien, c'est attendu au premier essai
vu qu'il n'a jamais été testé — les points les plus probables à corriger sont documentés en commentaire dans
`modules/sms-receiver/android/.../SmsReceiverModule.kt`.

Détails complets pour la suite du développement : voir [CLAUDE.md](./CLAUDE.md).

## Sécurité

Aucune donnée financière ne doit être commitée dans ce dépôt. Les sauvegardes (`*.mmbak`) et les bases SQLite
locales sont exclues via `.gitignore`.
