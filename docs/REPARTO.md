# Repartos

Pantalla aprobada en el sprint del commit 8fd2d88. Organiza los retiros de compras por proveedor.

## Comportamiento

- Título Repartos, botón Generar reparto y cantidad de paradas.
- Una tarjeta por proveedor con pedidos abiertos en BORRADOR, PEDIDO o ENVÍO. Solo se excluyen recibidos; se incluyen pendientes de fechas anteriores aunque tengan una marca histórica cerrado_en.
- Orden por inicio de horario, luego nombre e ID. Sin horario al final.
- Cada tarjeta muestra proveedor, dirección, teléfono y horario; líneas con producto, RAM/ROM, color, cantidad y costo unitario USD.
- Todas las tarjetas permanecen accesibles con scroll vertical; se paginan dos líneas por tarjeta.
- Generar reparto copia todas las líneas en el orden de las tarjetas, incluidas las páginas no visibles. Formato WhatsApp con asteriscos, separadores, cantidades y total por proveedor calculado en centavos. No envía el mensaje.
- Se muestra éxito o error de portapapeles. Botón con estilo compartido de Nueva compra y Nueva venta.

## Persistencia y compatibilidad

El ajuste local del 2026-09-14 guarda variantes en detalle_pedido.atributos y exige las opciones configuradas. Las observaciones antiguas se siguen leyendo. Las variantes se muestran en tarjetas y WhatsApp. Migración aplicada y verificada en Supabase el 2026-09-14; ver [detalle](sprints/COMPRAS-OPCIONES.md).

`lib/purchase-details.ts` codifica y valida ese formato, conservando las observaciones antiguas en texto libre. Al recibir, los valores precargan unidad.ram y unidad.variante. Su normalización futura requiere una migración que mantenga los datos anteriores.

Las RPC históricas se conservan por compatibilidad del esquema. No se incorporará un cierre diario. Los nuevos pagos y el circuito de recepción se implementarán según el [roadmap](ROADMAP.md); B1 evita que un cierre histórico oculte pedidos pendientes.

## Código y pruebas

- Agrupación y mensaje: `lib/delivery.ts`.
- Interfaz: `components/features/delivery/`.
- Pruebas de lógica: `tests/delivery.test.cjs`.
- Navegador: `tests/delivery.browser.cjs`, con compras simuladas, recarga, seis resoluciones y copia al portapapeles del conjunto completo.
- Captura regenerable: `tests/artifacts/delivery-desktop.png`.

Consultar [tests/README.md](../tests/README.md). Las pruebas simuladas no crean compras remotas. El estado histórico de los catálogos de prueba está documentado en [REVISION-SUPABASE.md](REVISION-SUPABASE.md).
