import { useState } from "react";

interface Props {
  onClose: () => void;
}

// Aviso de demora (11/11/2026, pedido explicito): franja amarilla arriba,
// chica y poco invasiva. Al tocarla se expande con el mensaje completo; la
// cruz de arriba a la derecha la cierra (vuelve en el proximo inicio de
// sesion mientras siga activo en Scrum).
export function ServiceExpiredNotice({ onClose }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="gym-notice-bar" role="status">
      <button
        type="button"
        className="gym-notice-main"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span className="gym-notice-icon" aria-hidden="true">
          ⚠
        </span>
        <span className="gym-notice-text">
          {expanded ? (
            <>
              <strong>Estimado cliente</strong>
              <span>Le recordamos que su servicio se encuentra vencido. Por favor, comuníquese con su proveedor.</span>
            </>
          ) : (
            <strong>Aviso sobre su servicio · tocá para ver más</strong>
          )}
        </span>
      </button>
      <button type="button" className="gym-notice-close" onClick={onClose} aria-label="Cerrar aviso">
        ✕
      </button>
    </div>
  );
}
