# MManagment

Application personnelle de gestion d'argent pour Android, pensée pour fonctionner **entièrement hors ligne**.
Aucun serveur, aucune API bancaire externe : les comptes, transactions, budgets et objectifs sont gérés localement,
avec une détection optionnelle des SMS financiers (MVola, Airtel Money, Orange Money, banques) selon une politique
stricte de liste blanche.

## Fonctionnalités

- **Comptes** multi-supports : mobile money, banque, espèces, carte, épargne — compte par défaut et ordre
  personnalisable
- **Transactions** manuelles (revenu, dépense, transfert, frais, retrait, dépôt), modifiables, avec recherche et
  filtres (compte, type, période, montant), et détectées automatiquement par SMS
- **Transactions récurrentes** (loyer, salaire, abonnements) générées automatiquement à échéance
- **Tableau de bord** et **statistiques** complètes : revenus/dépenses/épargne du mois clairement séparés (un
  versement d'épargne n'est jamais compté comme une dépense), comparaison au mois précédent, répartition des
  dépenses par catégorie, suivi des budgets, patrimoine net (comptes + épargne + objectifs), tendance sur 6 mois
- **Budgets** par catégorie et période, avec alertes de seuil
- **Épargne** : poches et objectifs, versement et retrait, avec suivi de progression
- **Catégories** personnalisables avec icônes
- **Notifications locales** (comptes, transactions, épargne/objectifs, budgets, rappels) — aucun serveur push requis
- **Détection SMS** en liste blanche stricte : seuls les expéditeurs explicitement autorisés sont analysés, avec
  double filtrage sur le contenu (montant, devise, type d'opération), anti-doublon, routage vers le bon compte même
  avec plusieurs comptes du même opérateur, et réconciliation du solde à partir du solde indiqué par le SMS
  lui-même quand il est présent
- **File d'attente SMS** avec confirmation individuelle ou groupée
- **Export Excel** détaillé (comptes, transactions, budgets, épargne, objectifs)
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
| Export | xlsx (Excel) |
| Distribution | EAS Build (APK) + GitHub Actions → GitHub Releases |

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

## Build Android

Le module de réception SMS est natif (Android/Kotlin) et nécessite un **Development Build** — Expo Go seul ne
suffit pas pour cette partie.

**Via GitHub Actions (recommandé) :** onglet [Actions](../../actions/workflows/build-apk.yml) de ce dépôt → *Run
workflow* → choisir le profil (`development` pour tester le module SMS, `preview`/`production` pour un APK
standard) → l'APK généré est automatiquement publié dans l'onglet
[Releases](../../releases) une fois le build terminé (~10-20 min).

**En local :**

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

Une fois le build terminé, télécharge et installe l'APK généré sur ton téléphone, puis :

```bash
npx expo start --dev-client
```

## Mises à jour

Pas de mise à jour OTA (over-the-air) configurée : chaque changement nécessite un nouveau build et une réinstallation
de l'APK sur l'appareil (Android accepte l'installation par-dessus la version précédente tant qu'elle vient du même
projet EAS). Le numéro de version se trouve dans `app.config.ts`.

## État du projet

🚧 **En maintenance et évolutif.** Le socle (comptes, transactions, budgets, épargne, objectifs, transactions
récurrentes, statistiques, notifications, sécurité, sauvegarde chiffrée) est fonctionnel. Le module de réception SMS
natif est en cours de validation sur device. La distribution via GitHub Actions → GitHub Releases est en place et
vérifiée fonctionnelle.

## Licence

MIT — voir [LICENSE](./LICENSE).
