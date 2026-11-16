import { useEffect, useState } from "react";
import { fetchGymNotice, loginGym, logoutGym, markGymNoticeSeen } from "./gym.client";
import { GymHomePage } from "./GymHomePage";
import { GymLoginScreen } from "./components/GymLoginScreen";
import { NewFeatureBanner } from "./components/NewFeatureBanner";
import { ServiceExpiredNotice } from "./components/ServiceExpiredNotice";
import { clearGymSession, loadGymSession, saveGymSession, type GymSession } from "./gym.session";

// "vistaprevia" es un usuario de prueba para ver el cartel: le sale siempre,
// sin depender de Scrum.
const PREVIEW_USERNAME = "vistaprevia";

// Una vez por inicio de sesion: si el cliente cierra el aviso, no vuelve a
// salir hasta el proximo login (F5 incluido).
function noticeShownKey(token: string) {
  return `frontend-gym.notice-shown.${token.slice(-12)}`;
}

function wasNoticeShown(token: string): boolean {
  try {
    return sessionStorage.getItem(noticeShownKey(token)) === "1";
  } catch {
    return false;
  }
}

function rememberNoticeShown(token: string) {
  try {
    sessionStorage.setItem(noticeShownKey(token), "1");
  } catch {
    // Sin sessionStorage: se cierra igual en esta visita.
  }
}

// Login con usuario y contraseña desde 30/09/2026 (antes "pasaba
// directo" en fase de pruebas).
export function GymApp() {
  const [session, setSession] = useState<GymSession | null>(loadGymSession);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showNotice, setShowNotice] = useState(false);

  // Aviso de demora (11/11/2026): se activa desde Scrum (Clientes) para el
  // usuario de este cliente. Al iniciar sesion se pregunta si esta activo
  // y, si lo esta, salta el cartel hasta que toque Aceptar.
  useEffect(() => {
    if (!session) {
      setShowNotice(false);
      return;
    }
    const token = session.token;
    if (wasNoticeShown(token)) return;
    const isPreview = session.user.username.toLowerCase() === PREVIEW_USERNAME;
    if (isPreview) {
      setShowNotice(true);
      return;
    }
    let cancelled = false;
    fetchGymNotice()
      .then((result) => {
        if (cancelled || !result.active) return;
        setShowNotice(true);
        void markGymNoticeSeen();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [session]);

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
    setShowNotice(false);
    setSession(null);
  }

  function handleSessionExpired() {
    clearGymSession();
    setSession(null);
    setLoginError("Tu sesión venció. Volvé a iniciar sesión.");
  }

  function handleCloseNotice() {
    if (session) rememberNoticeShown(session.token);
    setShowNotice(false);
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
      {showNotice && <ServiceExpiredNotice onClose={handleCloseNotice} />}
      {/* Aviso de turnos (modal que cubre la pantalla): solo Ale Gym. */}
      {session.user.workspaceKey === "alegym" ? <NewFeatureBanner /> : null}
      <GymHomePage
        userName={session.user.fullName ?? session.user.username}
        workspaceKey={session.user.workspaceKey}
        onLogout={handleLogout}
        onSessionExpired={handleSessionExpired}
      />
    </>
  );
}
