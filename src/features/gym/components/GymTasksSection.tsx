import { useState } from "react";
import { GYM_TASK_COLOR_LABELS, GYM_TASK_STATUS_LABELS, type GymTask, type GymTaskColor, type GymTaskStatus } from "../gym.types";

type GymTasksSectionProps = {
  tasks: GymTask[];
  onCreate: (task: { title: string; color: GymTaskColor }) => void;
  onMove: (taskId: string, direction: "forward" | "backward") => void;
  onDelete: (taskId: string) => void;
};

const COLUMNS: GymTaskStatus[] = ["todo", "in_progress", "done"];
const COLORS: GymTaskColor[] = ["green", "yellow", "red"];

export function GymTasksSection({ tasks, onCreate, onMove, onDelete }: GymTasksSectionProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<GymTaskColor>("green");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    onCreate({ title: title.trim(), color });
    setTitle("");
    setColor("green");
  }

  const grouped: Record<GymTaskStatus, GymTask[]> = { todo: [], in_progress: [], done: [] };
  for (const task of tasks) grouped[task.status].push(task);

  return (
    <div className="gym-tab-content">
      <form className="gym-form" onSubmit={handleSubmit}>
        <label>
          <span>Nueva tarea</span>
          <input type="text" placeholder="Ej: Arreglar cinta 2" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          <span>Prioridad</span>
          <select value={color} onChange={(event) => setColor(event.target.value as GymTaskColor)}>
            {COLORS.map((item) => (
              <option key={item} value={item}>
                {GYM_TASK_COLOR_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="gym-primary-button">
          Agregar tarea
        </button>
      </form>

      <div className="gym-board">
        {COLUMNS.map((status) => (
          <div key={status} className="gym-board-column">
            <h3>
              {GYM_TASK_STATUS_LABELS[status]} <span className="gym-hint">({grouped[status].length})</span>
            </h3>
            <div className="gym-board-column-items">
              {grouped[status].length === 0 ? (
                <p className="gym-hint">Sin tareas.</p>
              ) : (
                grouped[status].map((task) => (
                  <div key={task.id} className={`gym-task-card gym-task-card--${task.color}`}>
                    <strong>{task.title}</strong>
                    <span className="gym-hint">{GYM_TASK_COLOR_LABELS[task.color]}</span>
                    <div className="gym-task-card-actions">
                      {status !== "todo" ? (
                        <button type="button" className="gym-ghost-button" onClick={() => onMove(task.id, "backward")}>
                          {"<"} Volver
                        </button>
                      ) : null}
                      {status !== "done" ? (
                        <button type="button" className="gym-ghost-button" onClick={() => onMove(task.id, "forward")}>
                          Avanzar {">"}
                        </button>
                      ) : (
                        <button type="button" className="gym-ghost-button gym-ghost-button--danger" onClick={() => onDelete(task.id)}>
                          Borrar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
