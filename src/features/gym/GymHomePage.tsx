import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

type ClientStatus = "up_to_date" | "upcoming" | "due";

type Client = {
  id: string;
  name: string;
  cedula: string;
  enrolledAt: string;
  nextPaymentDate: string;
  active: boolean;
  lastVisitAt: string | null;
};

type NewClientForm = {
  name: string;
  cedula: string;
  enrolledAt: string;
};

const TODAY = "2026-05-14";

const initialClients: Client[] = [
  {
    id: "c-001",
    name: "Juan Perez",
    cedula: "45678901",
    enrolledAt: "2026-02-14",
    nextPaymentDate: "2026-05-14",
    active: true,
    lastVisitAt: "2026-05-13T19:18:00"
  },
  {
    id: "c-002",
    name: "Camila Suarez",
    cedula: "51234098",
    enrolledAt: "2026-03-09",
    nextPaymentDate: "2026-05-19",
    active: true,
    lastVisitAt: "2026-05-14T07:10:00"
  },
  {
    id: "c-003",
    name: "Matias Acosta",
    cedula: "49811234",
    enrolledAt: "2026-01-02",
    nextPaymentDate: "2026-05-29",
    active: true,
    lastVisitAt: "2026-05-12T20:05:00"
  },
  {
    id: "c-004",
    name: "Lucia Silva",
    cedula: "53445001",
    enrolledAt: "2026-04-01",
    nextPaymentDate: "2026-05-11",
    active: true,
    lastVisitAt: "2026-05-08T18:41:00"
  }
];

const initialForm: NewClientForm = {
  name: "",
  cedula: "",
  enrolledAt: TODAY
};

function parseLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(parseLocalDate(value));
}

function addMonths(dateValue: string, months: number) {
  const nextDate = parseLocalDate(dateValue);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate.toISOString().slice(0, 10);
}

function diffDays(fromDate: string, toDate: string) {
  const diffMs = parseLocalDate(toDate).getTime() - parseLocalDate(fromDate).getTime();
  return Math.round(diffMs / 86_400_000);
}

function getClientStatus(nextPaymentDate: string): ClientStatus {
  const daysLeft = diffDays(TODAY, nextPaymentDate);

  if (daysLeft <= 0) {
    return "due";
  }

  if (daysLeft <= 5) {
    return "upcoming";
  }

  return "up_to_date";
}

function getStatusLabel(status: ClientStatus) {
  switch (status) {
    case "due":
      return "Rojo";
    case "upcoming":
      return "Amarillo";
    default:
      return "Verde";
  }
}

export function GymHomePage() {
  const [clients, setClients] = useState(initialClients);
  const [newClient, setNewClient] = useState(initialForm);
  const [kioskInput, setKioskInput] = useState("");
  const [kioskResult, setKioskResult] = useState("Todavia no hubo ingresos marcados.");
  const nextIdRef = useRef(100);

  const activeClients = useMemo(() => clients.filter((client) => client.active), [clients]);

  const summary = useMemo(() => {
    const due = activeClients.filter((client) => getClientStatus(client.nextPaymentDate) === "due").length;
    const upcoming = activeClients.filter((client) => getClientStatus(client.nextPaymentDate) === "upcoming").length;
    const checkedInToday = activeClients.filter((client) => client.lastVisitAt?.startsWith(TODAY)).length;

    return {
      due,
      upcoming,
      checkedInToday
    };
  }, [activeClients]);

  const sortedClients = useMemo(() => {
    return [...activeClients].sort((left, right) => diffDays(TODAY, left.nextPaymentDate) - diffDays(TODAY, right.nextPaymentDate));
  }, [activeClients]);

  function handleAddClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newClient.name.trim() || !newClient.cedula.trim()) {
      return;
    }

    const createdClient: Client = {
      id: `c-${nextIdRef.current++}`,
      name: newClient.name.trim(),
      cedula: newClient.cedula.trim(),
      enrolledAt: newClient.enrolledAt,
      nextPaymentDate: addMonths(newClient.enrolledAt, 1),
      active: true,
      lastVisitAt: null
    };

    setClients((current) => [createdClient, ...current]);
    setNewClient(initialForm);
  }

  function handleKioskSubmit() {
    const normalizedCedula = kioskInput.trim();
    if (!normalizedCedula) {
      return;
    }

    const selectedClient = clients.find((client) => client.cedula === normalizedCedula);
    if (!selectedClient) {
      setKioskResult("No encontramos esa cedula.");
      return;
    }

    setClients((current) =>
      current.map((client) =>
        client.cedula === normalizedCedula ? { ...client, lastVisitAt: `${TODAY}T08:45:00` } : client
      )
    );
    setKioskResult(`${selectedClient.name} marco ingreso correctamente.`);
    setKioskInput("");
  }

  return (
    <main className="gym-shell">
      <section className="hero-simple">
        <div>
          <span className="eyebrow">Gym</span>
          <h1>Panel de control</h1>
          <p>Vista simple para ver clientes, fecha de ingreso y estado de cuota.</p>
        </div>

        <div className="summary-row">
          <div className="summary-box">
            <strong>{activeClients.length}</strong>
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
      </section>

      <section className="layout-simple">
        <article className="panel panel--main">
          <div className="panel__header">
            <h2>Clientes</h2>
          </div>

          <div className="table-head">
            <span>Cliente</span>
            <span>Fecha de ingreso</span>
            <span className="table-head__right">Estado</span>
          </div>

          <div className="clients-table">
            {sortedClients.map((client) => {
              const status = getClientStatus(client.nextPaymentDate);

              return (
                <div className="table-row" key={client.id}>
                  <strong>{client.name}</strong>
                  <span>{formatDate(client.enrolledAt)}</span>
                  <div className="table-status">
                    <span className={`status-pill status-pill--${status}`}>{getStatusLabel(status)}</span>
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

            <form className="simple-form" onSubmit={handleAddClient}>
              <input
                value={newClient.name}
                onChange={(event) => setNewClient((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nombre"
              />
              <input
                value={newClient.cedula}
                onChange={(event) => setNewClient((current) => ({ ...current, cedula: event.target.value }))}
                placeholder="Cedula"
              />
              <input
                type="date"
                value={newClient.enrolledAt}
                onChange={(event) => setNewClient((current) => ({ ...current, enrolledAt: event.target.value }))}
              />
              <button type="submit" className="button button--solid button--full">
                Agregar
              </button>
            </form>
          </article>

          <article className="panel">
            <div className="panel__header">
              <h2>Ingreso por cedula</h2>
            </div>

            <div className="kiosk-simple">
              <input
                value={kioskInput}
                onChange={(event) => setKioskInput(event.target.value)}
                placeholder="Escribi la cedula"
                inputMode="numeric"
              />
              <button type="button" className="button button--solid button--full" onClick={handleKioskSubmit}>
                Marcar ingreso
              </button>
              <p>{kioskResult}</p>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
