import { useState } from "react";
import { formatMoney, formatShortDate, getDaysUntilDue } from "../gym.shared";
import type { GymExpense } from "../gym.types";

type GymExpensesSectionProps = {
  expenses: GymExpense[];
  onCreate: (expense: { name: string; amount: number; intervalDays: number }) => void;
  onMarkPaid: (expenseId: string) => void;
  onDelete: (expenseId: string) => void;
};

export function GymExpensesSection({ expenses, onCreate, onMarkPaid, onDelete }: GymExpensesSectionProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [intervalDays, setIntervalDays] = useState("30");

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

  const sorted = [...expenses].sort((a, b) => getDaysUntilDue(a.dueDate) - getDaysUntilDue(b.dueDate));

  return (
    <div className="gym-tab-content">
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
                  <button type="button" className="gym-ghost-button" onClick={() => onMarkPaid(expense.id)}>
                    Marcar pagado
                  </button>
                  <button type="button" className="gym-ghost-button gym-ghost-button--danger" onClick={() => onDelete(expense.id)}>
                    Borrar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
