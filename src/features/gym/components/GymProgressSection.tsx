import { useMemo, useState } from "react";
import { formatShortDate, getTodayDate } from "../gym.shared";
import {
  GYM_PROGRESS_METRICS,
  GYM_STUDENT_CATEGORY_ICONS,
  GYM_STUDENT_CATEGORY_LABELS,
  type GymProgressMetricKey,
  type GymProgressRecord,
  type GymStudent
} from "../gym.types";

export type GymProgressInput = Pick<GymProgressRecord, "date" | "note" | GymProgressMetricKey>;

type GymProgressSectionProps = {
  students: GymStudent[];
  records: GymProgressRecord[];
  onCreate: (studentId: string, input: GymProgressInput) => void;
  onDelete: (recordId: string) => void;
};

const EMPTY_VALUES: Record<GymProgressMetricKey, string> = {
  weightKg: "",
  waistCm: "",
  bicepsCm: "",
  chestCm: "",
  hipsCm: "",
  thighCm: "",
  bodyFatPct: ""
};

// Hasta un decimal, con coma como se escribe aca ("72,5").
function formatMetric(value: number): string {
  return value.toLocaleString("es-UY", { maximumFractionDigits: 1 });
}

function countLabel(count: number): string {
  return count === 1 ? "1 medición" : `${count} mediciones`;
}

function formatDelta(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return "=";
  return `${rounded > 0 ? "+" : "−"}${formatMetric(Math.abs(rounded))}`;
}

