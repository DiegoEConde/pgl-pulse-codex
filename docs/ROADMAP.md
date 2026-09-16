# Roadmap beta

Actualizado: 2026-09-13. Referencia alpha: 321542c. Este plan reemplaza la numeración y el alcance anteriores; la implementación descartada queda registrada en el histórico.

## Forma de trabajo

Un sprint por entrega, con un resultado concreto y pequeño. Al terminar se informa qué cambió, cómo probarlo y qué falta; se espera la revisión del usuario antes de iniciar el siguiente. Si un sprint necesita demasiados cambios, se divide antes de implementarlo. No se ejecuta toda la tabla de una vez.

La referencia es [FLUJO-FUNCIONAL.md](FLUJO-FUNCIONAL.md). No hay cierre diario ni control de caja. Todos los usuarios tendrán credenciales propias y facultades de administrador. Las decisiones abiertas se resuelven solo cuando afectan al siguiente entregable.

## Incidencia prioritaria al retomar

**BETA-01 — Compra obliga a confirmar pago y reparto en el mismo recorrido.** Reportada por el usuario el 2026-09-13; pendiente de reproducción y corrección. Revisarla antes de continuar con B3.

- Comportamiento informado: al hacer una compra de producto, la aplicación fuerza a completar la confirmación de pago y la confirmación de reparto a la vez.
- Resultado esperado: registrar la compra sin obligar a completar ambas confirmaciones en ese momento. Respetar las etapas del [flujo funcional](FLUJO-FUNCIONAL.md): compra, generación de reparto con importe enviado (total, parcial o cero) y recepción posterior.
- Al retomar: reproducir los pasos exactos, identificar qué pantalla y controles fuerzan el recorrido y corregirlo con una prueba de regresión. No atribuir todavía la causa a una RPC ni confundir reparto de compras con retiro de una venta.
- Esta anotación no cambia la regla de ventas que exige retiro al completar el pago. No se modifica el programa ahora, por indicación del usuario.

## Sprints operativos

| Sprint | Entregable y aceptación | Estado |
| --- | --- | --- |
| B0 | Alpha recuperable en GitHub, referencia 321542c. | Completado |
| B1 | Pendientes visibles en Repartos aunque tengan cierre histórico; recibidos excluidos y orden por proveedor conservado. Plan beta actualizado. Ver [detalle](sprints/B1.md). | Revisado por el usuario |
| B2 | Cobros parciales en Ventas: importe inicial, abonos sucesivos e historial; ejemplo 100 → 40 + 40 + 20 con saldos 60, 20 y 0. Compatibilidad de ventas anteriores sin inventar pagos históricos. Ver [detalle](sprints/B2.md). | Habilitado y verificado en Supabase; revisión del usuario pendiente |
| B3 | Alertas de cobros en Inicio: un clic abre el registro de importe, actualiza abonado y pendiente y retira la alerta al saldar. | Pendiente |
| B4 | Estados de venta y retiro: Entregado/No pago incluye parciales; Pendiente de retirar mantiene saldo; Finalizada exige pago total y retiro. Sin modalidad de pago total antes de retirar. | Pendiente |
| B5 | Cancelación de venta pendiente: vuelve a Stock, desaparece la venta y se revierten abonos, ganancias y comisiones. Finalizadas inmutables salvo IMEI. | Pendiente |
| B6 | Deuda por proveedor: registrar abonos sucesivos e historial, mostrar saldos en Inicio y estadísticas y acceso rápido al pago. | Pendiente |
| B7 | Pago al generar reparto: modal por pedido con total + deuda previa desglosados; usuario valida o modifica el importe, incluso cero. No duplicar deuda entre pedidos. | Pendiente |
| B8 | Generar reparto crea unidades En reparto una sola vez y activa alerta en Inicio; crear compra todavía no crea unidades. Separar traslado de compras de entrega de ventas. | Pendiente |
| B9 | Recepción desde Inicio: casillas por unidad, marcadas a Stock; no marcadas se retiran. Confirmar importe abonado por cada excluida incluso con pago parcial, anulando deuda no pagada y registrando crédito por lo pagado. | Pendiente |
| B10 | Aplicación de saldo a favor del proveedor y conciliación de deuda, stock, alertas y estadísticas. | Pendiente |
| B11 | Datos de unidades: fijar etapa de completar información; impedir retrocesos salvo cancelación de venta pendiente; IMEI siempre editable. | Pendiente |

Cada cambio de datos persistentes incluirá su migración, compatibilidad y comprobación transaccional antes de considerarse terminado. Un entregable con SQL solo preparado localmente se informará como pendiente de aplicación y validación, no como funcionalidad ya disponible en Supabase.

