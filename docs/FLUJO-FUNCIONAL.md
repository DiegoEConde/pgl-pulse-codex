# Flujo funcional del programa

Definido y aclarado por el usuario el 2026-09-13. Esta es la referencia funcional para las próximas mejoras. Describe el comportamiento solicitado, no una certificación de lo que ya está implementado. Las dudas se mantienen abiertas y no se completan por suposición.

El programa administra datos operativos, estados y saldos de operaciones. No lleva control real de caja ni requiere cierre diario. Registrar pagos totales, parciales o pendientes sirve para conocer deudas y estados; no implica incorporar un cierre contable.

## 1. Acceso e Inicio

- El usuario abre el programa e inicia sesión con nombre de usuario y contraseña propios.
- Todos los usuarios son administradores y pueden realizar todas las funciones. La identidad individual no introduce diferentes niveles de permisos.
- Inicio muestra la información relevante del día: pendientes, productos en stock, unidades sin IMEI, sin cliente, en reparto y otras alertas operativas que se definan.
- La alerta de unidades en reparto permite acceder a su recepción en la oficina.
- La restricción de no modificar operaciones finalizadas se aplica también a los administradores; tener acceso a todas las funciones no elimina las reglas del flujo.

## 2. Creación de compras

- El usuario registra una o varias compras a un proveedor.
- Los pedidos se incorporan a Repartos, ordenados según los horarios de los proveedores.
- Las unidades todavía no se crean al registrar la compra: se crean al generar el reparto.

## 3. Generación de reparto y pago al proveedor

- Al generar el reparto se abre un modal por cada pedido a proveedor existente, mostrando el importe total de ese pedido.
- El modal desglosa el total del pedido y la deuda previa pendiente con ese proveedor, y muestra su suma como importe propuesto a enviar. El usuario puede validar esa cantidad o indicar lo que realmente paga: total, una parte o nada. Mostrar la propuesta no registra un pago automáticamente.
- Si hay varios pedidos del mismo proveedor, debe evitarse contabilizar o proponer pagar dos veces la misma deuda. La distribución de un abono entre deuda anterior y pedido nuevo queda por definir.
- El importe pendiente permite conocer la deuda por proveedor en Inicio y en las estadísticas.
- Al generar el reparto se crean las unidades físicas, que pasan a estado **En reparto** y aparecen en el centro de alertas.
- En este flujo, **En reparto** identifica el traslado de unidades compradas desde los proveedores hacia la oficina. No debe confundirse con la entrega de una venta al cliente.
- Debe precisarse el momento exacto de confirmación del conjunto de modales, el tratamiento de una generación interrumpida y cómo evitar incluir pedidos ya generados. No se ha definido todavía si la confirmación es por pedido o por reparto completo.
- La exportación de texto para WhatsApp existente no fue redefinida por esta explicación; debe revisarse su convivencia con el nuevo flujo antes de modificarla.

## 4. Recepción en la oficina

- Cuando llegan las unidades, el usuario accede a Inicio y pulsa la tarjeta de alerta de unidades en reparto.
- El modal de recepción permite marcar cada unidad mediante una casilla.
- Las unidades marcadas pasan a **En stock**, aparecen en Stock y quedan disponibles para venderse.
- Las unidades no marcadas se retiran del reparto y se eliminan del ingreso previsto. No quedan automáticamente pendientes de otra recepción.
- El importe a pagar correspondiente a esas unidades se anula y deja de formar parte de la deuda con el proveedor.
- Si al generar el reparto se había indicado que se pagaba todo el pedido, antes de eliminar una unidad no recibida se confirma si efectivamente se pagó esa unidad.
- Si no se pagó, se elimina la obligación correspondiente. Si se pagó pero no se recibió, el importe queda como **saldo a favor con ese proveedor**.
- También cuando el pedido tenía un pago parcial, antes de retirar cada unidad no recibida se pregunta cuánto se abonó por ella. La parte no pagada anula deuda y la parte pagada queda como saldo a favor con el proveedor.
- Sigue pendiente definir cómo se aplica posteriormente el saldo a favor.
- Falta definir el tratamiento del envío al excluir unidades y si el modal agrupa un pedido o todo el reparto; la selección por unidad ya está confirmada.

