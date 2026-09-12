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

## Sprint Datos - 2026-09-08

### Estado
Sprint iniciado. Base: commit 7b9bf52, cierre del sprint Stock.

### Punto de partida
- Cuatro catálogos: Productos, Proveedores, Clientes y Vendedores.
- Alta, edición y activación/desactivación con datos simulados en memoria, sin persistencia.
- La búsqueda por texto funciona; el selector Todos/Activos/Inactivos no está conectado al filtrado.
- Buscadores y filtros permanecen dentro de las tarjetas; pendiente alinearlos con el criterio visual compartido.
- Mejoras de este sprint pendientes de definir con el usuario. Sin cambios funcionales en Datos por ahora.

### Catalogos de Datos: listados y encabezados
- Titulos sin leyendas en Datos y sus cuatro catalogos; se retiran descripciones de las tarjetas de acceso.
- Productos, Proveedores, Clientes y Vendedores usan el layout compartido: buscador y filtro fuera de la tarjeta, controles de 42 px y separaciones de 18 px.
- Cada listado muestra hasta 10 coincidencias, ordenadas por ID descendente. El ID incremental representa el orden de alta en los mocks actuales; editar no cambia ese orden.
- La busqueda consulta todos los registros antes de limitar a 10. El filtro Todos/Activos/Inactivos queda conectado.
- Boton de alta con el estilo de Compras/Ventas y contador total a su derecha reutilizando el neon de Stock. El total incluye activos e inactivos, independientemente de la busqueda.
- El estilo del contador se centraliza en OperationalLayout.module.css y se reutiliza tambien desde Stock.
- Se conserva el alta y la edicion en memoria.

### Validacion de catalogos
- TypeScript y ESLint de Datos/Stock sin errores.
- Edge con Playwright: alta en los cuatro catalogos, registro nuevo primero, separacion de 18 px antes de la tarjeta y ausencia de desbordamiento horizontal a 390 px.
- Productos: se crearon registros simulados hasta superar 10, se verifico el limite y la busqueda de un registro anterior fuera de los 10 recientes.
- Proveedores: filtro de inactivos verificado. Las altas de prueba fueron solo en la memoria del navegador de validacion.

### Tarjetas iniciales y regreso a Datos
- Nombre de cada catalogo ampliado a 24 px junto al icono, con descripcion breve debajo.
- Se reemplazan Administrar y el numero aislado por el total dinamico de elementos creados, incluyendo activos e inactivos.
- Se quita el contador del encabezado interior; se conserva el boton de alta.
- Volver a Datos pasa inmediatamente a la derecha del buscador, antes del filtro, con altura de 42 px. En movil sigue el apilado del layout compartido.
- La grilla inicial pasa a dos columnas desde 1250 px para acomodar los titulos ampliados y a una en movil.

### Alineacion con la base oficial
- Fuente: ../pgl-pulse/docs/database.sql, lineas 36-78; contrastada con ../pgl-pulse/lib/supabase/types.ts y PGL-PULSE-BASE-DE-DATOS-v1.0.md.
- Producto: id, marca, nombre, categoria.
- Proveedor: id, nombre, contacto, telefono, direccion, horario_desde, horario_hasta, observaciones.
- Cliente: id, nombre, telefono, direccion, localidad, observaciones.
- Vendedor: id, nombre, telefono, porcentaje_comision, observaciones.
- Tablas y formularios comparten la configuracion de campos. ID automatico y campos opcionales vacios como null, mostrados con raya.
- Se retiran email, rol, variante de producto y activo/inactivo, ausentes del esquema oficial.
- Se conservan datos simulados conocidos; campos sin informacion quedan vacios. No se consultaron ni modificaron registros de Supabase.
- Formularios con unicidad marca/nombre para producto, longitudes del SQL y comision numerica no negativa.
- Volver a Datos queda encima del buscador, a 10 px; la tarjeta conserva 18 px de distancia.
- Recientes ordenados por ID descendente porque estas tablas no tienen fecha de alta.

## Sprint Intro - 2026-09-08

### Alcance
- Intro de 5,6 segundos usando el PNG original logo blanco SIN FONDO.png.
- Logo centrado sobre el fondo oscuro de la app, pulso azul/blanco de izquierda a derecha, atenuacion del logo y reaparicion antes del fundido a la app.
- La secuencia comienza al cargar el logo. Se reproduce al abrir o recargar la app; navegar entre pestanas no la reinicia.
- La interfaz se monta debajo y permanece sin interaccion durante la intro.
- Movimiento reducido: fundido breve de 0,8 segundos, sin barrido. Si falla la imagen se permite entrar directamente.
- Archivos: app/page.tsx, components/core/AppIntro/AppIntro.tsx y AppIntro.module.css; PNG original importado como recurso estatico.
- Base de datos aplazada para la proxima sesion por decision del usuario.

