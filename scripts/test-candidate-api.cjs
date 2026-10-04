const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(require.resolve('../lib/api/candidate.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
class ApiError extends Error { constructor(status, payload, message) { super(message); this.status = status; this.payload = payload; } }
function client(response) {
  const calls = [];
  const http = {
    get: async (path) => { calls.push(['get', path]); if (response instanceof Error) throw response; return response; },
    patch: async (path, body) => { calls.push(['patch', path, body]); return { id: 12, ...body }; },
    post: async (path, body) => { calls.push(['post', path, body]); return { id: 12, ...body }; },
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, FormData, require: (id) => {
    if (id === './client') return { http, ApiError };
    if (id === './endpoints') return { API: { auth: { me: '/me/' }, resumes: { certificates: '/certificates/' } } };
    throw new Error(id);
  } });
  return { api: exports.candidateApi, calls };
}

test('current list API uses the latest resume and never PATCHes NaN', async () => {
  const { api, calls } = client([{ id: 2, updated_at: '2026-09-01' }, { id: 12, updated_at: '2026-10-01' }]);
  await api.saveResume({ position: 'Chef' });
  assert.equal(calls[1][1], '/api/resumes/my/12/');
  assert.equal(calls[1][2].title, 'Chef');
});
test('paginated list accepts results and uses title as position', async () => {
  const { api } = client({ count: 1, results: [{ id: 12, title: 'Barista' }] });
  const resume = await api.myResume();
  assert.equal(resume.id, 12);
  assert.equal(resume.position, 'Barista');
});
test('empty list creates instead of updating an undefined id', async () => {
  for (const empty of [[], { count: 0, results: [] }]) {
    const { api, calls } = client(empty);
    await api.saveResume({ title: 'Hostess' });
    assert.equal(calls[1][0], 'post');
    assert.equal(calls[1][1], '/api/resumes/my/');
  }
});
test('legacy object and legacy 404 remain supported', async () => {
  const { api } = client({ id: 12, title: 'CV', position: 'Waiter' });
  assert.equal((await api.myResume()).position, 'Waiter');
  assert.equal(await client(new ApiError(404)).api.myResume(), null);
});
test('malformed ids cannot issue a write to a NaN endpoint', async () => {
  for (const bad of [{ title: 'No id' }, [{ id: 'wrong' }], { results: [{ id: 0 }] }]) {
    const { api, calls } = client(bad);
    await assert.rejects(api.saveResume({ title: 'Chef' }), { status: 502 });
    assert.equal(calls.length, 1);
  }
});
