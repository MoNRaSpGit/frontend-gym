import { GYM_STUDENT_PLAN_MONTHS, type GymStudent } from "./gym.types";

// Fecha local (no UTC): con toISOString, despues de las 21hs de Uruguay
// ya daba el dia siguiente.
function toLocalIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function getTodayDate(): string {
  return toLocalIsoDate(new Date());
}

export function formatMoney(value: number): string {
  return value.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

export function formatShortDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year.slice(2)}`;
}

// Numero real del dueño del gym (Ale) -- pedido explicito (10/10/2026).
// Hoy no se usa como destino de los WhatsApp porque esta activo el
// override de pruebas de aca abajo; queda guardado para cuando se saque
// ese override.
export const GYM_OWNER_PHONE = "098221822";

// TEMPORAL (10/10/2026, pedido explicito: "para que vaya probando"): todos
// los mensajes de WhatsApp van al numero de prueba del usuario, sin
// importar el telefono real del alumno. Para volver a mandarlos al alumno
// real, poner este valor en null (o borrar el override de abajo).
const WHATSAPP_TESTING_OVERRIDE_PHONE: string | null = "092945696";

// Link de WhatsApp (09/10/2026, pedido explicito): "que abra la
// conversacion... que el mensaje lo termine de enviar yo, el humano" --
// es un simple wa.me con texto precargado, no manda nada solo. Numeros
// uruguayos se escriben con el 0 inicial (ej: "092 945 696"); wa.me
// necesita el numero completo con codigo de pais (598) y sin ese 0.
export function buildWhatsAppLink(phone: string, message: string): string {
  const targetPhone = WHATSAPP_TESTING_OVERRIDE_PHONE ?? phone;
  const digits = targetPhone.replace(/\D/g, "");
  const withoutLeadingZero = digits.startsWith("0") ? digits.slice(1) : digits;
  const withCountryCode = withoutLeadingZero.startsWith("598") ? withoutLeadingZero : `598${withoutLeadingZero}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}

// Formato "carta" (09/10/2026, pedido explicito): encabezado con el
// nombre en su propia linea, aparte del cuerpo -- no todo en una frase
// corrida. "%0A" (salto de linea) lo respeta WhatsApp al abrir el chat.
export function buildOverdueFeeMessage(studentName: string, dueDate: string): string {
  // Sin emoji (09/10/2026, confirmado con el usuario): tanto 😊 como 🙂
  // le salian como "?" en su app -- se descarta el emoji definitivamente.
  return `Estimado cliente ${studentName}:\n\nSegún nuestros registros, su cuota venció el ${formatShortDate(dueDate)}.\n\nPor favor, pasar por recepción. ¡Gracias!`;
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
  return toLocalIsoDate(date);
}

export function getYearMonth(dateIso: string): string {
  return dateIso.slice(0, 7);
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// "Cada 30 dias" se toma como mensual de calendario (30/10 -> 30/11, no
// 29/11); lo mismo 60/90/... Cualquier otro numero suma dias exactos.
export function addExpenseInterval(fromIso: string, intervalDays: number): string {
  if (intervalDays % 30 === 0) return addMonths(fromIso, intervalDays / 30);
  return addDays(fromIso, intervalDays);
}

// Pedido explicito (30/09/2026): el dia de vencimiento queda fijo -- si
// vence el 30/10 y se marca pagado el 25/10 (o tarde), pasa a 30/11. Se
// cuenta desde el vencimiento, no desde el dia en que se marca.
export function computeExpenseAfterPayment<T extends { intervalDays: number; dueDate: string; lastPaidAt: string | null }>(
  expense: T
): T {
  return { ...expense, dueDate: addExpenseInterval(expense.dueDate, expense.intervalDays), lastPaidAt: getTodayDate() };
}

// Suma meses respetando fin de mes (31/01 + 1 mes = 28/02, no 03/03).
export function addMonths(fromIso: string, months: number): string {
  const [year, month, day] = fromIso.split("-").map(Number);
  const target = new Date(year, month - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return toLocalIsoDate(target);
}

export type StudentStatus = "green" | "yellow" | "red";

// Semaforo (pedido explicito): rojo el dia del vencimiento o vencido,
// amarillo cuando falta 1 semana o menos, verde el resto.
export function getStudentStatus(dueDate: string): StudentStatus {
  const daysLeft = getDaysUntilDue(dueDate);
  if (daysLeft <= 0) return "red";
  if (daysLeft <= 7) return "yellow";
  return "green";
}

// Si renueva antes de vencer, el nuevo periodo arranca desde el vencimiento
// actual (no pierde dias); si ya vencio, arranca desde hoy.
export function getRenewedDueDate(student: GymStudent): string {
  const today = getTodayDate();
  const base = student.dueDate > today ? student.dueDate : today;
  return addMonths(base, GYM_STUDENT_PLAN_MONTHS[student.plan]);
}

// Se comparan los ultimos 8 digitos: asi "099 123 456", "99123456" y
// "+598 99 123 456" son el mismo celular (Uruguay).
export function normalizePhoneKey(phone: string): string {
  return phone.replace(/\D/g, "").slice(-8);
}

// Fecha local (YYYY-MM-DD) de un timestamp ISO.
export function toLocalDateFromIso(value: string): string {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