## 5. Creación de ventas

- El usuario vende unidades que ya se encuentran en stock.
- Al crear la venta registra cuánto se abona: total, parcial o nada.
- Si el pago es total, la venta se considera **Finalizada**. El usuario aclara que no existe la modalidad de pago completo sin retiro: no debe agregarse un estado para ese caso.
- Si no se paga el total, el usuario elige entre **Entregado/No pago** y **Pendiente de retirar**.
- **Entregado/No pago** incluye tanto la falta total de pago como los pagos parciales de una unidad entregada. Se muestran el importe abonado y el saldo por abonar, sin crear estados adicionales.
- Los pagos restantes se registran mediante el acceso rápido desde Inicio descrito en la sección 8. La situación de entrega es otro avance de la operación; su control concreto sigue pendiente de definir.
- El estado de la venta y el estado físico de la unidad deben documentarse por separado; no se ha definido todavía el nombre del estado de la unidad mientras su venta está pendiente.

## 6. Edición y cancelación de ventas pendientes

- Las ventas en Entregado/No pago o Pendiente de retirar pueden cancelarse desde su edición.
- Una venta ya creada no se corrige reescribiendo sus datos; para revertirla se cancela.
- Al cancelar, la unidad vuelve a **Stock** y la venta deja de quedar registrada, conforme a la indicación del usuario de que «nada quede registrado» de esa venta.
- Si existía un importe abonado, se descuenta al cancelar. También se revierte la contribución de esa venta a las ganancias, comisiones y demás totales afectados; no debe continuar apareciendo como una venta válida en las estadísticas ni conservar una deuda de cliente por cobrar.
- Esta regla describe la eliminación del efecto de la venta en el administrador de datos, no una transferencia o devolución bancaria realizada por el programa. No se incorpora un historial visible de ventas canceladas por iniciativa propia.
- La devolución a stock por cancelación de una venta pendiente es la excepción explícita a la regla general de no retroceder estados.
- Si la unidad ya fue entregada, falta precisar cómo confirma el usuario que volvió físicamente antes de que pueda ofrecerse otra vez en stock.
- La cancelación no se extiende a ventas Finalizadas: estas solo admiten modificación de IMEI.

## 7. Finalización e información editable

- Una venta Finalizada no puede modificarse, excepto su IMEI.
- Una venta creada no admite cambios retrospectivos de sus datos; para revertirla debe cancelarse mientras permanezca pendiente.
- Las unidades no pueden retroceder de estado ni modificar hacia atrás su información, salvo la devolución a stock por cancelación de una venta pendiente expresamente descrita arriba.
- El IMEI es el único dato siempre editable.
- Completar un pago o avanzar una entrega debe distinguirse de cambiar los datos originales de la venta. El acceso rápido para abonos está confirmado en la sección 8; queda por precisar el control para avanzar la entrega.
- Todavía debe precisarse en qué etapa se completan los datos faltantes de la unidad distintos del IMEI, antes de que queden fijados.

## 8. Pagos sucesivos y alertas en Inicio

- Inicio muestra alertas de saldos pendientes de clientes y proveedores con un botón para registrar un pago. Un clic abre la acción para ingresar el importe; no implica saldar automáticamente la deuda.
- Se admiten tantos abonos sucesivos como sean necesarios. Cada abono actualiza el acumulado pagado y el saldo pendiente, conservando el historial de importes abonados de la operación vigente.
- Ejemplo: una venta de 100 recibe 40, luego 40 y finalmente 20. Se muestran acumulados de 40, 80 y 100, y pendientes de 60, 20 y 0. Mientras falte dinero y esté entregada, continúa en **Entregado/No pago**; al completar el pago queda **Finalizada**, respetando que no hay pago total sin retiro.
- Los pagos posteriores a proveedores también actualizan su deuda. Al generar un nuevo reparto, el modal incorpora la deuda previa según la sección 3.
- Registrar abonos no permite reescribir los datos originales de la venta ni introduce un cierre diario.

