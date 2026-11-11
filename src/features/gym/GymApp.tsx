import { useState } from "react";
import { loginGym, logoutGym } from "./gym.client";
import { GymHomePage } from "./GymHomePage";
import { GymLoginScreen } from "./components/GymLoginScreen";
import { ServiceExpiredNotice } from "./components/ServiceExpiredNotice";
import { clearGymSession, loadGymSession, saveGymSession, type GymSession } from "./gym.session";

function readNoticeAccepted(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

// Login con usuario y contraseña desde 30/09/2026 (antes "pasaba
// directo" en fase de pruebas).
export function GymApp() {
  const [session, setSession] = useState<GymSession | null>(loadGymSession);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [noticeAccepted, setNoticeAccepted] = useState(false);

  async function handleLogin(username: string, password: string) {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const next = await loginGym(username, password);
      saveGymSession(next);
      setSession(next);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    void logoutGym();
    clearGymSession();
    setSession(null);
  }

  function handleSessionExpired() {
    clearGymSession();
    setSession(null);
    setLoginError("Tu sesión venció. Volvé a iniciar sesión.");
  }

  // Aviso de servicio vencido solo para el usuario "alegym"; una vez aceptado
  // queda guardado en este navegador y no vuelve a salir.
  const noticeKey = session ? `frontend-gym.service-expired-accepted.${session.user.username.toLowerCase()}` : "";
  const isNoticeUser = session?.user.username.toLowerCase() === "alegym";
  const showNotice = isNoticeUser && !noticeAccepted && !readNoticeAccepted(noticeKey);

  function handleAcceptNotice() {
    try {
      localStorage.setItem(noticeKey, "1");
    } catch {
      // Si el navegador no deja guardar, al menos se cierra en esta visita.
    }
    setNoticeAccepted(true);
  }

  if (!session) {
    return (
      <GymLoginScreen
        onLogin={(username, password) => void handleLogin(username, password)}
        isLoading={isLoggingIn}
        error={loginError}
      />
    );
  }

  return (
    <>
      <GymHomePage
        userName={session.user.fullName ?? session.user.username}
        workspaceKey={session.user.workspaceKey}
        onLogout={handleLogout}
        onSessionExpired={handleSessionExpired}
      />
      {showNotice && <ServiceExpiredNotice onAccept={handleAcceptNotice} />}
    </>
  );
}
