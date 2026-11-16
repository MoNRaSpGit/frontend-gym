import { API_BASE_URL } from "../../shared/config/api";
import { getGymToken } from "../gym/gym.session";

// Turnos del gym (reservas de alumnos por link publico).
export type BookingClass = { key: string; name: string; capacity: number; hours: string[] };
export type PublicBooking = { classKey: string; hour: string; name: string };
export type AdminBooking = PublicBooking & { id: number };

export type PublicSchedule = {
  today: string;
  nowTime: string;
  date: string;
  days: string[];
  classes: BookingClass[];
  bookings: PublicBooking[];
};

export type AdminDay =
  | { enabled: false }
  | { enabled: true; token: string; today: string; date: string; classes: BookingClass[]; bookings: AdminBooking[] };

function url(path: string) {
  return `${API_BASE_URL}/api/v1/gym-booking${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data && typeof data.message === "string" ? data.message : "Ocurrió un error inesperado.";
    throw new Error(message);
  }
  return data as T;
}

export async function fetchPublicSchedule(token: string, date?: string): Promise<PublicSchedule> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return readJson(await fetch(url(`/public/${token}${query}`)));
}

export async function bookSlot(
  token: string,
  body: { date: string; classKey: string; hour: string; name: string }
): Promise<{ ok: true; id: number; cancelCode: string; name: string }> {
  return readJson(
    await fetch(url(`/public/${token}/book`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  );
}

export async function cancelBooking(token: string, body: { id: number; cancelCode: string }): Promise<void> {
  await readJson(
    await fetch(url(`/public/${token}/cancel`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  );
}

function authHeaders(): Record<string, string> {
  const token = getGymToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchAdminDay(date?: string): Promise<AdminDay> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return readJson(await fetch(url(`/admin${query}`), { headers: authHeaders() }));
}

export async function deleteAdminBooking(id: number): Promise<void> {
  await readJson(await fetch(url(`/admin/${id}`), { method: "DELETE", headers: authHeaders() }));
}

// ---- Fechas (texto "YYYY-MM-DD", sin zona horaria de por medio) ----

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function parseDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { weekday: WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()], day, month: MONTHS[month - 1] };
}

export function dayLabel(date: string, today: string): string {
  const { weekday, day, month } = parseDay(date);
  if (date === today) return `Hoy · ${day} ${month}`;
  return `${weekday} ${day} ${month}`;
}
