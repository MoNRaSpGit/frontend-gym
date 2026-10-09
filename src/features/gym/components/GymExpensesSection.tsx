import { useMemo, useState } from "react";
import { addExpenseInterval, formatDateTime, formatMoney, formatShortDate, getDaysUntilDue, getTodayDate, getYearMonth } from "../gym.shared";
import type { GymExpense, GymMovement, GymMovementType } from "../gym.types";

type GymExpensesSectionProps = {
  expenses: GymExpense[];
  onCreate: (expense: { name: string; amount: number; intervalDays: number }) => void;
  onMarkPaid: (expenseId: string) => void;
  onDelete: (expenseId: string) => void;
  // Gastos diarios (09/10/2026, pedido explicito: "en la parte de los
  // gastos tenga gastos diarios y los mensuales") -- reusa el mismo
  // movimiento tipo "gasto" que ya existia en Resumen, solo que ahora
  // tambien se puede cargar y ver desde aca.
  movements: GymMovement[];
  onCreateMovement: (movement: { type: GymMovementType; amount: number | null; note: string }) => void;
  onDeleteMovement: (movementId: string) => void;
};

export function GymExpensesSection({
  expenses,
  onCreate,
  onMarkPaid,
  onDelete,
  movements,
  onCreateMovement,
  onDeleteMovement
}: GymExpensesSectionProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [intervalDays, setIntervalDays] = useState("30");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [dailyNote, setDailyNote] = useState("");
  const [dailyAmount, setDailyAmount] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount.replace(",", "."));
    const parsedDays = Number(intervalDays);

    if (!name.trim()) return;
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) return;
    if (!Number.isFinite(parsedDays) || parsedDays <= 0) return;

    onCreate({ name: name.trim(), amount: parsedAmount, intervalDays: parsedDays });
    setName("");
    setAmount("");
    setIntervalDays("30");
  }

  function handleSubmitDaily(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(dailyAmount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    onCreateMovement({ type: "gasto", amount: parsedAmount, note: dailyNote.trim() });
    setDailyNote("");
    setDailyAmount("");
  }

  const dailyExpenses = useMemo(
    () =>
      movements
        .filter((movement) => movement.type === "gasto" && getYearMonth(movement.date) === getYearMonth(getTodayDate()))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [movements]
  );

  const sorted = [...expenses].sort((a, b) => getDaysUntilDue(a.dueDate) - getDaysUntilDue(b.dueDate));

  return (
    <div className="gym-tab-content">
      <h2 className="gym-section-title">Gastos diarios</h2>
      <form className="gym-form" onSubmit={handleSubmitDaily}>
        <label className="gym-form-note">
          <span>Concepto</span>
          <input
            type="text"
            placeholder="Ej: Agua, flete, propina"
            value={dailyNote}
            onChange={(event) => setDailyNote(event.target.value)}
          />
        </label>
        <label>
          <span>Monto</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Ej: 350"
            value={dailyAmount}
            onChange={(event) => setDailyAmount(event.target.value)}
          />
        </label>
        <button type="submit" className="gym-primary-button">
          Cargar gasto diario
        </button>
      </form>

      <div className="gym-movement-list">
        {dailyExpenses.length === 0 ? (
          <p className="gym-hint">Todavía no cargaste gastos diarios este mes.</p>
        ) : (
          dailyExpenses.map((movement) => (
            <div key={movement.id} className="gym-movement-row">
              <span className="gym-badge">Gasto</span>
              <span>{movement.amount !== null ? formatMoney(movement.amount) : "-"}</span>
              <span className="gym-hint">{movement.note || "-"}</span>
              <span className="gym-hint">{formatDateTime(movement.createdAt)}</span>
              <button type="button" className="gym-ghost-button gym-ghost-button--danger" onClick={() => onDeleteMovement(movement.id)}>
                Borrar
              </button>
            </div>
          ))
        )}
      </div>

      <h2 className="gym-section-title">Gastos mensuales</h2>
      <form className="gym-form" onSubmit={handleSubmit}>
        <label>
          <span>Nombre del gasto</span>
          <input type="text" placeholder="Ej: Luz" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          <span>Monto</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Ej: 2500"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label>
          <span>Cada cuántos días se paga</span>
          <input
            type="number"
            min="1"
            step="1"
            value={intervalDays}
            onChange={(event) => setIntervalDays(event.target.value)}
          />
        </label>
        <button type="submit" className="gym-primary-button">
          Agregar gasto
        </button>
      </form>

      <div className="gym-expense-list">
        {sorted.length === 0 ? (
          <p className="gym-hint">Todavía no cargaste ningún gasto.</p>
        ) : (
          sorted.map((expense) => {
            const daysLeft = getDaysUntilDue(expense.dueDate);
            const isOverdue = daysLeft <= 0;
            return (
              <div key={expense.id} className={isOverdue ? "gym-expense-card gym-expense-card--overdue" : "gym-expense-card"}>
                <div className="gym-expense-card-info">
                  <strong>{expense.name}</strong>
                  <span>{formatMoney(expense.amount)}</span>
                  <span className="gym-hint">Vence: {formatShortDate(expense.dueDate)}</span>
                </div>
                <div className="gym-expense-card-status">
                  {isOverdue ? (
                    <span className="gym-badge gym-badge--danger">Vencido</span>
                  ) : (
                    <span className="gym-badge">{daysLeft} día(s)</span>
                  )}
                </div>
                <div className="gym-expense-card-actions">
                  {confirmingId === expense.id ? (
                    <div className="gym-confirm">
                      <span>
                        ¿Pagado? Próximo vencimiento{" "}
                        <strong>{formatShortDate(addExpenseInterval(expense.dueDate, expense.intervalDays))}</strong>
                      </span>
                      <button
                        type="button"
                        className="gym-primary-button gym-primary-button--small"
                        onClick={() => {
                          onMarkPaid(expense.id);
                          setConfirmingId(null);
                        }}
                      >
                        Confirmar
                      </button>
                      <button type="button" className="gym-ghost-button" onClick={() => setConfirmingId(null)}>
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button type="button" className="gym-ghost-button" onClick={() => setConfirmingId(expense.id)}>
                        Marcar pagado
                      </button>
                      <button type="button" className="gym-ghost-button gym-ghost-button--danger" onClick={() => onDelete(expense.id)}>
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
