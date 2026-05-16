# Gym - Estado actual del frontend

Fecha de actualizacion: 2026-05-16

## Estado general

`frontend-gym` hoy se mantiene como demo visual funcional creada para venta inicial.

## Base actual disponible

El modulo ya tiene:

- scaffold Vite + React + TypeScript
- build meta
- placeholder de home ya evolucionado
- aviso de actualizacion
- base visual lista para crecer
- estructura separada por capas dentro del feature `gym`

## Flujo visible actual

Hoy ya existe:

- panel de control con estados de cuota por color
- recepcion tablet con ingreso por cedula
- movimiento reciente de altas, pagos, bajas e ingresos
- alta manual de cliente con vencimiento calculado
- acciones demo para registrar pago y dar de baja
- check-in que marca al cliente como presente

## Estado tecnico actual

Hoy el modulo:

- sigue sin integracion backend real
- funciona como demo comercial de producto
- sirve para validar lectura operativa inicial del negocio
- evita mezclar toda la logica y la UI en una sola pagina grande

## Siguiente paso recomendado

Antes de endurecer backend conviene definir:

1. contrato de clientes, pagos e ingresos
2. lectura real de caja diaria
3. prioridad entre recepcion, cuotas, rutinas y asistencia
