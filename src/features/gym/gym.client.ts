import { API_BASE_URL } from "../../shared/config/api";
import { getGymToken, type GymSession } from "./gym.session";
import type { GymWorkspaceData, GymWorkspaceRecord } from "./gym.types";

// Sesion vencida o invalida -- la app vuelve a la pantalla de login.
export class GymUnauthorizedError extends Error {}

// Otro dispositivo/usuario guardo antes (409 por version de fila).
export class GymConflictError extends Error {}

function buildUrl(path: string) {
  return `${API_BASE_URL}/api/v1${path}`;
}

function authHeaders(): Record<string, string> {
  const token = getGymToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = (data && typeof data.message === "string" ? data.message : null) ?? "Ocurrió un error inesperado.";
    if (response.status === 401) throw new GymUnauthorizedError(message);
    if (response.status === 409) throw new GymConflictError(message);
    throw new Error(message);
  }
  return data as T;
}

export async function fetchGymWorkspace(): Promise<GymWorkspaceRecord> {
  const response = await fetch(buildUrl("/gym/workspace"), { headers: authHeaders() });
  return readJson<GymWorkspaceRecord>(response);
}

export async function saveGymWorkspace(
  data: GymWorkspaceData,
  expectedRowVersion: number | null
): Promise<GymWorkspaceRecord> {
  const response = await fetch(buildUrl("/gym/workspace"), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ ...data, expectedRowVersion })
  });
  return readJson<GymWorkspaceRecord>(response);
}

export async function loginGym(username: string, password: string): Promise<GymSession> {
  const response = await fetch(buildUrl("/gym/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return readJson<GymSession>(response);
}

export async function logoutGym(): Promise<void> {
  await fetch(buildUrl("/gym/auth/logout"), { method: "POST", headers: authHeaders() }).catch(() => undefined);
}
