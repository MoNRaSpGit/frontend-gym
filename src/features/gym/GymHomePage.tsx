import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

type ClientStatus = "up_to_date" | "upcoming" | "due" | "overdue";
type GymTab = "panel" | "cobros" | "ingresar";

type Client = {
  id: string;
  name: string;
  cedula: string;
  phone: string;
  address: string;
  plan: string;
  enrolledAt: string;
  nextPaymentDate: string;
  active: boolean;
  lastVisitAt: string | null;
};

type NewClientForm = {
  name: string;
  cedula: string;
  plan: string;
  enrolledAt: string;
};

type DemoMemberCard = {
  name: string;
  plan: string;
  enrolledAt: string;
  nextPaymentDate: string;
  cedula: string;
};

type MovementItem = {
  id: string;
  clientName: string;
  amount: string;
  dateTime: string;
  plan: string;
  kind: "payment" | "signup";
};

const TODAY = "2026-05-14";

const initialClients: Client[] = [
  {
    id: "c-001",
    name: "Juan Perez",
    cedula: "45678901",
    phone: "099 123 456",
    address: "Rivera 1234",
    plan: "Plan estandar",
    enrolledAt: "2026-02-14",
    nextPaymentDate: "2026-05-14",
    active: true,
    lastVisitAt: "2026-05-13T19:18:00"
  },
  {
    id: "c-002",
    name: "Camila Suarez",
    cedula: "51234098",
    phone: "094 778 221",
    address: "Colonia 845",
    plan: "Plan 3 meses",
    enrolledAt: "2026-03-09",
    nextPaymentDate: "2026-05-19",
    active: true,
    lastVisitAt: "2026-05-14T07:10:00"
  },
  {
    id: "c-003",
    name: "Matias Acosta",
    cedula: "49811234",
    phone: "091 884 220",
    address: "Bulevar Artigas 2011",
    plan: "Plan estandar",
    enrolledAt: "2026-01-02",
    nextPaymentDate: "2026-05-29",
    active: true,
    lastVisitAt: "2026-05-12T20:05:00"
  },
  {
    id: "c-004",
    name: "Lucia Silva",
    cedula: "53445001",
    phone: "098 443 901",
    address: "8 de Octubre 5540",
    plan: "Plan 6 meses",
    enrolledAt: "2026-04-01",
    nextPaymentDate: "2026-05-11",
    active: true,
    lastVisitAt: "2026-05-08T18:41:00"
  }
];

const initialForm: NewClientForm = {
  name: "",
  cedula: "",
  plan: "Plan estandar",
  enrolledAt: TODAY
};

const demoMemberCard: DemoMemberCard = {
  name: "Anita",
  plan: "Pase libre",
  enrolledAt: "2026-03-14",
  nextPaymentDate: "2026-05-19",
  cedula: "52349876"
};

const demoMovements: MovementItem[] = [];

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function addMonths(dateValue: string, months: number) {
  const nextDate = parseLocalDate(dateValue);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate.toISOString().slice(0, 10);
}

function getPlanMonths(plan: string) {
  if (plan === "Plan 3 meses") {
    return 3;
  }

  if (plan === "Plan 6 meses") {
    return 6;
  }

  return 1;
}

function diffDays(fromDate: string, toDate: string) {
  const diffMs = parseLocalDate(toDate).getTime() - parseLocalDate(fromDate).getTime();
  return Math.round(diffMs / 86_400_000);
}

function getClientStatus(nextPaymentDate: string): ClientStatus {
  const daysLeft = diffDays(TODAY, nextPaymentDate);

  if (daysLeft === 0) {
    return "due";
  }

  if (daysLeft < 0) {
    return "overdue";
  }

  if (daysLeft <= 5) {
    return "upcoming";
  }

  return "up_to_date";
}

function getStatusLabel(status: ClientStatus) {
  switch (status) {
    case "due":
      return "Vence";
    case "upcoming":
      return "Vence";
    case "overdue":
      return "Vence";
    default:
      return "Vence";
  }
}

function getPaymentText(nextPaymentDate: string) {
  return `Vence ${formatDate(nextPaymentDate)}`;
}

function getSuccessStatus(nextPaymentDate: string) {
  const status = getClientStatus(nextPaymentDate);

  if (status === "due") {
    return "Cuota para regularizar hoy";
  }

  if (status === "upcoming") {
    return "Cuota proxima a vencer";
  }

  return "Cuota al dia";
}

function getMaskedCedula(value: string) {
  return `${value.slice(0, 4)}....`;
}

function getPaymentAlertVariant(nextPaymentDate: string) {
  const daysLeft = diffDays(TODAY, nextPaymentDate);

  if (daysLeft < 5) {
    return "danger";
  }

  return "warning";
}

