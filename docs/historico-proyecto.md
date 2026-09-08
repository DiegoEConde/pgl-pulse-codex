# Historial de Proyecto

Este archivo guarda el resumen diario del trabajo realizado en el proyecto. Cada vez que cerramos el día, se agrega un nuevo sprint con los avances, decisiones, ajustes y validaciones del período.

## Sprint 2026-09-01

### Fecha
2026-09-01

### Objetivo del día
Alinear la experiencia visual de Compras y Ventas con una misma lógica de densidad, separación, botones, paneles y modal premium, en una estética dark-blue premium.

### Cambios principales realizados

#### 1) Limpieza visual de Compras
- Se quitaron textos redundantes debajo del título y etiquetas innecesarias.
- Se eliminó el bloque de tarjetas extra no usado.
- Se mantuvo únicamente el nombre de la sección y la lógica central de paneles.
- Se reforzó el botón principal con azul oscuro, borde azul neon y letras blancas.

#### 2) Refinamiento de botones y filtros
- Ajuste del botón principal para que sea más marcado y premium.
- Ajuste visual del buscador y del filtro para mantener coherencia con la paleta general.
- Se eliminó el hover blanco del filtro.
- Se conservó la lógica del buscador para no afectar la lista del día y solo filtrar el historial.

#### 3) Uniformidad visual entre paneles
- Se redujo la diferencia visual entre secciones.
- Se ajustó el margen entre inputs y paneles.
- Se mejoró la separación entre tarjetas/paneles para evitar que queden pegados.
- Se reforzó la misma densidad visual entre Compras y Ventas.

#### 4) Ajustes específicos en Ventas
- Se eliminaron las cards superiores y el texto descriptivo extra.
- Se dejó la estructura con:
  - buscador y filtros arriba,
  - panel de ventas del día,
  - panel de historial.
- El historial quedó filtrado por búsqueda y estado.
- La lista del día quedó intacta y no se vio afectada por la búsqueda.
- Se renombró visualmente el historial para mantener coherencia.

#### 5) Modales premium y contenido resumido
- Se redujo la información visible del modal a lo esencial:
  - número de pedido/venta,
  - proveedor/cliente,
  - fecha,
  - estado,
  - total,
  - opción Ver.
- Se ajustó el detalle del desglose con una tabla clara y premium.
- Se aumentó el tamaño de fuente para mejorar legibilidad.
- Se mejoró la estética del modal con estilo más refinado.

#### 6) Sistema visual global
- Se consolidó la paleta dark-blue premium con acentos azules, verdes, violetas y ámbar.
- Se unificaron tamaños, bordes, headers, botones y tablas en la app.
- Se mantuvo una misma lógica visual en todas las secciones para aportar consistencia.

### Archivos relevantes
- components/features/purchases/PurchasesScreen.tsx
- components/features/purchases/PurchasesScreen.module.css
- components/features/sales/SalesScreen.tsx
- components/features/sales/SalesScreen.module.css
- styles.css
- components/ui/PageHeader/PageHeader.tsx

### Estado del sprint
El proyecto quedó con una estética visual premium y consistente, con separación clara entre paneles y densidad uniforme entre Compras y Ventas.

### Validación
Se comprobó la app con build final exitosa:
- `npm run build`
- Resultado: compilación exitosa y sin errores.

---

## Siguiente sesión
Cuando se cierre otro día de trabajo, se agregará un nuevo bloque con el nombre:

## Sprint YYYY-MM-DD

y allí se registrará lo que se hizo en esa jornada.

## Sprint Stock - 2026-09-08

### Cambios
- Se quitó la leyenda del título y se movieron buscador y filtros fuera de la tarjeta, siguiendo Compras y Ventas.
- Columnas: código de unidad, nombre, IMEI/serie, variante (RAM, ROM y color para celulares), pedido de origen, proveedor y costo USD.
- Se incorporaron valores demostrativos de RAM en los mocks de celulares. Otros productos conservan su variante y color.
- Se eliminaron controles y lógica de modificación, incluido el acceso desde el detalle. Stock queda como consulta; el uso operativo de las unidades corresponde a Ventas.
- El modal de consulta queda pendiente de revisión visual en la siguiente etapa.

### Criterio visual del proyecto
Mantener buscadores y filtros fuera de las tarjetas de listado, siguiendo Compras y Ventas, en las próximas pantallas y ajustes.

### Archivos
- components/features/stock/StockScreen.tsx
- components/features/stock/StockScreen.module.css
- lib/mock/stock.ts
- docs/historico-proyecto.md

### Validación
- TypeScript: npx tsc --noEmit --incremental false, sin errores.
- ESLint: npm run lint, sin errores; tres advertencias preexistentes por imports sin uso en Compras y Ventas.
- git diff --check: sin errores de espacios.
- Revisión visual en navegador pendiente.

### Ajuste adicional: proveedores y contador
- Se agrega el tercer filtro "Todos los proveedores", combinado con marca, categoría y búsqueda.
- En Stock se reemplaza el bloque "Operación estable" y su fecha por el total de dispositivos en stock, con tipografía grande y brillo neón azul.
- El contador del encabezado muestra el stock total; el contador junto a los filtros muestra las coincidencias.
- La barra permite varias filas para acomodar el nuevo filtro en pantallas intermedias.

### Ajuste adicional: tabla y modal de unidad
- Se elimina el contador redundante de unidades junto a los filtros; se conserva el total neón del encabezado.
- Color pasa a una columna propia, inmediatamente después de Variante.
- Se retiran del modal el precio sugerido y la advertencia inferior sobre la identidad de la unidad.
- Se eliminan el icono y los estilos que dejaron de utilizarse.

### Homogeneidad de Compras, Ventas y Stock
- Se elimina la leyenda inferior de la tarjeta de Stock.
- El modal muestra "Ingreso a stock" usando receivedAt, la fecha de recepción disponible en los datos simulados.
- Análisis: el gap de 18 px se sumaba al margen global de 27 px entre tarjetas; Ventas y Stock sumaban otros 18 px bajo los filtros. El encabezado conservaba 27 px de margen y su altura dependía del botón o contador.
- Se centraliza el layout en components/ui/OperationalLayout.module.css para las tres pantallas: 18 px entre bloques, encabezado de al menos 96 px, controles de 42 px, buscador de hasta 420 px y tarjetas con padding de 24 px (18 px en móvil).
- Se anulan los márgenes acumulados dentro de estas pantallas. En móvil el encabezado reserva 148 px y los filtros se apilan; en anchos intermedios pueden envolver.
- Stock adopta las medidas de modal de Compras y Ventas: ancho de 760 px, encabezado de 26/28/20 px, título de 24 px, cierre de 36 px y valores de 14 px.
- Archivos: las tres pantallas y sus CSS, el nuevo CSS compartido y este historial.

### Validaciones de homogeneidad
- TypeScript y ESLint sin errores (persisten tres advertencias anteriores de imports sin uso).
- Edge con Playwright, anchos de 1440, 900 y 390 px: controles de 42 px, separaciones de 18 px entre encabezado, filtros y tarjetas; sin desbordamiento horizontal de la pagina.
- Ajuste final a 96 px de altura minima del encabezado en escritorio para acomodar el contador neon. Verificados encabezados alineados en las tres pantallas; en movil miden 148 px.
- Modal de Stock: fecha de ingreso visible. Leyenda inferior eliminada.
