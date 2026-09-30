// Sesion real desde 30/09/2026: token opaco que devuelve POST
// /gym/auth/login. Se guarda en sessionStorage (no localStorage) a
// proposito -- pedido explicito: "toda persona que entre a la web tenga
// que pasar por el login". Sobrevive a un F5 en la misma pestaña, pero
// una pestaña nueva o volver a abrir el navegador pide login de nuevo.
const GYM_SESSION_KEY = "frontend-gym.session.v3";
const LEGACY_KEYS = ["frontend-gym.session.v1", "frontend-gym.session.v2"];

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
    const raw = sessionStorage.getItem(GYM_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GymSession;
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

export function saveGymSession(session: GymSession): void {
  try {
    sessionStorage.setItem(GYM_SESSION_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage puede fallar (privado, bloqueado) -- no es critico,
    // simplemente va a volver a pedir usuario/contraseña la proxima vez.
  }
}

export function clearGymSession(): void {
  try {
    sessionStorage.removeItem(GYM_SESSION_KEY);
    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
  } catch {
    // ver comentario de saveGymSession.
  }
}

export function getGymToken(): string | null {
  return loadGymSession()?.token ?? null;
}

try {
  for (const key of LEGACY_KEYS) localStorage.removeItem(key);
} catch {
  // ver comentario de saveGymSession.
}
