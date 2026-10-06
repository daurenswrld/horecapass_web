const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../lib/candidate/roles.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exportsObject, Set, JSON });
const { normalizeTargetRoles, candidateRoleContext } = exportsObject;
test('multiple desired positions retain custom roles and remove duplicate variants', () => {
  assert.equal(JSON.stringify(normalizeTargetRoles([' Chef ', 'chef', 'Pastry consultant', 3, ''])), JSON.stringify(['Chef', 'Pastry consultant']));
});
test('untrusted persisted values cannot crash role selection or exceed its bounds', () => {
  assert.equal(normalizeTargetRoles(null).length, 0);
  assert.equal(normalizeTargetRoles(['x'.repeat(101)]).length, 0);
  assert.equal(normalizeTargetRoles(Array.from({length:20}, (_,i)=>`Role ${i}`)).length, 10);
});
test('the model receives all selected positions and explicit non-fabrication rules', () => {
  const context = candidateRoleContext(['Chef', 'Pastry consultant']);
  assert.match(context, /\["Chef","Pastry consultant"\]/);
  assert.match(context, /ask only for missing information/);
  assert.match(context, /Do not invent qualifications/);
});
test('missing desired positions do not fabricate a role from the account', () => {
  assert.equal(candidateRoleContext([]), '');
});
