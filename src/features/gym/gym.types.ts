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

// Medicion de un alumno (pestana "Mi Progreso", 10/10/2026, pedido
// explicito: "peso, medida de la cintura, medida del biceps, y capaz que
// alguna otra cosa mas"). Todas las medidas son opcionales: null = ese
// dia no se midio. Se guardan con un decimal.
export type GymProgressRecord = {
  id: string;
  studentId: string;
  // Dia de la medicion (YYYY-MM-DD); puede ser anterior a hoy si se
  // pasan a la app mediciones viejas anotadas en papel.
  date: string;
  weightKg: number | null;
  waistCm: number | null;
  bicepsCm: number | null;
  chestCm: number | null;
  hipsCm: number | null;
  thighCm: number | null;
  bodyFatPct: number | null;
  note: string;
  createdAt: string;
};

export type GymProgressMetricKey = "weightKg" | "waistCm" | "bicepsCm" | "chestCm" | "hipsCm" | "thighCm" | "bodyFatPct";

// Las columnas de la tabla, en el orden en que se muestran. Las tres
// primeras son las que se pidieron; el resto son las medidas que se
// suelen tomar junto con esas. "max" es solo un tope para atajar errores
// de tipeo (ej: 725 en vez de 72,5).
export const GYM_PROGRESS_METRICS: { key: GymProgressMetricKey; label: string; unit: string; max: number }[] = [
  { key: "weightKg", label: "Peso", unit: "kg", max: 400 },
  { key: "waistCm", label: "Cintura", unit: "cm", max: 300 },
  { key: "bicepsCm", label: "Bíceps", unit: "cm", max: 100 },
  { key: "chestCm", label: "Pecho", unit: "cm", max: 300 },
  { key: "hipsCm", label: "Cadera", unit: "cm", max: 300 },
  { key: "thighCm", label: "Muslo", unit: "cm", max: 150 },
  { key: "bodyFatPct", label: "Grasa corporal", unit: "%", max: 80 }
];

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
  | "student_checkin"
  | "progress_created"
  | "progress_deleted";

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
  progressRecords: GymProgressRecord[];
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
