export interface RawSmsMessage {
  sender: string;
  body: string;
  receivedAt: string; // ISO 8601
}

export type SmsProvider = 'mvola' | 'airtel_money' | 'orange_money' | 'bank';

export interface SmsSourceConfig {
  id: string;
  name: string;
  provider: SmsProvider;
  senderPattern: string;
  enabled: boolean;
  parserVersion: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer' | 'fee' | 'withdrawal' | 'deposit';

export interface ParsedTransactionDraft {
  amount: number;
  currency: string;
  type: TransactionType;
  reference?: string;
  occurredAt: string; // ISO 8601
}

export interface FinancialMarkers {
  hasAmount: boolean;
  hasCurrency: boolean;
  hasOperationVerb: boolean;
  hasReference: boolean;
}

/** Mirrors sms_events.status (CDC §11) plus a disabled/no-op case that never reaches the DB. */
export type PipelineOutcome =
  | { kind: 'sms_detection_disabled' }
  | { kind: 'ignored_not_allowed' }
  | { kind: 'ignored_no_structure'; sourceId: string }
  | { kind: 'duplicate'; hash: string; sourceId: string }
  | { kind: 'pending_transaction'; draft: ParsedTransactionDraft; hash: string; sourceId: string };
