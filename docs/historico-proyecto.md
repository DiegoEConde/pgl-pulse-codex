# Historial del proyecto

Resumen de hitos, decisiones y verificaciones. El detalle de los ajustes intermedios se conserva en Git; las reglas vigentes están en [REGLAS-APP.md](REGLAS-APP.md) y las tareas abiertas en [ROADMAP.md](ROADMAP.md). Actualizar este archivo al cerrar cada sesión o sprint.

| Etapa | Resultado |
| --- | --- |
| 2026-09-01 | Unificación visual de Compras y Ventas a partir del prototipo. |
| 2026-09-08 | Stock y layout compartido; catálogos alineados al esquema; intro con logo y pulso, movimiento reducido y entrada al programa. |
| 2026-09-10 | Integración operativa sin cuentas en Supabase; pruebas SQL y del circuito de navegador de aquella interfaz. Commit `4234fe9`. |
| 2026-09-11 | Inicio y navegación responsive con tablas paginadas. Commit `5ff0a09`. |
| 2026-09-11 | Repartos por proveedor y exportación para WhatsApp. Commit `8fd2d88`. |
| 2026-09-11/12 | Reportes con períodos históricos, semestre móvil, personalizados, PDF y vendedores por ganancia. Chequeos completados y commit local `75cc1d7`, sin push. |

## Decisiones que se conservan

- Arquitectura centrada en la unidad física; producto es un modelo comercial.
- Filtros fuera de tarjetas, layout compartido y acceso al historial completo mediante paginación.
- Intro de 5,6 segundos al abrir/recargar, 0,8 segundos con movimiento reducido; la navegación interna no la reinicia.
- Repartos se dedica a los proveedores; la ubicación de pago, entrega y cierre queda por definir.
- Reportes cuenta compras confirmadas, incluso pendientes de recepción, y ordena vendedores por ganancia generada.
- Explicaciones extensas destinadas a una futura Ayuda.

## Limpieza de mantenimiento — 2026-09-12

- Eliminados el prototipo HTML/JS, mocks sin referencias, placeholder, constructor de gráficos desconectado y test de navegador obsoleto.
- Conservados esquema, migraciones, tipos y datos remotos. Los gráficos históricos permanecen en el contrato de Supabase.
- Logo organizado en assets; CSS base trasladado a app y selectores sin uso retirados.
- Comentarios breves en reglas, transacciones, fechas, concurrencia, exportación y paginación.
- Resultados de navegador en tests/artifacts, ignorados por Git. Scripts npm para pruebas de lógica y navegador.
- Documentación consolidada en reglas, arquitectura, roadmap, especificaciones y guía de pruebas. Retiradas instrucciones que describían pantallas antiguas.
- Validación final: 22 pruebas de lógica, lint, TypeScript y build aprobados. Las tres pruebas de navegador pasaron sobre la compilación final, incluyendo siete pantallas en seis resoluciones. Imports y enlaces locales verificados, sin referencias rotas; todos los módulos TypeScript de la app son alcanzables desde sus entradas. Sin consulta ni modificación de la base remota.

## Inicio de fase beta — 2026-09-12

- Alpha finalizada por el usuario. Se guarda la limpieza validada y se inicia la planificación de beta.
- Roadmap organizado en sprints B0–B7: cierre de alpha, pagos/entregas/cierre diario, usuarios, datos reales en la base actual, Vercel personal, pruebas y migración a las cuentas empresariales.
- Los sprints permanecen pendientes de ejecución; este cierre solo registra y publica en GitHub los cambios de código y documentación ya realizados.

## Apertura de beta — 2026-09-13

