import { useState } from "react";

// Aviso de "funcionalidad nueva" (16/11/2026): modal que cubre la pantalla al
// entrar, con un solo boton "Aceptar". Al aceptar queda guardado en este
// navegador y no vuelve a salir.
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

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Sin storage: se cierra igual en esta visita.
    }
    setVisible(false);
  }

  return (
    <div className="gym-feature-overlay" role="dialog" aria-modal="true" aria-labelledby="gym-feature-title">
      <div className="gym-feature-modal">
        <span className="gym-feature-icon" aria-hidden="true">
          📅
        </span>
        <h2 id="gym-feature-title">¡Nuevo! Ya podés usar los turnos</h2>
        <p>
          Entrá a la pestaña <strong>Turnos</strong>, copiá el link y mandáselo a tus alumnos por WhatsApp para que se
          anoten a sus clases.
        </p>
        <button type="button" className="gym-feature-accept" onClick={accept} autoFocus>
          Aceptar
        </button>
      </div>
    </div>
  );
}
