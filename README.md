# PGL Pulse

Aplicación Next.js basada en el mockup aprobado y la arquitectura centrada en la unidad.

## Ejecutar

```powershell
npm install
npm run dev
```

Abrir http://localhost:3000. El archivo `index.html` se conserva como referencia del mockup; la integración funciona en la aplicación Next.js.

## Supabase

Datos, Compras, Ventas, Reparto, Stock, Inicio y Reportes están conectados a Supabase. La aplicación funciona sin cuentas, con acceso compartido mediante el rol `anon` y operaciones transaccionales.

Copiar `.env.example` a `.env.local` y configurar la URL y la clave publicable si se trabaja en otro equipo.

Ver [estado de integración, acceso y validaciones](docs/REVISION-SUPABASE.md). Las migraciones se conservan en `supabase/migrations`.

## Validar

```powershell
node --test tests/operations.test.cjs
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

La prueba de navegador y sus condiciones de ejecución están documentadas en la revisión de Supabase.
