import { useState } from "react";
import { addExpenseInterval, formatMoney, formatShortDate, getDaysUntilDue } from "../gym.shared";
import type { GymExpense, GymMovementType } from "../gym.types";

type GymExpensesSectionProps = {
  expenses: GymExpense[];
  onCreate: (expense: { name: string; amount: number; intervalDays: number }) => void;
  onMarkPaid: (expenseId: string) => void;
  onDelete: (expenseId: string) => void;
  // Gastos diarios (09/10/2026, pedido explicito: "en gastos solo se va a
  // ingresar nomas... toma el dia de hoy" -- acá es solo alta, sin lista
  // ni navegacion por dia. Eso se mira desde Resumen, con doble clic en
  // la tarjeta "Gastos diarios del mes").
  onCreateMovement: (movement: { type: GymMovementType; amount: number | null; note: string }) => void;
};

export function GymExpensesSection({ expenses, onCreate, onMarkPaid, onDelete, onCreateMovement }: GymExpensesSectionProps) {
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

  const sorted = [...expenses].sort((a, b) => getDaysUntilDue(a.dueDate) - getDaysUntilDue(b.dueDate));

  return (
    <div className="gym-tab-content">
      <h2 className="gym-section-title">Gastos diarios</h2>
      <p className="gym-hint">Se carga con la fecha de hoy. Para ver los gastos diarios de otro día, mirá el Resumen.</p>
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
