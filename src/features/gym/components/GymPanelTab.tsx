import type { FormEvent } from "react";
import { formatDate, getClientStatus, getStatusLabel } from "../lib/gymUtils";
import type { Client, NewClientForm } from "../types";

type Props = {
  clients: Client[];
  upcomingClients: Client[];
  newClient: NewClientForm;
  onNewClientFieldChange: (field: keyof NewClientForm, value: string) => void;
  onAddClient: () => void;
};

export function GymPanelTab({
  clients,
  upcomingClients,
  newClient,
  onNewClientFieldChange,
  onAddClient
}: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAddClient();
  }

  return (
    <>
      <section className="layout-simple">
        <article className="panel panel--main">
          <div className="panel__header">
            <h2>Clientes</h2>
          </div>

          <div className="table-head">
            <span>Cliente</span>
            <span>Ingreso</span>
            <span className="table-head__right">Estado</span>
          </div>

          <div className="clients-table">
            {clients.map((client) => {
              const status = getClientStatus(client.nextPaymentDate);

              return (
                <div className="table-row" key={client.id}>
                  <div className="client-cell">
                    <strong>{client.name}</strong>
                  </div>
                  <div className="client-cell client-cell--dates">
                    <strong>{formatDate(client.enrolledAt)}</strong>
                  </div>
                  <div className="table-status">
                    <span className={`status-pill status-pill--${status}`}>
                      {getStatusLabel()} {formatDate(client.nextPaymentDate)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <aside className="side-stack">
          <article className="panel">
            <div className="panel__header">
              <h2>Nuevo cliente</h2>
            </div>

            <form className="simple-form" onSubmit={handleSubmit}>
              <input
                value={newClient.name}
                onChange={(event) => onNewClientFieldChange("name", event.target.value)}
                placeholder="Nombre"
              />
              <input
                value={newClient.cedula}
                onChange={(event) => onNewClientFieldChange("cedula", event.target.value)}
                placeholder="Cedula"
              />
              <select
                value={newClient.plan}
                onChange={(event) => onNewClientFieldChange("plan", event.target.value)}
              >
                <option>Plan estandar</option>
                <option>Plan 3 meses</option>
                <option>Plan 6 meses</option>
              </select>
              <input
                type="date"
                value={newClient.enrolledAt}
                onChange={(event) => onNewClientFieldChange("enrolledAt", event.target.value)}
              />
              <button type="submit" className="button button--solid button--full">
                Agregar
              </button>
            </form>
          </article>
        </aside>
      </section>

      <section className="movement-layout">
        <article className="panel">
          <div className="panel__header">
            <h2>Proximos vencimientos</h2>
          </div>

          <div className="movement-list">
            {upcomingClients.map((client) => (
              <div className="movement-row" key={client.id}>
                <span>{client.name}</span>
                <strong>Vence {formatDate(client.nextPaymentDate)}</strong>
              </div>
            ))}
            {upcomingClients.length === 0 ? <p className="empty-copy">No hay vencimientos cercanos.</p> : null}
          </div>
        </article>
      </section>
    </>
  );
}
