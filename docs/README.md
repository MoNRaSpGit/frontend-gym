# Gym Docs

Fecha de actualizacion: 2026-05-16

## Objetivo

Esta carpeta documenta el producto `gym` del lado frontend.

Su funcion es dejar claro:

- en que estado real esta el modulo
- que demo funcional ya existe
- que decisiones finas se tomaron en el frontend
- que cambios se fueron aplicando mientras arranca el producto

## Alcance

`frontend-gym/docs` documenta:

- comportamiento real del frontend `gym`
- estado actual del modulo
- flujo visible de producto
- decisiones finas de interfaz del modulo
- bitacora operativa del frontend

No documenta:

- arquitectura global del SaaS
- metodo global de trabajo
- reglas compartidas de backend, auth, tenant o billing

Eso vive en `backend/docs`.

## Orden recomendado de lectura

1. [Estado actual del frontend](./product/current-state.md)
2. [Contexto inicial del producto](./product/product-context.md)
3. [Bitacora del modulo](./operations/bitacora.md)

## Estructura de esta carpeta

### `product/`

Define el estado y contexto actual del modulo.

### `operations/`

Guarda el seguimiento fino del frontend:

- que se hizo
- que quedo
- que validaciones tecnicas pasaron

## Regla importante de este corte

`gym` sigue en etapa de demo funcional, sin integracion formal a backend por ahora.
