import { formatDate, formatDateTime } from "../lib/gymUtils";
import type { Client, MovementItem } from "../types";

type Props = {
  dueToday: Client[];
  movements: MovementItem[];
  expandedMovementId: string | null;
  onSelectClient: (clientId: string) => void;
  onQuickPayment: (clientId: string) => void;
  onToggleMovement: (movementId: string) => void;
};

export function GymCollectionsTab({
  dueToday,
  movements,
  expandedMovementId,
  onSelectClient,
  onQuickPayment,
  onToggleMovement
}: Props) {
  return (
    <section className="collections-layout">
      <article className="panel">
        <div className="panel__header">
          <h2>Cobros de hoy</h2>
        </div>

        <div className="collections-list">
          {dueToday.map((client) => (
            <div className="collection-row" key={client.id}>
              <div className="collection-main">
                <strong>{client.name}</strong>
                <span>Vence {formatDate(client.nextPaymentDate)}</span>
              </div>
              <div className="collection-actions">
                <button type="button" className="button button--ghost" onClick={() => onSelectClient(client.id)}>
                  Ver ficha
                </button>
                <button type="button" className="button button--solid" onClick={() => onQuickPayment(client.id)}>
                  Registrar pago
                </button>
              </div>
            </div>
          ))}
          {dueToday.length === 0 ? <p className="empty-copy">No hay clientes venciendo hoy.</p> : null}
        </div>
      </article>

      <article className="panel">
        <div className="panel__header">
          <h2>Movimiento</h2>
        </div>

        <div className="collections-list">
          {movements.map((movement) => {
            const isExpanded = expandedMovementId === movement.id;

            return (
              <div className="collection-item" key={movement.id}>
                <button
                  type="button"
                  className={`collection-row collection-row--expandable ${isExpanded ? "collection-row--expanded" : ""}`}
                  onClick={() => onToggleMovement(movement.id)}
                >
                  <div className="collection-main">
                    <strong>{movement.clientName}</strong>
                  </div>
                  <span className="collection-amount">{movement.amount}</span>
                </button>
                {isExpanded ? (
                  <div className="collection-detail-bar">
                    <span>{formatDateTime(movement.dateTime)}</span>
                    <strong>{movement.plan}</strong>
                  </div>
                ) : null}
              </div>
            );
          })}
          {movements.length === 0 ? <p className="empty-copy">Sin movimientos todavia.</p> : null}
        </div>
      </article>
    </section>
  );
}
