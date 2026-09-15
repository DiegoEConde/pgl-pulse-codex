# Opciones de compra — 2026-09-14

## Entrega local

- Modal sin recepción estimada ni envío. Producto del catálogo; selectores de color y variantes; cantidad, costo unitario, agregar productos y observaciones conservados.
- Cargar en Reparto guarda BORRADOR, ya visible en Repartos, y vuelve al listado. No crea unidades ni confirma estados.
- compra_opcion define clave, etiqueta y valores por categoría; categoria='*' aplica globalmente. producto_id sustituye la opción para un modelo. Colores y memorias iniciales son una lista general editable, no combinaciones comerciales certificadas.
- Celulares: RAM/ROM. Consolas: Física, Digital, Pro, Edición especial. Notebooks y otras categorías quedan listas para configurar después.
- detalle_pedido.atributos permite variantes diferentes del mismo producto/color; duplicados exactos se rechazan. Se conservan las observaciones antiguas. Recepción propone RAM y variante desde la línea.
- Fecha estimada nueva nula y envío cero provisional hasta definir su cálculo; sin reescribir datos históricos.

## Activación remota verificada

Acceso administrativo por CLI confirmado el 2026-09-14 al proyecto hxoofxapwgebihkyuvrv. B2 ya existía en remoto y se verificó sin reejecutarlo. Aplicada purchase_options y registradas ambas versiones en el historial. Integración SQL y prueba de opciones con rol anon aprobadas en Supabase, con ROLLBACK. Datos previos verificados por hashes. App en localhost:3100 comprobada contra el snapshot real: colores y RAM/ROM visibles, botón Cargar en Reparto habilitado; navegador sin escrituras. Las pruebas transaccionales pueden avanzar secuencias. No se validó concurrencia entre conexiones.

## Verificación

PostgreSQL en memoria: migraciones, fecha nula, variantes del mismo producto/color, reintentos, opciones inválidas y atomicidad. Navegador con REST interceptado: celulares, consolas, cambio de categoría, múltiples líneas, recarga, móvil y base sin migrar. Sin escrituras remotas.
