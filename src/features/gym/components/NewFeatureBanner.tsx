import { useState } from "react";

// Cartelito de "funcionalidad nueva" (16/11/2026): franja finita arriba, con
// una cruz. Al cerrarla queda guardado en este navegador y no vuelve a salir.
const STORAGE_KEY = "frontend-gym.banner.turnos.v1";

function wasClosed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function NewFeatureBanner() {
  const [visible, setVisible] = useState(() => !wasClosed());

  if (!visible) return null;

  function close() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Sin storage: se cierra igual en esta visita.
    }
    setVisible(false);
  }

  return (
    <div className="gym-feature-bar" role="status">
      <p className="gym-feature-text">
        <strong>¡Nuevo! Ya podés usar los turnos.</strong> Entrá a la pestaña Turnos, copiá el link y mandáselo a tus
        alumnos por WhatsApp para que se anoten a sus clases.
      </p>
      <button type="button" className="gym-feature-close" onClick={close} aria-label="Cerrar aviso">
        ✕
      </button>
    </div>
  );
}
