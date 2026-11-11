interface Props {
  onAccept: () => void;
}

// Aviso de servicio vencido (11/11/2026, pedido explicito): salta apenas
// se loguea el cliente alegym y no se cierra hasta que toca "Aceptar".
export function ServiceExpiredNotice({ onAccept }: Props) {
  return (
    <div className="gym-notice-backdrop" role="dialog" aria-modal="true" aria-labelledby="gym-notice-title">
      <div className="gym-notice-card">
        <h2 id="gym-notice-title">Estimado cliente</h2>
        <p>Le recordamos que su servicio se encuentra vencido. Por favor, comuníquese con su proveedor.</p>
        <button type="button" className="gym-primary-button" onClick={onAccept} autoFocus>
          Aceptar
        </button>
      </div>
    </div>
  );
}
