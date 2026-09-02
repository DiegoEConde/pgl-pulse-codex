# Arquitectura frontend inicial

## Objetivo

Esta estructura convierte el mockup aprobado en una aplicación Next.js real, manteniendo la integración de datos fuera de alcance hasta finalizar y aprobar las pantallas.

## Capas

- `app/`: entrada, layout y estilos globales.
- `components/core/`: AppShell, Header, Navigation y selección de pantalla.
- `components/ui/`: piezas visuales reutilizables sin reglas de negocio.
- `components/features/`: pantallas y componentes propios de cada módulo.
- `contexts/`: estado global puramente visual.
- `config/`: navegación y configuración estática.
- `lib/mock/`: datos ficticios reemplazables posteriormente por servicios.
- `types/`: contratos compartidos de TypeScript.

## Módulos previstos

1. Inicio
2. Compras
3. Ventas
4. Reparto
5. Stock
6. Datos
7. Reportes

## Restricciones actuales

- Sin Supabase.
- Sin variables de entorno.
- Sin persistencia.
- Los números del Dashboard son demostrativos.
- La Unidad física continúa siendo la referencia central del dominio.

## Integración futura

Cuando las pantallas estén aprobadas, `lib/mock` podrá ser sustituido por una capa de servicios y repositorios conectada a Supabase, sin mover responsabilidades de datos a los componentes visuales.

## Contrato Compras → Reparto

`PurchasesContext` separa `todayOrders` de `orderHistory` y expone `finalizeDailyOrders()`.

Cuando Reparto implemente la validación del cierre diario deberá invocar esa acción una sola vez. La acción:

1. mueve todos los pedidos del día al historial;
2. vacía la lista operativa de pedidos del día;
3. conserva el historial completo en memoria;
4. permite que Compras muestre únicamente los 10 registros más recientes.

Compras no ejecuta el cierre por sí misma. La autoridad para finalizar el día pertenece al módulo Reparto.
