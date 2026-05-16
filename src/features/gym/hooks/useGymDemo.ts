import { useMemo, useRef, useState } from "react";
import { TODAY, demoMemberCard, demoMovements, initialClients, initialForm } from "../data/gymData";
import { addMonths, diffDays, getClientStatus, getPlanMonths } from "../lib/gymUtils";
import type { Client, DemoMemberCard, GymTab, NewClientForm } from "../types";

export function useGymDemo() {
  const [clients, setClients] = useState(initialClients);
  const [movements, setMovements] = useState(demoMovements);
  const [newClient, setNewClient] = useState(initialForm);
  const [kioskInput, setKioskInput] = useState("");
  const [kioskResult, setKioskResult] = useState("Todavia no hubo ingresos marcados.");
  const [kioskMember, setKioskMember] = useState<DemoMemberCard | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [expandedMovementId, setExpandedMovementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<GymTab>("panel");
  const nextIdRef = useRef(100);

  const activeClients = useMemo(() => clients.filter((client) => client.active), [clients]);

  const summary = useMemo(() => {
    const due = activeClients.filter((client) => getClientStatus(client.nextPaymentDate) === "due").length;
    const upcoming = activeClients.filter((client) => getClientStatus(client.nextPaymentDate) === "upcoming").length;
    const checkedInToday = activeClients.filter((client) => client.lastVisitAt?.startsWith(TODAY)).length;

    return { due, upcoming, checkedInToday };
  }, [activeClients]);

  const sortedClients = useMemo(
    () => [...activeClients].sort((left, right) => diffDays(TODAY, left.nextPaymentDate) - diffDays(TODAY, right.nextPaymentDate)),
    [activeClients]
  );

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

  function setNewClientField(field: keyof NewClientForm, value: string) {
    setNewClient((current) => ({ ...current, [field]: value }));
  }

  function addClient() {
    if (!newClient.name.trim() || !newClient.cedula.trim()) {
      return false;
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
    return true;
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

  return {
    activeTab,
    setActiveTab,
    activeClients,
    summary,
    sortedClients,
    collectionsSummary,
    movements,
    expandedMovementId,
    setExpandedMovementId,
    selectedClient,
    setSelectedClientId,
    newClient,
    setNewClientField,
    addClient,
    kioskInput,
    kioskResult,
    kioskMember,
    appendDigit,
    removeDigit,
    clearKiosk,
    handleKioskSubmit,
    handleQuickPayment
  };
}
