# PGL Pulse

Gestión de compras, unidades físicas, ventas y repartos para PGL Electrónica. Aplicación Next.js con datos compartidos en Supabase.

## Ejecutar

Usar Node.js 22 (versión utilizada en las validaciones) y npm. Copiar `.env.example` a `.env.local` y completar la URL y la clave publicable del proyecto.

```powershell
npm ci
npm run dev
```

Abrir http://localhost:3000. Para producción local: `npm run build` y luego `npm run start`.

## Guía del proyecto

- [Flujo funcional acordado](docs/FLUJO-FUNCIONAL.md): funcionamiento solicitado para las próximas mejoras y aclaraciones pendientes.
- [Reglas implementadas en alpha](docs/REGLAS-APP.md): dominio, estados y cálculos del código actual.
- [Roadmap](docs/ROADMAP.md): decisiones y mejoras pendientes.
- [Arquitectura](docs/ARQUITECTURA-FRONTEND.md): carpetas, flujo de datos y dónde modificar cada responsabilidad.
- [Supabase](docs/REVISION-SUPABASE.md): acceso, migraciones y límites de la integración.
- [Reportes](docs/REPORTES.md), [Repartos](docs/REPARTO.md) y [responsive](docs/RESPONSIVE.md): especificaciones de cada área.
- [Pruebas](tests/README.md): ejecución, cobertura y archivos generados.
- [Historial](docs/historico-proyecto.md): hitos y decisiones relevantes.

## Verificación rápida

```powershell
npm test
npm run lint
npm run build
npx tsc --noEmit --incremental false
```

Con un servidor iniciado, `npm run test:browser` ejecuta las tres pruebas de navegador. Consultar los requisitos de Playwright y Edge en la guía de pruebas.
