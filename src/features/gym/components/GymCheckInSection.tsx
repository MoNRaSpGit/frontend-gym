import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatMoney,
  formatShortDate,
  getDaysUntilDue,
  getStudentStatus,
  getTodayDate,
  getYearMonth,
  normalizePhoneKey,
  toLocalDateFromIso
} from "../gym.shared";
import { GYM_STUDENT_PLAN_LABELS, type GymCheckIn, type GymStudent } from "../gym.types";

type GymCheckInSectionProps = {
  students: GymStudent[];
  checkIns: GymCheckIn[];
  onCheckIn: (studentId: string) => void;
};

type Screen =
  | { kind: "keypad" }
  | { kind: "notFound" }
  | { kind: "choose"; studentIds: string[] }
  | { kind: "card"; studentId: string };

const MIN_DIGITS = 5;
const MAX_DIGITS = 12;
const AUTO_RETURN_SECONDS = 10;

// "099123456" -> "099 123 456" para que se lea facil mientras se escribe.
function formatTypedPhone(digits: string): string {
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ");
}

function describeLastVisit(timestamp: string): string {
  const days = getDaysUntilDue(toLocalDateFromIso(timestamp)) * -1;
  const time = new Date(timestamp).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });
  if (days === 0) return `Hoy a las ${time}`;
  if (days === 1) return `Ayer a las ${time}`;
  return `Hace ${days} días (${formatShortDate(toLocalDateFromIso(timestamp))})`;
}

