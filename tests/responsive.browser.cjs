const assert = require("node:assert/strict");
const { chromium } = require(process.env.PGL_PLAYWRIGHT_PATH || process.env.TEMP + "/pandasoft-validation/node_modules/playwright");
const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
const snapshot = {
  products: [{ id: 1, nombre: "Samsung Galaxy Ultra 256 GB", marca: "Samsung", categoria: "Celulares" }],
  suppliers: [{ id: 1, nombre: "Proveedor internacional de prueba" }],
  clients: [{ id: 1, nombre: "Cliente de prueba con nombre extenso", direccion: "Avenida de prueba 1234, departamento 10", localidad: "Buenos Aires", telefono: "1155555555" }],
  sellers: [{ id: 1, nombre: "Vendedor de prueba", porcentaje_comision: 5 }],
  orders: [], lines: [], units: [], charts: [],
};
for (let id = 1; id <= 40; id++) {
  snapshot.orders.push({ id, proveedor_id: 1, fecha_pedido: day + "T12:00:00-03:00", fecha_estimada: day, estado: "RECIBIDO", costo_envio_usd: 5, cerrado_en: id % 2 ? null : day + "T12:00:00Z" });
  snapshot.lines.push({ id, pedido_id: id, producto_id: 1, color: "Negro", cantidad: 1, precio_costo_usd: 800 });
  snapshot.units.push({ id, pedido_id: id, producto_id: 1, cliente_id: 1, vendedor_id: 1, estado: id % 3 === 0 ? "STOCK" : id % 3 === 1 ? "REPARTO" : "ENTREGADA", codigo: "IMEI-123456789012345-" + id, color: "Negro", variante: "256 GB", ram: "12 GB", precio_sugerido_usd: 1000, precio_costo_usd: 800, costo_envio_usd: 5, precio_venta_usd: 1000, comision_usd: 50, fecha_ingreso_stock: day + "T12:00:00Z", fecha_venta: id % 3 ? day + "T12:00:00Z" : null, fecha_entrega: day + "T12:00:00Z", pago_verificado: false });
  snapshot.charts.push({ id: String(id), title: "Informe de prueba numero " + id, dimension: "category", metric: "sales", chart_type: "bar", state: "TODOS" });
}
(async () => {
  const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    // All data is intercepted: this test never creates records in Supabase.
    await page.route("**/rest/v1/rpc/pgl_snapshot", route => route.fulfill({ json: snapshot }));
    await page.goto(process.env.PGL_TEST_URL || "http://localhost:3000", { waitUntil: "networkidle" });
    await page.waitForTimeout(3500);
    for (const [width, height] of [[1440,900], [1280,720], [1024,600], [768,1024], [820,600], [390,844]]) {
      await page.setViewportSize({ width, height });
      for (const name of ["Inicio", "Compras", "Ventas", "Reparto", "Stock", "Datos", "Reportes"]) {
        const menu = page.getByRole("button", { name: /Abrir men/ });
        if (await menu.isVisible()) await menu.click();
        await page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
        if (name === "Datos") await page.getByRole("button", { name: /^Clientes/ }).click();
        const tabs = page.getByRole("tab");
        for (let index = 0; index < Math.max(1, await tabs.count()); index++) {
          if (await tabs.count()) await tabs.nth(index).click();
          await page.waitForTimeout(200);
          const check = async () => {
            const size = await page.evaluate(() => ({ w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }));
            assert.ok(size.sw <= size.w + 1 || width <= 740, `${name}/${index}: horizontal ${JSON.stringify(size)}`);
            if (width > 740) assert.ok(size.sh <= size.h + 1, `${name}/${index}: vertical ${JSON.stringify(size)}`);
          };
          await check();
          const next = page.getByRole("button", { name: "Página siguiente", exact: true });
          if (width > 740 && await next.count() && await next.isEnabled()) {
            const before = await page.locator('.workspace-tabpanel:not([hidden]) tbody, .view > .panel tbody').first().innerText();
            await next.click();
            await page.waitForTimeout(200);
            await check();
            const after = await page.locator('.workspace-tabpanel:not([hidden]) tbody, .view > .panel tbody').first().innerText();
            assert.notEqual(after, before, "La siguiente página debe mostrar otros registros");
          }
        }
      }
      console.log(`OK ${width}x${height}`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });