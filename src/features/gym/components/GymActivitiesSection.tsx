import { useMemo, useState } from "react";
import { formatMoney, formatShortDate, getTodayDate } from "../gym.shared";
import type { GymActivity, GymMovement } from "../gym.types";

type GymActivitiesSectionProps = {
  activities: GymActivity[];
  movements: GymMovement[];
  onSave: (input: { id?: string; name: string; price: number }) => void;
  onDelete: (activityId: string) => void;
  onDeleteMovement: (movementId: string) => void;
};

function parsePrice(text: string): number | null {
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

// Pestana "Actividades" (24/11/2026, pedido explicito): Zumba y similares no
// son un plan, se cobran por vez. Aca el cliente arma su catalogo (nombre +
// precio) y mira quien se anoto en cada actividad, dia por dia. El cobro en
// si se hace desde la ficha de cada alumno (pestana Alumnos).
export function GymActivitiesSection({ activities, movements, onSave, onDelete, onDeleteMovement }: GymActivitiesSectionProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [date, setDate] = useState(getTodayDate());
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selected = activities.find((item) => item.id === selectedId) ?? null;

  const attendees = useMemo(() => {
    if (!selected) return [];
    return movements
      .filter((movement) => movement.type === "actividad" && movement.activityId === selected.id && movement.date === date)
      .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "") || a.createdAt.localeCompare(b.createdAt));
  }, [movements, selected, date]);

  const total = attendees.reduce((sum, movement) => sum + (movement.amount ?? 0), 0);

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parsePrice(price);
    if (!name.trim()) {
      setError("Poné el nombre de la actividad.");
      return;
    }
    if (parsed === null) {
      setError("El precio tiene que ser un número.");
      return;
    }
    onSave({ name: name.trim(), price: parsed });
    setName("");
    setPrice("");
    setError(null);
  }

  function openActivity(activity: GymActivity) {
    setSelectedId(activity.id);
    setDate(getTodayDate());
    setEditing(false);
    setConfirmDelete(false);
  }

  function startEdit(activity: GymActivity) {
    setEditName(activity.name);
    setEditPrice(String(activity.price));
    setEditing(true);
  }

  function saveEdit(activity: GymActivity) {
    const parsed = parsePrice(editPrice);
    if (!editName.trim() || parsed === null) return;
    onSave({ id: activity.id, name: editName.trim(), price: parsed });
    setEditing(false);
  }

  return (
    <div className="gym-tab-content">
      <form className="gym-form" onSubmit={handleCreate}>
        <label className="gym-form-note">
          <span>Nueva actividad</span>
          <input type="text" placeholder="Ej: Zumba" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          <span>Precio por vez</span>
          <input type="text" inputMode="decimal" placeholder="Ej: 500" value={price} onChange={(event) => setPrice(event.target.value)} />
        </label>
        <button type="submit" className="gym-primary-button">
          Guardar actividad
        </button>
        {error ? <span className="gym-form-error">{error}</span> : null}
      </form>

      {activities.length === 0 ? (
        <div className="gym-empty-state">
          <strong>Todavía no cargaste actividades</strong>
          <span className="gym-hint">Una actividad es algo que se paga por vez, como Zumba. Después la cobrás desde la ficha de cada alumno.</span>
          <button type="button" className="gym-ghost-button" onClick={() => onSave({ name: "Zumba", price: 500 })}>
            + Agregar Zumba ($500)
          </button>
        </div>
      ) : (
        <div className="gym-activity-grid">
          {activities.map((activity) => (
            <button
              type="button"
              key={activity.id}
              className={`gym-activity-tile ${activity.id === selectedId ? "gym-activity-tile--active" : ""}`}
              onClick={() => openActivity(activity)}
            >
              <strong>{activity.name}</strong>
              <span className="gym-hint">{formatMoney(activity.price)} por vez</span>
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <section className="gym-activity-detail">
          <header className="gym-activity-detail-head">
            {editing ? (
              <div className="gym-activity-edit">
                <input type="text" value={editName} onChange={(event) => setEditName(event.target.value)} aria-label="Nombre" />
                <input type="text" inputMode="decimal" value={editPrice} onChange={(event) => setEditPrice(event.target.value)} aria-label="Precio" />
                <button type="button" className="gym-primary-button gym-primary-button--small" onClick={() => saveEdit(selected)}>
                  Guardar
                </button>
                <button type="button" className="gym-ghost-button" onClick={() => setEditing(false)}>
                  Cancelar
                </button>
              </div>
            ) : confirmDelete ? (
              <div className="gym-confirm">
                <span>¿Borrar {selected.name}? Los cobros ya registrados se conservan.</span>
                <button
                  type="button"
                  className="gym-ghost-button gym-ghost-button--danger"
                  onClick={() => {
                    onDelete(selected.id);
                    setSelectedId(null);
                  }}
                >
                  Sí, borrar
                </button>
                <button type="button" className="gym-ghost-button" onClick={() => setConfirmDelete(false)}>
                  No
                </button>
              </div>
            ) : (
              <>
                <div>
                  <h3>{selected.name}</h3>
                  <span className="gym-hint">{formatMoney(selected.price)} por vez</span>
                </div>
                <div className="gym-activity-detail-actions">
                  <button type="button" className="gym-ghost-button" onClick={() => startEdit(selected)}>
                    Editar
                  </button>
                  <button type="button" className="gym-ghost-button gym-ghost-button--danger" onClick={() => setConfirmDelete(true)}>
                    Borrar
                  </button>
                </div>
              </>
            )}
          </header>

          <label className="gym-activity-date">
            <span>Día</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value || getTodayDate())} />
          </label>

          <div className="gym-summary-cards">
            <div className="gym-summary-card">
              <span className="gym-hint">Anotados el {formatShortDate(date)}</span>
              <strong>{attendees.length}</strong>
            </div>
            <div className="gym-summary-card">
              <span className="gym-hint">Cobrado ese día</span>
              <strong>{formatMoney(total)}</strong>
            </div>
          </div>

          <div className="gym-movement-list">
            {attendees.length === 0 ? (
              <p className="gym-hint">Nadie anotado en {selected.name} ese día.</p>
            ) : (
              attendees.map((movement) => (
                <div key={movement.id} className="gym-movement-row gym-movement-row--ingreso">
                  <span className="gym-badge">{movement.time || "—"}</span>
                  <span>{movement.studentName ?? movement.note}</span>
                  <span className="gym-hint">{movement.amount !== null ? formatMoney(movement.amount) : "-"}</span>
                  <button type="button" className="gym-ghost-button gym-ghost-button--danger" onClick={() => onDeleteMovement(movement.id)}>
                    Borrar
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
