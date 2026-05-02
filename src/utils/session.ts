import { format, subMonths, addMonths, startOfMonth, parseISO, isAfter, isBefore, isEqual } from 'date-fns';

export function getCurrentSessionYear(): number {
  const now = new Date();
  // getMonth() is 0-indexed (Jan=0, Feb=1)
  return now.getMonth() >= 1 ? now.getFullYear() : now.getFullYear() - 1;
}

export function getSessionRange(sessionYear: number) {
  const start = new Date(sessionYear, 1, 1); // Feb 1st
  const end = new Date(sessionYear + 1, 0, 31); // Jan 31st next year
  return { start, end };
}

export function getMonthList(sessionYear: number) {
  const months = [];
  for (let i = 0; i < 12; i++) {
    // 0: Feb, 1: Mar, ..., 10: Dec, 11: Jan (next year)
    const monthDate = addMonths(new Date(sessionYear, 1, 1), i);
    months.push({
      date: monthDate,
      value: format(monthDate, 'yyyy-MM'),
      label: format(monthDate, 'MMMM yyyy'),
    });
  }
  return months;
}

export function getPreviousMonth(monthStr: string): string {
  const date = parseISO(`${monthStr}-01`);
  return format(subMonths(date, 1), 'yyyy-MM');
}

export function formatCurrency(amount: number, symbol: string = 'Rs') {
  return `${symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
