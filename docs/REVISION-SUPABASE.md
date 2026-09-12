# Supabase: integración y mantenimiento

Proyecto documentado: `hxoofxapwgebihkyuvrv`. Estado del código revisado el 2026-09-12; la limpieza no consultó ni modificó la base remota.

## Acceso y funcionamiento

La aplicación usa la URL y clave publicable de `.env.local`, sin cuentas ni permisos individuales. RLS está habilitado y las políticas permiten el acceso compartido del rol `anon`. Quien dispone de la URL y clave tiene ese acceso; no hay aislamiento por usuario.

Los catálogos se leen y editan directamente según las políticas. Compras, recepción, stock y ventas se guardan mediante funciones transaccionales. `pgl_snapshot` devuelve los catálogos, pedidos, líneas, unidades y configuraciones históricas de gráficos.

Las funciones de pago, entrega y cierre diario siguen en el esquema, pero sus controles ya no están en Repartos. `reporte_config` también se conserva, aunque no tiene interfaz actual. RAM/ROM de las compras utiliza la compatibilidad descrita en [REPARTO.md](REPARTO.md).

## Migraciones aplicadas

Estas versiones fueron verificadas en la sesión de integración del 10 de septiembre. No volver a aplicar ni reescribir las migraciones instaladas; los cambios futuros necesitan una nueva migración.

| Archivo local | Versión remota registrada |
| --- | --- |
| `20260909000100_initial_schema.sql` | `20260910003810` |
| `20260909000200_catalog_access.sql` | `20260910004155` |
| `20260909000300_program_without_accounts.sql` | `20260910005350` |
| `20260909000400_optional_stock_price.sql` | `20260910010558` |

La tercera reemplaza el modelo con cuentas de la segunda. Los tipos del esquema están en `lib/supabase/types.ts`. `auditoria-supabase.sql` permite consultar estructura, políticas y permisos sin devolver registros comerciales.

## Evidencia histórica y límites

El 10 de septiembre se validaron transacciones con rol anon y ROLLBACK, idempotencia, recepción completa, prorrateo, reserva de stock, pago, entrega y cierre. Dos ventas concurrentes de la misma unidad produjeron exactamente una venta aceptada.

El antiguo circuito de navegador se aprobó contra la interfaz de ese día. Se retiró en la limpieza porque dependía de controles y exportación CSV eliminados; esa aprobación histórica no certifica las pantallas actuales. La prueba SQL se conserva en `supabase/tests/integration.sql`.

La limpieza de datos de aquella prueba ocurrió antes de cargar los catálogos simulados de las sesiones posteriores. La última nota registra proveedores Jacinto, Roman y Anselmo con contactos ficticios, y cuatro productos de prueba. No asumir que la base está vacía ni que ese listado describe su contenido actual.

Para pruebas locales y su alcance vigente, consultar [tests/README.md](../tests/README.md). Las decisiones pendientes están en [ROADMAP.md](ROADMAP.md).
