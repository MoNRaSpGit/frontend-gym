import { useState } from "react";

type GymLoginScreenProps = {
  onLogin: (username: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
};

// Login real desde 30/09/2026 (antes un boton que "pasaba directo").
// Los usuarios se crean a mano con backend/scripts/create-gym-user.js.
export function GymLoginScreen({ onLogin, isLoading, error }: GymLoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) return;
    onLogin(username.trim(), password);
  }

  return (
    <div className="gym-shell">
      <form className="gym-login-card" onSubmit={handleSubmit}>
        <h1>Gym</h1>
        <p>Iniciá sesión para continuar.</p>

        <label className="gym-field gym-login-field">
          <span>Usuario</span>
          <input
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoFocus
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label className="gym-field gym-login-field">
          <span>Contraseña</span>
          <div className="gym-password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button type="button" className="gym-password-toggle" onClick={() => setShowPassword((current) => !current)}>
              {showPassword ? "Ocultar" : "Ver"}
            </button>
          </div>
        </label>

        {error ? <p className="gym-login-error">{error}</p> : null}

        <button type="submit" className="gym-primary-button" disabled={isLoading || !username.trim() || !password}>
          {isLoading ? "Entrando..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