export function GymHomePage() {
  const [clients, setClients] = useState(initialClients);
  const [movements, setMovements] = useState(demoMovements);
  const [newClient, setNewClient] = useState(initialForm);
  const [kioskInput, setKioskInput] = useState("");
  const [kioskResult, setKioskResult] = useState("Todavia no hubo ingresos marcados.");
  const [kioskMember, setKioskMember] = useState<DemoMemberCard | null>(null);
  const [kioskCountdown, setKioskCountdown] = useState(12);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [expandedMovementId, setExpandedMovementId] = useState<string | null>(null);
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

  const collectionsSummary = useMemo(() => {
    const dueToday = activeClients.filter((client) => diffDays(TODAY, client.nextPaymentDate) <= 0);
    const dueSoon = activeClients.filter((client) => {
      const daysLeft = diffDays(TODAY, client.nextPaymentDate);
      return daysLeft > 0 && daysLeft <= 7;
    });

    return {
      dueToday,
      dueSoon,
      total: dueToday.length + dueSoon.length
    };
  }, [activeClients]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  useEffect(() => {
    if (!kioskMember) {
      return;
    }

    setKioskCountdown(12);

    const intervalId = window.setInterval(() => {
      setKioskCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setKioskInput("");
          setKioskMember(null);
          setKioskResult("Todavia no hubo ingresos marcados.");
          return 12;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [kioskMember]);

  function handleAddClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newClient.name.trim() || !newClient.cedula.trim()) {
      return;
    }

    const createdClient: Client = {
      id: `c-${nextIdRef.current++}`,
      name: newClient.name.trim(),
      cedula: newClient.cedula.trim(),
      phone: "099 000 000",
      address: "Direccion a definir",
      plan: newClient.plan,
      enrolledAt: newClient.enrolledAt,
      nextPaymentDate: addMonths(newClient.enrolledAt, getPlanMonths(newClient.plan)),
      active: true,
      lastVisitAt: null
    };

    setClients((current) => [createdClient, ...current]);
    setMovements((current) => [
      {
        id: `m-${nextIdRef.current++}`,
        clientName: createdClient.name,
        amount: "Nuevo cliente",
        dateTime: `${TODAY}T11:30:00`,
        plan: createdClient.plan,
        kind: "signup"
      },
      ...current
    ]);
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
    setKioskResult("Bienvenido");
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
    setKioskCountdown(12);
  }

  function handleQuickPayment(clientId: string) {
    const selected = clients.find((client) => client.id === clientId);
    if (!selected) {
      return;
    }

    setClients((current) =>
      current.map((client) =>
        client.id === clientId
          ? {
              ...client,
              nextPaymentDate: addMonths(client.nextPaymentDate, getPlanMonths(client.plan))
            }
          : client
      )
    );
    setMovements((current) => [
      {
        id: `m-${nextIdRef.current++}`,
        clientName: selected.name,
        amount: selected.plan === "Plan estandar" ? "+ $500" : selected.plan === "Plan 3 meses" ? "+ $1.500" : "+ $3.000",
        dateTime: `${TODAY}T12:15:00`,
        plan: selected.plan,
        kind: "payment"
      },
      ...current
    ]);
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
              className={`tab-button ${activeTab === "cobros" ? "tab-button--active" : ""}`}
              onClick={() => setActiveTab("cobros")}
            >
              Cobros
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

      {activeTab === "panel" ? (
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
                {sortedClients.map((client) => {
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
                        <span className={`status-pill status-pill--${status}`}>{getStatusLabel(status)} {formatDate(client.nextPaymentDate)}</span>
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
                <select
                  value={newClient.plan}
                  onChange={(event) => setNewClient((current) => ({ ...current, plan: event.target.value }))}
                >
                  <option>Plan estandar</option>
                  <option>Plan 3 meses</option>
                  <option>Plan 6 meses</option>
                </select>
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

          <section className="movement-layout">
            <article className="panel">
              <div className="panel__header">
                <h2>Proximos vencimientos</h2>
              </div>

              <div className="movement-list">
                {collectionsSummary.dueSoon.map((client) => (
                  <div className="movement-row" key={client.id}>
                    <span>{client.name}</span>
                    <strong>Vence {formatDate(client.nextPaymentDate)}</strong>
                  </div>
                ))}
                {collectionsSummary.dueSoon.length === 0 ? <p className="empty-copy">No hay vencimientos cercanos.</p> : null}
              </div>
            </article>
          </section>
        </>
      ) : activeTab === "cobros" ? (
        <section className="collections-layout">
          <article className="panel">
            <div className="panel__header">
              <h2>Cobros de hoy</h2>
            </div>

            <div className="collections-list">
              {collectionsSummary.dueToday.map((client) => (
                <div className="collection-row" key={client.id}>
                  <div className="collection-main">
                    <strong>{client.name}</strong>
                    <span>Vence {formatDate(client.nextPaymentDate)}</span>
                  </div>
                  <div className="collection-actions">
                    <button type="button" className="button button--ghost" onClick={() => setSelectedClientId(client.id)}>
                      Ver ficha
                    </button>
                    <button type="button" className="button button--solid" onClick={() => handleQuickPayment(client.id)}>
                      Registrar pago
                    </button>
                  </div>
                </div>
              ))}
              {collectionsSummary.dueToday.length === 0 ? <p className="empty-copy">No hay clientes venciendo hoy.</p> : null}
            </div>
          </article>

          <article className="panel">
            <div className="panel__header">
              <h2>Movimiento</h2>
            </div>

            <div className="collections-list">
              {movements.map((movement) => {
                const isExpanded = expandedMovementId === movement.id;
                const title = movement.clientName;

                return (
                  <div className="collection-item" key={movement.id}>
                    <button
                      type="button"
                      className={`collection-row collection-row--expandable ${isExpanded ? "collection-row--expanded" : ""}`}
                      onClick={() => setExpandedMovementId(isExpanded ? null : movement.id)}
                    >
                      <div className="collection-main">
                        <strong>{title}</strong>
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
      ) : (
        <section className="kiosk-page">
          {!kioskMember ? (
            <article className="panel panel--kiosk">
              <div className="panel__header">
                <h2>Ingreso por cedula</h2>
              </div>

              <div className="kiosk-simple">
                <div className="kiosk-display">
                  <span>Cedula</span>
                  <strong>{kioskInput || "--------"}</strong>
                </div>

                <p className="kiosk-helper">Escribi cualquier numero para simular el ingreso del socio.</p>

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
                  Aceptar
                </button>
                <p>{kioskResult}</p>
              </div>
            </article>
          ) : (
            <article className="member-card member-card--success member-card--welcome">
              <div className="member-card__success">
                <span className="success-icon success-icon--tick" aria-hidden="true">
                  ✓
                </span>
                <div>
                  <p>{kioskResult}</p>
                </div>
              </div>

              <div className="member-card__media">
                <span>IMG</span>
              </div>
              <div className="member-card__body">
                <h3>{kioskMember.name}</h3>
                <p className="member-card__lead">Tu ingreso fue registrado. Ya podes pasar al salon.</p>
                <div className="member-card__info">
                  <span>Cedula: {getMaskedCedula(kioskMember.cedula)}</span>
                  <span>Plan: {kioskMember.plan}</span>
                  <span>Ingreso: {formatDate(kioskMember.enrolledAt)}</span>
                  <span>Proximo pago: {formatDate(kioskMember.nextPaymentDate)}</span>
                </div>
                <div className={`payment-alert payment-alert--${getPaymentAlertVariant(kioskMember.nextPaymentDate)}`}>
                  <strong>{getSuccessStatus(kioskMember.nextPaymentDate)}</strong>
                  <span>Le quedan {diffDays(TODAY, kioskMember.nextPaymentDate)} dias para abonar</span>
                </div>
                <p className="member-card__countdown">Volviendo al ingreso en {kioskCountdown}s</p>
              </div>
            </article>
          )}
        </section>
      )}

      {selectedClient ? (
        <div className="overlay" role="presentation" onClick={() => setSelectedClientId(null)}>
          <article className="member-card member-card--panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="member-card__success member-card__success--panel">
              <span className="success-icon success-icon--panel">SOCIO</span>
              <div>
                <strong>{selectedClient.name}</strong>
                <p>Cobro y estado del cliente</p>
              </div>
            </div>

            <div className="member-card__media">
              <span>IMG</span>
            </div>
            <div className="member-card__body">
              <h3>{selectedClient.name}</h3>
              <div className="detail-grid">
                <div className="detail-card">
                  <span className="detail-label">Cedula</span>
                  <strong>{selectedClient.cedula}</strong>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Telefono</span>
                  <strong>{selectedClient.phone}</strong>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Direccion</span>
                  <strong>{selectedClient.address}</strong>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Plan</span>
                  <strong>{selectedClient.plan}</strong>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Ingreso</span>
                  <strong>{formatDate(selectedClient.enrolledAt)}</strong>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Vencimiento</span>
                  <strong>{formatDate(selectedClient.nextPaymentDate)}</strong>
                </div>
              </div>
              <div className={`payment-alert payment-alert--${getPaymentAlertVariant(selectedClient.nextPaymentDate)}`}>
                <strong>{getPaymentText(selectedClient.nextPaymentDate)}</strong>
                <span>{getSuccessStatus(selectedClient.nextPaymentDate)}</span>
              </div>
              <button type="button" className="button button--ghost button--full" onClick={() => setSelectedClientId(null)}>
                Cerrar ficha
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </main>
  );
}
