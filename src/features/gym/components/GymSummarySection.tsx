import { useMemo, useState } from "react";
import { GraficoResumenMensual, type GymMonthHistoryItem } from "./GraficoResumenMensual";
import { formatDateTime, formatMoney, getTodayDate, getYearMonth } from "../gym.shared";
import { GYM_MOVEMENT_TYPE_LABELS, type GymMovement, type GymMovementType } from "../gym.types";

type GymSummarySectionProps = {
  movements: GymMovement[];
  onCreate: (movement: { type: GymMovementType; amount: number | null; note: string }) => void;
  onDelete: (movementId: string) => void;
};

const TYPES_WITH_AMOUNT: GymMovementType[] = ["cobro", "gasto"];

export function GymSummarySection({ movements, onCreate, onDelete }: GymSummarySectionProps) {
  const [type, setType] = useState<GymMovementType>("cobro");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const needsAmount = TYPES_WITH_AMOUNT.includes(type);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = needsAmount ? Number(amount.replace(",", ".")) : null;
    if (needsAmount && (!Number.isFinite(parsedAmount) || (parsedAmount ?? 0) <= 0)) return;

    onCreate({ type, amount: parsedAmount, note: note.trim() });
    setAmount("");
    setNote("");
  }

  const currentMonth = getYearMonth(getTodayDate());
  const monthMovements = useMemo(
    () => movements.filter((movement) => getYearMonth(movement.date) === currentMonth),
    [movements, currentMonth]
  );

  const ingresos = monthMovements
    .filter((movement) => movement.type === "cobro")
    .reduce((sum, movement) => sum + (movement.amount ?? 0), 0);
  const egresos = monthMovements
    .filter((movement) => movement.type === "gasto")
    .reduce((sum, movement) => sum + (movement.amount ?? 0), 0);

  const monthlyHistory = useMemo((): GymMonthHistoryItem[] => {
    const totalsByMonth = new Map<string, number>();
    for (const movement of movements) {
      if (movement.type !== "cobro" && movement.type !== "gasto") continue;
      const key = getYearMonth(movement.date);
      const signed = movement.type === "cobro" ? movement.amount ?? 0 : -(movement.amount ?? 0);
      totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + signed);
    }

    return [...totalsByMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, total]) => {
        const [anio, mes] = key.split("-").map(Number);
        return { anio, mes, total };
      });
  }, [movements]);

  const recentMovements = [...movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30);

  return (
    <div className="gym-tab-content">
      <form className="gym-form" onSubmit={handleSubmit}>
        <label>
          <span>Tipo</span>
          <select value={type} onChange={(event) => setType(event.target.value as GymMovementType)}>
            {(Object.keys(GYM_MOVEMENT_TYPE_LABELS) as GymMovementType[]).map((item) => (
              <option key={item} value={item}>
                {GYM_MOVEMENT_TYPE_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        {needsAmount ? (
          <label>
            <span>Monto</span>
            <input type="text" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
        ) : null}
        <label className="gym-form-note">
          <span>Nota (opcional)</span>
          <input type="text" placeholder="Ej: Juan Pérez" value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <button type="submit" className="gym-primary-button">
          Cargar movimiento
        </button>
      </form>

      <div className="gym-summary-cards">
        <div className="gym-summary-card">
          <span className="gym-hint">Ingresos del mes</span>
          <strong>{formatMoney(ingresos)}</strong>
        </div>
        <div className="gym-summary-card">
          <span className="gym-hint">Egresos del mes</span>
          <strong>{formatMoney(egresos)}</strong>
        </div>
        <div className="gym-summary-card">
          <span className="gym-hint">Neto del mes</span>
          <strong>{formatMoney(ingresos - egresos)}</strong>
        </div>
      </div>

      <GraficoResumenMensual meses={monthlyHistory} />

      <div className="gym-movement-list">
        {recentMovements.length === 0 ? (
          <p className="gym-hint">Todavía no cargaste ningún movimiento.</p>
        ) : (
          recentMovements.map((movement) => (
            <div key={movement.id} className="gym-movement-row">
              <span className="gym-badge">{GYM_MOVEMENT_TYPE_LABELS[movement.type]}</span>
              <span>{movement.amount !== null ? formatMoney(movement.amount) : "-"}</span>
              <span className="gym-hint">{movement.note || "-"}</span>
              <span className="gym-hint">{formatDateTime(movement.createdAt)}</span>
              <button type="button" className="gym-ghost-button gym-ghost-button--danger" onClick={() => onDelete(movement.id)}>
                Borrar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
