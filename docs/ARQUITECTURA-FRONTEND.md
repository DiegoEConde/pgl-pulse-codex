# Arquitectura de PGL Pulse

Estado revisado: 2026-09-12. Next.js App Router, React, TypeScript y Supabase. La interfaz tiene siete pantallas dentro de una única página; `AppContext` controla la navegación local.

## Carpetas

| Ruta | Responsabilidad |
| --- | --- |
| `app/` | Entrada, proveedores de contexto y estilos globales. `base.css` contiene la base visual; `globals.css`, los ajustes comunes y responsive. |
| `assets/` | Logo importado por Next Image. |
| `components/core/` | Intro, estructura, navegación, conexión y selección de pantalla. |
| `components/features/` | Pantallas y componentes específicos de cada módulo. |
| `components/ui/` | Encabezados, métricas, pestañas, paginación y layout compartido. |
| `contexts/` | Navegación visual y snapshot compartido de la base. |
| `hooks/` | Ejecución de operaciones, bloqueo de dobles envíos y errores. |
| `config/` | Navegación y campos de catálogos. |
| `lib/` | Transformaciones y reglas de negocio independientes de React; exportación PDF. |
| `lib/supabase/` | Cliente, acceso a catálogos, RPC y tipos del esquema. |
| `types/` | Contratos de navegación y operaciones para la interfaz. |
| `supabase/` | Migraciones aplicadas y prueba transaccional SQL. |
| `tests/` | Pruebas de lógica y navegador; resultados regenerables en `artifacts/`. |
| `docs/` | Reglas vigentes, planificación y seguimiento. |

## Lectura y escritura

1. `ProgramProvider` consulta `pgl_snapshot` al montar, al recuperar foco, cada 30 segundos con la pestaña visible y al actualizar manualmente.
2. `deriveOperations` une IDs con catálogos y produce pedidos, ventas y stock para las pantallas. Reportes y Repartos derivan sus propias vistas del mismo snapshot.
3. Una respuesta antigua no reemplaza una actualización posterior: se compara la generación de cada solicitud.
4. Los formularios de operaciones usan `useOperation` y RPC transaccionales. Tras guardar se vuelve a leer el snapshot; no se inventa un resultado local.
5. Datos usa `persistRecord` para altas y edición de los cuatro catálogos. Los formularios y la base validan sus campos; PostgreSQL asigna los IDs.

`AppProvider` envuelve a `ProgramProvider` en el layout. El constructor antiguo de gráficos se retiró porque ninguna pantalla lo montaba. `charts` permanece en el contrato del snapshot y en el esquema remoto por compatibilidad; no hay interfaz actual para esos registros.

## Dónde hacer cambios

- Estados, integridad o operaciones atómicas: nueva migración SQL, tipos y adaptador RPC. No editar migraciones ya aplicadas.
- Cálculos, fechas o agrupaciones: `lib/` y pruebas de lógica correspondientes.
- Campos de catálogos: `config/catalogs.ts`, adaptador y esquema si cambia la persistencia.
- Interfaz de una pantalla: su carpeta de feature y CSS Module. Reutilizar el layout, las pestañas y las tablas compartidas.
- Comentarios: explicar reglas o decisiones no evidentes, sin narrar cada línea. Los tipos de Supabase reflejan el esquema; evitar retoques cosméticos allí.

Las reglas completas están en [REGLAS-APP.md](REGLAS-APP.md). La apariencia y sus límites se documentan en [RESPONSIVE.md](RESPONSIVE.md).
