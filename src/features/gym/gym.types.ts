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

// Categoria del alumno (09/10/2026, pedido explicito: "saca las
// categorias gimnasio, futbol, voley y basquet" -- el unico cliente real
// de Gym a partir de ahora es "alegym", asi que quedan solo estas 4 mas
// "otro").
// "musculacion_funcional" (10/10/2026, pedido explicito): categoria
// combinada aparte, no reemplaza a "musculacion" ni a "funcional" por
// separado -- quedan las tres como opciones distintas.
export type GymStudentCategory = "preparacion_deportiva" | "funcional" | "musculacion" | "musculacion_funcional" | "zumba" | "otro";

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
  preparacion_deportiva: "Preparación deportiva",
  funcional: "Funcional",
  musculacion: "Musculación",
  musculacion_funcional: "Musculación y Funcional",
  zumba: "Zumba",
  otro: "Otro"
};

export const GYM_STUDENT_CATEGORY_ICONS: Record<GymStudentCategory, string> = {
  preparacion_deportiva: "🏃",
  funcional: "🤸",
  musculacion: "💪",
  musculacion_funcional: "🏋️",
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
