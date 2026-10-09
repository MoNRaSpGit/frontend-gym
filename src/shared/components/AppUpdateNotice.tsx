import { useEffect, useRef, useState } from "react";
import { fetchPublishedFrontendBuildMeta, FRONTEND_BUILD_INFO } from "../config/build";
import { isAppIdle } from "../state/appActivity";

const UPDATE_CHECK_INTERVAL_MS = 2 * 60 * 1000;
const IDLE_RETRY_INTERVAL_MS = 15 * 1000;
const APP_CACHE_PREFIX = "gym-";
// Cuanto tarda la barra en llenarse cuando el usuario toca "Actualizar"
// (10/10/2026, pedido explicito: imitar la pantalla de progreso de
// frontend-distribuidora). La limpieza real es mas rapida; la barra
// existe para que se VEA que esta actualizando.
const PROGRESS_DURATION_MS = 2200;
const PROGRESS_TICK_MS = 40;

// Misma logica que frontend-joker/frontend-ejemplo: en vez de coordinar con
// el service worker "nuevo", directo lo desregistra, borra el cache de la
// app y recarga -- como sw.js ya hace skipWaiting + clients.claim solo, el
// proximo load arranca limpio.
async function clearAppCache() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const appBasePath = new URL(import.meta.env.BASE_URL, window.location.href).pathname;
      await Promise.all(
        registrations
          .filter((registration) => registration.scope.includes(appBasePath))
          .map((registration) => registration.unregister())
      );
    }

    if ("caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith(APP_CACHE_PREFIX)).map((key) => window.caches.delete(key)));
    }
  } catch {
    // Si la limpieza falla, igual se recarga: es lo que trae la version nueva.
  }
}

export function AppUpdateNotice() {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!import.meta.env.PROD) {
      setShow(false);
      return;
    }

    let mounted = true;

    const checkForUpdates = async () => {
      if (appliedRef.current) return;

      try {
        const published = await fetchPublishedFrontendBuildMeta();
        if (!mounted || published.releaseSha === FRONTEND_BUILD_INFO.releaseSha) {
          return;
        }

        // Si nadie esta usando la app, se actualiza sola y sin pantalla de
        // progreso (no hay nadie mirando). Si hay alguien, se le muestra
        // el cartel y decide el cuando con el boton "Actualizar".
        if (isAppIdle()) {
          appliedRef.current = true;
          await clearAppCache();
          window.location.reload();
          return;
        }

        setShow(true);
      } catch {
        // Silencioso: se reintenta solo en el proximo chequeo.
      }
    };

    void checkForUpdates();
    const intervalId = window.setInterval(() => {
      void checkForUpdates();
    }, UPDATE_CHECK_INTERVAL_MS);

    const idleRetryId = window.setInterval(() => {
      if (show && !appliedRef.current && isAppIdle()) {
        appliedRef.current = true;
        void clearAppCache().then(() => window.location.reload());
      }
    }, IDLE_RETRY_INTERVAL_MS);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void checkForUpdates();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.clearInterval(idleRetryId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [show]);

  // Boton "Actualizar" tocado a mano: pantalla de progreso que toma toda
  // la pantalla, igual que frontend-distribuidora, y recien al llegar a
  // 100% (y con la limpieza real ya terminada) recarga.
  function handleUpdate() {
    if (progress !== null) return;
    appliedRef.current = true;
    setProgress(0);

    const cleanup = clearAppCache();
    const startedAt = Date.now();

    const intervalId = window.setInterval(() => {
      const next = Math.min(100, Math.round(((Date.now() - startedAt) / PROGRESS_DURATION_MS) * 100));
      setProgress(next);

      if (next >= 100) {
        window.clearInterval(intervalId);
        void cleanup.then(() => window.location.reload());
      }
    }, PROGRESS_TICK_MS);
  }

  if (progress !== null) {
    return (
      <div className="update-overlay" role="status" aria-live="polite">
        <div className="update-overlay-card">
          <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" />
          <strong>{progress < 100 ? "Actualizando la aplicación…" : "¡Listo!"}</strong>
          <div className="update-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div className="update-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}%</span>
        </div>
      </div>
    );
  }

  if (!show) {
    return null;
  }

  return (
    <aside className="update-banner" role="status" aria-live="polite">
      <strong>Hay una nueva actualización</strong>
      <button type="button" className="gym-primary-button" onClick={handleUpdate}>
        Actualizar
      </button>
    </aside>
  );
}