// Simulacion del ingreso al gimnasio (pedido explicito 30/09/2026): el
// alumno marca su celular en un teclado numerico y ve su ficha. Por ahora
// celular y no cedula ("pedir la cedula me parece un poco fuerte").
export function GymCheckInSection({ students, checkIns, onCheckIn }: GymCheckInSectionProps) {
  const [digits, setDigits] = useState("");
  const [screen, setScreen] = useState<Screen>({ kind: "keypad" });
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS);

  const reset = useCallback(() => {
    setDigits("");
    setScreen({ kind: "keypad" });
    setSecondsLeft(AUTO_RETURN_SECONDS);
  }, []);

  const enter = useCallback(
    (studentId: string) => {
      onCheckIn(studentId);
      setScreen({ kind: "card", studentId });
    },
    [onCheckIn]
  );

  const submit = useCallback(() => {
    if (digits.length < MIN_DIGITS) return;
    const key = normalizePhoneKey(digits);
    const matches = students.filter((student) => student.phone && normalizePhoneKey(student.phone) === key);
    if (matches.length === 0) setScreen({ kind: "notFound" });
    else if (matches.length === 1) enter(matches[0].id);
    else setScreen({ kind: "choose", studentIds: matches.map((student) => student.id) });
  }, [digits, students, enter]);

  const pressDigit = useCallback((digit: string) => {
    setDigits((current) => (current.length >= MAX_DIGITS ? current : current + digit));
  }, []);

  const backspace = useCallback(() => setDigits((current) => current.slice(0, -1)), []);

  // Tambien se puede usar con el teclado fisico (PC de recepcion).
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (screen.kind !== "keypad") {
        if (event.key === "Escape" || event.key === "Enter") reset();
        return;
      }
      if (/^\d$/.test(event.key)) pressDigit(event.key);
      else if (event.key === "Backspace") backspace();
      else if (event.key === "Enter") submit();
      else if (event.key === "Escape") setDigits("");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen.kind, pressDigit, backspace, submit, reset]);

  // Vuelve solo al teclado para el siguiente alumno.
  useEffect(() => {
    if (screen.kind === "keypad") return;
    setSecondsLeft(AUTO_RETURN_SECONDS);
    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [screen]);

  useEffect(() => {
    if (screen.kind !== "keypad" && secondsLeft === 0) reset();
  }, [secondsLeft, screen.kind, reset]);

  const cardStudent = screen.kind === "card" ? students.find((student) => student.id === screen.studentId) ?? null : null;

  const cardStats = useMemo(() => {
    if (!cardStudent) return null;
    const own = checkIns
      .filter((checkIn) => checkIn.studentId === cardStudent.id)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const currentMonth = getYearMonth(getTodayDate());
    const daysThisMonth = new Set(
      own.map((checkIn) => toLocalDateFromIso(checkIn.timestamp)).filter((day) => getYearMonth(day) === currentMonth)
    );
    // own[0] es el ingreso que se acaba de registrar; la "ultima visita" es la anterior.
    return { visitsThisMonth: daysThisMonth.size, previousVisit: own[1] ?? null };
  }, [cardStudent, checkIns]);

  const countdown = (
    <div className="gym-kiosk-countdown">
      <div className="gym-kiosk-countdown-bar" style={{ width: `${(secondsLeft / AUTO_RETURN_SECONDS) * 100}%` }} />
    </div>
  );

  if (screen.kind === "notFound") {
    return (
      <div className="gym-kiosk">
        <div className="gym-kiosk-panel gym-kiosk-message">
          <div className="gym-kiosk-icon gym-kiosk-icon--red">?</div>
          <h2>No encontramos ese número</h2>
          <p className="gym-hint">{formatTypedPhone(digits)}</p>
          <p>Revisá que esté bien o pasá por recepción.</p>
          <button type="button" className="gym-primary-button gym-kiosk-wide-button" onClick={reset}>
            Volver a intentar
          </button>
          {countdown}
        </div>
      </div>
    );
  }

  if (screen.kind === "choose") {
    return (
      <div className="gym-kiosk">
        <div className="gym-kiosk-panel gym-kiosk-message">
          <h2>¿Quién sos?</h2>
          <p className="gym-hint">Hay más de un alumno con este celular.</p>
          <div className="gym-kiosk-choose">
            {screen.studentIds.map((studentId) => {
              const student = students.find((item) => item.id === studentId);
              if (!student) return null;
              return (
                <button key={student.id} type="button" className="gym-kiosk-choose-button" onClick={() => enter(student.id)}>
                  <span className="gym-kiosk-choose-avatar">{student.name.charAt(0).toUpperCase()}</span>
                  {student.name}
                </button>
              );
            })}
          </div>
          <button type="button" className="gym-ghost-button" onClick={reset}>
            Cancelar
          </button>
          {countdown}
        </div>
      </div>
    );
  }

  if (screen.kind === "card" && cardStudent && cardStats) {
    const status = getStudentStatus(cardStudent.dueDate);
    const daysLeft = getDaysUntilDue(cardStudent.dueDate);
    const firstName = cardStudent.name.split(" ")[0];
    const headline =
      status === "red" ? "Tu cuota está vencida" : status === "yellow" ? "Tu cuota vence pronto" : "¡Todo al día!";
    const daysText =
      daysLeft > 1
        ? `Te quedan ${daysLeft} días`
        : daysLeft === 1
          ? "Te queda 1 día"
          : daysLeft === 0
            ? "Vence hoy"
            : `Venció hace ${-daysLeft} ${daysLeft === -1 ? "día" : "días"}`;

    return (
      <div className="gym-kiosk">
        <div className={`gym-kiosk-panel gym-kiosk-card gym-kiosk-card--${status}`}>
          <div className="gym-kiosk-card-top">
            <div className="gym-kiosk-avatar">{cardStudent.name.charAt(0).toUpperCase()}</div>
            <p className="gym-kiosk-welcome">¡Bienvenido/a!</p>
            <h2>{firstName}</h2>
            <span className={`gym-due-pill gym-due-pill--${status}`}>{headline}</span>
          </div>

          <div className="gym-kiosk-days">
            <strong>{daysText}</strong>
            <span>Tu cuota vence el {formatShortDate(cardStudent.dueDate)}</span>
          </div>

          {status === "red" ? <p className="gym-kiosk-alert">Pasá por recepción para renovar 🙌</p> : null}

          <dl className="gym-kiosk-facts">
            <div>
              <dt>Alumno desde</dt>
              <dd>{formatShortDate(toLocalDateFromIso(cardStudent.createdAt))}</dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>
                {GYM_STUDENT_PLAN_LABELS[cardStudent.plan]}
                {cardStudent.fee !== null ? ` · ${formatMoney(cardStudent.fee)}` : ""}
              </dd>
            </div>
            <div>
              <dt>Visitas este mes</dt>
              <dd>{cardStats.visitsThisMonth}</dd>
            </div>
            <div>
              <dt>Última visita</dt>
              <dd>{cardStats.previousVisit ? describeLastVisit(cardStats.previousVisit.timestamp) : "¡Es tu primera!"}</dd>
            </div>
          </dl>

          <button type="button" className="gym-primary-button gym-kiosk-wide-button" onClick={reset}>
            Listo ({secondsLeft})
          </button>
          {countdown}
        </div>
      </div>
    );
  }

  const canSubmit = digits.length >= MIN_DIGITS;

  return (
    <div className="gym-kiosk">
      <div className="gym-kiosk-panel">
        <h2 className="gym-kiosk-title">Ingresá tu celular</h2>
        <div className={digits ? "gym-kiosk-display" : "gym-kiosk-display gym-kiosk-display--empty"}>
          {digits ? formatTypedPhone(digits) : "09_ ___ ___"}
        </div>

        <div className="gym-keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button key={digit} type="button" className="gym-key" onClick={() => pressDigit(digit)}>
              {digit}
            </button>
          ))}
          <button type="button" className="gym-key gym-key--muted" onClick={backspace} aria-label="Borrar">
            ⌫
          </button>
          <button type="button" className="gym-key" onClick={() => pressDigit("0")}>
            0
          </button>
          <button type="button" className="gym-key gym-key--ok" onClick={submit} disabled={!canSubmit}>
            OK
          </button>
        </div>

        <p className="gym-hint gym-kiosk-footnote">Modo prueba · el ingreso queda registrado</p>
      </div>
    </div>
  );
}
