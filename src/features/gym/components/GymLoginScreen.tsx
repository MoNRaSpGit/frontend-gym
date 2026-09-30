type GymLoginScreenProps = {
  onIngresar: () => void;
  isLoading: boolean;
};

// Login "pasa directo" (30/09/2026, pedido explicito): fase de pruebas,
// sin usuario/contraseña todavia -- un solo boton que entra directo y
// deja un registro en la auditoria interna. Cuando el cliente pida login
// de verdad, esto se reemplaza sin tocar el resto de la app (el resto ya
// consume gym.session.ts/gymClient igual que si hubiera login real).
export function GymLoginScreen({ onIngresar, isLoading }: GymLoginScreenProps) {
  return (
    <div className="gym-shell">
      <div className="gym-login-card">
        <h1>Gym</h1>
        <p>Gastos, tareas y resumen del gimnasio.</p>
        <button type="button" className="gym-primary-button" onClick={onIngresar} disabled={isLoading}>
          {isLoading ? "Entrando..." : "Ingresar"}
        </button>
      </div>
    </div>
  );
}
