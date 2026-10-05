# Analisis de fallas logicas - 2026-10-05

Contexto:
- Base auditada: Supabase pruebas `excwvgrkouurprtplcya`.
- Commit creado antes de la auditoria: `2d13309 Agrega repartidores al modelo operativo`.
- Datos demo nuevos verificados: `Demo Repartidor Lucio` id 1 y `Demo Repartidora Mara` id 2.
- Asignaciones demo verificadas: pedido 80 -> Lucio, pedido 81 -> Lucio, venta/unidad 53 -> Mara.

Pruebas ejecutadas:
- `npm test`: OK, 29 tests pasaron.
- `npx tsc --noEmit --pretty false`: OK.
- `npm run build`: OK.
- `npx eslint app components config contexts lib types --ext .ts,.tsx`: OK.
- RPC remotas nuevas: OK para `pgl_assign_order_courier` y `pgl_assign_sale_courier`.
- Auditoria remota de snapshot completo: 277 productos, 9 proveedores, 9 clientes, 6 vendedores, 2 repartidores, 15 pedidos, 22 lineas, 20 unidades, 4 abonos de venta, 13 pagos a proveedor.

Limitaciones de la auditoria:
- No pude completar el recorrido browser con Playwright porque el paquete temporal de Playwright existe en disco pero no resuelve como modulo Node. El build y las pruebas por API/remoto si pasaron.
- `npx eslint` sin acotar falla porque toma scripts ignorados en `supabase/.temp`; el lint acotado a codigo fuente versionable pasa.

## Fallas encontradas

1. Pedidos historicos sin repartidor asignado.
   - Severidad: media.
   - Evidencia: pedidos 61, 62, 63, 64, 65, 66, 67, 74, 75, 76, 77 y 78 tienen estado generado/recibido y `repartidor_id = null`.
   - Impacto: los reportes o vistas futuras por repartidor quedan incompletos para datos previos a la migracion.
   - Causa probable: la migracion agrega la FK nullable y no hace backfill de pedidos existentes.
   - Decision pendiente: asignarlos manualmente, crear una rutina de backfill, o aceptar que el historico anterior no tenga repartidor.

2. Ventas historicas sin repartidor asignado.
   - Severidad: media.
   - Evidencia: ventas/unidades 39, 41 y 49 estan en `REPARTO` o `ENTREGADA` con `repartidor_id = null`.
   - Impacto: no se puede reconstruir quien entrego esas ventas ni incluirlas en liquidaciones por repartidor.
   - Causa probable: ventas creadas antes de existir la entidad `repartidor`.
   - Decision pendiente: asignacion manual o backfill si se conoce quien hizo esas entregas.

3. El modelo nuevo todavia no cubre una ruta/liquidacion de repartidor como entidad propia.
   - Severidad: alta para el nuevo alcance financiero.
   - Evidencia funcional: ahora existen repartidores y asignaciones a pedidos/unidades, pero no existe una tabla tipo `ruta_reparto` o `liquidacion_repartidor`.
   - Impacto: no hay una entidad que agrupe "salida del repartidor", pedidos a retirar, ventas a entregar, dinero entregado, dinero cobrado y dinero que debe volver.
   - Causa: el cambio implementado crea trazabilidad basica, pero el requerimiento de caja/ruta necesita otro nivel de modelo.
   - Decision pendiente: disenar una tabla de rutas/liquidaciones antes de seguir sumando reglas financieras.

4. No existe registro estructurado de dinero entregado al repartidor para compras.
   - Severidad: alta para control de caja.
   - Evidencia funcional: `proveedor_pago` registra pagos a proveedor, pero no quien llevo el efectivo ni cuanto dinero se le entrego al repartidor antes de salir.
   - Impacto: no se puede calcular de forma confiable cuanto efectivo debe devolver el repartidor por sobrante de compras.
   - Decision pendiente: agregar movimientos de caja por repartidor o campos de anticipo dentro de una futura ruta.

5. No existe registro estructurado de dinero que el repartidor debe cobrar/traer por entregas a clientes.
   - Severidad: alta para control de caja.
   - Evidencia funcional: `venta_abono` registra pagos de ventas, pero no distingue metodo, responsable del cobro ni liquidacion por repartidor.
   - Impacto: una venta asignada a repartidor no alcanza para saber cuanto dinero debe traer ni si ya fue rendido.
   - Decision pendiente: relacionar cobros con repartidor/ruta y agregar estado de rendicion.

6. No existe generacion de comprobante de compra/entrega para el cliente.
   - Severidad: media-alta.
   - Evidencia funcional: el flujo de Ventas registra pago y entrega, pero no genera ni almacena comprobante.
   - Impacto: el repartidor no tiene comprobante formal para entregar y el sistema no conserva trazabilidad documental.
   - Decision pendiente: definir formato, numeracion, datos legales/comerciales y persistencia del comprobante.

7. Tooling: `npx eslint` completo revisa archivos temporales ignorados.
   - Severidad: baja-media.
   - Evidencia: `npx eslint` falla en `supabase/.temp/*.cjs` por `@typescript-eslint/no-require-imports`.
   - Impacto: un chequeo general de CI/local puede fallar aunque el codigo versionable este correcto.
   - Decision pendiente: excluir `supabase/.temp` desde la configuracion de ESLint o usar siempre lint acotado a carpetas versionables.

## Observaciones sin falla critica

- Las FK nuevas de repartidores funcionan en remoto.
- `pgl_snapshot` ya devuelve `couriers`.
- Datos, Pedidos/Reparto y Ventas ya consumen `couriers`.
- No encontre FK rotas en productos, proveedores, clientes, vendedores, pedidos, lineas, unidades, repartidores, pagos de proveedor ni abonos de venta.
- No encontre sobrepagos reales al recalcular pagos con la misma regla que usa la app.
