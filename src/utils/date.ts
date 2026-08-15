import {
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

export function periodInterval(period: BudgetPeriod, reference: Date = new Date()): { start: Date; end: Date } {
  switch (period) {
    case 'weekly':
      return { start: startOfWeek(reference, { weekStartsOn: 1 }), end: endOfWeek(reference, { weekStartsOn: 1 }) };
    case 'yearly':
      return { start: startOfYear(reference), end: endOfYear(reference) };
    case 'monthly':
    default:
      return { start: startOfMonth(reference), end: endOfMonth(reference) };
  }
}

export function isWithinPeriod(date: Date, period: BudgetPeriod, reference: Date = new Date()): boolean {
  const { start, end } = periodInterval(period, reference);
  return isWithinInterval(date, { start, end });
}

export function daysUntil(date: Date, reference: Date = new Date()): number {
  return differenceInCalendarDays(date, reference);
}

export function formatDate(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

export function nowIso(): string {
  return new Date().toISOString();
}
