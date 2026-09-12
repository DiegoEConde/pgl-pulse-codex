# Roadmap beta

Actualizado: 2026-09-12. Etapa alpha finalizada por el usuario. Este documento define los sprints de beta y el futuro pase a producción; no autoriza su ejecución inmediata. Cada sprint se iniciará cuando el usuario lo indique.

## Objetivo y decisiones de esta etapa

Completar el circuito operativo, incorporar usuarios, probar con datos reales en el Supabase actual y publicar la beta en el Vercel personal. Cuando las pruebas estén aprobadas, pasar código, base de datos y web a GitHub, Supabase y Vercel de la empresa.

- La beta usará la base actual, por decisión del usuario; no se creará una base beta separada como requisito.
- El usuario dispone de un backup para reconstruir los datos. Antes de depender de él se comprobarán su formato, contenido y restauración.
- Los movimientos de prueba podrán descartarse al preparar producción. Se definirá exactamente qué datos y usuarios conservar o reconstruir antes de cualquier limpieza.
- Usuarios finales y usuarios de prueba se analizarán e implementarán durante la beta. La etiqueta de tester no implica automáticamente permisos de administrador ni aislamiento de datos.
- Publicar en una cuenta personal es independiente del plan contratado: se revisará un plan de Vercel compatible con el uso empresarial.
- El pase a la empresa es viable mediante transferencia de proyectos existentes o creación de proyectos empresariales y migración. La modalidad se elegirá antes del corte.

## Secuencia

| Sprint | Resultado esperado | Dependencia |
| --- | --- | --- |
| B0 | Cierre y referencia recuperable de alpha | Inicio de beta |
| B1 | Reglas y controles de pagos, entregas y cierre diario | B0 |
| B2 | Usuarios finales y de prueba con acceso controlado | B1 |
| B3 | Base actual cargada con datos reales y restauración comprobada | B2 |
| B4 | Beta accesible en Vercel personal | B3 |
| B5 | Pruebas de usuarios y corrección de incidencias | B4 |
| B6 | Preparación del entorno empresarial y ensayo de migración | B5 aprobado |
| B7 | Publicación en producción y traspaso a la empresa | B6 |

Los sprints expresan orden y entregables, sin estimaciones de duración todavía. Todos comienzan pendientes.

## B0 — Cierre de alpha

**Alcance**

- Revisar y guardar en Git los cambios de limpieza que quedaron sin commit.
- Identificar una versión de referencia de alpha recuperable, con su documentación y validaciones.
- Registrar limitaciones conocidas y acordar los criterios de aceptación de beta.

**Cierre:** código y documentos de alpha identificados en Git, con un punto de retorno verificable.

## B1 — Pagos, entregas y cierre diario

**Análisis**

- Distinguir cobros de ventas y pagos a proveedores. Definir si la beta requiere pagos parciales, saldos pendientes, historial de pagos y correcciones.
- Definir qué significa entrega confirmada, cómo se relaciona con el pago y dónde estarán sus controles.
- Definir qué incluye el cierre diario: pedidos, ventas, cobros y pendientes; condiciones para cerrar, reintentos y eventual reapertura.
- Revisar las RPC existentes: el cierre actual solo marca pedidos del día y no representa por sí solo un cierre de caja.
- Acordar quién podrá ejecutar cada acción para implementar esos permisos en B2.

**Implementación prevista**

- Incorporar las reglas acordadas, sus controles y, si corresponde, nuevas migraciones y funciones transaccionales.
- Conectar deuda a proveedores y métricas relacionadas según el alcance acordado.
- Revisar la diferencia actual entre compras de Inicio, que incluyen borradores, y Reportes, que solo cuenta confirmadas.
- Actualizar las reglas de la app y las pruebas de los estados y cálculos afectados.

**Cierre:** circuito definido y probado localmente; pagos, entregas y cierre tienen un significado explícito y controles utilizables. Las decisiones funcionales se acuerdan antes de implementarlas.

## B2 — Usuarios finales y usuarios de prueba

**Análisis**

- Definir tipos de usuario, permisos y alcance de los datos compartidos. Evaluar administrador, operador y tester sin fijar todavía la matriz definitiva.
- Acordar altas por invitación o registro, inicio y cierre de sesión, recuperación de acceso y desactivación.
- Distinguir la cuenta de acceso del vendedor comercial existente; decidir si se vinculan.
- Definir cómo identificar movimientos de prueba y quién realizó pagos, entregas y cierres.

**Implementación prevista**

- Incorporar autenticación y administración de usuarios según el flujo acordado.
- Adaptar RLS, permisos y RPC al usuario autenticado. El acceso anónimo actual debe dejar de permitir operaciones comerciales fuera de los permisos acordados.
- Crear cuentas finales y de prueba; aplicar sus permisos en la base además de en la interfaz.
- Definir qué cuentas se conservarán, migrarán o volverán a invitar al pasar a producción.

**Cierre:** accesos permitidos y rechazados comprobados para cada perfil, incluyendo llamadas directas a la API. Usuarios desactivados o sin sesión no pueden operar fuera del alcance acordado.

## B3 — Datos reales en el Supabase actual

**Alcance**

- Revisar el backup aportado: tablas, relaciones, fechas, importes y posibles datos de usuarios o archivos. Identificar qué contiene y qué queda fuera.
- Comprobar su restauración en un entorno temporal adecuado, sin sobrescribir la base actual durante el ensayo.
- Preparar una carga repetible y compatible con el esquema posterior a B1/B2. El backup original se conserva; cualquier transformación queda documentada.
- Respaldar el estado previo y acordar el tratamiento de los catálogos ficticios existentes.
- Cargar los datos reales en la base actual, respetando relaciones y trazabilidad.
- Comparar cantidades, stock, compras, ventas, costos y saldos con el origen.
- Definir cómo restaurar los datos entre rondas y cómo evitar mezclar pruebas con operaciones que deban conservarse.

