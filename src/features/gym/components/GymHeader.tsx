import { TODAY } from "../data/gymData";
import { formatDate } from "../lib/gymUtils";
import type { GymTab } from "../types";

type Props = {
  activeTab: GymTab;
  activeClientsCount: number;
  summary: {
    due: number;
    upcoming: number;
    checkedInToday: number;
  };
  collectionsSummary: {
    dueToday: unknown[];
    dueSoon: unknown[];
    total: number;
  };
  onTabChange: (tab: GymTab) => void;
};

export function GymHeader({
  activeTab,
  activeClientsCount,
  summary,
  collectionsSummary,
  onTabChange
}: Props) {
  return (
    <section className="hero-simple">
      <div className="hero-top">
        <div>
          <span className="eyebrow">Gym</span>
          <h1>{activeTab === "panel" ? "Panel de control" : "Ingresar"}</h1>
          <p>
            {activeTab === "panel"
              ? "Vista simple para ver clientes, fecha de ingreso y estado de cuota."
              : "Pantalla separada para recepcion y marcado de ingreso por cedula."}
          </p>
        </div>

        <nav className="tabs" aria-label="Secciones gym">
          <button
            type="button"
            className={`tab-button ${activeTab === "panel" ? "tab-button--active" : ""}`}
            onClick={() => onTabChange("panel")}
          >
            Panel
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === "cobros" ? "tab-button--active" : ""}`}
            onClick={() => onTabChange("cobros")}
          >
            Cobros
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === "ingresar" ? "tab-button--active" : ""}`}
            onClick={() => onTabChange("ingresar")}
          >
            Ingresar
          </button>
        </nav>
      </div>

      {activeTab === "panel" ? (
        <div className="summary-row">
          <div className="summary-box">
            <strong>{activeClientsCount}</strong>
            <span>Clientes</span>
          </div>
          <div className="summary-box">
            <strong>{summary.due}</strong>
            <span>Rojo</span>
          </div>
          <div className="summary-box">
            <strong>{summary.upcoming}</strong>
            <span>Amarillo</span>
          </div>
          <div className="summary-box">
            <strong>{summary.checkedInToday}</strong>
            <span>Ingresaron hoy</span>
          </div>
        </div>
      ) : activeTab === "cobros" ? (
        <div className="summary-row">
          <div className="summary-box">
            <strong>{collectionsSummary.dueToday.length}</strong>
            <span>Vencen hoy</span>
          </div>
          <div className="summary-box">
            <strong>{collectionsSummary.dueSoon.length}</strong>
            <span>Vencen en 7 dias</span>
          </div>
          <div className="summary-box">
            <strong>{collectionsSummary.total}</strong>
            <span>Para cobrar</span>
          </div>
          <div className="summary-box">
            <strong>{formatDate(TODAY)}</strong>
            <span>Corte actual</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
