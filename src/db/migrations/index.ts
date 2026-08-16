import type { Migration } from '../migrationRunner';
import { migration001Init } from './001_init';
import { migration002AddSmsDiagnostics } from './002_add_sms_diagnostics';
import { migration003AddTransferTarget } from './003_add_transfer_target';
import { migration004SeedDefaultSmsSources } from './004_seed_default_sms_sources';
import { migration005AddSmsSourceAutoConfirm } from './005_add_sms_source_autoconfirm';

/** Ordered ascending by version — the migration runner does not sort defensively. */
export const migrations: Migration[] = [
  migration001Init,
  migration002AddSmsDiagnostics,
  migration003AddTransferTarget,
  migration004SeedDefaultSmsSources,
  migration005AddSmsSourceAutoConfirm,
];
