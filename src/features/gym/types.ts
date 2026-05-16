export type ClientStatus = "up_to_date" | "upcoming" | "due" | "overdue";
export type GymTab = "panel" | "cobros" | "ingresar";

export type Client = {
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

export type NewClientForm = {
  name: string;
  cedula: string;
  plan: string;
  enrolledAt: string;
};

export type DemoMemberCard = {
  name: string;
  plan: string;
  enrolledAt: string;
  nextPaymentDate: string;
  cedula: string;
};

export type MovementItem = {
  id: string;
  clientName: string;
  amount: string;
  dateTime: string;
  plan: string;
  kind: "payment" | "signup";
};
