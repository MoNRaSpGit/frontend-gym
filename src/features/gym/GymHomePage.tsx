import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { fetchGymWorkspace, GymUnauthorizedError, saveGymWorkspace } from "./gym.client";
import { computeExpenseAfterPayment, generateId, getRenewedDueDate, getStudentStatus, getTodayDate } from "./gym.shared";
import type {
  GymAuditAction,
  GymAuditEntry,
  GymCheckIn,
  GymExpense,
  GymMovement,
  GymMovementType,
  GymStudent,
  GymTask,
  GymTaskColor,
  GymWorkspaceData
} from "./gym.types";
import { GymExpensesSection } from "./components/GymExpensesSection";
import { GymTasksSection } from "./components/GymTasksSection";
import { GymSummarySection } from "./components/GymSummarySection";
import { GymStudentsSection, type GymStudentInput } from "./components/GymStudentsSection";
import { GymCheckInSection } from "./components/GymCheckInSection";

type GymTab = "alumnos" | "gastos" | "tareas" | "resumen" | "ingresar";

const TAB_LABELS: Record<GymTab, string> = {
  alumnos: "Alumnos",
  gastos: "Gastos",
  tareas: "Tareas",
  resumen: "Resumen",
  ingresar: "Ingresar"
};

const EMPTY_DATA: GymWorkspaceData = { expenses: [], tasks: [], movements: [], students: [], checkIns: [], auditLog: [] };

type GymHomePageProps = {
  userName: string;
  onLogout: () => void;
  onSessionExpired: () => void;
};

