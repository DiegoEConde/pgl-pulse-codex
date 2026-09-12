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
