# Reportes

La distribución permite comparar unidades compradas, vendidas, proveedores, clientes y vendedores. El Top 5 usa unidades para dispositivos vendidos, clientes y proveedores; los dispositivos más caros comprados se ordenan por el mayor costo unitario de compra del período y los más caros vendidos por el mayor precio unitario de venta del período.

El informe personalizado empieza por gráfico o lista. Los gráficos disponibles son barras horizontales, columnas, líneas y circular. Permite medir unidades, costo de compras, importe vendido, ganancia, comisiones y precio promedio de venta; agrupar por dispositivo, proveedor, cliente, vendedor, día o mes; y filtrar por fechas y entidades. Solo se ofrecen combinaciones compatibles. Los importes usan USD; el promedio se calcula a partir de ventas individuales.

Las líneas mantienen el orden cronológico e incluyen fechas sin actividad con cero, excepto promedios. El circular excluye ganancias y promedios: presenta cinco grupos y agrega el resto como Otros, conservando el total. Las listas y barras admiten orden ascendente, descendente o alfabético y límites 5, 10, 20 o todos. La tabla conserva nombres y valores completos. El PDF incluye el gráfico elegido, filtros, valores y el detalle opcional.

Las compras incluyen pedidos confirmados aunque no se hayan recibido. Las ventas incluyen reparto y entregadas. La ganancia descuenta costo, envío y comisión. Los filtros y resultados se calculan en el navegador con el snapshot existente.

## Referencias de diseño

- [ONE Data: selección de gráficos](https://docs.one.org/guidelines/data-visualisation-guidelines/guidelines/chart-selection/): comparar categorías con barras, mostrar evolución temporal con líneas y composición con circular; ejes de barras desde cero.
- [From Data to Viz](https://www.data-to-viz.com/): elegir visualizaciones según la estructura de los datos y la pregunta.

## Validación

- npm test
- npx tsc --noEmit --incremental false
- npx eslint components/features/reports lib/reports.ts lib/report-pdf.ts lib/custom-report-pdf.ts
- node tests/reports.browser.cjs (servidor local en puerto 3000; usa datos simulados y genera PDF/capturas en tests/artifacts)
