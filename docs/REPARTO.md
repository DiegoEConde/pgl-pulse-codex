# Repartos — sprint cerrado

## Comportamiento aprobado
- Pantalla con título Repartos, botón Generar reparto y cantidad de paradas debajo.
- Una tarjeta por proveedor con pedidos abiertos (BORRADOR, PEDIDO o ENVÍO); se excluyen recibidos y cerrados. Incluye pendientes de fechas anteriores.
- Orden por inicio de horario, luego nombre e ID. Sin horario al final.
- Proveedor, dirección, teléfono y horario; líneas con producto, RAM/ROM, color, cantidad y costo unitario USD.
- Todas las tarjetas visibles con scroll vertical. Paginación interna de dos líneas por tarjeta.
- Generar reparto copia todas las líneas, incluidas las paginadas, en el orden de las tarjetas. Formato WhatsApp con asteriscos, separadores, cantidades y total por proveedor calculado en centavos. Mensaje de éxito o error de portapapeles.
- Estilo compartido de botones Nueva compra, Nueva venta y Generar reparto. Explicaciones operativas destinadas a futura Ayuda.

## Persistencia y compatibilidad
RAM/ROM se cargan opcionalmente en Compras. La RPC actual no admite esos campos en detalle_pedido: se guardan transaccionalmente en un sobre JSON pgl.purchase-details.v1 dentro de pedido.observaciones junto con el texto del usuario, identificadas por producto_id/color. lib/purchase-details.ts codifica y valida. Datos anteriores permanecen compatibles. Al recibir se precargan en unidad.ram y unidad.variante. Una futura migración puede normalizarlos en detalle_pedido.

Las operaciones remotas de pago, entrega y cierre siguen existiendo, pero sus controles ya no aparecen en Repartos por decisión del usuario. El test antiguo tests/integration.browser.cjs aún depende de esa interfaz retirada: no usarlo como validación de esta pantalla hasta definir la nueva ubicación de esas acciones.

## Validación
- tests/delivery.test.cjs: agrupación, orden, estados, memoria, formato exacto de WhatsApp, minutos y totales.
- tests/operations.test.cjs: fechas y cálculos existentes.
- tests/delivery.browser.cjs: compras simuladas, recarga, tarjetas, seis viewports y copia real al portapapeles de todas las líneas.
- tests/responsive.browser.cjs: admite scroll vertical en Repartos.
- Se corrigió oscilación de capacidad en PagedTable conservando la mayor altura medida.
- Captura de referencia: tests/delivery-desktop.png.
- Las pruebas de este sprint no dejaron compras reales. Los tres proveedores y cuatro productos de prueba, con contactos ficticios, sí están guardados en Supabase.

## Próximo sprint
Reportes. Base actual: Resumen, Constructor, Detalle y Guardados; métricas de facturación, ganancia, unidades y pagos; gráficos por dimensión/métrica/estado; exportación CSV y gráficos persistentes para Inicio. Pendiente acordar con el usuario el diseño y flujo antes de modificar la pantalla.
