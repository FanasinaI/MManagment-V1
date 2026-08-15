import { nowIso } from '@/utils/date';
import { generateId } from '@/utils/id';
import type { Account, NewAccount } from '@/validation/accountSchema';

import type { DbConnection } from '../types';

interface AccountRow {
  id: string;
  name: string;
  provider: string;
  type: string;
  currency: string;
  balance: number;
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider as Account['provider'],
    type: row.type as Account['type'],
    currency: row.currency,
    balance: row.balance,
  };
}

export function createAccountsRepository(db: DbConnection) {
  return {
    async list(): Promise<Account[]> {
      const rows = await db.getAllAsync<AccountRow>('SELECT * FROM accounts ORDER BY createdAt ASC;');
      return rows.map(toAccount);
    },

    async getById(id: string): Promise<Account | null> {
      const row = await db.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?;', [id]);
      return row ? toAccount(row) : null;
    },

    async create(input: NewAccount): Promise<Account> {
      const id = generateId();
      const now = nowIso();
      await db.runAsync(
        `INSERT INTO accounts (id, name, provider, type, currency, balance, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [id, input.name, input.provider, input.type, input.currency, input.balance, now, now]
      );
      return { id, ...input };
    },

    async adjustBalance(id: string, delta: number): Promise<void> {
      await db.runAsync('UPDATE accounts SET balance = balance + ?, updatedAt = ? WHERE id = ?;', [
        delta,
        nowIso(),
        id,
      ]);
    },

    async remove(id: string): Promise<void> {
      await db.runAsync('DELETE FROM accounts WHERE id = ?;', [id]);
    },
  };
}

export type AccountsRepository = ReturnType<typeof createAccountsRepository>;
