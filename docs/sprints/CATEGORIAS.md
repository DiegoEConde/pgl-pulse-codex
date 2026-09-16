# Categorias y caracteristicas

Alcance acordado el 2026-09-15: categorias relacionadas con productos y
caracteristicas obligatorias por categoria. En Compras se permite crear productos
y agregar valores a caracteristicas existentes, sin crear campos nuevos.

Potencia: entero de 2 a 350 W. Televisores: la ultima medida es 100 pulgadas.
Las categorias sin caracteristicas no solicitan color ni memoria.
La migracion conserva pedidos y unidades historicos.

## Implementacion

- `categorias`: 15 categorias solicitadas. `producto.categoria_id` es la FK;
  `producto.categoria` se conserva y sincroniza para consumidores anteriores.
- `categoria_caracteristica`: 22 campos con tipo, obligatoriedad, lista de valores
  o limites numericos. RAM/almacenamiento usan GB y TB; las listas se ordenan por
  capacidad. Colores: Negro, Blanco, Gris, Plata, Dorado, Azul, Rojo, Verde, Rosa,
  Violeta. No se supone compatibilidad comercial por modelo.
- Todas las caracteristicas definidas son obligatorias. Audio admite potencia
  entera entre 2 y 350. Las cinco categorias sin caracteristicas solo piden el
  producto, cantidad y costo en la compra.
- Compras permite crear productos con categoria y nombre (marca opcional), y
  agregar valores a listas existentes. No permite crear campos ni categorias.
  Las altas conservan el borrador; valores repetidos no se duplican.
- `pgl_create_product` y `pgl_add_category_value` validan las altas; las tablas de
  configuracion no permiten escrituras directas al rol anon.
- `compra_opcion` queda archivada, sin consumidores activos. Los atributos y
  colores de pedidos anteriores no se reescriben. Las compras nuevas sin color
  guardan cadena vacia en la columna historica.
- Repartos, detalle y recepcion muestran GB/TB, potencia y pulgadas sin duplicar
  unidades ni ocultar almacenamiento cuando tambien hay un modelo de consola.

## Verificacion

25 pruebas de logica, lint, TypeScript y compilacion aprobados. PostgreSQL local
con las migraciones reales: campos obligatorios de las 15 categorias, potencia,
normalizacion, duplicados, atomicidad, permisos y regresion de cobros/recepcion.
La base local reproduce los permisos predeterminados amplios de Supabase.

Navegador: compras de las 15 categorias contra PostgreSQL en memoria, alta de
producto y valor, conservacion del borrador, recarga, escritorio/movil y base sin
migrar. Regresion de Compras/Repartos aprobada en seis resoluciones. Capturas en
`tests/artifacts/categories-1440.png` y `categories-390.png`.

Migraciones `20260915000100_categories.sql` y
`20260915000200_category_permissions.sql` aplicadas en Supabase. La segunda
revoca explicitamente los permisos predeterminados de tablas y secuencias.
Comparacion por hashes: productos anteriores, pedidos, lineas, unidades, abonos y
configuracion archivada intactos. Formulario comprobado con snapshot real y
escrituras bloqueadas desde el navegador.

Prueba transaccional de categorias aprobada tambien en Supabase con rol anon y
ROLLBACK; las secuencias pueden avanzar. Ambas versiones quedaron registradas en
el historial remoto. Los hashes se comprobaron de nuevo despues de las pruebas.

No se valida concurrencia entre conexiones PostgreSQL en las pruebas locales.
No se inicio B3 ni se publico una version web.
