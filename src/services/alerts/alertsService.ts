import * as SecureStore from 'expo-secure-store';

import { getRepositories } from '@/db/repositories';
import { evaluateAlerts, type AlertCondition, type AlertType, type TriggeredAlert } from '@/domain/finance/alertsEngine';
import { computeBudgetProgress } from '@/domain/finance/budgetEngine';
import { computeGoalProgress } from '@/domain/finance/goalsEngine';
import { notificationService } from '@/services/notifications/notificationService';
import { notificationTemplates } from '@/services/notifications/notificationTemplates';

const NOTIFIED_KEY = 'mm_alerts_notified';
const SAVINGS_REMINDER_NOTIFICATION_ID_KEY = 'mm_savings_reminder_notification_id';
const DEFAULT_LOW_BALANCE_THRESHOLD = 10000;
const DEFAULT_SAVINGS_REMINDER_DAY = 25;

async function getNotifiedKeys(): Promise<Set<string>> {
  const raw = await SecureStore.getItemAsync(NOTIFIED_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function saveNotifiedKeys(keys: Set<string>): Promise<void> {
  // Cap to avoid unbounded growth over the lifetime of the app.
  await SecureStore.setItemAsync(NOTIFIED_KEY, JSON.stringify(Array.from(keys).slice(-200)));
}

/** Budget alerts reset monthly (tied to the budget's own period); balance/goal alerts dedupe per day. */
function periodSignature(type: AlertType): string {
  const now = new Date();
  if (type === 'budget_80' || type === 'budget_100') {
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  }
  return now.toISOString().slice(0, 10);
}

function alertTitle(type: AlertType): string {
  switch (type) {
    case 'budget_80':
      return 'Budget bientôt atteint';
    case 'budget_100':
      return 'Budget dépassé';
    case 'low_balance':
      return 'Solde faible';
    case 'goal_near':
      return 'Objectif proche';
    default:
      return 'Alerte';
  }
}

export const alertsService = {
  /**
   * Evaluates budget/low-balance/goal alert conditions against current data
   * and notifies for any that just crossed a threshold and haven't already
   * been notified this period (month for budgets, day otherwise) —
   * otherwise every app open / transaction would re-fire the same alert.
   */
  async evaluateAndNotify(): Promise<TriggeredAlert[]> {
    const repos = await getRepositories();
    const [alerts, accounts, budgets, goals, transactions] = await Promise.all([
      repos.alerts.list(),
      repos.accounts.list(),
      repos.budgets.list(),
      repos.goals.list(),
      repos.transactions.list(),
    ]);

    const conditions: AlertCondition[] = alerts
      .filter((a) => a.type !== 'savings_reminder')
      .map((a) => ({ type: a.type, threshold: a.threshold ?? undefined, enabled: a.enabled }));

    const budgetProgresses = budgets.map((budget) =>
      computeBudgetProgress(
        budget,
        transactions.map((t) => ({ categoryId: t.categoryId, amount: t.amount, type: t.type, status: t.status, occurredAt: t.occurredAt }))
      )
    );
    const goalProgresses = goals.map((goal) => computeGoalProgress(goal));

    const triggered = evaluateAlerts(conditions, {
      budgetProgresses,
      accountBalances: accounts.map((a) => ({ accountId: a.id, balance: a.balance })),
      goalProgresses,
      lowBalanceThreshold: DEFAULT_LOW_BALANCE_THRESHOLD,
    });

    const notifiedKeys = await getNotifiedKeys();
    const toNotify = triggered.filter((alert) => !notifiedKeys.has(`${alert.type}:${alert.refId}:${periodSignature(alert.type)}`));

    for (const alert of toNotify) {
      notifiedKeys.add(`${alert.type}:${alert.refId}:${periodSignature(alert.type)}`);
      void notificationService.sendImmediate({ title: alertTitle(alert.type), body: alert.message });
    }
    if (toNotify.length > 0) await saveNotifiedKeys(notifiedKeys);

    return toNotify;
  },

  /** Schedules (or cancels) the monthly savings reminder — CDC §10 example: the 25th of the month. */
  async setSavingsReminder(enabled: boolean, dayOfMonth: number = DEFAULT_SAVINGS_REMINDER_DAY): Promise<void> {
    const existingId = await SecureStore.getItemAsync(SAVINGS_REMINDER_NOTIFICATION_ID_KEY);
    if (existingId) {
      await notificationService.cancel(existingId);
      await SecureStore.deleteItemAsync(SAVINGS_REMINDER_NOTIFICATION_ID_KEY);
    }
    if (enabled) {
      const id = await notificationService.scheduleMonthly(notificationTemplates.savingsReminder(), dayOfMonth, 9, 0);
      await SecureStore.setItemAsync(SAVINGS_REMINDER_NOTIFICATION_ID_KEY, id);
    }
  },
};
