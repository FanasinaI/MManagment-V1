import { getDb } from '../client';
import { createAccountsRepository } from './accountsRepository';
import { createAlertsRepository } from './alertsRepository';
import { createBudgetsRepository } from './budgetsRepository';
import { createCategoriesRepository } from './categoriesRepository';
import { createGoalsRepository } from './goalsRepository';
import { createRecurringTransactionsRepository } from './recurringTransactionsRepository';
import { createSavingsRepository } from './savingsRepository';
import { createSmsEventsRepository } from './smsEventsRepository';
import { createSmsSourcesRepository } from './smsSourcesRepository';
import { createTransactionsRepository } from './transactionsRepository';

let repositoriesPromise: ReturnType<typeof buildRepositories> | null = null;

async function buildRepositories() {
  const db = await getDb();
  return {
    accounts: createAccountsRepository(db),
    transactions: createTransactionsRepository(db),
    categories: createCategoriesRepository(db),
    budgets: createBudgetsRepository(db),
    savings: createSavingsRepository(db),
    goals: createGoalsRepository(db),
    recurringTransactions: createRecurringTransactionsRepository(db),
    smsSources: createSmsSourcesRepository(db),
    smsEvents: createSmsEventsRepository(db),
    alerts: createAlertsRepository(db),
  };
}

/** Singleton repository bundle bound to the migrated app database. */
export function getRepositories(): ReturnType<typeof buildRepositories> {
  if (!repositoriesPromise) repositoriesPromise = buildRepositories();
  return repositoriesPromise;
}

export type Repositories = Awaited<ReturnType<typeof getRepositories>>;
