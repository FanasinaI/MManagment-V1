import type { TransactionType } from '../types';
import { extractAmount, extractReference, matchOperationType, type Parser } from './parser';

// Generic bank vocabulary layered on top of the mobile-money verbs — bank SMS
// formats vary per institution (CDC §4 lets the user add banks individually);
// this is a best-effort default until real fixtures are captured per bank.
const BANK_VERB_MAP: Record<string, TransactionType> = {
  'virement reçu': 'income',
  'virement recu': 'income',
  virement: 'expense',
  prélèvement: 'expense',
  prelevement: 'expense',
  retrait: 'withdrawal',
  dépôt: 'deposit',
  depot: 'deposit',
  'paiement carte': 'expense',
  frais: 'fee',
};

export const bankParser: Parser = {
  parse(msg) {
    const amount = extractAmount(msg.body);
    const type = matchOperationType(msg.body, BANK_VERB_MAP);
    if (amount === null || type === null) return null;

    return {
      amount,
      currency: 'MGA',
      type,
      reference: extractReference(msg.body),
      occurredAt: msg.receivedAt,
    };
  },
};
