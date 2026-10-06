import { useMemo, useState } from "react";
import {
  addMonths,
  formatMoney,
  formatShortDate,
  getDaysUntilDue,
  getRenewedDueDate,
  getStudentStatus,
  getTodayDate,
  type StudentStatus
} from "../gym.shared";
import {
  GYM_STUDENT_CATEGORY_ICONS,
  GYM_STUDENT_CATEGORY_LABELS,
  GYM_STUDENT_PLAN_LABELS,
  GYM_STUDENT_PLAN_MONTHS,
  type GymStudent,
  type GymStudentCategory,
  type GymStudentPlan
} from "../gym.types";

export type GymStudentInput = {
  name: string;
  phone: string;
  fee: number | null;
  plan: GymStudentPlan;
  category: GymStudentCategory;
  dueDate: string;
  note: string;
};

type GymStudentsSectionProps = {
  students: GymStudent[];
  onCreate: (student: GymStudentInput, paidNow: boolean) => void;
  onUpdate: (studentId: string, student: GymStudentInput) => void;
  onRenew: (studentId: string) => void;
  onDelete: (studentId: string) => void;
};

type StatusFilter = "all" | StudentStatus;
type CategoryFilter = "all" | GymStudentCategory;

function describeDaysLeft(daysLeft: number): string {
  if (daysLeft === 0) return "Vence hoy";
  if (daysLeft === 1) return "Vence mañana";
  if (daysLeft > 1) return `Vence en ${daysLeft} días`;
  if (daysLeft === -1) return "Venció ayer";
  return `Venció hace ${-daysLeft} días`;
}

const STATUS_LABELS: Record<StudentStatus, string> = {
  green: "Al día",
  yellow: "Por vencer",
  red: "Vencidos"
};

type FormState = {
  name: string;
  phone: string;
  fee: string;
  plan: GymStudentPlan;
  category: GymStudentCategory;
  dueDate: string;
  note: string;
  paidNow: boolean;
};

function emptyForm(): FormState {
  return {
    name: "",
    phone: "",
    fee: "",
    plan: "mensual",
    category: "gimnasio",
    dueDate: addMonths(getTodayDate(), 1),
    note: "",
    paidNow: true
  };
}

