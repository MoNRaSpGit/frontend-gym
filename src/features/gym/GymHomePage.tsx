import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { fetchGymWorkspace, GymConflictError, GymUnauthorizedError, saveGymWorkspace } from "./gym.client";
import { addExpenseInterval, computeExpenseAfterPayment, generateId, getRenewedDueDate, getStudentStatus, getTodayDate, getYearMonth } from "./gym.shared";
import type {
  GymAuditAction,
  GymAuditEntry,
  GymCheckIn,
  GymExpense,
  GymMovement,
  GymMovementType,
  GymStudent,
  GymWorkspaceData
} from "./gym.types";
import { GymExpensesSection } from "./components/GymExpensesSection";
import { GymSummarySection } from "./components/GymSummarySection";
import { GymStudentsSection, type GymStudentInput } from "./components/GymStudentsSection";
import { GymCheckInSection } from "./components/GymCheckInSection";
import { GymShopSection } from "./components/GymShopSection";

type GymTab = "alumnos" | "gastos" | "tienda" | "resumen" | "ingresar";

const TAB_LABELS: Record<GymTab, string> = {
  alumnos: "Alumnos",
  gastos: "Gastos",
  tienda: "Tienda",
  resumen: "Resumen",
  ingresar: "Ingresar"
};

const EMPTY_DATA: GymWorkspaceData = { expenses: [], movements: [], students: [], checkIns: [], auditLog: [] };

type GymHomePageProps = {
  userName: string;
  onLogout: () => void;
  onSessionExpired: () => void;
};

export function GymHomePage({ userName, onLogout, onSessionExpired }: GymHomePageProps) {
  const [tab, setTab] = useState<GymTab>("alumnos");
  // Mes compartido entre Resumen y Gastos (09/10/2026, pedido explicito:
  // "en la grafica pongo agosto, voy a gastos diarios, ya se sabe que son
  // los gastos diarios de agosto"). Vive aca arriba, no en cada pestana
  // por separado.
  const [selectedMonth, setSelectedMonth] = useState(getYearMonth(getTodayDate()));
  const [data, setData] = useState<GymWorkspaceData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const skipNextSaveRef = useRef(true);
  const rowVersionRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetchGymWorkspace()
      .then((snapshot) => {
        if (cancelled) return;
        setData({ ...snapshot.data, students: snapshot.data.students ?? [], checkIns: snapshot.data.checkIns ?? [] });
        rowVersionRef.current = snapshot.rowVersion;
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

  // Bug 30/09/2026 ("agrego un alumno, lo borro, sale el cartel de que
  // alguien ya guardo y con F5 vuelve a aparecer"): el guardado usaba la
  // version de fila capturada en el render, asi que dos cambios seguidos
  // mandaban la version vieja y el servidor lo tomaba como conflicto.
  // Ahora la version y los datos viven en refs y los guardados van de a
  // uno: si hay uno en curso, el siguiente espera y manda lo ultimo.
  const dataRef = useRef(data);
  dataRef.current = data;
  const isSavingRef = useRef(false);
  const hasPendingSaveRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);

  function flushSave() {
    if (isSavingRef.current) {
      hasPendingSaveRef.current = true;
      return;
    }
    isSavingRef.current = true;
    hasUnsavedChangesRef.current = false;
    saveGymWorkspace(dataRef.current, rowVersionRef.current)
      .then((snapshot) => {
        rowVersionRef.current = snapshot.rowVersion;
      })
      .catch((error) => {
        hasPendingSaveRef.current = false;
        if (error instanceof GymUnauthorizedError) {
          onSessionExpired();
          return;
        }
        if (error instanceof GymConflictError) {
          // Conflicto real (otro dispositivo/usuario guardo antes): se trae
          // lo del servidor para no pisarle los cambios al otro.
          toast.warn("Había cambios guardados desde otro dispositivo. Se actualizó la pantalla; repetí tu último cambio.");
          void reloadFromServer();
          return;
        }
        hasUnsavedChangesRef.current = true;
        toast.error(error instanceof Error ? error.message : "No se pudo guardar.");
      })
      .finally(() => {
        isSavingRef.current = false;
        if (hasPendingSaveRef.current) {
          hasPendingSaveRef.current = false;
          flushSave();
        }
      });
  }

  async function reloadFromServer() {
    try {
      const snapshot = await fetchGymWorkspace();
      rowVersionRef.current = snapshot.rowVersion;
      skipNextSaveRef.current = true;
      setData({ ...snapshot.data, students: snapshot.data.students ?? [], checkIns: snapshot.data.checkIns ?? [] });
    } catch (error) {
      if (error instanceof GymUnauthorizedError) onSessionExpired();
    }
  }

  // Autoguardado (1.2s de silencio, mismo criterio que agro) -- evita
  // guardar en cada tecla y evita el primer guardado espurio al cargar.
  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (isLoading) return;

    hasUnsavedChangesRef.current = true;
    const timeoutId = window.setTimeout(flushSave, 1200);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Si se recarga/cierra la pagina con un cambio todavia sin guardar
  // (los 1.2s de espera o el guardado en curso), el navegador avisa.
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChangesRef.current && !isSavingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

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

    const expense: GymExpense = {
      id: generateId("exp"),
      name: input.name,
      amount: input.amount,
      intervalDays: input.intervalDays,
      dueDate: addExpenseInterval(today, input.intervalDays),
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
            onCreateMovement={handleCreateMovement}
          />
        ) : null}
        {tab === "tienda" ? (
          <GymShopSection movements={data.movements} onCreate={handleCreateMovement} onDelete={handleDeleteMovement} />
        ) : null}
        {tab === "resumen" ? (
          <GymSummarySection
            movements={data.movements}
            onDelete={handleDeleteMovement}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
          />
        ) : null}
      </main>
    </div>
  );
}
