import { useState } from "react";
import { loginGym, logoutGym } from "./gym.client";
import { GymHomePage } from "./GymHomePage";
import { GymLoginScreen } from "./components/GymLoginScreen";
import { clearGymSession, loadGymSession, saveGymSession, type GymSession } from "./gym.session";

// Login con usuario y contraseña desde 30/09/2026 (antes "pasaba
// directo" en fase de pruebas).
export function GymApp() {
  const [session, setSession] = useState<GymSession | null>(loadGymSession);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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
    <GymHomePage
      userName={session.user.fullName ?? session.user.username}
      onLogout={handleLogout}
      onSessionExpired={handleSessionExpired}
    />
  );
}
