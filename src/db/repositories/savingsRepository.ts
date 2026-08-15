import { generateId } from '@/utils/id';
import type { NewSavingsPocket, SavingsPocket } from '@/validation/savingsSchema';

import type { DbConnection } from '../types';

export function createSavingsRepository(db: DbConnection) {
  return {
    async list(): Promise<SavingsPocket[]> {
      return db.getAllAsync<SavingsPocket>('SELECT * FROM savings;');
    },

    async create(input: NewSavingsPocket): Promise<SavingsPocket> {
      const id = generateId();
      await db.runAsync('INSERT INTO savings (id, name, targetAmount, balance) VALUES (?, ?, ?, 0);', [
        id,
        input.name,
        input.targetAmount ?? null,
      ]);
      return { id, name: input.name, targetAmount: input.targetAmount ?? null, balance: 0 };
    },

    /** Positive amount = versement, negative = retrait de la poche d'épargne. */
    async adjustBalance(id: string, delta: number): Promise<void> {
      await db.runAsync('UPDATE savings SET balance = balance + ? WHERE id = ?;', [delta, id]);
    },

    async remove(id: string): Promise<void> {
      await db.runAsync('DELETE FROM savings WHERE id = ?;', [id]);
    },
  };
}

export type SavingsRepository = ReturnType<typeof createSavingsRepository>;
