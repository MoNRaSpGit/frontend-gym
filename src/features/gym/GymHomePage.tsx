import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

type ClientStatus = "up_to_date" | "upcoming" | "due";
type GymTab = "panel" | "ingresar";

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

type DemoMemberCard = {
  name: string;
  plan: string;
  enrolledAt: string;
  nextPaymentDate: string;
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

const demoMemberCard: DemoMemberCard = {
  name: "Anita",
  plan: "Pase libre",
  enrolledAt: "2026-03-14",
  nextPaymentDate: "2026-05-19"
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

function getPaymentText(nextPaymentDate: string) {
  const daysLeft = diffDays(TODAY, nextPaymentDate);

  if (daysLeft <= 0) {
    return "Paga hoy o esta vencido";
  }

  if (daysLeft <= 5) {
    return `Le faltan ${daysLeft} dias para pagar`;
  }

  return `Le faltan ${daysLeft} dias para pagar`;
}

export function GymHomePage() {
  const [clients, setClients] = useState(initialClients);
  const [newClient, setNewClient] = useState(initialForm);
  const [kioskInput, setKioskInput] = useState("");
  const [kioskResult, setKioskResult] = useState("Todavia no hubo ingresos marcados.");
  const [kioskMember, setKioskMember] = useState<DemoMemberCard | null>(null);
  const [activeTab, setActiveTab] = useState<GymTab>("panel");
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

    setClients((current) =>
      current.map((client) =>
        client.id === "c-001" ? { ...client, lastVisitAt: `${TODAY}T08:45:00` } : client
      )
    );
    setKioskMember(demoMemberCard);
    setKioskResult(`Bienvenida ${demoMemberCard.name}. Ingreso marcado correctamente.`);
  }

  function appendDigit(digit: string) {
    if (kioskInput.length >= 8) {
      return;
    }

    setKioskInput((current) => current + digit);
  }

  function removeDigit() {
    setKioskInput((current) => current.slice(0, -1));
  }

  function clearKiosk() {
    setKioskInput("");
    setKioskMember(null);
    setKioskResult("Todavia no hubo ingresos marcados.");
  }

  return (
    <main className="gym-shell">
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
              onClick={() => setActiveTab("panel")}
            >
              Panel
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === "ingresar" ? "tab-button--active" : ""}`}
              onClick={() => setActiveTab("ingresar")}
            >
              Ingresar
            </button>
          </nav>
        </div>

        {activeTab === "panel" ? (
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
        ) : null}
      </section>

      {activeTab === "panel" ? (
        <section className="layout-simple">
          <article className="panel panel--main">
            <div className="panel__header">
              <h2>Clientes</h2>
            </div>

            <div className="table-head">
              <span>Cliente</span>
              <span>Ingreso y pago</span>
              <span className="table-head__right">Estado</span>
            </div>

            <div className="clients-table">
              {sortedClients.map((client) => {
                const status = getClientStatus(client.nextPaymentDate);

                return (
                  <div className="table-row" key={client.id}>
                    <div className="client-cell">
                      <strong>{client.name}</strong>
                      <span>CI {client.cedula}</span>
                    </div>
                    <div className="client-cell">
                      <strong>Ingreso {formatDate(client.enrolledAt)}</strong>
                      <span>Pago {formatDate(client.nextPaymentDate)}</span>
                    </div>
                    <div className="table-status">
                      <span className={`status-pill status-pill--${status}`}>{getStatusLabel(status)}</span>
                      <span className="status-note">{getPaymentText(client.nextPaymentDate)}</span>
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
          </aside>
        </section>
      ) : (
        <section className="kiosk-page">
          <article className="panel panel--kiosk">
            <div className="panel__header">
              <h2>Ingreso por cedula</h2>
            </div>

            <div className="kiosk-simple">
              <div className="kiosk-display">
                <span>Cedula</span>
                <strong>{kioskInput || "--------"}</strong>
              </div>

              <div className="keypad-grid">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                  <button key={digit} type="button" className="keypad-button" onClick={() => appendDigit(digit)}>
                    {digit}
                  </button>
                ))}
                <button type="button" className="keypad-button keypad-button--muted" onClick={clearKiosk}>
                  Limpiar
                </button>
                <button type="button" className="keypad-button" onClick={() => appendDigit("0")}>
                  0
                </button>
                <button type="button" className="keypad-button keypad-button--muted" onClick={removeDigit}>
                  Borrar
                </button>
              </div>

              <button type="button" className="button button--solid button--full" onClick={handleKioskSubmit}>
                Marcar ingreso
              </button>
              <p>{kioskResult}</p>
            </div>

            {kioskMember ? (
              <article className="member-card">
                <div className="member-card__media" />
                <div className="member-card__body">
                  <span className="member-card__eyebrow">Socio activo</span>
                  <h3>Bienvenida {kioskMember.name}</h3>
                  <div className="member-card__info">
                    <span>Plan: {kioskMember.plan}</span>
                    <span>Ingreso: {formatDate(kioskMember.enrolledAt)}</span>
                    <span>Proximo pago: {formatDate(kioskMember.nextPaymentDate)}</span>
                    <span>Le quedan {diffDays(TODAY, kioskMember.nextPaymentDate)} dias para abonar</span>
                  </div>
                </div>
              </article>
            ) : null}
          </article>
        </section>
      )}
    </main>
  );
}
