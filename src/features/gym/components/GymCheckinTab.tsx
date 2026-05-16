import { diffDays, formatDate, getMaskedCedula, getPaymentAlertVariant, getSuccessStatus } from "../lib/gymUtils";
import { TODAY } from "../data/gymData";
import type { DemoMemberCard } from "../types";

type Props = {
  kioskInput: string;
  kioskResult: string;
  kioskMember: DemoMemberCard | null;
  onAppendDigit: (digit: string) => void;
  onRemoveDigit: () => void;
  onClear: () => void;
  onSubmit: () => void;
};

export function GymCheckinTab({
  kioskInput,
  kioskResult,
  kioskMember,
  onAppendDigit,
  onRemoveDigit,
  onClear,
  onSubmit
}: Props) {
  return (
    <section className="kiosk-page">
      {!kioskMember ? (
        <article className="panel panel--kiosk">
          <div className="panel__header">
            <h2>Ingreso por cedula</h2>
          </div>

          <div className="kiosk-simple">
            <div className="kiosk-display">
              <span>Cedula</span>
              <strong>{kioskInput || "--------"}</strong>
            </div>

            <p className="kiosk-helper">Escribi cualquier numero para simular el ingreso del socio.</p>

            <div className="keypad-grid">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button key={digit} type="button" className="keypad-button" onClick={() => onAppendDigit(digit)}>
                  {digit}
                </button>
              ))}
              <button type="button" className="keypad-button keypad-button--muted" onClick={onClear}>
                Limpiar
              </button>
              <button type="button" className="keypad-button" onClick={() => onAppendDigit("0")}>
                0
              </button>
              <button type="button" className="keypad-button keypad-button--muted" onClick={onRemoveDigit}>
                Borrar
              </button>
            </div>

            <button type="button" className="button button--solid button--full" onClick={onSubmit}>
              Aceptar
            </button>
            <p>{kioskResult}</p>
          </div>
        </article>
      ) : (
        <article className="member-card member-card--success member-card--welcome">
          <div className="member-card__success">
            <span className="success-icon success-icon--tick" aria-hidden="true">
              OK
            </span>
            <div>
              <p>{kioskResult}</p>
            </div>
          </div>

          <div className="member-card__media">
            <span>IMG</span>
          </div>
          <div className="member-card__body">
            <h3>{kioskMember.name}</h3>
            <p className="member-card__lead">Tu ingreso fue registrado. Ya podes pasar al salon.</p>
            <div className="member-card__info">
              <span>Cedula: {getMaskedCedula(kioskMember.cedula)}</span>
              <span>Plan: {kioskMember.plan}</span>
              <span>Ingreso: {formatDate(kioskMember.enrolledAt)}</span>
              <span>Proximo pago: {formatDate(kioskMember.nextPaymentDate)}</span>
            </div>
            <div className={`payment-alert payment-alert--${getPaymentAlertVariant(kioskMember.nextPaymentDate)}`}>
              <strong>{getSuccessStatus(kioskMember.nextPaymentDate)}</strong>
              <span>Le quedan {diffDays(TODAY, kioskMember.nextPaymentDate)} dias para abonar</span>
            </div>
            <button type="button" className="button button--solid button--full" onClick={onClear}>
              Aceptar
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
