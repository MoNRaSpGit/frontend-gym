export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatMoney(value: number): string {
  return value.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

export function formatShortDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year.slice(2)}`;
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("es-UY", { dateStyle: "short", timeStyle: "short" });
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

// Dias que faltan para el vencimiento de un gasto -- negativo si ya
// vencio (pedido explicito: "se marca como vencido").
export function getDaysUntilDue(dueDate: string): number {
  return daysBetween(getTodayDate(), dueDate);
}

export function addDays(fromIso: string, days: number): string {
  const date = new Date(`${fromIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getYearMonth(dateIso: string): string {
  return dateIso.slice(0, 7);
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function computeExpenseAfterPayment<T extends { intervalDays: number; dueDate: string; lastPaidAt: string | null }>(
  expense: T
): T {
  const today = getTodayDate();
  return { ...expense, dueDate: addDays(today, expense.intervalDays), lastPaidAt: today };
}
