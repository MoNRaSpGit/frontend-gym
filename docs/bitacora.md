# Bitacora Gym

## 2026-05-14

Se crea el scaffold inicial de `frontend-gym`.

Incluye:

- estructura Vite + React + TypeScript
- scripts base de build, lint, typecheck y smoke
- placeholder de home del modulo
- build metadata (`app-build.json`)
- service worker simple
- estilos globales iniciales

Se evoluciona la home a demo comercial funcional.

Incluye:

- panel de control con clientes demo y estados rojo, amarillo y verde segun vencimiento
- alta manual de cliente con proximo vencimiento calculado
- acciones demo para registrar pago y dar de baja
- movimiento reciente para mostrar altas, pagos, bajas e ingresos
- flujo de recepcion para tablet con teclado numerico por cedula
- check-in que marca al cliente como presente en el panel
