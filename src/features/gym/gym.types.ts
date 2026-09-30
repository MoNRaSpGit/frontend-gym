export type GymExpense = {
  id: string;
  name: string;
  amount: number;
  intervalDays: number;
  dueDate: string;
  lastPaidAt: string | null;
  createdAt: string;
};

export type GymTaskColor = "green" | "yellow" | "red";
export type GymTaskStatus = "todo" | "in_progress" | "done";

export type GymTask = {
  id: string;
  title: string;
  color: GymTaskColor;
  status: GymTaskStatus;
  createdAt: string;
};

export type GymMovementType = "cobro" | "gasto" | "cliente_nuevo" | "otro";

export type GymMovement = {
  id: string;
  date: string;
  type: GymMovementType;
  amount: number | null;
  note: string;
  createdAt: string;
};

export type GymStudentPlan = "mensual" | "trimestral" | "semestral" | "anual";

export type GymStudent = {
  id: string;
  name: string;
  phone: string;
  fee: number | null;
  plan: GymStudentPlan;
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
  | "task_created"
  | "task_moved"
  | "task_deleted"
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
  tasks: GymTask[];
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
  otro: "Otro"
};

export const GYM_TASK_COLOR_LABELS: Record<GymTaskColor, string> = {
  green: "Básica",
  yellow: "Más o menos",
  red: "Importante"
};

export const GYM_TASK_STATUS_LABELS: Record<GymTaskStatus, string> = {
  todo: "Tareas",
  in_progress: "Realizando",
  done: "Finalizada"
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
