import type { Account } from '@/validation/accountSchema';

export const PROVIDER_LABELS: Record<Account['provider'], string> = {
  mvola: 'MVola',
  airtel_money: 'Airtel Money',
  orange_money: 'Orange Money',
  bank: 'Banque',
  cash: 'Espèces',
  card: 'Carte',
  savings: 'Épargne',
};

export const PROVIDERS = Object.keys(PROVIDER_LABELS) as Account['provider'][];

/** The account `type` column is derived from `provider` — no separate UI choice needed. */
export const PROVIDER_TO_TYPE: Record<Account['provider'], Account['type']> = {
  mvola: 'mobile_money',
  airtel_money: 'mobile_money',
  orange_money: 'mobile_money',
  bank: 'bank',
  cash: 'cash',
  card: 'card',
  savings: 'savings',
};
