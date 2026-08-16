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
  sortOrder: number;
  isDefault: number;
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider as Account['provider'],
    type: row.type as Account['type'],
    currency: row.currency,
    balance: row.balance,
    sortOrder: row.sortOrder,
    isDefault: row.isDefault === 1,
  };
}

export function createAccountsRepository(db: DbConnection) {
  return {
    async list(): Promise<Account[]> {
      const rows = await db.getAllAsync<AccountRow>('SELECT * FROM accounts ORDER BY sortOrder ASC, createdAt ASC;');
      return rows.map(toAccount);
    },

    async getById(id: string): Promise<Account | null> {
      const row = await db.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?;', [id]);
      return row ? toAccount(row) : null;
    },

    /** The very first account a user creates becomes the default automatically; later ones are picked via setDefault. */
    async create(input: NewAccount): Promise<Account> {
      const id = generateId();
      const now = nowIso();
      const [maxOrderRow, countRow] = await Promise.all([
        db.getFirstAsync<{ maxOrder: number | null }>('SELECT MAX(sortOrder) as maxOrder FROM accounts;'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM accounts;'),
      ]);
      const sortOrder = (maxOrderRow?.maxOrder ?? -1) + 1;
      const isDefault = (countRow?.count ?? 0) === 0;

      await db.runAsync(
        `INSERT INTO accounts (id, name, provider, type, currency, balance, sortOrder, isDefault, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [id, input.name, input.provider, input.type, input.currency, input.balance, sortOrder, isDefault ? 1 : 0, now, now]
      );
      return { id, ...input, sortOrder, isDefault };
    },

    async update(id: string, patch: { name: string; provider: Account['provider']; type: Account['type']; currency: string }): Promise<void> {
      await db.runAsync('UPDATE accounts SET name = ?, provider = ?, type = ?, currency = ?, updatedAt = ? WHERE id = ?;', [
        patch.name,
        patch.provider,
        patch.type,
        patch.currency,
        nowIso(),
        id,
      ]);
    },

    async adjustBalance(id: string, delta: number): Promise<void> {
      await db.runAsync('UPDATE accounts SET balance = balance + ?, updatedAt = ? WHERE id = ?;', [
        delta,
        nowIso(),
        id,
      ]);
    },

    /** Unsets any previous default before marking `id` — at most one account is default at a time. */
    async setDefault(id: string): Promise<void> {
      await db.withTransactionAsync(async () => {
        await db.runAsync('UPDATE accounts SET isDefault = 0 WHERE isDefault = 1;');
        await db.runAsync('UPDATE accounts SET isDefault = 1 WHERE id = ?;', [id]);
      });
    },

    /** Persists display order: `orderedIds[i]` gets sortOrder `i`. */
    async reorder(orderedIds: string[]): Promise<void> {
      await db.withTransactionAsync(async () => {
        for (let i = 0; i < orderedIds.length; i++) {
          await db.runAsync('UPDATE accounts SET sortOrder = ? WHERE id = ?;', [i, orderedIds[i]]);
        }
      });
    },

    async remove(id: string): Promise<void> {
      await db.runAsync('DELETE FROM accounts WHERE id = ?;', [id]);
    },
  };
}

export type AccountsRepository = ReturnType<typeof createAccountsRepository>;
