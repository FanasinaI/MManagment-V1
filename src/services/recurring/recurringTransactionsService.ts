import { getRepositories } from '@/db/repositories';
import { computeDueOccurrences } from '@/domain/finance/recurrence';
import { notificationService } from '@/services/notifications/notificationService';
import { notificationTemplates } from '@/services/notifications/notificationTemplates';

/**
 * Runs on app boot: for every active recurring rule, generates a normal
 * manual transaction for each occurrence due since it was last processed
 * (catching up on a backlog if the app wasn't opened in a while), then
 * advances the rule's nextOccurrence past all of them. Rules never touch
 * balances directly — every occurrence goes through the same
 * transactions.createManual path as a hand-entered transaction.
 */
export const recurringTransactionsService = {
  async processDue(): Promise<number> {
    const repos = await getRepositories();
    const rules = await repos.recurringTransactions.listActive();
    const now = new Date();
    let generated = 0;

    for (const rule of rules) {
      const due = computeDueOccurrences(rule.nextOccurrence, rule.frequency, now);
      if (due.length === 0) continue;

      for (const occurrence of due) {
        await repos.transactions.createManual({
          accountId: rule.accountId,
          toAccountId: rule.toAccountId ?? undefined,
          type: rule.type,
          amount: rule.amount,
          categoryId: rule.categoryId,
          occurredAt: occurrence.occurredAt,
          note: rule.note ?? undefined,
        });
        generated++;
      }

      await repos.recurringTransactions.advance(rule.id, due[due.length - 1].nextOccurrence);
    }

    if (generated > 0) {
      void notificationService.sendImmediate(notificationTemplates.recurringGenerated(generated));
    }

    return generated;
  },
};