## Transiciones confirmadas y puntos abiertos

| Elemento | Evento | Resultado |
| --- | --- | --- |
| Pedido de compra | Registro | Pendiente en Repartos, ordenado por horario del proveedor; todavía sin crear unidades. |
| Unidades compradas | Generar reparto | Se crean en En reparto y aparecen en alertas. |
| Unidad marcada en recepción | Confirmar desde Inicio | En stock, visible y disponible para venta. |
| Unidad no marcada y no pagada | Confirmar recepción | Se retira y se elimina su importe de la deuda al proveedor. |
| Unidad no marcada pero pagada | Confirmar pago de esa unidad antes de retirarla | Se retira y queda saldo a favor con el proveedor. |
| Venta | Pago total | Finalizada; no se contempla pago completo sin retiro. |
| Venta con unidad entregada | Pago parcial o inexistente | Entregado/No pago, mostrando abonado y pendiente. |
| Venta sin retiro | Pago incompleto o inexistente | Pendiente de retirar. |
| Venta pendiente | Cancelación | Unidad vuelve a Stock; desaparece la venta y se revierten sus importes y efectos estadísticos. |
| Venta finalizada | Edición | Solo IMEI. |

## Aclaraciones necesarias antes de implementar

1. Pagos al proveedor: cómo distribuir un abono entre deuda anterior y pedido nuevo, especialmente si existen varios pedidos del mismo proveedor.
2. Saldo a favor del proveedor: cómo se aplica a una compra posterior o se registra su devolución.
3. Cancelación de una venta entregada: cómo se confirma la devolución física antes de reponer stock.
4. Datos faltantes de las unidades: momento de completarlos antes de quedar inmutables, excepto IMEI.
5. Estado y disponibilidad de la unidad al crear una venta pendiente, para evitar que vuelva a venderse mientras está reservada, y control para confirmar su retiro posterior.
6. Recepción: agrupación del modal y tratamiento del costo de envío de unidades excluidas.

Ya están confirmados los abonos sucesivos desde alertas de Inicio, la propuesta de pedido más deuda previa del proveedor y la consulta del importe pagado por cada unidad excluida de un pedido parcialmente pagado. Tampoco se reabren las reglas de ausencia de pago total antes del retiro, parciales dentro de Entregado/No pago, cancelación con reversión de importes y recepción mediante casillas.

## Relación con los documentos y el código actuales

Este flujo tiene prioridad para diseñar las mejoras. [REGLAS-APP.md](REGLAS-APP.md) documenta principalmente el código de alpha y debe actualizarse al implementar cada cambio. Las diferencias no se consideran implementadas por el hecho de registrarlas aquí.

Cambios importantes respecto de alpha:

- Cuentas individuales con las mismas facultades administrativas, en lugar de acceso sin sesión.
- Creación de unidades al generar reparto, en lugar de crearlas al recibir.
- En reparto referido a compras en traslado, no a ventas.
- Recepción desde las alertas de Inicio.
- Deuda por proveedor a partir de pagos totales, parciales o nulos al generar reparto.
- Ventas pendientes cancelables y ventas finalizadas inmutables salvo IMEI.
- Sin cierre diario.

El [roadmap beta](ROADMAP.md) distribuye estas reglas en sprints cortos, con revisión del usuario entre entregas. B1 corrige la visibilidad de pendientes en Repartos; las demás reglas se implementarán en sus sprints, resolviendo antes las dudas que afecten a cada uno.
