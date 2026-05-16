import { TODAY } from "../data/gymData";
import type { ClientStatus } from "../types";

export function parseLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(parseLocalDate(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function addMonths(dateValue: string, months: number) {
  const nextDate = parseLocalDate(dateValue);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate.toISOString().slice(0, 10);
}

export function getPlanMonths(plan: string) {
  if (plan === "Plan 3 meses") {
    return 3;
  }

  if (plan === "Plan 6 meses") {
    return 6;
  }

  return 1;
}

export function diffDays(fromDate: string, toDate: string) {
  const diffMs = parseLocalDate(toDate).getTime() - parseLocalDate(fromDate).getTime();
  return Math.round(diffMs / 86_400_000);
}

export function getClientStatus(nextPaymentDate: string): ClientStatus {
  const daysLeft = diffDays(TODAY, nextPaymentDate);

  if (daysLeft === 0) {
    return "due";
  }

  if (daysLeft < 0) {
    return "overdue";
  }

  if (daysLeft <= 5) {
    return "upcoming";
  }

  return "up_to_date";
}

export function getStatusLabel() {
  return "Vence";
}

export function getPaymentText(nextPaymentDate: string) {
  return `Vence ${formatDate(nextPaymentDate)}`;
}

export function getSuccessStatus(nextPaymentDate: string) {
  const status = getClientStatus(nextPaymentDate);

  if (status === "due") {
    return "Cuota para regularizar hoy";
  }

  if (status === "upcoming") {
    return "Cuota proxima a vencer";
  }

  return "Cuota al dia";
}

export function getMaskedCedula(value: string) {
  return `${value.slice(0, 4)}....`;
}

export function getPaymentAlertVariant(nextPaymentDate: string) {
  const daysLeft = diffDays(TODAY, nextPaymentDate);
  return daysLeft < 5 ? "danger" : "warning";
}