- B0 cerrado: alpha recuperable en 321542c, coincidente con la referencia local origin/main; validaciones del cierre registradas arriba.
- B1 iniciado en análisis. Diagnóstico y decisiones pendientes en [sprints/B1.md](sprints/B1.md).
- Corregida la documentación: Ventas sí tiene un control para verificar el pago en su detalle. Faltan importes/historial, pagos a proveedores y controles de entrega/cierre según las reglas por acordar.
- Detectada la relación entre cerrado_en y la exclusión de pedidos en Repartos, a resolver al definir el cierre.
- El único cambio de código previo a esta apertura era next-env.d.ts generado para desarrollo; se conserva sin modificar.
- No se alteraron operaciones ni datos remotos en esta apertura.

## Reversión de cambios de B1 — 2026-09-13

- El usuario descarta el cierre diario porque el programa administra datos y no controla caja real.
- Restaurados los archivos del programa al estado anterior a esta implementación. Retirados los componentes, cálculos, migración y pruebas de B1, su captura de fallo y PostgreSQL embebido de la carpeta temporal.
- Conservados los documentos previos de apertura con esta corrección de alcance. B1 queda pendiente de redefinir.
- No hubo migración ni escrituras en Supabase, commit ni push de la implementación descartada.

## Definición del flujo funcional — 2026-09-13

- Registrada la explicación del usuario en [FLUJO-FUNCIONAL.md](FLUJO-FUNCIONAL.md), como referencia prioritaria para futuras mejoras.
- Cuentas individuales con acceso administrador; pagos al generar reparto; creación de unidades en traslado; recepción desde Inicio; ventas con pago total o parcial, pendientes cancelables y finalizadas editables solo en IMEI.
- Separado el flujo solicitado del comportamiento actual de alpha. Las ambigüedades de pago, entrega, cancelación, recepción y edición quedan explícitamente pendientes de aclaración.
- Solo documentación; sin cambios en el programa ni en Supabase.

## Aclaraciones del flujo funcional — 2026-09-13

- No se contempla pago completo sin retiro. Entregado/No pago incluye abonos parciales y muestra abonado y pendiente.
- Las ventas pendientes se revierten por cancelación: la unidad vuelve a Stock, la venta deja de figurar y se revierten abonos y efectos en ganancias, comisiones y estadísticas.
- Recepción con casillas por unidad: las marcadas ingresan; las restantes se retiran y ajustan la deuda. Si una unidad no recibida fue pagada, queda saldo a favor con el proveedor.
- Pendiente aclarar el registro de pagos posteriores y la asignación de abonos a unidades excluidas de pedidos parcialmente pagados, entre otros detalles anotados en FLUJO-FUNCIONAL.md.
- Solo documentación; sin implementación ni cambios en Supabase.

## Pagos sucesivos y deuda previa — 2026-09-13

- Confirmado el botón desde alertas de Inicio para registrar abonos sucesivos de clientes y proveedores, mostrando abonado y pendiente. Ejemplo: 100 abonados en partes de 40, 40 y 20.
- Al generar reparto, el modal propone el total del pedido más la deuda previa del proveedor, con desglose y validación del importe real por el usuario.
- Confirmada la consulta del importe pagado por cada unidad no recibida también en pedidos parcialmente pagados, para anular deuda o generar saldo a favor.
- Actualizadas las aclaraciones pendientes en FLUJO-FUNCIONAL.md; la distribución de pagos y aplicación de créditos todavía deben definirse. Solo documentación, sin cambios en el programa ni en Supabase.

## Beta B1 — Pendientes visibles en Repartos — 2026-09-13

- Reorganizado el roadmap en entregas cortas, con revisión del usuario antes de continuar; incorporados abonos desde Inicio, deuda previa al generar reparto y ajuste por unidades no recibidas.
- Redefinido B1 y corregido el filtro: cerrado_en histórico no oculta pedidos sin recibir. RECIBIDO sigue excluido. No se alteran migraciones ni datos remotos.
- Prueba de regresión actualizada. Validación: 22 pruebas aprobadas, lint y TypeScript sin errores; sin pruebas de navegador ni contra Supabase en esta entrega.
- B1 listo para revisión. B2 (cobros parciales en Ventas) todavía no iniciado.

