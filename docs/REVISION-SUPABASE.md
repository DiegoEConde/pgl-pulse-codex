# Integración con Supabase — estado y revisiones

Proyecto: `hxoofxapwgebihkyuvrv`.

## Estado vigente — 2026-09-12

La integración con Supabase sigue operativa. Las validaciones detalladas más abajo corresponden al 10 de septiembre y son históricas; no describen todas las pantallas actuales.

- Repartos cerrado y publicado en GitHub hasta el commit 8fd2d88. Estado y reglas: [REPARTO.md](REPARTO.md).
- Reportes implementado, con cierre técnico validado el 12 de septiembre y revisión visual pendiente con el usuario: [REPORTES.md](REPORTES.md). Incluye selectores históricos, semestre móvil, PDF y resumen de vendedores.
- Catálogos de prueba cargados: Jacinto (15–16), Roman (14–16), Anselmo (10–20), con contactos ficticios; iPhone 15, Galaxy A55, Edge 50 y Redmi Note 13. La limpieza de tablas documentada más abajo ocurrió antes de esa carga; no implica que la base esté vacía actualmente.
- No hubo nuevas migraciones en estos sprints. RAM/ROM de compras se guardan mediante la compatibilidad documentada en REPARTO.md.
- Las acciones de pago/entrega/cierre conservan sus funciones remotas, pero sus antiguos controles ya no están en Repartos. tests/integration.browser.cjs necesita adaptarse antes de volver a validar el circuito completo actual.
- Próxima sesión: continuar la revisión de Reportes. Resumen de cierre en [historico-proyecto.md](historico-proyecto.md).

## Revisión histórica — 2026-09-10

## Estado en la revisión original

La integración operativa está implementada y validada. Este documento reemplaza el estado anterior, que solo describía catálogos con inicio de sesión.

La aplicación funciona sin cuentas: usa el rol `anon` y la clave publicable de `.env.local`. Las políticas permiten leer los datos y crear/editar catálogos sin autenticación. Las operaciones de compras, stock y ventas se ejecutan mediante funciones transaccionales. Este modelo da acceso compartido a quien disponga de la URL y la clave publicable; no hay permisos individuales ni aislamiento por usuario. RLS permanece habilitado, con políticas para ese acceso compartido.

## Implementado

- Datos: alta, edición y lectura persistentes de productos, proveedores, clientes y vendedores; IDs generados por PostgreSQL.
- Compras: borradores con líneas de producto/color/cantidad/costo, confirmación, envío y recepción. Prorrateo exacto del costo de envío entre unidades.
- Stock: unidades recibidas con código/IMEI, variante, RAM y precio sugerido opcional; edición persistente.
- Ventas: fecha operativa de Buenos Aires, cliente, vendedor, importes y reserva atómica de una unidad disponible.
- Reparto: verificación de pago, confirmación de entrega y cierre diario persistentes.
- Inicio y Reportes: métricas de datos reales, gráficos guardados en Supabase y exportación CSV.
- Lectura conjunta mediante `pgl_snapshot`, actualización manual y periódica; estados de carga y error.

## Migraciones

Las cuatro migraciones locales están aplicadas en la base. Supabase les asignó estas versiones:

| Archivo local | Versión remota |
| --- | --- |
| `20260909000100_initial_schema.sql` | `20260910003810` |
| `20260909000200_catalog_access.sql` | `20260910004155` |
| `20260909000300_program_without_accounts.sql` | `20260910005350` |
| `20260909000400_optional_stock_price.sql` | `20260910010558` |

La tercera migración reemplaza los permisos con cuentas de la segunda y agrega las operaciones y `reporte_config`. No se deben volver a aplicar las migraciones ya instaladas. Los tipos se conservan en `lib/supabase/types.ts`.

## Validación completada

- `node --test tests/operations.test.cjs`: cuatro pruebas aprobadas (fechas, pérdidas, filtros y totales).
- `npm run lint`: sin errores ni advertencias. La regla de imports CommonJS se exceptúa únicamente para los tests `.cjs`.
- `npx tsc --noEmit --incremental false`: aprobado.
- `npm run build`: compilación de producción aprobada.
- `supabase/tests/integration.sql`: aprobado con rol `anon` y `ROLLBACK`; cubre idempotencia, recepción atómica, prorrateo, reserva, pago, entrega, cierre y restricciones de escritura directa.
- `node --env-file=.env.local tests/integration.browser.cjs`: circuito completo aprobado en Edge, con persistencia tras recargar y CSV con comillas escapadas.
- Dos ventas concurrentes de la misma unidad: exactamente una aceptada.
- Las siete pantallas no desbordan horizontalmente a 390 px. El ajuste de Reportes ya estaba guardado al retomar; se verificó con datos reales de prueba.

Resultado de navegador: `tests/integration-result.json`, con `success: true`. Captura: `tests/integration-mobile.png`. La captura `tests/integration-failure.png` pertenece a la ejecución anterior.

Los registros de esta ejecución (`PGL-E2E-1789081428873`) se eliminaron al terminar. Se verificó que las ocho tablas quedaron vacías. Las secuencias pueden haber avanzado. El script de navegador crea datos persistentes y ejecuta el cierre del día: usar una base de prueba y limpiar sus registros identificados al terminar.

## Ejecutar y continuar

1. Configurar `.env.local` siguiendo `.env.example` si se trabaja en otro equipo. Usar la clave publicable; no colocar claves secretas ni `service_role` en el frontend.
2. Ejecutar `npm run dev` y abrir http://localhost:3000. Para repetir el navegador con su URL predeterminada, iniciar con `npm run dev -- --port 3100`.
3. Cargar los catálogos desde Datos y comenzar el circuito de Compras.

No quedan fallos pendientes de las validaciones anteriores. No se realizó despliegue ni commit en esta revisión. El siguiente paso operativo es cargar los catálogos reales y probar el uso habitual con el usuario.
