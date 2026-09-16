# Criterio responsive de PGL Pulse

## Regla de diseño

Las tablas principales adaptan su contenido a la anchura y altura disponibles en notebook y tablet mediante paginación. Inicio y Repartos admiten scroll vertical para conservar las tarjetas completas y el texto legible. En celular se admite desplazamiento.

- Mantener el tamaño de texto legible; no escalar toda la aplicación ni ocultar el desbordamiento para simular que entra.
- Separar los bloques extensos en secciones seleccionables mediante `WorkspaceTabs`.
- Usar `PagedTable` para las listas: calcula la capacidad según la altura disponible y conserva acceso al conjunto completo mediante Anterior/Siguiente.
- Las búsquedas filtran el conjunto completo antes de paginar. No recortar el historial a diez registros.
- Permitir que los textos y controles se ajusten al ancho; las tablas de notebook y tablet no deben exigir desplazamiento horizontal.
- El breakpoint actual de celular es 740 px de ancho. Es una clasificación por viewport, no por el modelo físico del dispositivo.

## Verificación

Ejecutar `node tests/responsive.browser.cjs` con el servidor en `http://localhost:3000` (o configurar `PGL_TEST_URL`). Requiere Playwright y Edge; ver [la guía de pruebas](../tests/README.md).

La prueba intercepta la lectura de Supabase con cuarenta registros simulados. No escribe en la base. Recorre las siete pestañas, sus secciones y la página siguiente de tablas, comprobando desbordamientos y errores del navegador.

Resoluciones verificadas: 1440×900, 1280×720, 1024×600, 768×1024, 820×600 y 390×844. En celular se permite desplazamiento. Estos resultados no equivalen a garantizar cualquier viewport arbitrariamente pequeño.

El alcance de esta prueba son las vistas principales. Los formularios y diálogos largos conservan su comportamiento de desplazamiento y requieren una adaptación por pasos para aplicarles la misma restricción.

## Legibilidad — 2026-09-16

Texto principal de tablas y formularios de 15–16 px; etiquetas, estados y texto
secundario de 12–14 px. La misma escala se aplica en las siete pestañas y sus
modales. Se conserva la jerarquía de encabezados y acciones principales.

Inicio deja crecer las tarjetas según el contenido; en móvil los importes se
muestran en filas completas. Nueva compra sigue entrando sin scroll con un
producto en 1440×900, 1366×768, 1280×720, 1024×600, 390×844 y 360×740. Pedidos con
más productos y diálogos extensos mantienen desplazamiento cuando lo necesitan.

Verificados los detalles de Compras, Ventas y Stock, el alta de Datos y el reporte
personalizado en escritorio y móvil, con datos simulados y sin escrituras remotas.
