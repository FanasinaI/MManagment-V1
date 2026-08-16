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

export const PROVIDER_ICONS: Record<Account['provider'], keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  mvola: 'phone-portrait',
  airtel_money: 'phone-portrait',
  orange_money: 'phone-portrait',
  bank: 'business',
  cash: 'cash',
  card: 'card',
  savings: 'wallet',
};

export const PROVIDER_COLORS: Record<Account['provider'], string> = {
  mvola: '#3FB27F',
  airtel_money: '#E2574C',
  orange_money: '#F2A93C',
  bank: '#4C8FE2',
  cash: '#7A8194',
  card: '#8B6FD6',
  savings: '#E8BE6B',
};
