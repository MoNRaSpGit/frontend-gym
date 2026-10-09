export type GymExpense = {
  id: string;
  name: string;
  amount: number;
  intervalDays: number;
  dueDate: string;
  lastPaidAt: string | null;
  createdAt: string;
};

// "producto" (06/10/2026, pedido explicito: "el cliente vende otras cosas,
// no solo la mensualidad -- suplementos, calzas, etc.") es income igual
// que "cobro", pero se carga desde la pestana Tienda y se reporta
// separado en el resumen para no mezclarlo con las cuotas.
export type GymMovementType = "cobro" | "gasto" | "cliente_nuevo" | "producto" | "otro";

export type GymMovement = {
  id: string;
  date: string;
  type: GymMovementType;
  amount: number | null;
  note: string;
  createdAt: string;
};

export type GymStudentPlan = "mensual" | "trimestral" | "semestral" | "anual";

// Categoria/deporte del alumno (01/10/2026, pedido explicito: "me
// preguntaron si podia ser por categoria tambien tipo voley, futbol...").
// "gimnasio" es la generica de siempre (musculacion); el resto son
// actividades con pelota -- se les pone el emoji de su pelota al lado
// del nombre en la lista (ver GYM_STUDENT_CATEGORY_ICONS).
// Pedido explicito (09/10/2026): se suman categorias de gimnasio puro
// para la cuenta nueva "alegym" (Preparacion deportiva, Funcional,
// Musculacion, Zumba) -- se agregan a la lista en vez de reemplazarla,
// asi el cliente real de "ale" (futbol/voley/basquet) sigue igual.
export type GymStudentCategory =
  | "gimnasio"
  | "futbol"
  | "voley"
  | "basquet"
  | "preparacion_deportiva"
  | "funcional"
  | "musculacion"
  | "zumba"
  | "otro";

export type GymStudent = {
  id: string;
  name: string;
  phone: string;
  fee: number | null;
  plan: GymStudentPlan;
  category: GymStudentCategory;
  dueDate: string;
  note: string;
  lastPaidAt: string | null;
  createdAt: string;
};

export type GymCheckIn = {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  // Si entro con la cuota vencida (igual se lo deja pasar, es simulacion).
  wasOverdue: boolean;
};

export type GymAuditAction =
  | "login"
  | "expense_created"
  | "expense_paid"
  | "expense_deleted"
  | "movement_created"
  | "movement_deleted"
  | "student_created"
  | "student_renewed"
  | "student_updated"
  | "student_deleted"
  | "student_checkin";

export type GymAuditEntry = {
  id: string;
  action: GymAuditAction;
  timestamp: string;
  details: string;
};

export type GymWorkspaceData = {
  expenses: GymExpense[];
  movements: GymMovement[];
  students: GymStudent[];
  checkIns: GymCheckIn[];
  auditLog: GymAuditEntry[];
};

export type GymWorkspaceRecord = {
  data: GymWorkspaceData;
  rowVersion: number;
  updatedAt: string | null;
};

export const GYM_MOVEMENT_TYPE_LABELS: Record<GymMovementType, string> = {
  cobro: "Cobro",
  gasto: "Gasto",
  cliente_nuevo: "Cliente nuevo",
  producto: "Venta de producto",
  otro: "Otro"
};

export const GYM_STUDENT_CATEGORY_LABELS: Record<GymStudentCategory, string> = {
  gimnasio: "Gimnasio",
  futbol: "Fútbol",
  voley: "Vóley",
  basquet: "Básquet",
  preparacion_deportiva: "Preparación deportiva",
  funcional: "Funcional",
  musculacion: "Musculación",
  zumba: "Zumba",
  otro: "Otro"
};

// Pedido explicito: "de paso le pones una pelota referenciando, ejemplo
// Juan Futbol (pelota), Pablo Voley (pelota de voley)".
export const GYM_STUDENT_CATEGORY_ICONS: Record<GymStudentCategory, string> = {
  gimnasio: "🏋️",
  futbol: "⚽",
  voley: "🏐",
  basquet: "🏀",
  preparacion_deportiva: "🏃",
  funcional: "🤸",
  musculacion: "💪",
  zumba: "💃",
  otro: "🏷️"
};

export const GYM_STUDENT_PLAN_LABELS: Record<GymStudentPlan, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual"
};

export const GYM_STUDENT_PLAN_MONTHS: Record<GymStudentPlan, number> = {
  mensual: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12
};
