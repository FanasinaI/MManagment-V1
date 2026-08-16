export interface NotificationContent {
  title: string;
  body: string;
}

/** CDC §10 alert wording. */
export const notificationTemplates = {
  budget80: (categoryName: string): NotificationContent => ({
    title: 'Budget bientôt atteint',
    body: `Vous avez atteint 80% de votre budget "${categoryName}".`,
  }),
  budget100: (categoryName: string): NotificationContent => ({
    title: 'Budget dépassé',
    body: `Votre budget "${categoryName}" est dépassé.`,
  }),
  lowBalance: (accountName: string): NotificationContent => ({
    title: 'Solde faible',
    body: `Le solde de "${accountName}" est bas.`,
  }),
  goalNear: (goalName: string): NotificationContent => ({
    title: 'Objectif presque atteint',
    body: `Vous approchez de votre objectif "${goalName}".`,
  }),
  savingsReminder: (): NotificationContent => ({
    title: "Rappel d'épargne",
    body: "N'oubliez pas votre versement d'épargne du mois.",
  }),
  accountAdded: (accountName: string): NotificationContent => ({
    title: 'Compte ajouté',
    body: `"${accountName}" a été ajouté à tes comptes.`,
  }),
  transactionAdded: (amountLabel: string): NotificationContent => ({
    title: 'Transaction enregistrée',
    body: amountLabel,
  }),
  transactionConfirmed: (amountLabel: string): NotificationContent => ({
    title: 'Transaction confirmée',
    body: amountLabel,
  }),
  budgetAdded: (categoryName: string): NotificationContent => ({
    title: 'Budget créé',
    body: `Un budget a été défini pour "${categoryName}".`,
  }),
  savingsPocketAdded: (pocketName: string): NotificationContent => ({
    title: "Poche d'épargne créée",
    body: `"${pocketName}" a été ajoutée.`,
  }),
  goalAdded: (goalName: string): NotificationContent => ({
    title: 'Objectif créé',
    body: `"${goalName}" a été ajouté à tes objectifs.`,
  }),
};
