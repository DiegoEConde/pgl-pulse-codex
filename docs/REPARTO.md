# Repartos

Pantalla aprobada en el sprint del commit 8fd2d88. Organiza los retiros de compras por proveedor.

## Comportamiento

- Título Repartos, botón Generar reparto y cantidad de paradas.
- Una tarjeta por proveedor con pedidos abiertos en BORRADOR, PEDIDO o ENVÍO. Se excluyen recibidos y cerrados; se incluyen pendientes de fechas anteriores.
- Orden por inicio de horario, luego nombre e ID. Sin horario al final.
- Cada tarjeta muestra proveedor, dirección, teléfono y horario; líneas con producto, RAM/ROM, color, cantidad y costo unitario USD.
- Todas las tarjetas permanecen accesibles con scroll vertical; se paginan dos líneas por tarjeta.
- Generar reparto copia todas las líneas en el orden de las tarjetas, incluidas las páginas no visibles. Formato WhatsApp con asteriscos, separadores, cantidades y total por proveedor calculado en centavos. No envía el mensaje.
- Se muestra éxito o error de portapapeles. Botón con estilo compartido de Nueva compra y Nueva venta.

## Persistencia y compatibilidad

RAM/ROM son opcionales en Compras. La RPC actual no admite columnas propias en detalle_pedido: se guardan junto con el texto del usuario en un JSON `pgl.purchase-details.v1` dentro de pedido.observaciones, identificadas por producto_id/color.

`lib/purchase-details.ts` codifica y valida ese formato, conservando las observaciones antiguas en texto libre. Al recibir, los valores precargan unidad.ram y unidad.variante. Su normalización futura requiere una migración que mantenga los datos anteriores.

Las RPC de pago, entrega y cierre diario siguen existiendo, pero sus controles se retiraron de esta pantalla. La ubicación definitiva está pendiente en el [roadmap](ROADMAP.md).

## Código y pruebas

- Agrupación y mensaje: `lib/delivery.ts`.
- Interfaz: `components/features/delivery/`.
- Pruebas de lógica: `tests/delivery.test.cjs`.
- Navegador: `tests/delivery.browser.cjs`, con compras simuladas, recarga, seis resoluciones y copia al portapapeles del conjunto completo.
- Captura regenerable: `tests/artifacts/delivery-desktop.png`.

Consultar [tests/README.md](../tests/README.md). Las pruebas simuladas no crean compras remotas. El estado histórico de los catálogos de prueba está documentado en [REVISION-SUPABASE.md](REVISION-SUPABASE.md).
