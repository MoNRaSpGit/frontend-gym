import { formatDate, getPaymentAlertVariant, getPaymentText, getSuccessStatus } from "../lib/gymUtils";
import type { Client } from "../types";

type Props = {
  client: Client | null;
  onClose: () => void;
};

export function GymMemberModal({ client, onClose }: Props) {
  if (!client) {
    return null;
  }

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <article className="member-card member-card--panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="member-card__success member-card__success--panel">
          <span className="success-icon success-icon--panel">SOCIO</span>
          <div>
            <strong>{client.name}</strong>
            <p>Cobro y estado del cliente</p>
          </div>
        </div>

        <div className="member-card__media">
          <span>IMG</span>
        </div>
        <div className="member-card__body">
          <h3>{client.name}</h3>
          <div className="detail-grid">
            <div className="detail-card">
              <span className="detail-label">Cedula</span>
              <strong>{client.cedula}</strong>
            </div>
            <div className="detail-card">
              <span className="detail-label">Telefono</span>
              <strong>{client.phone}</strong>
            </div>
            <div className="detail-card">
              <span className="detail-label">Direccion</span>
              <strong>{client.address}</strong>
            </div>
            <div className="detail-card">
              <span className="detail-label">Plan</span>
              <strong>{client.plan}</strong>
            </div>
            <div className="detail-card">
              <span className="detail-label">Ingreso</span>
              <strong>{formatDate(client.enrolledAt)}</strong>
            </div>
            <div className="detail-card">
              <span className="detail-label">Vencimiento</span>
              <strong>{formatDate(client.nextPaymentDate)}</strong>
            </div>
          </div>
          <div className={`payment-alert payment-alert--${getPaymentAlertVariant(client.nextPaymentDate)}`}>
            <strong>{getPaymentText(client.nextPaymentDate)}</strong>
            <span>{getSuccessStatus(client.nextPaymentDate)}</span>
          </div>
          <button type="button" className="button button--ghost button--full" onClick={onClose}>
            Cerrar ficha
          </button>
        </div>
      </article>
    </div>
  );
}
