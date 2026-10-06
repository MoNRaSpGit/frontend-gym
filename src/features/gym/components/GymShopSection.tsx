import { useMemo, useState } from "react";
import { formatDateTime, formatMoney } from "../gym.shared";
import type { GymMovement } from "../gym.types";

type GymShopSectionProps = {
  movements: GymMovement[];
  onCreate: (movement: { type: "producto"; amount: number | null; note: string }) => void;
  onDelete: (movementId: string) => void;
};

const PAGE_SIZE = 5;

// Pestana "Tienda" (06/10/2026, pedido explicito): el cliente vende otras
// cosas aparte de la cuota -- suplementos, calzas, etc. Reusa el mismo
// sistema de movimientos que Resumen (mismo onCreate/onDelete), solo que
// con tipo "producto" fijo, asi el ingreso se suma solo al total del mes.
export function GymShopSection({ movements, onCreate, onDelete }: GymShopSectionProps) {
  const [producto, setProducto] = useState("");
  const [monto, setMonto] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const ventas = useMemo(
    () => movements.filter((movement) => movement.type === "producto").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [movements]
  );

  const totalMes = useMemo(() => {
    const now = new Date();
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return ventas
      .filter((venta) => venta.date.startsWith(mesActual))
      .reduce((sum, venta) => sum + (venta.amount ?? 0), 0);
  }, [ventas]);

  const visibles = ventas.slice(0, visibleCount);
  const remaining = ventas.length - visibleCount;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(monto.replace(",", "."));
    if (!producto.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    onCreate({ type: "producto", amount: parsedAmount, note: producto.trim() });
    setProducto("");
    setMonto("");
  }

  return (
    <div className="gym-tab-content">
      <form className="gym-form" onSubmit={handleSubmit}>
        <label className="gym-form-note">
          <span>Producto</span>
          <input
            type="text"
            placeholder="Ej: Calza talle M"
            value={producto}
            onChange={(event) => setProducto(event.target.value)}
          />
        </label>
        <label>
          <span>Monto</span>
          <input type="text" inputMode="decimal" placeholder="Ej: 500" value={monto} onChange={(event) => setMonto(event.target.value)} />
        </label>
        <button type="submit" className="gym-primary-button">
          Registrar venta
        </button>
      </form>

      <div className="gym-summary-cards">
        <div className="gym-summary-card">
          <span className="gym-hint">Ventas de productos este mes</span>
          <strong>{formatMoney(totalMes)}</strong>
        </div>
      </div>

      <div className="gym-movement-list">
        {visibles.length === 0 ? (
          <p className="gym-hint">Todavía no registraste ninguna venta de producto.</p>
        ) : (
          visibles.map((venta) => (
            <div key={venta.id} className="gym-movement-row">
              <span className="gym-badge">Producto</span>
              <span>{venta.amount !== null ? formatMoney(venta.amount) : "-"}</span>
              <span className="gym-hint">{venta.note || "-"}</span>
              <span className="gym-hint">{formatDateTime(venta.createdAt)}</span>
              <button type="button" className="gym-ghost-button gym-ghost-button--danger" onClick={() => onDelete(venta.id)}>
                Borrar
              </button>
            </div>
          ))
        )}
      </div>

      {remaining > 0 ? (
        <button
          type="button"
          className="gym-ghost-button"
          style={{ marginTop: 10 }}
          onClick={() => setVisibleCount((count) => (remaining <= PAGE_SIZE ? ventas.length : count + PAGE_SIZE))}
        >
          {remaining <= PAGE_SIZE ? "Ver todos" : "Ver más"}
        </button>
      ) : null}
    </div>
  );
}
