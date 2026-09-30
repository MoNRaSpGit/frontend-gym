import { API_BASE_URL } from "../../shared/config/api";
import type { GymWorkspaceData, GymWorkspaceRecord } from "./gym.types";

function buildUrl(path: string) {
  return `${API_BASE_URL}/api/v1${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = (data && typeof data.message === "string" ? data.message : null) ?? "Ocurrió un error inesperado.";
    throw new Error(message);
  }
  return data as T;
}

export async function fetchGymWorkspace(): Promise<GymWorkspaceRecord> {
  const response = await fetch(buildUrl("/gym/workspace"));
  return readJson<GymWorkspaceRecord>(response);
}

export async function saveGymWorkspace(
  data: GymWorkspaceData,
  expectedRowVersion: number | null
): Promise<GymWorkspaceRecord> {
  const response = await fetch(buildUrl("/gym/workspace"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, expectedRowVersion })
  });
  return readJson<GymWorkspaceRecord>(response);
}

// Login "pasa directo" (30/09/2026, pedido explicito, fase de pruebas):
// no valida usuario/contraseña todavia -- solo deja un registro en la
// auditoria de cuando se toco "Ingresar".
export async function loginGym(): Promise<GymWorkspaceRecord> {
  const response = await fetch(buildUrl("/gym/auth/login"), { method: "POST" });
  return readJson<GymWorkspaceRecord>(response);
}
