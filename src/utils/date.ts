import dayjs from 'dayjs';

export function isoNow(): string {
  return new Date().toISOString();
}

export function addDays(baseIso: string, days: number): string {
  return dayjs(baseIso).add(days, 'day').toISOString();
}

export function daysBetween(fromIso: string, toIso: string): number {
  return dayjs(toIso).diff(dayjs(fromIso), 'day');
}
