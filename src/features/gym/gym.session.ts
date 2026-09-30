// Sesion real desde 30/09/2026 (antes era solo una bandera de "pasa
// directo"): token opaco que devuelve POST /gym/auth/login, guardado en
// localStorage para no pedir usuario/contraseña en cada recarga.
const GYM_SESSION_KEY = "frontend-gym.session.v2";

export type GymSessionUser = {
  id: number;
  username: string;
  fullName: string | null;
};

export type GymSession = {
  token: string;
  user: GymSessionUser;
};

export function loadGymSession(): GymSession | null {
  try {
    const raw = localStorage.getItem(GYM_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GymSession;
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

export function saveGymSession(session: GymSession): void {
  try {
    localStorage.setItem(GYM_SESSION_KEY, JSON.stringify(session));
  } catch {
    // localStorage puede fallar (privado, bloqueado) -- no es critico,
    // simplemente va a volver a pedir usuario/contraseña la proxima vez.
  }
}

export function clearGymSession(): void {
  try {
    localStorage.removeItem(GYM_SESSION_KEY);
    localStorage.removeItem("frontend-gym.session.v1");
  } catch {
    // ver comentario de saveGymSession.
  }
}

export function getGymToken(): string | null {
  return loadGymSession()?.token ?? null;
}
