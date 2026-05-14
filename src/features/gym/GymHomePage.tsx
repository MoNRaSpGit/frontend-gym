import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

type ClientStatus = "up_to_date" | "upcoming" | "due";
type ActivityKind = "alta" | "pago" | "baja" | "ingreso";

type Client = {
  id: string;
  name: string;
  cedula: string;
  plan: string;
  monthlyFee: number;
  enrolledAt: string;
  nextPaymentDate: string;
  visitsThisMonth: number;
  lastVisitAt: string | null;
  active: boolean;
};

type ActivityItem = {
  id: string;
  type: ActivityKind;
  clientName: string;
  detail: string;
  at: string;
};

type NewClientForm = {
  name: string;
  cedula: string;
  plan: string;
  monthlyFee: string;
  enrolledAt: string;
};

const TODAY = "2026-05-14";

const initialClients: Client[] = [
  {
    id: "c-001",
    name: "Juan Perez",
    cedula: "45678901",
    plan: "Libre",
    monthlyFee: 1850,
    enrolledAt: "2026-02-14",
    nextPaymentDate: "2026-05-14",
    visitsThisMonth: 11,
    lastVisitAt: "2026-05-13T19:18:00",
    active: true
  },
  {
    id: "c-002",
    name: "Camila Suarez",
    cedula: "51234098",
    plan: "Funcional",
    monthlyFee: 2100,
    enrolledAt: "2026-03-09",
    nextPaymentDate: "2026-05-19",
    visitsThisMonth: 9,
    lastVisitAt: "2026-05-14T07:10:00",
    active: true
  },
  {
    id: "c-003",
    name: "Matias Acosta",
    cedula: "49811234",
    plan: "Musculacion",
    monthlyFee: 1990,
    enrolledAt: "2026-01-02",
    nextPaymentDate: "2026-05-29",
    visitsThisMonth: 15,
    lastVisitAt: "2026-05-12T20:05:00",
    active: true
  },
  {
    id: "c-004",
    name: "Lucia Silva",
    cedula: "53445001",
    plan: "Pase total",
    monthlyFee: 2400,
    enrolledAt: "2026-04-01",
    nextPaymentDate: "2026-05-11",
    visitsThisMonth: 4,
    lastVisitAt: "2026-05-08T18:41:00",
    active: true
  }
];

const initialActivity: ActivityItem[] = [
  {
    id: "a-001",
    type: "ingreso",
    clientName: "Camila Suarez",
    detail: "Ingreso por tablet en recepcion",
    at: "2026-05-14T07:10:00"
  },
  {
    id: "a-002",
    type: "pago",
    clientName: "Matias Acosta",
    detail: "Pago registrado de cuota mensual",
    at: "2026-05-13T18:30:00"
  },
  {
    id: "a-003",
    type: "alta",
    clientName: "Lucia Silva",
    detail: "Alta nueva con plan Pase total",
    at: "2026-05-12T11:45:00"
  }
];

const initialForm: NewClientForm = {
  name: "",
  cedula: "",
  plan: "Libre",
  monthlyFee: "1900",
  enrolledAt: TODAY
};

function parseLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "short"
  }).format(parseLocalDate(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0
  }).format(value);
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

function getStatusMessage(nextPaymentDate: string) {
  const daysLeft = diffDays(TODAY, nextPaymentDate);

  if (daysLeft <= 0) {
    return "Debe pagar hoy o esta vencido";
  }

  if (daysLeft <= 5) {
    return `Le faltan ${daysLeft} dias para pagar`;
  }

  return `Le faltan ${daysLeft} dias para la proxima cuota`;
}

function getActivityAccent(type: ActivityKind) {
  switch (type) {
    case "alta":
      return "teal";
    case "pago":
      return "emerald";
    case "baja":
      return "rose";
    default:
      return "amber";
  }
}