## Decisiones antes del sprint afectado

- B4–B5: control de retiro y confirmación del retorno físico al cancelar una venta entregada; mantener la unidad reservada para impedir ventas duplicadas.
- B6–B7: distribución del abono entre deuda anterior y pedidos nuevos. No asumir una prioridad de pago ni descontar automáticamente créditos sin definirla.
- B8: confirmación de modales, interrupciones y reintentos; compatibilidad con unidades históricas y copia para WhatsApp.
- B9: agrupación de la recepción y tratamiento del costo de envío de unidades excluidas.
- B10: uso del saldo a favor en próximas compras o registro de devolución.
- B11: momento de completar datos distintos del IMEI.

## Usuarios, datos y publicación

| Sprint | Entregable y aceptación | Dependencia |
| --- | --- | --- |
| B12 | Inicio y cierre de sesión, recuperación y bloqueo de operaciones sin sesión mediante RLS/RPC. Todos los autenticados habilitados son administradores. | B11 revisado |
| B13 | Alta y desactivación de usuarios finales y de prueba con credenciales propias; distinguir cuenta de acceso de vendedor. Comprobar acceso directo a API y sesiones simultáneas. | B12 |
| B14 | Revisar backup del usuario y ensayar restauración en entorno temporal; preparar carga repetible y comprobar qué datos, usuarios y archivos incluye. | B13 |
| B15 | Respaldar estado actual y cargar datos reales en el Supabase actual; conciliar cantidades, relaciones, costos y saldos. Precisar limpieza de datos ficticios antes de ejecutarla. | B14 |
| B16 | Publicar candidato en GitHub y Vercel personal, configurar conexión y sesiones, revisar plan compatible con uso empresarial y probar acceso de testers. | B15 |
| B17 | Primera ronda de pruebas del circuito completo, móvil y escritorio; incidencias con versión y pasos. Corregir por tandas pequeñas y repetir solo cobertura afectada. | B16 |

Se conserva el backup original. No se exige otra base para la beta: se utiliza la actual por decisión del usuario. Definir cómo reconstruir los datos entre rondas y qué movimientos se descartarán evita confundir pruebas con datos que deban conservarse. Las vistas previas de despliegue deben tener un destino de datos explícito.

## Producción en la empresa

| Sprint | Entregable y aceptación | Dependencia |
| --- | --- | --- |
| B18 | Preparar cuentas empresariales de GitHub, Supabase y Vercel; elegir transferencia o migración, propietarios, facturación y destino de datos de prueba. | B17 aprobado |
| B19 | Ensayar migración de esquema, datos, cuentas y archivos; configurar variables, dominio y autenticación. Documentar corte, pausa de escrituras, respaldo y vuelta atrás. | B18 |
| B20 | Ejecutar el traspaso aprobado: repositorio GitHub, Supabase y web Vercel bajo la empresa; validar circuito, sesiones y totales antes del uso habitual. | B19 revisado |
| B21 | Verificar primeras operaciones, documentar responsables y recuperación; separar o retirar beta personal conservando respaldos. | B20 |

La producción usará los datos iniciales acordados: reconstrucción desde backup o conservación de registros aprobados. No se presupone que un backup de tablas incluya usuarios o archivos. Si se mantiene beta personal, quedará separada de producción.

## Pendientes conservados

- Ayuda de reglas y métricas; normalización RAM/ROM conservando compatibilidad con observaciones.
- Decidir si se recuperan gráficos configurables; sus registros remotos siguen existiendo.
- Diálogos largos, foco, contenido y paginación PDF; revisión actualizada de dependencias antes de producción.

Al cerrar cada sprint se actualizan reglas, documentación afectada e histórico con validación y limitaciones. No se publica ni se pasa al siguiente sprint como consecuencia automática de terminar una entrega local.


## Ajuste de Compras — 2026-09-14

[Formulario y opciones por categoría](sprints/COMPRAS-OPCIONES.md) implementados localmente. Aplicado y verificado en Supabase el 2026-09-14, con B2 previamente existente. No se inició B3. Cálculo de envío y opciones definitivas pendientes de la explicación del usuario.

## Categorias y caracteristicas — 2026-09-15

El usuario definio las opciones definitivas: [implementacion](sprints/CATEGORIAS.md).
15 categorias relacionadas con productos y 22 caracteristicas; altas de productos
y valores desde Compras. Aplicadas las migraciones de categorias y permisos en
Supabase, conservando los datos anteriores. Calculo de envio aun pendiente; B3
no iniciado. Esta entrega queda para revision del usuario.
