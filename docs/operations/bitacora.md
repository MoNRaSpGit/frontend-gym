# Bitacora Gym

Fecha de actualizacion: 2026-05-16

## Regla de este archivo

Este documento guarda detalle fino del modulo `gym`.

Aca corresponde anotar:

- que se hizo en el frontend
- donde quedo el modulo
- que demo funcional ya existe
- que validaciones tecnicas pasaron

## 2026-05-14 - scaffold inicial

Se crea el scaffold inicial de `frontend-gym`.

Incluye:

- estructura Vite + React + TypeScript
- scripts base de build, lint, typecheck y smoke
- placeholder de home del modulo
- build metadata (`app-build.json`)
- service worker simple
- estilos globales iniciales

## 2026-05-14 - demo comercial funcional

Se evoluciona la home a demo comercial funcional.

Incluye:

- panel de control con clientes demo y estados rojo, amarillo y verde segun vencimiento
- alta manual de cliente con proximo vencimiento calculado
- acciones demo para registrar pago y dar de baja
- movimiento reciente para mostrar altas, pagos, bajas e ingresos
- flujo de recepcion para tablet con teclado numerico por cedula
- check-in que marca al cliente como presente en el panel

## 2026-05-16 - Refactor por capas del modulo gym

Se ordena el modulo para evitar una pagina unica con demasiada logica, UI y estilos mezclados.

Incluye:

- separacion de `types`, `data`, `lib`, `hooks`, `components` y `styles`
- `GymHomePage` reducido a composicion de vistas
- estilos del feature movidos a `features/gym/styles/gym-home.css`
- `global.css` reducido a base realmente global

Objetivo:

- dejar una base mas mantenible para seguir creciendo el modulo sin ruido tecnico