export function GymStudentsSection({ students, onCreate, onUpdate, onRenew, onDelete }: GymStudentsSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [dueDateTouched, setDueDateTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [confirming, setConfirming] = useState<{ id: string; action: "renew" | "delete" } | null>(null);

  const counts = useMemo(() => {
    const result: Record<StudentStatus, number> = { green: 0, yellow: 0, red: 0 };
    for (const student of students) result[getStudentStatus(student.dueDate)] += 1;
    return result;
  }, [students]);

  const categoryCounts = useMemo(() => {
    const result: Record<GymStudentCategory, number> = { gimnasio: 0, futbol: 0, voley: 0, basquet: 0, otro: 0 };
    for (const student of students) result[student.category ?? "gimnasio"] += 1;
    return result;
  }, [students]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students
      .filter((student) => (filter === "all" ? true : getStudentStatus(student.dueDate) === filter))
      .filter((student) => (categoryFilter === "all" ? true : (student.category ?? "gimnasio") === categoryFilter))
      .filter((student) => (term ? student.name.toLowerCase().includes(term) || student.phone.includes(term) : true))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name));
  }, [students, search, filter, categoryFilter]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      // Mientras no toquen la fecha a mano, se recalcula sola con el plan.
      if (key === "plan" && !dueDateTouched && !editingId) {
        next.dueDate = addMonths(getTodayDate(), GYM_STUDENT_PLAN_MONTHS[value as GymStudentPlan]);
      }
      return next;
    });
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setDueDateTouched(false);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEdit(student: GymStudent) {
    setEditingId(student.id);
    setForm({
      name: student.name,
      phone: student.phone,
      fee: student.fee === null ? "" : String(student.fee),
      plan: student.plan,
      category: student.category ?? "gimnasio",
      dueDate: student.dueDate,
      note: student.note,
      paidNow: false
    });
    setDueDateTouched(true);
    setFormError(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError("Poné el nombre del alumno.");
      return;
    }
    let fee: number | null = null;
    if (form.fee.trim()) {
      fee = Number(form.fee.replace(",", "."));
      if (!Number.isFinite(fee) || fee < 0) {
        setFormError("La cuota tiene que ser un número.");
        return;
      }
    }
    if (!form.dueDate) {
      setFormError("Elegí la fecha de vencimiento.");
      return;
    }

    const input: GymStudentInput = {
      name,
      phone: form.phone.trim(),
      fee,
      plan: form.plan,
      category: form.category,
      dueDate: form.dueDate,
      note: form.note.trim()
    };

    if (editingId) onUpdate(editingId, input);
    else onCreate(input, form.paidNow);
    closeForm();
  }

  return (
    <div className="gym-tab-content">
      <div className="gym-students-toolbar">
        <input
          type="search"
          className="gym-search-input"
          placeholder="Buscar alumno..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {!isFormOpen ? (
          <button type="button" className="gym-primary-button" onClick={openCreate}>
            + Nuevo alumno
          </button>
        ) : null}
      </div>

      {isFormOpen ? (
        <form className="gym-student-form" onSubmit={handleSubmit}>
          <div className="gym-student-form-header">
            <h3>{editingId ? "Editar alumno" : "Nuevo alumno"}</h3>
            <button type="button" className="gym-icon-button" onClick={closeForm} aria-label="Cerrar">
              ✕
            </button>
          </div>

          <div className="gym-student-form-grid">
            <label className="gym-field gym-field--wide">
              <span>Nombre *</span>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={form.name}
                autoFocus
                onChange={(event) => updateForm("name", event.target.value)}
              />
            </label>
            <label className="gym-field">
              <span>Teléfono</span>
              <input
                type="tel"
                placeholder="Ej: 099 123 456"
                value={form.phone}
                onChange={(event) => updateForm("phone", event.target.value)}
              />
            </label>
            <label className="gym-field">
              <span>Cuota</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ej: 1500"
                value={form.fee}
                onChange={(event) => updateForm("fee", event.target.value)}
              />
            </label>
            <label className="gym-field">
              <span>Plan</span>
              <select value={form.plan} onChange={(event) => updateForm("plan", event.target.value as GymStudentPlan)}>
                {(Object.keys(GYM_STUDENT_PLAN_LABELS) as GymStudentPlan[]).map((plan) => (
                  <option key={plan} value={plan}>
                    {GYM_STUDENT_PLAN_LABELS[plan]}
                  </option>
                ))}
              </select>
            </label>
            <label className="gym-field">
              <span>Categoría</span>
              <select
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value as GymStudentCategory)}
              >
                {(Object.keys(GYM_STUDENT_CATEGORY_LABELS) as GymStudentCategory[]).map((category) => (
                  <option key={category} value={category}>
                    {GYM_STUDENT_CATEGORY_ICONS[category]} {GYM_STUDENT_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </label>
            <label className="gym-field">
              <span>Vence</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => {
                  setDueDateTouched(true);
                  updateForm("dueDate", event.target.value);
                }}
              />
            </label>
            <label className="gym-field gym-field--wide">
              <span>Nota</span>
              <input
                type="text"
                placeholder="Ej: lesión en rodilla, va de mañana"
                value={form.note}
                onChange={(event) => updateForm("note", event.target.value)}
              />
            </label>
          </div>

          {!editingId ? (
            <label className="gym-checkbox">
              <input
                type="checkbox"
                checked={form.paidNow}
                onChange={(event) => updateForm("paidNow", event.target.checked)}
              />
              <span>Ya pagó la primera cuota (se registra el cobro en Resumen)</span>
            </label>
          ) : null}

          {formError ? <p className="gym-error">{formError}</p> : null}

          <div className="gym-student-form-actions">
            <button type="button" className="gym-ghost-button" onClick={closeForm}>
              Cancelar
            </button>
            <button type="submit" className="gym-primary-button">
              {editingId ? "Guardar cambios" : "Registrar alumno"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="gym-status-filters">
        <button
          type="button"
          className={filter === "all" ? "gym-status-chip gym-status-chip--active" : "gym-status-chip"}
          onClick={() => setFilter("all")}
        >
          Todos <strong>{students.length}</strong>
        </button>
        {(["red", "yellow", "green"] as StudentStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            className={
              filter === status
                ? `gym-status-chip gym-status-chip--${status} gym-status-chip--active`
                : `gym-status-chip gym-status-chip--${status}`
            }
            onClick={() => setFilter(filter === status ? "all" : status)}
          >
            <span className="gym-status-dot" />
            {STATUS_LABELS[status]} <strong>{counts[status]}</strong>
          </button>
        ))}
      </div>

      <div className="gym-status-filters">
        <button
          type="button"
          className={categoryFilter === "all" ? "gym-status-chip gym-status-chip--active" : "gym-status-chip"}
          onClick={() => setCategoryFilter("all")}
        >
          Todas las categorías <strong>{students.length}</strong>
        </button>
        {(Object.keys(GYM_STUDENT_CATEGORY_LABELS) as GymStudentCategory[]).map((category) => (
          <button
            key={category}
            type="button"
            className={categoryFilter === category ? "gym-status-chip gym-status-chip--active" : "gym-status-chip"}
            onClick={() => setCategoryFilter(categoryFilter === category ? "all" : category)}
          >
            {GYM_STUDENT_CATEGORY_ICONS[category]} {GYM_STUDENT_CATEGORY_LABELS[category]}{" "}
            <strong>{categoryCounts[category]}</strong>
          </button>
        ))}
      </div>

      <div className="gym-student-list">
        {students.length === 0 ? (
          <div className="gym-empty-state">
            <strong>Todavía no hay alumnos</strong>
            <span className="gym-hint">Tocá "+ Nuevo alumno" para registrar el primero.</span>
          </div>
        ) : visible.length === 0 ? (
          <p className="gym-hint">No hay alumnos que coincidan con la búsqueda.</p>
        ) : (
          visible.map((student) => {
            const status = getStudentStatus(student.dueDate);
            const daysLeft = getDaysUntilDue(student.dueDate);
            const isConfirmingRenew = confirming?.id === student.id && confirming.action === "renew";
            const isConfirmingDelete = confirming?.id === student.id && confirming.action === "delete";

            return (
              <div key={student.id} className={`gym-student-card gym-student-card--${status}`}>
                <div className="gym-student-avatar">{student.name.charAt(0).toUpperCase()}</div>

                <div className="gym-student-info">
                  <strong className="gym-student-name">
                    {student.name} {GYM_STUDENT_CATEGORY_ICONS[student.category ?? "gimnasio"]}
                  </strong>
                  <span className="gym-student-meta">
                    {GYM_STUDENT_CATEGORY_LABELS[student.category ?? "gimnasio"]} ·{" "}
                    {GYM_STUDENT_PLAN_LABELS[student.plan]}
                    {student.fee !== null ? ` · ${formatMoney(student.fee)}` : ""}
                    {student.phone ? ` · ${student.phone}` : ""}
                  </span>
                  {student.note ? <span className="gym-student-note">{student.note}</span> : null}
                </div>

                <div className="gym-student-due">
                  <span className={`gym-due-pill gym-due-pill--${status}`}>vence {formatShortDate(student.dueDate)}</span>
                  <span className="gym-hint">{describeDaysLeft(daysLeft)}</span>
                </div>

                <div className="gym-student-actions">
                  {isConfirmingRenew ? (
                    <div className="gym-confirm">
                      <span>
                        ¿Renovar hasta <strong>{formatShortDate(getRenewedDueDate(student))}</strong>?
                      </span>
                      <button
                        type="button"
                        className="gym-primary-button gym-primary-button--small"
                        onClick={() => {
                          onRenew(student.id);
                          setConfirming(null);
                        }}
                      >
                        Confirmar
                      </button>
                      <button type="button" className="gym-ghost-button" onClick={() => setConfirming(null)}>
                        No
                      </button>
                    </div>
                  ) : isConfirmingDelete ? (
                    <div className="gym-confirm">
                      <span>¿Borrar a {student.name}?</span>
                      <button
                        type="button"
                        className="gym-ghost-button gym-ghost-button--danger"
                        onClick={() => {
                          onDelete(student.id);
                          setConfirming(null);
                        }}
                      >
                        Sí, borrar
                      </button>
                      <button type="button" className="gym-ghost-button" onClick={() => setConfirming(null)}>
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="gym-primary-button gym-primary-button--small"
                        onClick={() => setConfirming({ id: student.id, action: "renew" })}
                      >
                        Renovar
                      </button>
                      <button type="button" className="gym-ghost-button" onClick={() => openEdit(student)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="gym-ghost-button gym-ghost-button--danger"
                        onClick={() => setConfirming({ id: student.id, action: "delete" })}
                      >
                        Borrar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
