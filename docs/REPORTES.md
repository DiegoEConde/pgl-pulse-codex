# Reportes

Implementado y con cierre técnico en el commit 75cc1d7. Pendiente de revisión visual final con el usuario. Esta especificación describe el comportamiento vigente.

## Períodos y métricas

- Pestañas Hoy, Mes, Semestre y Año. Cada una recuerda su selección de día, mes o año mientras la pantalla permanece montada.
- Semestre móvil: mes final elegido y cinco anteriores, incluso cruzando de año. Los períodos históricos incluyen el intervalo completo; el actual termina hoy.
- El selector de años incluye al menos diez anteriores y se extiende hasta el primer movimiento disponible.
- Compras por fecha_pedido, ventas por fecha_venta y días operativos de Buenos Aires. Se incluyen compras en PEDIDO, ENVÍO y RECIBIDO; se excluyen borradores. Cerrar pedidos no elimina su actividad histórica.
- Costo total: mercadería comprada más envío del período. Unidades compradas: suma de cantidades de sus líneas.
- Total de ventas: importes de unidades en REPARTO o ENTREGADA. Ganancia: ventas menos costo de las unidades vendidas, su envío y comisiones históricas. No equivale necesariamente a ventas menos compras del mismo período.
- Los importes se acumulan en centavos. El envío prorrateado conserva el total al filtrar por dispositivo.

## Gráficos y rankings

La torta muestra dispositivos por unidades compradas, clientes por unidades vendidas o proveedores por unidades compradas. Se agrupa por ID para no fusionar nombres iguales.

Hoy muestra todas las categorías; Mes, Semestre y Año muestran las diez primeras. Los porcentajes corresponden al conjunto mostrado, no al total omitido del top 10.

El ranking muestra cinco modelos por mayor costo unitario de compra registrado, sin envío, una entrada por modelo; o cinco vendedores por mayor ganancia, con desempate por facturación y nombre.

## Reporte personalizado

Formulario con título, fechas, alcance (compras/ventas/ambas), dispositivo, proveedor, gráfico, ranking y detalle opcional. Al elegir Ventas se habilitan cliente y vendedor; esos filtros no se aplican en los otros alcances. Se rechazan fechas futuras e intervalos invertidos.

El resultado abre un diálogo independiente y permite cambiar gráfico/ranking y descargar PDF. Los KPI de compras quedan en cero en el alcance Ventas. Un personalizado de varios días usa top 10; uno de un día muestra todas las categorías.

## Resumen de vendedores

Incluye todos los vendedores, aun sin ventas, para el período seleccionado. Al elegir uno muestra unidades, importe vendido, costo vendido, ganancia, comisión, pagos verificados, ticket promedio y clientes distintos. Cada venta detalla cliente, fecha, costo, ingreso, comisión, ganancia, pago y estado.

## PDF

Descarga directa con jsPDF cargado bajo demanda. Incluye título, fechas, alcance, IDs de filtros, métricas, torta y ranking seleccionados. El personalizado incluye todas las operaciones si se pidió detalle y agrega páginas según el espacio disponible. No escribe en Supabase ni utiliza un servicio externo de generación.

Los gráficos guardados por el constructor antiguo siguen en la base, pero ninguna pantalla actual los muestra. Su posible recuperación está en el [roadmap](ROADMAP.md).

## Código y validación

- Lógica: `lib/reports.ts`. Exportación: `lib/report-pdf.ts`.
- Interfaz: `components/features/reports/`.
- Pruebas: `tests/reports.test.cjs` y `tests/reports.browser.cjs`.
- Capturas y muestras PDF se regeneran en `tests/artifacts/` y no se versionan.

Consultar [la guía de pruebas](../tests/README.md) para ejecución y límites de cobertura, y [el historial](historico-proyecto.md) para resultados de cada cierre.
