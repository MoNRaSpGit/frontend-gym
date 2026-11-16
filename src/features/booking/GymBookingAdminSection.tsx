import { useCallback, useEffect, useState } from "react";
import { deleteAdminBooking, dayLabel, fetchAdminDay, type AdminDay } from "./booking.client";
import "./booking.css";

// Pestana "Turnos" de Ale: ve quien se anoto (por dia, clase y hora) y tiene
// el link para mandar por WhatsApp.
export function GymBookingAdminSection() {
  const [day, setDay] = useState<AdminDay | null>(null);
  const [date, setDate] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setDay(await fetchAdminDay(date));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar.");
    }
  }, [date]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  if (error && !day) return <p className="bk-error">{error}</p>;
  if (!day) return <p className="bk-empty">Cargando turnos…</p>;
  if (!day.enabled) return <p className="bk-empty">Los turnos todavía no están activados para esta cuenta.</p>;

  const link = `${window.location.origin}${import.meta.env.BASE_URL}#/anotarse/${day.token}`;
  const days = Array.from({ length: 7 }, (_, index) => {
    const [year, month, dayNumber] = day.today.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, dayNumber + index)).toISOString().slice(0, 10);
  });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copiá el link:", link);
    }
  }

  async function removeBooking(id: number, name: string) {
    if (!window.confirm(`¿Sacar a ${name} de este turno?`)) return;
    await deleteAdminBooking(id).catch(() => undefined);
    await load();
  }

  return (
    <div className="bk-page" style={{ padding: 0 }}>
      <div className="bk-link-box">
        <strong>Link para tus alumnos</strong>
        <code>{link}</code>
        <button type="button" className="bk-btn" onClick={() => void copyLink()}>
          {copied ? "¡Copiado!" : "Copiar link"}
        </button>
        <a className="bk-btn bk-btn--ghost" style={{ textAlign: "center", textDecoration: "none" }} href={`https://wa.me/?text=${encodeURIComponent(`Anotate a tu clase acá: ${link}`)}`} target="_blank" rel="noreferrer">
          Mandar por WhatsApp
        </a>
      </div>

      <div className="bk-days">
        {days.map((item) => (
          <button key={item} type="button" className={item === day.date ? "bk-day bk-day--on" : "bk-day"} onClick={() => setDate(item)}>
            {dayLabel(item, day.today)}
          </button>
        ))}
      </div>

      {day.classes.map((gymClass) => {
        const rows = gymClass.hours
          .map((hour) => ({ hour, people: day.bookings.filter((item) => item.classKey === gymClass.key && item.hour === hour) }))
          .filter((row) => row.people.length > 0);
        return (
          <div key={gymClass.key} className="bk-admin-class">
            <h3>{gymClass.name}</h3>
            {rows.length === 0 ? (
              <span className="bk-empty">Nadie anotado este día.</span>
            ) : (
              rows.map((row) => (
                <div key={row.hour} className="bk-admin-row">
                  <strong>
                    {row.hour} · {row.people.length}/{gymClass.capacity}
                  </strong>
                  <div className="bk-names">
                    {row.people.map((person) => (
                      <span key={person.id} className="bk-chip">
                        {person.name}
                        <button type="button" aria-label={`Sacar a ${person.name}`} onClick={() => void removeBooking(person.id, person.name)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
