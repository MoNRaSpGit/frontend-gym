// Portado de frontend-joker/GraficoVentasMensuales.tsx (30/09/2026,
// pedido explicito: "la grafica la quiero igual a la que hicimos en el
// proyecto joker") -- mismo dibujo SVG a mano (sin libreria de graficos),
// solo cambian los colores para usar los tokens de gym en vez de los de
// joker.
const NOMBRES_MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const ANCHO = 640;
const ALTO = 220;
const PADDING_X = 24;
const PADDING_SUPERIOR = 34;
const PADDING_INFERIOR = 34;

function armarPathSuave(puntos: Array<{ x: number; y: number }>): string {
  if (puntos.length === 1) return `M ${puntos[0].x} ${puntos[0].y}`;

  let path = `M ${puntos[0].x} ${puntos[0].y}`;
  for (let i = 0; i < puntos.length - 1; i++) {
    const actual = puntos[i];
    const siguiente = puntos[i + 1];
    const mitadX = (actual.x + siguiente.x) / 2;
    path += ` C ${mitadX} ${actual.y}, ${mitadX} ${siguiente.y}, ${siguiente.x} ${siguiente.y}`;
  }
  return path;
}

function formatearPesos(valor: number) {
  return valor.toLocaleString("es-UY", { style: "currency", currency: "UYU", minimumFractionDigits: 0 });
}

export type GymMonthHistoryItem = { anio: number; mes: number; total: number };

function monthKey(anio: number, mes: number) {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

type GraficoResumenMensualProps = {
  meses: GymMonthHistoryItem[];
  // Clic en un mes (09/10/2026, pedido explicito): "si apreto el mes,
  // ejemplo sep, me muestra lo que paso ese mes" -- el punto elegido
  // queda resaltado.
  selectedMonth?: string;
  onSelectMonth?: (key: string) => void;
};

export function GraficoResumenMensual({ meses, selectedMonth, onSelectMonth }: GraficoResumenMensualProps) {
  if (meses.length === 0) {
    return <p className="gym-hint">Todavía no hay movimientos para graficar.</p>;
  }

  const maximo = Math.max(...meses.map((m) => m.total), 1);
  const anchoUtil = ANCHO - PADDING_X * 2;
  const altoUtil = ALTO - PADDING_SUPERIOR - PADDING_INFERIOR;

  const puntos = meses.map((m, i) => {
    const x = meses.length === 1 ? PADDING_X + anchoUtil / 2 : PADDING_X + (i / (meses.length - 1)) * anchoUtil;
    const y = PADDING_SUPERIOR + altoUtil - (m.total / maximo) * altoUtil;
    return { x, y, ...m };
  });

  const pathLinea = armarPathSuave(puntos);
  const pathArea = `${pathLinea} L ${puntos[puntos.length - 1].x} ${PADDING_SUPERIOR + altoUtil} L ${puntos[0].x} ${PADDING_SUPERIOR + altoUtil} Z`;

  const lineasGrilla = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="gym-chart-card">
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="gym-chart-svg"
        preserveAspectRatio="none"
        role="img"
        aria-label="Neto mensual"
      >
        <defs>
          <linearGradient id="gym-mes-relleno" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {lineasGrilla.map((fraccion) => {
          const y = PADDING_SUPERIOR + altoUtil * fraccion;
          return <line key={fraccion} x1={PADDING_X} y1={y} x2={ANCHO - PADDING_X} y2={y} className="gym-chart-grilla" />;
        })}

        <path d={pathArea} fill="url(#gym-mes-relleno)" stroke="none" />
        <path d={pathLinea} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />

        {puntos.map((p) => {
          const key = monthKey(p.anio, p.mes);
          const isSelected = key === selectedMonth;
          return (
            <g
              key={key}
              onClick={() => onSelectMonth?.(key)}
              className={onSelectMonth ? "gym-chart-punto gym-chart-punto--clickable" : "gym-chart-punto"}
            >
              {/* Zona invisible mas grande para que sea facil de tocar en el celular. */}
              <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
              {p.total !== 0 ? (
                <text x={p.x} y={p.y - 12} textAnchor="middle" className="gym-chart-valor">
                  {formatearPesos(p.total)}
                </text>
              ) : null}
              <circle
                cx={p.x}
                cy={p.y}
                r={isSelected ? "6" : "4"}
                fill={isSelected ? "var(--color-accent)" : "var(--color-surface)"}
                stroke="var(--color-accent)"
                strokeWidth="2.5"
              />
              <title>
                {NOMBRES_MES_CORTO[p.mes - 1]} {p.anio}: {formatearPesos(p.total)}
              </title>
              <text
                x={p.x}
                y={ALTO - 10}
                textAnchor="middle"
                className={isSelected ? "gym-chart-etiqueta gym-chart-etiqueta--selected" : "gym-chart-etiqueta"}
              >
                {NOMBRES_MES_CORTO[p.mes - 1]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
