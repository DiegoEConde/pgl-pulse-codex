const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path) {
 const exports = {};
 new Function('exports', ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(exports);
 return exports;
}
const { sortedValues } = load('lib/categories.ts');
const { memoryLabel, variantLabel } = load('lib/purchase-details.ts');
test('Capacidades ordenadas por magnitud, sin modificar el catalogo', () => {
 const field = { clave: 'rom', valores: ['2 TB','64 GB','1 TB','512 GB','256 GB'] };
 assert.deepEqual(sortedValues(field), ['64 GB','256 GB','512 GB','1 TB','2 TB']);
 assert.equal(field.valores[0], '2 TB');
 assert.deepEqual(sortedValues({ clave: 'pulgadas', valores: ['100','32','98'] }), ['32','98','100']);
});
test('Caracteristicas nuevas e historicas conservan unidades legibles', () => {
 assert.equal(memoryLabel('8 GB','1 TB'), '8 GB / 1 TB');
 assert.equal(memoryLabel('8','128',true), '8/128 GB');
 assert.equal(memoryLabel('','1 TB'), '1 TB');
 assert.equal(memoryLabel('',''), '');
 assert.equal(variantLabel({ potencia:'350', ram:'8 GB', rom:'1 TB' }), '350 W');
 assert.equal(variantLabel({ pulgadas:'100' }), '100"');
});
