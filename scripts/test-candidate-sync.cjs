const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function syncClient() {
  const calls = [];
  const exports = {};
  const api = { patchProfile: async (body) => calls.push(['profile', body]), saveResume: async (body) => calls.push(['resume', body]) };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../lib/demo/candidate-sync.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, require: (id) => {
    if (id === '@/lib/api/candidate') return { candidateApi: api };
    if (id === '@/lib/demo/employer-sync') return { canSyncToServer: () => true };
    if (id === '@/lib/demo/storage') return { cvConsent: { load: () => ({ signer: '' }) } };
    throw new Error(id);
  } });
  return { sync: exports.syncCandidate, calls };
}

test('confirming a desired management role cannot overwrite the completed waiter CV', async () => {
  const { sync, calls } = syncClient();
  await sync({ cvBuilt: true, role: 'Restaurant Manager', years: 1, countries: [], check: { achievement: 'Actual waiter experience' } }, { first: 'A', last: 'B' }, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'profile');
});

test('unfinished legacy profile details still sync without losing the normal setup path', async () => {
  const { sync, calls } = syncClient();
  await sync({ cvBuilt: false, role: 'Waiter', years: 2, countries: [], check: {} }, { first: 'A', last: 'B' }, 1);
  assert.equal(calls[1][0], 'resume');
  assert.equal(calls[1][1].title, 'Waiter');
});
