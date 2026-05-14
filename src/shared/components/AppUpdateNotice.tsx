import { useEffect, useState, type CSSProperties } from "react";
import { getAvailableBuildMeta, type AppBuildMeta } from "../config/build";

const noticeStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 24,
  transform: "translateX(-50%)",
  zIndex: 30,
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 16px",
  borderRadius: 18,
  background: "#122320",
  color: "#effdfa",
  boxShadow: "0 16px 40px rgba(0,0,0,0.22)"
};

const buttonStyle: CSSProperties = {
  border: "none",
  borderRadius: 999,
  padding: "9px 14px",
  background: "#0f766e",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer"
};

export function AppUpdateNotice() {
  const [availableBuild, setAvailableBuild] = useState<AppBuildMeta | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      return;
    }

    let active = true;

    const checkForUpdate = async () => {
      const nextBuild = await getAvailableBuildMeta();
      if (!active || !nextBuild) {
        return;
      }

      if (nextBuild.releaseSha !== __APP_RELEASE_SHA__) {
        setAvailableBuild(nextBuild);
      }
    };

    void checkForUpdate();
    const intervalId = window.setInterval(() => {
      void checkForUpdate();
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  if (!availableBuild) {
    return null;
  }

  return (
    <div style={noticeStyle}>
      <span>Hay una actualizacion disponible.</span>
      <button type="button" onClick={() => window.location.reload()} style={buttonStyle}>
        Actualizar
      </button>
    </div>
  );
}
