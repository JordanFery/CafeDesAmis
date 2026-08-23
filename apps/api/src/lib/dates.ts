/** Convertit "AAAA-MM-JJ" en Date UTC à minuit. */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date du jour au format "AAAA-MM-JJ" (UTC). */
export function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Convertit "AAAA-MM" en Date UTC du 1er du mois. */
export function parseMonthOnly(value: string): Date {
  return new Date(`${value}-01T00:00:00.000Z`);
}

/** Mois courant au format "AAAA-MM" (UTC). */
export function currentMonthOnly(): string {
  return new Date().toISOString().slice(0, 7);
}