### Intro: latido SVG
- Se sustituye el barrido por el electrocardiograma aportado por el usuario, dentro de div.pulse.
- Mismo revelado y borrado de izquierda a derecha del SCSS, adaptado a clip-path porcentual sin Sass ni jQuery.
- Trazo blanco con resplandor azul y linea base tenue; ancho completo, altura responsive y grosor constante.
- Latido de 2,2 segundos desde el segundo 1,5, coordinado con el logo dentro de la intro de 5,6 segundos.

### Intro: disolucion final e intensidad
- El logo se difumina progresivamente (hasta 22 px de blur) y desaparece durante el latido, sin reaparecer.
- Latido ampliado al 78% de la altura de pantalla (entre 240 y 780 px), trazo de 5 px y cuatro capas de luz blanca, cyan y azul hasta 64 px.
- Pulso desde 1,5 hasta 4,8 segundos; al terminar comienza el fundido de 0,8 segundos hacia el programa. Duracion total: 5,6 segundos.

### Intro: suavizado del arrastre luminoso
- El recorte duro del latido se sustituye por una mascara con extremos degradados animados para disolver la luz durante el borrado.
- Se reduce solo el halo exterior de 64 a 42 px y su opacidad, conservando el nucleo blanco y el brillo azul cercano.

## Cierre de jornada - 2026-09-08

- Sprint Datos finalizado: catalogos alineados al esquema oficial, tablas y formularios completos, buscadores, ultimos 10 registros y tarjetas de acceso revisadas.
- Sprint Intro finalizado y aprobado: PNG de PGL, latido blanco/azul responsive, logo que se difumina hasta desaparecer y entrada suave al programa; arrastre luminoso suavizado.
- Validaciones: TypeScript y ESLint sin errores (tres advertencias previas de imports sin uso en Compras/Ventas). Pruebas con Edge de altas, edicion, campos SQL, navegacion, intro y adaptacion movil.
- Se cierra la jornada con commit y publicacion en GitHub.
- Proxima sesion: activar y coordinar la base de datos. Reparto queda despues de esa integracion.

## Cierre de sesión — 2026-09-11

Reportes queda guardado para continuar su revisión visual y funcional con el usuario; no se declara aprobado definitivamente. El próximo paso es retomar esta pantalla desde el estado documentado en [REPORTES.md](REPORTES.md), sin rehacer la integración.

- Repartos cerrado y subido a GitHub en 8fd2d88. Exportación WhatsApp y contactos ficticios documentados en REPARTO.md.
- Reportes: cuatro KPI, torta, top 5, personalizados, PDF y resumen de vendedores implementados.
- Última corrección: más espacio bajo el título; selectores de día, mes, mes final del semestre y año. Semestre móvil = mes elegido más cinco anteriores, incluso cruzando de año.
- Preferencias confirmadas: compras confirmadas, incluidos pendientes de recepción; ranking de vendedores por ganancia neta generada.
- Mantener estética y espaciados compartidos. Las explicaciones operativas van a una futura Ayuda.
- Mantener los informes actualizados al cerrar cada sesión o sprint, por instrucción del usuario.
- No se modificó el esquema remoto ni se crearon movimientos reales en las pruebas de Reportes.
- Pendientes conocidos: actualizar el test de integración antiguo a las interfaces definitivas; mantenimiento de dependencias señalado en REPORTES.md.
- Este cierre solicita commit local; no se solicita un nuevo push.

## Cierre técnico de Reportes — 2026-09-12

- Se retoma y completa el chequeo pendiente del último ajuste de selectores.
- Aprobados: 14 tests de lógica, lint, TypeScript, build de producción, navegador de Reportes y regresión responsive global (siete pantallas, seis resoluciones).
- PDF y capturas regenerados con datos simulados; sin cambios en la base remota.
- Implementación, documentación y pruebas preparadas para commit local, según lo solicitado. Sin push ni despliegue.
- Sigue pendiente la revisión visual con el usuario; mantenimiento de dependencias y adaptación del test histórico de integración conservan su alcance separado.
