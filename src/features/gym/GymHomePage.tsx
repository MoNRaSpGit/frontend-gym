import type { CSSProperties } from "react";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(15,118,110,0.18), transparent 30%), linear-gradient(180deg, #eef7f6 0%, #dff0ee 100%)",
  color: "#122320"
};

const wrapStyle: CSSProperties = {
  width: "min(1120px, calc(100% - 32px))",
  margin: "0 auto",
  padding: "48px 0 64px",
  display: "grid",
  gap: 24
};

const heroStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  padding: "32px",
  borderRadius: 28,
  border: "1px solid rgba(18, 35, 32, 0.10)",
  background: "rgba(255,255,255,0.76)",
  boxShadow: "0 24px 60px rgba(18, 35, 32, 0.10)"
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 18
};

const cardStyle: CSSProperties = {
  padding: 22,
  borderRadius: 24,
  border: "1px solid rgba(18, 35, 32, 0.10)",
  background: "rgba(255,255,255,0.82)",
  boxShadow: "0 18px 40px rgba(18, 35, 32, 0.08)",
  display: "grid",
  gap: 8
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  padding: "8px 12px",
  borderRadius: 999,
  background: "#0f766e",
  color: "#effdfa",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase"
};

export function GymHomePage() {
  return (
    <main style={pageStyle}>
      <div style={wrapStyle}>
        <section style={heroStyle}>
          <span style={badgeStyle}>Gym</span>
          <h1 style={{ margin: 0, fontSize: "clamp(2.4rem, 6vw, 4.8rem)", lineHeight: 0.94 }}>Modulo nuevo listo para crecer.</h1>
          <p style={{ margin: 0, maxWidth: 760, fontSize: 18, lineHeight: 1.6, color: "#49615d" }}>
            Dejamos una base limpia para construir el proximo flujo del modulo Gym con la misma estructura simple,
            ordenada y lista para deployar.
          </p>
        </section>

        <section style={gridStyle}>
          <article style={cardStyle}>
            <strong>Estructura lista</strong>
            <span>Vite, React, TypeScript, lint, smoke y build metadata preparados.</span>
          </article>
          <article style={cardStyle}>
            <strong>Deploy ready</strong>
            <span>La app ya nace lista para GitHub Pages con `build:gh` y `deploy`.</span>
          </article>
          <article style={cardStyle}>
            <strong>Proximo paso</strong>
            <span>Definir el flujo principal del modulo y empezar con la primera pantalla real.</span>
          </article>
        </section>
      </div>
    </main>
  );
}
