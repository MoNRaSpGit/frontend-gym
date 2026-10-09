import { useMemo, useState } from "react";
import { GraficoResumenMensual, type GymMonthHistoryItem } from "./GraficoResumenMensual";
import { formatDateTime, formatMoney, getYearMonth } from "../gym.shared";
import { GYM_MOVEMENT_TYPE_LABELS, type GymMovement } from "../gym.types";

type GymSummarySectionProps = {
  movements: GymMovement[];
  onDelete: (movementId: string) => void;
  // Mes compartido con Gastos (09/10/2026, pedido explicito) -- vive en
  // GymHomePage, no aca adentro.
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
};

const NOMBRES_MES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

function formatMonthLabel(key: string) {
  const [anio, mes] = key.split("-").map(Number);
  return `${NOMBRES_MES[mes - 1]} ${anio}`;
}

// Verde = entra plata (cobro, producto), rojo = sale plata (gasto) --
// pedido explicito (09/10/2026): "lo que es como un ingreso en verde, lo
// que es como un gasto en rojo, para asimilar rapido".
function movementColorClass(type: GymMovement["type"]) {
  if (type === "cobro" || type === "producto") return "gym-movement-row--ingreso";
  if (type === "gasto") return "gym-movement-row--gasto";
  return "";
}

export function GymSummarySection({ movements, onDelete, selectedMonth, onSelectMonth }: GymSummarySectionProps) {
  const monthMovements = useMemo(
    () => movements.filter((movement) => getYearMonth(movement.date) === selectedMonth),
    [movements, selectedMonth]
  );

  const ingresosCuotas = monthMovements
    .filter((movement) => movement.type === "cobro")
    .reduce((sum, movement) => sum + (movement.amount ?? 0), 0);
  // "producto" (Tienda): ventas de suplementos, calzas, etc. -- suma igual
  // al total de ingresos del mes, pero se muestra aparte de las cuotas.
  const ingresosProductos = monthMovements
    .filter((movement) => movement.type === "producto")
    .reduce((sum, movement) => sum + (movement.amount ?? 0), 0);
  const ingresos = ingresosCuotas + ingresosProductos;
  const egresos = monthMovements
    .filter((movement) => movement.type === "gasto")
    .reduce((sum, movement) => sum + (movement.amount ?? 0), 0);

  const monthlyHistory = useMemo((): GymMonthHistoryItem[] => {
    const totalsByMonth = new Map<string, number>();
    for (const movement of movements) {
      if (movement.type !== "cobro" && movement.type !== "gasto" && movement.type !== "producto") continue;
      const key = getYearMonth(movement.date);
      const signed = movement.type === "gasto" ? -(movement.amount ?? 0) : movement.amount ?? 0;
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

  // Lista de abajo filtrada por el mismo mes elegido arriba (09/10/2026,
  // pedido explicito: "si pongo agosto, me muestra eso").
  const sortedMovements = useMemo(
    () => [...monthMovements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [monthMovements]
  );

  // Paginado simple (06/10/2026, pedido explicito): arranca mostrando 5,
  // "Ver mas" suma de 5 en 5, y cuando el proximo salto ya cubriria todo
  // lo que queda el boton pasa a decir "Ver todos" (mismo boton, un solo
  // click salta al final en vez de seguir de a 5).
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Si se cambia de mes, se vuelve a arrancar mostrando solo 5 (sino
  // quedaba "Ver todos" ya apretado de un mes anterior con mas datos).
  const handleSelectMonth = (key: string) => {
    onSelectMonth(key);
    setVisibleCount(PAGE_SIZE);
  };
  const visibleMovements = sortedMovements.slice(0, visibleCount);
  const remaining = sortedMovements.length - visibleCount;

  return (
    <div className="gym-tab-content">
      <p className="gym-summary-month-label">{formatMonthLabel(selectedMonth)}</p>

      <div className="gym-summary-cards">
        <div className="gym-summary-card gym-summary-card--ingresos">
          <span className="gym-hint">Ingresos del mes</span>
          <strong>{formatMoney(ingresos)}</strong>
        </div>
        <div className="gym-summary-card gym-summary-card--cuotas">
          <span className="gym-hint">Cuotas del mes</span>
          <strong>{formatMoney(ingresosCuotas)}</strong>
        </div>
        <div className="gym-summary-card gym-summary-card--tienda">
          <span className="gym-hint">Tienda del mes</span>
          <strong>{formatMoney(ingresosProductos)}</strong>
        </div>
        <div className="gym-summary-card gym-summary-card--egresos">
          <span className="gym-hint">Gastos diarios del mes</span>
          <strong>{formatMoney(egresos)}</strong>
        </div>
        <div className="gym-summary-card gym-summary-card--neto">
          <span className="gym-hint">Neto del mes</span>
          <strong>{formatMoney(ingresos - egresos)}</strong>
        </div>
      </div>

      <GraficoResumenMensual meses={monthlyHistory} selectedMonth={selectedMonth} onSelectMonth={handleSelectMonth} />

      <div className="gym-movement-list">
        {visibleMovements.length === 0 ? (
          <p className="gym-hint">No hay movimientos en {formatMonthLabel(selectedMonth).toLowerCase()}.</p>
        ) : (
          visibleMovements.map((movement) => (
            <div key={movement.id} className={`gym-movement-row ${movementColorClass(movement.type)}`}>
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

      {remaining > 0 ? (
        <button
          type="button"
          className="gym-ghost-button"
          style={{ marginTop: 10 }}
          onClick={() => setVisibleCount((count) => (remaining <= PAGE_SIZE ? sortedMovements.length : count + PAGE_SIZE))}
        >
          {remaining <= PAGE_SIZE ? "Ver todos" : "Ver más"}
        </button>
      ) : null}
    </div>
  );
}
