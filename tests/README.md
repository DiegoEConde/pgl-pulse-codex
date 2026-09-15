# Pruebas

Ejecutar desde la raíz. Node.js 22 es la versión usada en la validación local.

## Lógica y compilación

```powershell
npm test
npm run lint
npm run build
npx tsc --noEmit --incremental false
```

Las pruebas de lógica cargan los módulos TypeScript con el compilador ya incluido en el proyecto. Cubren fechas, costos derivados, compatibilidad de RAM/ROM, reparto y filtros/cálculos de Reportes.

## Navegador

Los scripts actuales usan Playwright y Microsoft Edge en Windows. Playwright se resuelve desde `PGL_PLAYWRIGHT_PATH` o, por compatibilidad con el entorno local, desde `$env:TEMP/pandasoft-validation/node_modules/playwright`. Edge se busca en `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`.

Si falta Playwright, se puede instalar en una carpeta externa al repositorio:

```powershell
npm install --prefix "$env:TEMP/pandasoft-validation" playwright
```

Configurar las variables de `.env.local` para que el cliente de la app pueda inicializarse. Las solicitudes REST de estas pruebas se interceptan y usan datos simulados; no escriben en Supabase.

Iniciar el servidor en otra terminal (preferiblemente después de build):

```powershell
npm run start -- --port 3100
```

Luego ejecutar:

```powershell
$env:PGL_TEST_URL='http://localhost:3100'
npm run test:browser
```

Sin PGL_TEST_URL se usa http://localhost:3000.

| Script | Cobertura |
| --- | --- |
| `delivery.browser.cjs` | Compras simuladas, RAM/ROM, recarga, agrupación por proveedor, paginación y copia al portapapeles. |
| `reports.browser.cjs` | Métricas, períodos históricos, filtros, modales, vendedores y descarga de PDF. |
| `responsive.browser.cjs` | Siete pantallas, pestañas y paginación en seis resoluciones. |

Los scripts de Repartos y Reportes guardan capturas y PDF en `tests/artifacts/`. Son resultados regenerables e ignorados por Git; pueden borrarse sin perder código de pruebas. La comprobación PDF actual valida descarga, cabecera y tamaño básico, no todo su contenido visual.

## Supabase y cobertura pendiente

`supabase/tests/integration.sql` comprueba las RPC con rol anon dentro de una transacción terminada en ROLLBACK. Ejecutarlo en un entorno de prueba al modificar el esquema; las secuencias pueden avanzar. No forma parte de npm test y no se ejecutó durante esta limpieza.

El antiguo integration.browser.cjs dependía de controles retirados y se eliminó. Falta reconstruir el circuito completo con la interfaz definitiva. No confundir las pruebas simuladas actuales con una validación completa contra la base remota.

## B2: abonos de ventas

Instalar PostgreSQL embebido fuera del repositorio:

```powershell
npm install --prefix "$env:TEMP/pandasoft-validation" @electric-sql/pglite
npm run test:payments
```

También se admite PGL_PGLITE_PATH con la ruta del paquete. La base se crea en memoria; las migraciones del repositorio y supabase/tests/integration.sql se ejecutan contra esa base local. No usa credenciales ni escribe en Supabase. La prueba no simula varias conexiones PostgreSQL simultáneas.

payments.browser.cjs forma parte de test:browser y admite PGL_TEST_URL. Intercepta REST para probar abonos, respuesta perdida, recuperación de conexión, retiro, móvil, recarga e interfaz sin migración. Genera tests/artifacts/b2-payments-mobile.png.


## Opciones de Compras

payments.database.cjs aplica también las migraciones posteriores a B2: variantes, fecha nula, opciones inválidas, duplicados y atomicidad. delivery.browser.cjs cubre categorías, múltiples variantes, recarga, móvil y base sin migrar. Sin escrituras remotas.


Validación remota realizada el 2026-09-14 con la CLI autenticada: supabase/tests/integration.sql y supabase/tests/purchase_options.sql. Ambas usan transacción y ROLLBACK; las secuencias pueden avanzar. Verificado también el formulario en localhost:3100 contra el snapshot real, sin enviar escrituras desde el navegador.
