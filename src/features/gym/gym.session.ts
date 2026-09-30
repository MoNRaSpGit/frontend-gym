// Sesion minima (30/09/2026, fase de pruebas): sin usuario/contraseña
// todavia -- solo una bandera en localStorage para no mostrar la
// pantalla de "Ingresar" en cada recarga. Cuando se agregue login de
// verdad, esto se reemplaza por un token real.
const GYM_SESSION_KEY = "frontend-gym.session.v1";

export function hasGymSession(): boolean {
  try {
    return localStorage.getItem(GYM_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveGymSession(): void {
  try {
    localStorage.setItem(GYM_SESSION_KEY, "1");
  } catch {
    // localStorage puede fallar (privado, bloqueado) -- no es critico,
    // simplemente va a volver a pedir "Ingresar" la proxima vez.
  }
}

export function clearGymSession(): void {
  try {
    localStorage.removeItem(GYM_SESSION_KEY);
  } catch {
    // ver comentario de saveGymSession.
  }
}
