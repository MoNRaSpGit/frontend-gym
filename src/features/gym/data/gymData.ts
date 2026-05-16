import type { Client, DemoMemberCard, MovementItem, NewClientForm } from "../types";

export const TODAY = "2026-05-14";

export const initialClients: Client[] = [
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

export const initialForm: NewClientForm = {
  name: "",
  cedula: "",
  plan: "Plan estandar",
  enrolledAt: TODAY
};

export const demoMemberCard: DemoMemberCard = {
  name: "Anita",
  plan: "Pase libre",
  enrolledAt: "2026-03-14",
  nextPaymentDate: "2026-05-19",
  cedula: "52349876"
};

export const demoMovements: MovementItem[] = [];
