import { useState } from "react";
import { toast } from "react-toastify";
import { loginGym } from "./gym.client";
import { GymHomePage } from "./GymHomePage";
import { GymLoginScreen } from "./components/GymLoginScreen";
import { hasGymSession, saveGymSession } from "./gym.session";

// Arranque del proyecto (16/09/2026) -- ahora con las 3 pestanas reales:
// Gastos, Tareas y Resumen (30/09/2026, pedido explicito del cliente).
// Login "pasa directo" a proposito (fase de pruebas, sin usuario/
// contraseña todavia) -- ver gym.session.ts.
export function GymApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(hasGymSession());
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleIngresar() {
    setIsLoggingIn(true);
    try {
      await loginGym();
      saveGymSession();
      setIsLoggedIn(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo entrar.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  if (!isLoggedIn) {
    return <GymLoginScreen onIngresar={() => void handleIngresar()} isLoading={isLoggingIn} />;
  }

  return <GymHomePage />;
}