## Beta B2 — Cobros parciales de ventas — 2026-09-13

- B1 revisado por el usuario; iniciado B2. Implementados importe inicial, abonos sucesivos, historial y saldo, con transacciones e identificadores de reintento.
- Preparada migración 20260913000100_sale_installments.sql; conserva pagos alpha como saldo inicial sin inventar fechas ni abonos. Bloquea el interruptor booleano antiguo.
- Confirmación mínima de retiro al saldar, adelantada de B4 para respetar el flujo. B3 (alertas), estados definitivos y cancelación siguen pendientes.
- Corregido panel vacío en Ventas causado por espacio residual entre las pestañas. Comprobada la recuperación existente ante pérdida de conexión.
- Validación final: 23 pruebas de lógica, PostgreSQL embebido con migraciones e integración SQL, navegador de B2 en escritorio/móvil con reintentos y recarga, lint y build con TypeScript aprobados. Sin validación de concurrencia entre conexiones ni contra Supabase remoto.
- Instalado PGlite en la carpeta temporal de validación, fuera del repositorio; pruebas reproducibles en npm run test:payments. Conservado el next-env.d.ts de desarrollo previo al sprint.
- Pendiente aplicar la migración y validar Supabase: esta sesión solo tiene URL y clave publicable, sin acceso administrativo. La interfaz deshabilita nuevos cobros y ventas hasta disponer del nuevo snapshot. Sin commit, push ni despliegue.

## Incidencia pendiente al pausar — 2026-09-13

- El usuario informa que al comprar un producto se fuerza el recorrido de confirmación de pago y confirmación de reparto a la vez.
- Registrada BETA-01 en el roadmap como prioridad al retomar, antes de B3. Pendiente reproducir, diagnosticar y corregir; no se asume todavía una causa técnica.
- Solo se documenta el fallo; no se modifican código ni datos en esta anotación.


## BETA-01: regreso al listado de Compras - 2026-09-14

- El usuario aclara que al crear una compra el recorrido avanza hasta la recepción sin dejarlo continuar trabajando.
- La prueba local previa no reprodujo cambios automáticos de estado; sí confirmó la apertura inmediata del detalle al guardar.
- Se elimina esa apertura: guardar vuelve al listado con aviso de borrador guardado. El detalle se abre manualmente.
- Prueba de navegador ampliada para verificar ausencia de modales, permanencia en BORRADOR, ninguna unidad recibida y reapertura manual. Sin cambios en Supabase.
- Pendiente revisión del usuario para confirmar si resuelve el recorrido informado; BETA-01 no se considera completamente reproducido.

- Detectado y corregido un panel vacío en Compras: un espacio residual era interpretado como primera pestaña, ocultando el listado de hoy.


## Opciones de Compras — 2026-09-14

Ajuste solicitado implementado localmente; [detalle y activación](sprints/COMPRAS-OPCIONES.md). Sin fecha estimada ni envío en el modal, botón Cargar en Reparto y variantes por línea. Migración probada localmente; pendiente de aplicación remota.


## Activación de Supabase — 2026-09-14

Acceso administrativo por CLI confirmado el 2026-09-14 al proyecto hxoofxapwgebihkyuvrv. B2 ya existía en remoto y se verificó sin reejecutarlo. Aplicada purchase_options y registradas ambas versiones en el historial. Integración SQL y prueba de opciones con rol anon aprobadas en Supabase, con ROLLBACK. Datos previos verificados por hashes. App en localhost:3100 comprobada contra el snapshot real: colores y RAM/ROM visibles, botón Cargar en Reparto habilitado; navegador sin escrituras. Las pruebas transaccionales pueden avanzar secuencias. No se validó concurrencia entre conexiones.

Las cuatro migraciones históricas tienen versiones remotas distintas de los nombres locales. Se preservó ese historial; no usar db push indiscriminadamente ni volver a ejecutar el esquema inicial. Las dos versiones beta sí coinciden y quedaron registradas.
