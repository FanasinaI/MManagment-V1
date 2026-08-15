export type SqlParams = unknown[] | Record<string, unknown>;

export interface SqlRunResult {
  lastInsertRowId: number;
  changes: number;
}

/**
 * Narrow surface over expo-sqlite's async API. Repositories and the migration
 * runner depend on this interface, not on expo-sqlite directly, so they can be
 * unit-tested in Vitest with an in-memory fake — no native module required.
 */
export interface DbConnection {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: SqlParams): Promise<SqlRunResult>;
  getAllAsync<T>(source: string, params?: SqlParams): Promise<T[]>;
  getFirstAsync<T>(source: string, params?: SqlParams): Promise<T | null>;
  withTransactionAsync(action: () => Promise<void>): Promise<void>;
}
