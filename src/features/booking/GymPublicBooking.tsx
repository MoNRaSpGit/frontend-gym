import { useCallback, useEffect, useMemo, useState } from "react";
import { bookSlot, cancelBooking, dayLabel, fetchPublicSchedule, type PublicSchedule } from "./booking.client";
import "./booking.css";

// Pagina publica de turnos: los alumnos entran por el link (sin login) y se
// anotan en una clase y horario. Lo que reservaron en este celu se recuerda
// para poder cancelar solo lo propio.
type MyBooking = { id: number; cancelCode: string; date: string; classKey: string; hour: string; name: string };

const NAME_KEY = "gym-booking.name";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento: funciona igual, solo no recuerda.
  }
}

export function GymPublicBooking({ token }: { token: string }) {
  const myKey = `gym-booking.mine.${token.slice(0, 8)}`;
  const [schedule, setSchedule] = useState<PublicSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string | undefined>(undefined);
  const [classKey, setClassKey] = useState<string | null>(null);
  const [mine, setMine] = useState<MyBooking[]>(() => readJson<MyBooking[]>(myKey, []));
  const [sheet, setSheet] = useState<{ hour: string } | null>(null);
  const [name, setName] = useState(() => readJson<string>(NAME_KEY, ""));
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await fetchPublicSchedule(token, date);
      setSchedule(next);
      setDate((current) => current ?? next.date);
      setClassKey((current) => current ?? next.classes[0]?.key ?? null);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar.");
    }
  }, [token, date]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 20000);
    return () => window.clearInterval(timer);
  }, [load]);

  const activeClass = useMemo(() => schedule?.classes.find((item) => item.key === classKey) ?? null, [schedule, classKey]);

  function updateMine(next: MyBooking[]) {
    setMine(next);
    writeJson(myKey, next);
  }

  async function confirmBooking() {
    if (!schedule || !activeClass || !sheet || !date) return;
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setSheetError("Poné tu nombre.");
      return;
    }
    setBusy(true);
    setSheetError(null);
    try {
      const result = await bookSlot(token, { date, classKey: activeClass.key, hour: sheet.hour, name: cleanName });
      writeJson(NAME_KEY, cleanName);
      updateMine([...mine, { id: result.id, cancelCode: result.cancelCode, date, classKey: activeClass.key, hour: sheet.hour, name: result.name }]);
      setNotice(`¡Listo, ${result.name}! Quedaste anotado/a en ${activeClass.name} a las ${sheet.hour}.`);
      setSheet(null);
      await load();
    } catch (bookError) {
      setSheetError(bookError instanceof Error ? bookError.message : "No se pudo anotar.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(booking: MyBooking) {
    if (!window.confirm(`¿Cancelar tu turno de ${booking.hour}?`)) return;
    try {
      await cancelBooking(token, { id: booking.id, cancelCode: booking.cancelCode });
    } catch {
      // Si ya no existe (la borró Ale), igual se limpia de este celu.
    }
    updateMine(mine.filter((item) => item.id !== booking.id));
    setNotice("Turno cancelado.");
    await load();
  }

  if (error && !schedule) {
    return (
      <div className="bk-page">
        <div className="bk-head">
          <h1>Ale Gym</h1>
          <p className="bk-error">{error}</p>
        </div>
      </div>
    );
  }
  if (!schedule || !activeClass) {
    return (
      <div className="bk-page">
        <div className="bk-head">
          <h1>Ale Gym</h1>
          <p>Cargando turnos…</p>
        </div>
      </div>
    );
  }

  const dayBookings = schedule.bookings.filter((item) => item.classKey === activeClass.key);
  const isToday = schedule.date === schedule.today;

  return (
    <div className="bk-page">
      <div className="bk-head">
        <h1>Ale Gym</h1>
        <p>Elegí el día, la clase y el horario, y anotate con tu nombre.</p>
      </div>

      {notice ? <div className="bk-ok">{notice}</div> : null}

      <div className="bk-days">
        {schedule.days.map((day) => (
          <button
            key={day}
            type="button"
            className={day === schedule.date ? "bk-day bk-day--on" : "bk-day"}
            onClick={() => {
              setNotice(null);
              setDate(day);
            }}
          >
            {dayLabel(day, schedule.today)}
          </button>
        ))}
      </div>

      <div className="bk-classes">
        {schedule.classes.map((item) => {
          const count = schedule.bookings.filter((booking) => booking.classKey === item.key).length;
          return (
            <button
              key={item.key}
              type="button"
              className={item.key === activeClass.key ? "bk-class bk-class--on" : "bk-class"}
              onClick={() => setClassKey(item.key)}
            >
              {item.name}
              <small>{count} anotados</small>
            </button>
          );
        })}
      </div>

      <div className="bk-slots">
        {activeClass.hours.map((hour) => {
          const people = dayBookings.filter((item) => item.hour === hour);
          const left = activeClass.capacity - people.length;
          const past = isToday && hour <= schedule.nowTime;
          const full = left <= 0;
          const myHere = mine.filter((item) => item.date === schedule.date && item.classKey === activeClass.key && item.hour === hour);
          return (
            <div key={hour} className={past ? "bk-slot bk-slot--past" : "bk-slot"}>
              <div className="bk-slot-top">
                <div>
                  <div className="bk-hour">{hour}</div>
                  <div className="bk-meta">
                    {past ? "Ya pasó" : full ? "Completo" : `Quedan ${left} de ${activeClass.capacity} lugares`}
                  </div>
                </div>
                <button
                  type="button"
                  className="bk-btn"
                  disabled={past || full}
                  onClick={() => {
                    setNotice(null);
                    setSheetError(null);
                    setSheet({ hour });
                  }}
                >
                  {full ? "Completo" : "Anotarme"}
                </button>
              </div>
              <div className={full ? "bk-meter bk-meter--full" : "bk-meter"}>
                <span style={{ width: `${Math.min(100, (people.length / activeClass.capacity) * 100)}%` }} />
              </div>
              {people.length === 0 ? (
                <div className="bk-empty">Todavía no hay nadie anotado.</div>
              ) : (
                <div className="bk-names">
                  {people.map((person, index) => {
                    const own = myHere.find((item) => item.name.toLowerCase() === person.name.toLowerCase());
                    return (
                      <span key={`${person.name}-${index}`} className={own ? "bk-chip bk-chip--me" : "bk-chip"}>
                        {person.name}
                        {own ? (
                          <button type="button" aria-label="Cancelar mi turno" onClick={() => void handleCancel(own)}>
                            ×
                          </button>
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sheet ? (
        <div className="bk-overlay" onClick={() => !busy && setSheet(null)}>
          <div className="bk-sheet" onClick={(event) => event.stopPropagation()}>
            <h2>
              {activeClass.name} · {dayLabel(schedule.date, schedule.today)} · {sheet.hour}
            </h2>
            <input
              className="bk-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tu nombre y apellido"
              maxLength={60}
              autoFocus
            />
            {sheetError ? <div className="bk-error">{sheetError}</div> : null}
            <button type="button" className="bk-btn" disabled={busy} onClick={() => void confirmBooking()}>
              {busy ? "Anotando…" : "Confirmar"}
            </button>
            <button type="button" className="bk-btn bk-btn--ghost" disabled={busy} onClick={() => setSheet(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
