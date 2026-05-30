export const CURRENCY_CODES = ['EUR', 'GBP', 'USD', 'RUB', 'KZT', 'MNT', 'DKK'] as const;
export type CurrencyCode = typeof CURRENCY_CODES[number];
export const isCurrencyCode = (c: unknown): c is CurrencyCode =>
  CURRENCY_CODES.includes(c as CurrencyCode);