export function GymHomePage({ userName, onLogout, onSessionExpired }: GymHomePageProps) {
  const [tab, setTab] = useState<GymTab>("alumnos");
  const [data, setData] = useState<GymWorkspaceData>(EMPTY_DATA);
  const [rowVersion, setRowVersion] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const skipNextSaveRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    fetchGymWorkspace()
      .then((snapshot) => {
        if (cancelled) return;
        setData({ ...snapshot.data, students: snapshot.data.students ?? [], checkIns: snapshot.data.checkIns ?? [] });
        setRowVersion(snapshot.rowVersion);
        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof GymUnauthorizedError) {
          onSessionExpired();
          return;
        }
        setLoadError(error instanceof Error ? error.message : "No se pudo cargar la información.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Carga una sola vez al montar (la home se desmonta al cerrar sesion).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autoguardado (1.2s de silencio, mismo criterio que agro) -- evita
  // guardar en cada tecla y evita el primer guardado espurio al cargar.
  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (isLoading) return;

    const timeoutId = window.setTimeout(() => {
      saveGymWorkspace(data, rowVersion)
        .then((snapshot) => {
          setRowVersion(snapshot.rowVersion);
        })
        .catch((error) => {
          if (error instanceof GymUnauthorizedError) {
            onSessionExpired();
            return;
          }
          toast.error(error instanceof Error ? error.message : "No se pudo guardar.");
        });
    }, 1200);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function addAudit(action: GymAuditAction, details: string) {
    const entry: GymAuditEntry = {
      id: generateId("audit"),
      action,
      timestamp: new Date().toISOString(),
      details
    };
    return entry;
  }

  function handleCreateExpense(input: { name: string; amount: number; intervalDays: number }) {
    const today = getTodayDate();
    const due = new Date(`${today}T00:00:00`);
    due.setDate(due.getDate() + input.intervalDays);

    const expense: GymExpense = {
      id: generateId("exp"),
      name: input.name,
      amount: input.amount,
      intervalDays: input.intervalDays,
      dueDate: due.toISOString().slice(0, 10),
      lastPaidAt: null,
      createdAt: new Date().toISOString()
    };

    setData((current) => ({
      ...current,
      expenses: [expense, ...current.expenses],
      auditLog: [addAudit("expense_created", `Gasto creado: ${expense.name} (${expense.intervalDays} días)`), ...current.auditLog]
    }));
    toast.success("Gasto agregado.");
  }

  function handleMarkExpensePaid(expenseId: string) {
    setData((current) => {
      const expense = current.expenses.find((item) => item.id === expenseId);
      if (!expense) return current;

      const updatedExpense = computeExpenseAfterPayment(expense);
      const movement: GymMovement = {
        id: generateId("mov"),
        date: getTodayDate(),
        type: "gasto",
        amount: expense.amount,
        note: `Pago: ${expense.name}`,
        createdAt: new Date().toISOString()
      };

      return {
        ...current,
        expenses: current.expenses.map((item) => (item.id === expenseId ? updatedExpense : item)),
        movements: [movement, ...current.movements],
        auditLog: [addAudit("expense_paid", `Gasto pagado: ${expense.name}`), ...current.auditLog]
      };
    });
    toast.success("Gasto marcado como pagado.");
  }

  function handleDeleteExpense(expenseId: string) {
    setData((current) => {
      const expense = current.expenses.find((item) => item.id === expenseId);
      return {
        ...current,
        expenses: current.expenses.filter((item) => item.id !== expenseId),
        auditLog: expense
          ? [addAudit("expense_deleted", `Gasto borrado: ${expense.name}`), ...current.auditLog]
          : current.auditLog
      };
    });
  }

  function handleCreateTask(input: { title: string; color: GymTaskColor }) {
    const task: GymTask = {
      id: generateId("task"),
      title: input.title,
      color: input.color,
      status: "todo",
      createdAt: new Date().toISOString()
    };
    setData((current) => ({
      ...current,
      tasks: [task, ...current.tasks],
      auditLog: [addAudit("task_created", `Tarea creada: ${task.title}`), ...current.auditLog]
    }));
  }

  function handleMoveTask(taskId: string, direction: "forward" | "backward") {
    setData((current) => {
      const order: GymTask["status"][] = ["todo", "in_progress", "done"];
      const task = current.tasks.find((item) => item.id === taskId);
      if (!task) return current;

      const currentIndex = order.indexOf(task.status);
      const nextIndex = direction === "forward" ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= order.length) return current;

      const nextStatus = order[nextIndex];
      return {
        ...current,
        tasks: current.tasks.map((item) => (item.id === taskId ? { ...item, status: nextStatus } : item)),
        auditLog: [addAudit("task_moved", `Tarea "${task.title}" movida a ${nextStatus}`), ...current.auditLog]
      };
    });
  }

  function handleDeleteTask(taskId: string) {
    setData((current) => {
      const task = current.tasks.find((item) => item.id === taskId);
      return {
        ...current,
        tasks: current.tasks.filter((item) => item.id !== taskId),
        auditLog: task ? [addAudit("task_deleted", `Tarea borrada: ${task.title}`), ...current.auditLog] : current.auditLog
      };
    });
  }

  function handleCreateMovement(input: { type: GymMovementType; amount: number | null; note: string }) {
    const movement: GymMovement = {
      id: generateId("mov"),
      date: getTodayDate(),
      type: input.type,
      amount: input.amount,
      note: input.note,
      createdAt: new Date().toISOString()
    };
    setData((current) => ({
      ...current,
      movements: [movement, ...current.movements],
      auditLog: [addAudit("movement_created", `Movimiento: ${input.type}${input.note ? " · " + input.note : ""}`), ...current.auditLog]
    }));
  }

  function handleDeleteMovement(movementId: string) {
    setData((current) => ({
      ...current,
      movements: current.movements.filter((item) => item.id !== movementId),
      auditLog: [addAudit("movement_deleted", "Movimiento borrado"), ...current.auditLog]
    }));
  }

  function handleCreateStudent(input: GymStudentInput, paidNow: boolean) {
    const now = new Date().toISOString();
    const today = getTodayDate();
    const student: GymStudent = {
      id: generateId("stu"),
      ...input,
      lastPaidAt: paidNow ? today : null,
      createdAt: now
    };

    // Alta de alumno = "Cliente nuevo" en Resumen (pedido explicito) y, si
    // ya pago, tambien el cobro de la primera cuota.
    const newMovements: GymMovement[] = [
      { id: generateId("mov"), date: today, type: "cliente_nuevo", amount: null, note: student.name, createdAt: now }
    ];
    if (paidNow) {
      newMovements.unshift({
        id: generateId("mov"),
        date: today,
        type: "cobro",
        amount: student.fee,
        note: `Cuota: ${student.name}`,
        createdAt: now
      });
    }

    setData((current) => ({
      ...current,
      students: [student, ...current.students],
      movements: [...newMovements, ...current.movements],
      auditLog: [addAudit("student_created", `Alumno registrado: ${student.name} (vence ${student.dueDate})`), ...current.auditLog]
    }));
    toast.success(`${student.name} registrado.`);
  }

  function handleUpdateStudent(studentId: string, input: GymStudentInput) {
    setData((current) => {
      const student = current.students.find((item) => item.id === studentId);
      if (!student) return current;
      return {
        ...current,
        students: current.students.map((item) => (item.id === studentId ? { ...item, ...input } : item)),
        auditLog: [addAudit("student_updated", `Alumno editado: ${input.name} (vence ${input.dueDate})`), ...current.auditLog]
      };
    });
    toast.success("Cambios guardados.");
  }

  function handleRenewStudent(studentId: string) {
    const student = data.students.find((item) => item.id === studentId);
    if (!student) return;
    const today = getTodayDate();
    const nextDueDate = getRenewedDueDate(student);
    const movement: GymMovement = {
      id: generateId("mov"),
      date: today,
      type: "cobro",
      amount: student.fee,
      note: `Cuota: ${student.name}`,
      createdAt: new Date().toISOString()
    };

    setData((current) => ({
      ...current,
      students: current.students.map((item) =>
        item.id === studentId ? { ...item, dueDate: nextDueDate, lastPaidAt: today } : item
      ),
      movements: [movement, ...current.movements],
      auditLog: [addAudit("student_renewed", `Alumno renovado: ${student.name} (nuevo vencimiento ${nextDueDate})`), ...current.auditLog]
    }));
    toast.success(`${student.name} renovado.`);
  }

  function handleDeleteStudent(studentId: string) {
    setData((current) => {
      const student = current.students.find((item) => item.id === studentId);
      return {
        ...current,
        students: current.students.filter((item) => item.id !== studentId),
        auditLog: student ? [addAudit("student_deleted", `Alumno borrado: ${student.name}`), ...current.auditLog] : current.auditLog
      };
    });
  }

  function handleCheckIn(studentId: string) {
    setData((current) => {
      const student = current.students.find((item) => item.id === studentId);
      if (!student) return current;
      const wasOverdue = getStudentStatus(student.dueDate) === "red";
      const checkIn: GymCheckIn = {
        id: generateId("in"),
        studentId,
        studentName: student.name,
        timestamp: new Date().toISOString(),
        wasOverdue
      };
      return {
        ...current,
        checkIns: [checkIn, ...current.checkIns],
        auditLog: [
          addAudit("student_checkin", `Ingreso: ${student.name}${wasOverdue ? " (cuota vencida)" : ""}`),
          ...current.auditLog
        ]
      };
    });
  }

  if (isLoading) {
    return (
      <div className="gym-shell">
        <p className="gym-hint">Cargando...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="gym-shell">
        <p className="gym-error">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="gym-page">
      <header className="gym-header">
        <h1>Gym</h1>
        <div className="gym-header-user">
          <span className="gym-header-avatar">{userName.charAt(0).toUpperCase()}</span>
          <span>{userName}</span>
          <button type="button" className="gym-ghost-button" onClick={onLogout}>
            Salir
          </button>
        </div>
      </header>

      <nav className="gym-tabs">
        {(Object.keys(TAB_LABELS) as GymTab[]).map((item) => (
          <button
            key={item}
            type="button"
            className={tab === item ? "gym-tab-button gym-tab-button--active" : "gym-tab-button"}
            onClick={() => setTab(item)}
          >
            {TAB_LABELS[item]}
          </button>
        ))}
      </nav>

      <main className="gym-main">
        {tab === "ingresar" ? (
          <GymCheckInSection students={data.students} checkIns={data.checkIns} onCheckIn={handleCheckIn} />
        ) : null}
        {tab === "alumnos" ? (
          <GymStudentsSection
            students={data.students}
            onCreate={handleCreateStudent}
            onUpdate={handleUpdateStudent}
            onRenew={handleRenewStudent}
            onDelete={handleDeleteStudent}
          />
        ) : null}
        {tab === "gastos" ? (
          <GymExpensesSection
            expenses={data.expenses}
            onCreate={handleCreateExpense}
            onMarkPaid={handleMarkExpensePaid}
            onDelete={handleDeleteExpense}
          />
        ) : null}
        {tab === "tareas" ? (
          <GymTasksSection tasks={data.tasks} onCreate={handleCreateTask} onMove={handleMoveTask} onDelete={handleDeleteTask} />
        ) : null}
        {tab === "resumen" ? (
          <GymSummarySection movements={data.movements} onCreate={handleCreateMovement} onDelete={handleDeleteMovement} />
        ) : null}
      </main>
    </div>
  );
}