export function GymHomePage() {
  const [clients, setClients] = useState(initialClients);
  const [activity, setActivity] = useState(initialActivity);
  const [newClient, setNewClient] = useState(initialForm);
  const [kioskInput, setKioskInput] = useState("");
  const [kioskMessage, setKioskMessage] = useState("Escribi la cedula del cliente para ver su ficha y marcar ingreso.");
  const nextIdRef = useRef(100);

  const dashboard = useMemo(() => {
    const activeClients = clients.filter((client) => client.active);
    const dueClients = activeClients.filter((client) => getClientStatus(client.nextPaymentDate) === "due");
    const upcomingClients = activeClients.filter((client) => getClientStatus(client.nextPaymentDate) === "upcoming");
    const checkedInToday = activeClients.filter((client) => client.lastVisitAt?.startsWith(TODAY)).length;
    const projectedRevenue = activeClients.reduce((total, client) => total + client.monthlyFee, 0);

    return {
      activeClients,
      dueClients,
      upcomingClients,
      checkedInToday,
      projectedRevenue
    };
  }, [clients]);

  const kioskClient = useMemo(
    () => clients.find((client) => client.cedula === kioskInput.trim()) ?? null,
    [clients, kioskInput]
  );

  const highlightedClients = useMemo(() => {
    return [...dashboard.activeClients].sort((left, right) => {
      const leftDiff = diffDays(TODAY, left.nextPaymentDate);
      const rightDiff = diffDays(TODAY, right.nextPaymentDate);
      return leftDiff - rightDiff;
    });
  }, [dashboard.activeClients]);

  const recentActivity = useMemo(() => {
    return [...activity].sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime()).slice(0, 8);
  }, [activity]);

  function appendActivity(type: ActivityKind, clientName: string, detail: string) {
    const item: ActivityItem = {
      id: `${type}-${nextIdRef.current++}`,
      type,
      clientName,
      detail,
      at: new Date(`${TODAY}T12:00:00`).toISOString()
    };

    setActivity((current) => [item, ...current]);
  }

  function handleAddClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newClient.name.trim() || !newClient.cedula.trim()) {
      return;
    }

    const createdClient: Client = {
      id: `c-${nextIdRef.current++}`,
      name: newClient.name.trim(),
      cedula: newClient.cedula.trim(),
      plan: newClient.plan,
      monthlyFee: Number(newClient.monthlyFee) || 0,
      enrolledAt: newClient.enrolledAt,
      nextPaymentDate: addMonths(newClient.enrolledAt, 1),
      visitsThisMonth: 0,
      lastVisitAt: null,
      active: true
    };

    setClients((current) => [createdClient, ...current]);
    appendActivity("alta", createdClient.name, `Alta nueva con plan ${createdClient.plan}`);
    setNewClient(initialForm);
  }

  function handleRegisterPayment(clientId: string) {
    const selectedClient = clients.find((client) => client.id === clientId);
    if (!selectedClient) {
      return;
    }

    const updatedPaymentDate = addMonths(selectedClient.nextPaymentDate, 1);

    setClients((current) =>
      current.map((client) => (client.id === clientId ? { ...client, nextPaymentDate: updatedPaymentDate } : client))
    );
    appendActivity("pago", selectedClient.name, `Pago aplicado. Nueva fecha ${formatDate(updatedPaymentDate)}`);
  }

  function handleDeactivateClient(clientId: string) {
    const selectedClient = clients.find((client) => client.id === clientId);
    if (!selectedClient) {
      return;
    }

    setClients((current) => current.map((client) => (client.id === clientId ? { ...client, active: false } : client)));
    appendActivity("baja", selectedClient.name, "Se marco como baja del modulo");
  }

  function handleKioskSubmit() {
    const normalizedCedula = kioskInput.trim();
    if (!normalizedCedula) {
      return;
    }

    const selectedClient = clients.find((client) => client.cedula === normalizedCedula);
    if (!selectedClient) {
      setKioskMessage("No encontramos esa cedula. Idealmente aca podriamos ofrecer alta rapida.");
      return;
    }

    setClients((current) =>
      current.map((client) => {
        if (client.cedula !== normalizedCedula) {
          return client;
        }

        return {
          ...client,
          visitsThisMonth: client.visitsThisMonth + 1,
          lastVisitAt: `${TODAY}T08:45:00`
        };
      })
    );
    appendActivity("ingreso", selectedClient.name, "Ingreso marcado desde el teclado numerico");
    setKioskMessage(`${selectedClient.name} ya quedo marcado como presente en el panel.`);
  }

  function appendDigit(value: string) {
    if (kioskInput.length >= 8) {
      return;
    }

    setKioskInput((current) => current + value);
  }

  function clearKiosk() {
    setKioskInput("");
    setKioskMessage("Escribi la cedula del cliente para ver su ficha y marcar ingreso.");
  }

  return (
    <main className="gym-shell">
      <section className="gym-hero">
        <div className="gym-hero__copy">
          <span className="eyebrow">Gym SaaS Demo</span>
          <h1>Un panel que ayuda a cobrar, seguir asistencia y mostrar orden desde el primer minuto.</h1>
          <p>
            Armamos una demo pensada para vender: control visual de cuotas, recepcion con tablet para check-in por
            cedula y movimiento reciente del negocio en una sola pantalla.
          </p>
          <div className="hero-pills">
            <span>Rojo: paga hoy o vencido</span>
            <span>Amarillo: faltan 5 dias o menos</span>
            <span>Verde: cuota al dia</span>
          </div>
        </div>

        <div className="hero-score">
          <div className="score-card">
            <strong>{dashboard.activeClients.length}</strong>
            <span>socios activos</span>
          </div>
          <div className="score-card">
            <strong>{dashboard.dueClients.length}</strong>
            <span>para cobrar hoy</span>
          </div>
          <div className="score-card">
            <strong>{dashboard.checkedInToday}</strong>
            <span>ingresos hoy</span>
          </div>
          <div className="score-card">
            <strong>{formatCurrency(dashboard.projectedRevenue)}</strong>
            <span>facturacion mensual</span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel panel--wide">
          <div className="panel__header">
            <div>
              <span className="eyebrow eyebrow--muted">Panel de control</span>
              <h2>Clientes y estado de cuota</h2>
            </div>
            <span className="panel-chip">Base demo lista para mostrar</span>
          </div>

          <div className="clients-list">
            {highlightedClients.map((client) => {
              const status = getClientStatus(client.nextPaymentDate);

              return (
                <div className="client-row" key={client.id}>
                  <div className="client-main">
                    <div className={`status-dot status-dot--${status}`} />
                    <div>
                      <strong>{client.name}</strong>
                      <p>
                        CI {client.cedula} · {client.plan} · vence {formatDate(client.nextPaymentDate)}
                      </p>
                    </div>
                  </div>

                  <div className="client-side">
                    <span className={`status-pill status-pill--${status}`}>{getStatusLabel(status)}</span>
                    <span className="client-note">{getStatusMessage(client.nextPaymentDate)}</span>
                    <span className="client-note">
                      {client.lastVisitAt ? `Ultimo ingreso ${formatDateTime(client.lastVisitAt)}` : "Sin ingresos aun"}
                    </span>
                  </div>

                  <div className="client-actions">
                    <button type="button" className="button button--solid" onClick={() => handleRegisterPayment(client.id)}>
                      Marcar pago
                    </button>
                    <button type="button" className="button button--ghost" onClick={() => handleDeactivateClient(client.id)}>
                      Dar baja
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow eyebrow--muted">Oportunidades</span>
              <h2>Alertas de hoy</h2>
            </div>
          </div>
          <div className="alert-stack">
            <div className="alert-card alert-card--danger">
              <strong>{dashboard.dueClients.length} clientes en rojo</strong>
              <p>Ideal para llamar, mandar WhatsApp o cobrar apenas llegan.</p>
            </div>
            <div className="alert-card alert-card--warn">
              <strong>{dashboard.upcomingClients.length} clientes en amarillo</strong>
              <p>Sirve para anticiparse antes de que la cuota venza.</p>
            </div>
            <div className="alert-card alert-card--ok">
              <strong>{dashboard.checkedInToday} ingresos registrados hoy</strong>
              <p>El panel ya te muestra quien paso por recepcion.</p>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow eyebrow--muted">Alta rapida</span>
              <h2>Agregar cliente</h2>
            </div>
          </div>

          <form className="new-client-form" onSubmit={handleAddClient}>
            <label>
              Nombre
              <input
                value={newClient.name}
                onChange={(event) => setNewClient((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ej: Valentina Ramos"
              />
            </label>

            <label>
              Cedula
              <input
                value={newClient.cedula}
                onChange={(event) => setNewClient((current) => ({ ...current, cedula: event.target.value }))}
                placeholder="Solo numeros"
              />
            </label>

            <label>
              Plan
              <select value={newClient.plan} onChange={(event) => setNewClient((current) => ({ ...current, plan: event.target.value }))}>
                <option>Libre</option>
                <option>Musculacion</option>
                <option>Funcional</option>
                <option>Pase total</option>
              </select>
            </label>

            <label>
              Cuota mensual
              <input
                value={newClient.monthlyFee}
                onChange={(event) => setNewClient((current) => ({ ...current, monthlyFee: event.target.value }))}
                inputMode="numeric"
              />
            </label>

            <label>
              Fecha de alta
              <input
                type="date"
                value={newClient.enrolledAt}
                onChange={(event) => setNewClient((current) => ({ ...current, enrolledAt: event.target.value }))}
              />
            </label>

            <button type="submit" className="button button--solid button--full">
              Crear cliente
            </button>
          </form>
        </article>
      </section>

      <section className="experience-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow eyebrow--muted">Recepcion tablet</span>
              <h2>Ingreso por cedula</h2>
            </div>
            <span className="panel-chip panel-chip--dark">Pensado para tablet</span>
          </div>

          <div className="kiosk-screen">
            <span className="kiosk-label">Cedula ingresada</span>
            <strong>{kioskInput || "--------"}</strong>
            <p>{kioskMessage}</p>
          </div>

          <div className="kiosk-grid">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((digit) => (
              <button key={digit} type="button" className="keypad-button" onClick={() => appendDigit(digit)}>
                {digit}
              </button>
            ))}
            <button type="button" className="keypad-button keypad-button--secondary" onClick={clearKiosk}>
              Limpiar
            </button>
            <button type="button" className="keypad-button keypad-button--confirm" onClick={handleKioskSubmit}>
              Ingresar
            </button>
          </div>

          <div className="kiosk-result">
            {kioskClient ? (
              <>
                <strong>{kioskClient.name}</strong>
                <p>
                  Se inscribio el {formatDate(kioskClient.enrolledAt)} · Proximo pago {formatDate(kioskClient.nextPaymentDate)}
                </p>
                <p>{getStatusMessage(kioskClient.nextPaymentDate)}</p>
              </>
            ) : (
              <>
                <strong>Ficha rapida</strong>
                <p>Aca se puede mostrar si esta al dia, su plan, visitas del mes y hasta promociones para renovar.</p>
              </>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow eyebrow--muted">Movimiento</span>
              <h2>Actividad reciente</h2>
            </div>
          </div>

          <div className="activity-list">
            {recentActivity.map((item) => (
              <div className="activity-row" key={item.id}>
                <span className={`activity-dot activity-dot--${getActivityAccent(item.type)}`} />
                <div>
                  <strong>{item.clientName}</strong>
                  <p>{item.detail}</p>
                </div>
                <time>{formatDateTime(item.at)}</time>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow eyebrow--muted">Para vender mejor</span>
              <h2>Que suma valor al gimnasio</h2>
            </div>
          </div>

          <div className="selling-points">
            <div>
              <strong>Cobro sin adivinar</strong>
              <p>Los colores ayudan a recepcion a saber a quien cobrar apenas llega.</p>
            </div>
            <div>
              <strong>Asistencia automatica</strong>
              <p>El check-in por cedula deja trazado quien entro hoy sin planillas manuales.</p>
            </div>
            <div>
              <strong>Base para crecer</strong>
              <p>Despues se puede sumar vencimientos por WhatsApp, rutinas, caja diaria y ranking de asistencia.</p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
