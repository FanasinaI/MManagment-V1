import type { Migration } from '../migrationRunner';
import { migration001Init } from './001_init';
import { migration002AddSmsDiagnostics } from './002_add_sms_diagnostics';

/** Ordered ascending by version — the migration runner does not sort defensively. */
export const migrations: Migration[] = [migration001Init, migration002AddSmsDiagnostics];
