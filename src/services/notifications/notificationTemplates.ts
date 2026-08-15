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
};