**Cierre:** carga reconciliada y procedimiento de reconstrucción comprobado. Borrar datos no forma parte de esta planificación ejecutada: la limpieza concreta se revisará cuando corresponda.

## B4 — Publicación de beta en Vercel personal

**Alcance**

- Guardar y subir a GitHub la versión candidata de beta.
- Revisar el plan de Vercel aplicable al uso empresarial y configurar el proyecto en la cuenta personal.
- Configurar las variables para el Supabase actual y comprobar que no se publiquen credenciales secretas.
- Publicar y verificar acceso de testers, sesiones y operaciones desde la dirección de beta.
- Acordar qué rama alimenta la beta y cómo revisar cambios antes de desplegarlos. Las vistas previas no deberán modificar datos compartidos de forma inadvertida.
- Preparar un canal de incidencias y una identificación visible o consultable de la versión probada.

**Cierre:** testers autorizados acceden sin depender del equipo local; conexión y circuito básico funcionan en el despliegue.

## B5 — Pruebas beta y estabilización

**Alcance**

- Probar catálogos, compras, recepción, stock, ventas, pagos, entregas, cierre diario y Reportes con los datos cargados.
- Probar usuarios finales y de prueba, sesiones simultáneas, doble envío, venta concurrente de una unidad, permisos y recuperación ante errores.
- Revisar notebook, tablet y celular, diálogos, navegación por teclado y exportaciones.
- Reponer la prueba de navegador del circuito completo, que reemplaza al antiguo script retirado.
- Registrar incidencias con versión, pasos, resultado esperado/obtenido y prioridad; corregir y repetir la cobertura afectada.
- Completar la revisión de Reportes con el usuario y acordar qué alertas de Inicio entran en esta beta.
- Revisar dependencias y resolver los problemas que impidan publicar producción.

**Cierre:** escenarios críticos aprobados por los responsables, sin incidencias bloqueantes; pendientes menores expresamente aceptados. Repetir este sprint si las pruebas detectan nuevos bloqueos.

## B6 — Preparación de producción empresarial

**Alcance**

- Preparar organización/repositorio de GitHub, organización de Supabase y equipo de Vercel de la empresa, con propietarios y facturación definidos.
- Elegir entre transferir proyectos existentes o crear proyectos nuevos y migrar. Revisar requisitos, accesos e integraciones de la opción elegida.
- Decidir el destino de cada conjunto de datos: descartar movimientos de prueba, reconstruir desde el backup o conservar registros aprobados.
- Ensayar la migración del esquema final, funciones, políticas y datos. Incluir usuarios, archivos y configuración si existen; no asumir que un backup de tablas cubre todo.
- Preparar variables de entorno, dominio si se utiliza, enlaces de autenticación y permisos de despliegue desde el GitHub empresarial.
- Definir ventana de cambio, pausa de escrituras, respaldo final, comprobaciones de aceptación y procedimiento de vuelta atrás.
- Acordar si el entorno personal se conserva como beta futura; en ese caso deberá quedar separado de los datos de producción.

**Cierre:** ensayo satisfactorio, datos iniciales y cuentas de producción definidos, y plan concreto de corte y recuperación listo para revisión.

## B7 — Pase a producción y traspaso

**Alcance**

- Ejecutar el plan de corte aprobado, evitando escrituras simultáneas en dos bases durante la migración.
- Transferir o migrar el repositorio a GitHub empresarial y verificar el historial y los permisos.
- Transferir o migrar Supabase a la organización empresarial y comprobar datos, políticas, funciones y cuentas.
- Transferir o publicar la web en Vercel empresarial, apuntando al Supabase definitivo y al repositorio correcto.
- Validar el circuito operativo, las sesiones, los enlaces y los totales antes de abrir el uso habitual.
- Confirmar propiedad empresarial de proyectos y dominio, si corresponde; revisar accesos personales y credenciales según el traspaso elegido.
- Retirar o separar los entornos de beta después de aceptar producción y de conservar los respaldos necesarios.
- Documentar recuperación, actualizaciones y responsables; seguir las primeras operaciones reales para detectar incidencias.

**Cierre:** GitHub, Supabase y Vercel bajo control de la empresa; aplicación validada en producción, con datos iniciales aceptados y recuperación documentada.

## Pendientes conservados para priorizar

Estos puntos no se pierden al sustituir el roadmap anterior. Su inclusión en beta dependerá de su impacto y del alcance acordado:

- Ayuda de reglas y métricas para usuarios.
- Normalizar RAM/ROM en detalle_pedido conservando compatibilidad con el JSON de observaciones.
- Decidir si se recuperan gráficos configurables; sus registros remotos siguen existiendo.
- Adaptación de diálogos largos y manejo consistente del foco.
- Ampliar validación de contenido y paginación de PDF.
- Revisar los avisos históricos de dependencias con un audit actualizado; no tratarlos como diagnóstico vigente sin comprobarlo.

## Seguimiento de los sprints

Al iniciar un sprint se detallarán sus tareas y decisiones pendientes. Al cerrarlo se actualizarán [las reglas](REGLAS-APP.md), las especificaciones afectadas y [el historial](historico-proyecto.md), registrando pruebas, limitaciones y versión. Un cambio de alcance debe quedar reflejado aquí.

Este roadmap no inicia ahora cargas, borrados, creación de usuarios, despliegues, transferencias ni migraciones.