// Pestana "Mi Progreso" (10/10/2026, pedido explicito): se elige un
// alumno y se le va armando una tabla con sus mediciones -- peso,
// cintura, biceps y algunas mas -- para ver como viene con el tiempo.
// Todas las medidas son opcionales: se carga lo que se haya medido ese
// dia (alcanza con una).
export function GymProgressSection({ students, records, onCreate, onDelete }: GymProgressSectionProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [date, setDate] = useState(getTodayDate());
  const [values, setValues] = useState(EMPTY_VALUES);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const countByStudent = useMemo(() => {
    const counts = new Map<string, { count: number; lastDate: string }>();
    for (const record of records) {
      const current = counts.get(record.studentId);
      counts.set(record.studentId, {
        count: (current?.count ?? 0) + 1,
        lastDate: current && current.lastDate > record.date ? current.lastDate : record.date
      });
    }
    return counts;
  }, [records]);

  const visibleStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students
      .filter((student) => (term ? student.name.toLowerCase().includes(term) || student.phone.includes(term) : true))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [students, search]);

  const selected = selectedId ? (students.find((student) => student.id === selectedId) ?? null) : null;

  // Del mas viejo al mas nuevo: asi cada fila se compara con la anterior.
  const studentRecords = useMemo(
    () =>
      selected
        ? records
            .filter((record) => record.studentId === selected.id)
            .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
        : [],
    [records, selected]
  );

  function openStudent(studentId: string) {
    setSelectedId(studentId);
    setDate(getTodayDate());
    setValues(EMPTY_VALUES);
    setNote("");
    setFormError(null);
    setConfirmingDelete(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    const parsed = {} as Record<GymProgressMetricKey, number | null>;
    for (const metric of GYM_PROGRESS_METRICS) {
      const raw = values[metric.key].trim();
      if (!raw) {
        parsed[metric.key] = null;
        continue;
      }
      const numeric = Number(raw.replace(",", "."));
      if (!Number.isFinite(numeric) || numeric <= 0 || numeric > metric.max) {
        setFormError(`Revisá "${metric.label}": tiene que ser un número mayor a 0 (máximo ${metric.max}).`);
        return;
      }
      parsed[metric.key] = Math.round(numeric * 10) / 10;
    }

    if (GYM_PROGRESS_METRICS.every((metric) => parsed[metric.key] === null)) {
      setFormError("Cargá al menos una medida.");
      return;
    }
    if (!date || date > getTodayDate()) {
      setFormError("La fecha no puede ser futura.");
      return;
    }

    onCreate(selected.id, { date, note: note.trim(), ...parsed });
    setValues(EMPTY_VALUES);
    setNote("");
    setFormError(null);
  }

  if (!selected) {
    return (
      <div className="gym-tab-content">
        <div className="gym-students-toolbar">
          <input
            type="search"
            className="gym-search-input"
            placeholder="Buscar alumno por nombre o celular"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="gym-student-list">
          {students.length === 0 ? (
            <div className="gym-empty-state">
              <strong>Todavía no hay alumnos</strong>
              <span className="gym-hint">Registralos primero en la pestaña Alumnos.</span>
            </div>
          ) : visibleStudents.length === 0 ? (
            <p className="gym-hint">No hay alumnos que coincidan con la búsqueda.</p>
          ) : (
            visibleStudents.map((student) => {
              const summary = countByStudent.get(student.id);
              const category = student.category ?? "otro";
              return (
                <button key={student.id} type="button" className="gym-student-card gym-progress-student" onClick={() => openStudent(student.id)}>
                  <div className="gym-student-avatar">{student.name.charAt(0).toUpperCase()}</div>
                  <div className="gym-student-info">
                    <strong className="gym-student-name">{student.name}</strong>
                    <span className="gym-student-meta">
                      {GYM_STUDENT_CATEGORY_ICONS[category]} {GYM_STUDENT_CATEGORY_LABELS[category]}
                    </span>
                  </div>
                  <span className="gym-hint">
                    {summary
                      ? `${countLabel(summary.count)} · última ${formatShortDate(summary.lastDate)}`
                      : "Sin mediciones"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  const first = studentRecords[0];
  // Solo las columnas que este alumno tiene cargadas alguna vez: si nunca
  // se le midio el muslo, esa columna no ocupa lugar en la tabla.
  const usedMetrics = GYM_PROGRESS_METRICS.filter((metric) => studentRecords.some((record) => record[metric.key] !== null));

  return (
    <div className="gym-tab-content">
      <div className="gym-progress-header">
        <button type="button" className="gym-ghost-button" onClick={() => setSelectedId(null)}>
          ← Alumnos
        </button>
        <div className="gym-student-avatar">{selected.name.charAt(0).toUpperCase()}</div>
        <div>
          <strong className="gym-student-name">{selected.name}</strong>
          <span className="gym-hint">
            {studentRecords.length === 0
              ? "Todavía sin mediciones"
              : `${countLabel(studentRecords.length)} desde el ${formatShortDate(first.date)}`}
          </span>
        </div>
      </div>

      <form className="gym-student-form" onSubmit={handleSubmit}>
        <div className="gym-student-form-header">
          <h3>Nueva medición</h3>
        </div>

        <div className="gym-student-form-grid">
          <label className="gym-field">
            <span>Fecha</span>
            <input type="date" value={date} max={getTodayDate()} onChange={(event) => setDate(event.target.value)} />
          </label>
          {GYM_PROGRESS_METRICS.map((metric) => (
            <label key={metric.key} className="gym-field">
              <span>
                {metric.label} ({metric.unit})
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="—"
                value={values[metric.key]}
                onChange={(event) => setValues((current) => ({ ...current, [metric.key]: event.target.value }))}
              />
            </label>
          ))}
          <label className="gym-field gym-field--wide">
            <span>Nota (opcional)</span>
            <input type="text" placeholder="Ej: arrancó rutina nueva" value={note} maxLength={140} onChange={(event) => setNote(event.target.value)} />
          </label>
        </div>

        {formError ? <p className="gym-error">{formError}</p> : null}

        <div className="gym-student-form-actions">
          <span className="gym-hint">Cargá solo lo que hayas medido hoy.</span>
          <button type="submit" className="gym-primary-button">
            Guardar medición
          </button>
        </div>
      </form>

      {studentRecords.length >= 2 ? (
        <div className="gym-summary-cards">
          {usedMetrics.map((metric) => {
            // Cambio entre la primera y la ultima vez que se midio ESTO
            // (no necesariamente la primera y la ultima fila).
            const measured = studentRecords.filter((record) => record[metric.key] !== null);
            if (measured.length < 2) return null;
            const from = measured[0][metric.key] as number;
            const to = measured[measured.length - 1][metric.key] as number;
            return (
              <div key={metric.key} className="gym-summary-card">
                <span className="gym-hint">{metric.label}</span>
                <strong>
                  {formatMetric(to)} {metric.unit}
                </strong>
                <span className="gym-hint">
                  {formatDelta(to - from)} {metric.unit} desde el {formatShortDate(measured[0].date)}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {studentRecords.length === 0 ? (
        <div className="gym-empty-state">
          <strong>Sin mediciones todavía</strong>
          <span className="gym-hint">Cargá la primera arriba: queda como punto de partida para comparar.</span>
        </div>
      ) : (
        <div className="gym-progress-table-wrap">
          <table className="gym-progress-table">
            <thead>
              <tr>
                <th>Fecha</th>
                {usedMetrics.map((metric) => (
                  <th key={metric.key} className="gym-progress-num">
                    {metric.label} <small>{metric.unit}</small>
                  </th>
                ))}
                <th>Nota</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {/* Lo mas nuevo arriba; la diferencia es contra la medicion anterior de esa misma medida. */}
              {[...studentRecords].reverse().map((record) => {
                const index = studentRecords.indexOf(record);
                return (
                  <tr key={record.id}>
                    <td>{formatShortDate(record.date)}</td>
                    {usedMetrics.map((metric) => {
                      const value = record[metric.key];
                      if (value === null) {
                        return (
                          <td key={metric.key} className="gym-progress-num gym-hint">
                            —
                          </td>
                        );
                      }
                      const previous = studentRecords
                        .slice(0, index)
                        .reverse()
                        .find((item) => item[metric.key] !== null);
                      const delta = previous ? value - (previous[metric.key] as number) : null;
                      return (
                        <td key={metric.key} className="gym-progress-num">
                          <strong>{formatMetric(value)}</strong>
                          {delta !== null ? (
                            <span className={`gym-progress-delta${Math.abs(delta) < 0.05 ? "" : delta > 0 ? " gym-progress-delta--up" : " gym-progress-delta--down"}`}>
                              {formatDelta(delta)}
                            </span>
                          ) : null}
                        </td>
                      );
                    })}
                    <td className="gym-hint">{record.note || "—"}</td>
                    <td className="gym-progress-actions">
                      {confirmingDelete === record.id ? (
                        <>
                          <button
                            type="button"
                            className="gym-ghost-button gym-ghost-button--danger"
                            onClick={() => {
                              onDelete(record.id);
                              setConfirmingDelete(null);
                            }}
                          >
                            Sí, borrar
                          </button>
                          <button type="button" className="gym-ghost-button" onClick={() => setConfirmingDelete(null)}>
                            No
                          </button>
                        </>
                      ) : (
                        <button type="button" className="gym-ghost-button" onClick={() => setConfirmingDelete(record.id)}>
                          Borrar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
