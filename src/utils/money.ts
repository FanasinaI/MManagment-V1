/** Ariary has no minor unit in everyday use — amounts are formatted as whole numbers. */
export function formatMoney(amount: number, currency = 'MGA'): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('fr-FR').format(rounded);
  const symbol = currency === 'MGA' ? 'Ar' : currency;
  return `${formatted} ${symbol}`;
}

export function formatSignedMoney(amount: number, currency = 'MGA'): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${sign}${formatMoney(Math.abs(amount), currency)}`;
}
