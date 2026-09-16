# Reglas de la aplicación

Este documento describe el comportamiento implementado en alpha y los cambios de beta indicados, contrastado con el código y las migraciones. Para las próximas mejoras, la referencia funcional prioritaria es [FLUJO-FUNCIONAL.md](FLUJO-FUNCIONAL.md), definida por el usuario el 2026-09-13. Las diferencias entre ambos documentos son cambios pendientes, no funcionalidades ya implementadas. No se incorporará cierre diario.

## Dominio y datos

- La entidad central es `unidad`: un equipo físico individual. `producto` representa un modelo comercial, no una existencia.
- Un proveedor tiene pedidos; cada pedido tiene líneas de producto/color/cantidad/costo. La recepción crea una unidad por equipo y conserva su pedido y línea de origen.
- Clientes y vendedores se asocian a la unidad al venderla. Las claves foráneas protegen los registros relacionados; no se borran para limpiar historiales.
- Los catálogos son producto, proveedor, cliente y vendedor. Producto es único por marca/nombre. La interfaz permite alta y edición, sin un estado activo/inactivo inventado.
- Fechas operativas en `America/Argentina/Buenos_Aires`; importes en USD. Reportes y la exportación de reparto acumulan centavos para conservar totales.
- El acceso es compartido y sin cuentas. Las operaciones se validan en la base, además de las comprobaciones del formulario.

## Compras y recepción

- Flujo: BORRADOR → PEDIDO → ENVÍO → RECIBIDO. Se puede recibir directamente desde PEDIDO.
- Crear un pedido no crea stock. La recepción completa valida todas las unidades, las inserta y cambia el estado dentro de una transacción.
- El envío se reparte entre unidades en centavos; el remanente se distribuye sin perder el total.
- IMEI/serie, RAM, variante y precio sugerido son opcionales. Stock permite completarlos mientras la unidad esté disponible.
- Ajuste local de Compras: sin recepción estimada ni envío en el modal. Cargar en Reparto guarda el pedido pendiente y vuelve al listado.
- Categorías relacionadas por ID y características obligatorias en `categoria_caracteristica`; 15 categorías y 22 campos definidos por el usuario. Compras permite crear productos y agregar valores a listas existentes, sin crear campos. Las categorías sin color no lo solicitan; audio admite potencia entera de 2 a 350 W. RAM y almacenamiento usan GB/TB. Configuración anterior archivada y pedidos históricos conservados: [detalle](sprints/CATEGORIAS.md).
- La creación usa un UUID de solicitud para que reintentar no duplique un pedido.
- Pedidos de hoy contiene los abiertos de la fecha actual; el historial contiene los anteriores y los cerrados. Búsqueda y estado filtran ambos conjuntos antes de paginar.
- La RPC histórica de cierre permanece en el esquema por compatibilidad; no se incorporará su control a la interfaz. Desde B1, esa marca no oculta pedidos pendientes en Repartos.

## Stock y ventas

- La pantalla Stock lista solo unidades en STOCK. El modelo derivado conserva también otros estados para usos de las pantallas.
- Una venta reserva una unidad en STOCK y la pasa a REPARTO. La base bloquea esa unidad para que dos solicitudes no puedan venderla simultáneamente.
- La venta guarda cliente, vendedor, fecha, importe y comisión en USD. B2 agrega importe inicial, abonos sucesivos e historial cuando está aplicada su migración. Una venta de importe cero sigue conservando su costo y puede producir pérdida.
- La fecha de venta no puede ser anterior al ingreso ni posterior al día operativo actual.
- El UUID de solicitud permite reintentar sin duplicar la venta. La comisión histórica no se recalcula al editar el vendedor.
- B2 reemplaza el interruptor de pago por abonos con saldo pendiente: no se borran cobros desde ese detalle. Completar el pago exige confirmar retiro, salvo una unidad ya entregada. Las ventas alpha verificadas conservan un saldo inicial sin historial inventado. B3 incorporará las alertas; B4, los estados definitivos. Ver [B2](sprints/B2.md) para activación y límites.
- Ventas separa fecha actual e historial; búsqueda y estado se aplican antes de paginar.

## Inicio, Repartos y Reportes

- Inicio resume ventas y compras del día. Su total de compras incluye borradores; Reportes cuenta solo compras confirmadas. Esta diferencia existe hoy y debe revisarse antes de unificar métricas.
- Deuda a proveedores y contadores de alertas en Inicio son vistas previas explícitas, todavía sin cálculo operativo.
- Repartos organiza retiros por proveedor con pedidos abiertos, incluidos borradores y pendientes de días anteriores. Generar reparto copia el texto completo para WhatsApp; no envía mensajes. Ver [REPARTO.md](REPARTO.md).
- Reportes usa fecha de pedido para compras y fecha de venta para ventas. La ganancia resta el costo de lo vendido y sus comisiones, no las compras del período. Ver [REPORTES.md](REPORTES.md) para filtros, períodos y rankings.
- Los PDF se generan localmente. El antiguo constructor de gráficos no se muestra; sus registros remotos se conservan por compatibilidad.

## Criterio de interfaz

Mantener controles y espaciados compartidos, filtros fuera de las tarjetas y texto legible. El historial completo debe seguir accesible por paginación; no limitarlo arbitrariamente a diez filas. Las explicaciones largas pertenecen a la futura Ayuda. Ver [RESPONSIVE.md](RESPONSIVE.md).
