const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const memory = new Map();
const window = { localStorage: { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) } };
function moduleFrom(path, deps = {}) {
  const exports = {};
  const source = fs.readFileSync(require.resolve(path), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(compiled, { exports, window, URL, require: (key) => {
    if (key in deps) return deps[key];
    throw new Error(`Unexpected import: ${key}`);
  } });
  return exports;
}
const draftModule = moduleFrom('../lib/demo/candidate.ts');
const { emptyCandidate, candidateDraft, profileProgress } = draftModule;
const { hydrateCandidate, candidateDestination, afterMaterials } = moduleFrom('../lib/candidate/state.ts', { '@/lib/demo/candidate': draftModule });
const { profileDraft, cvConsent } = moduleFrom('../lib/demo/storage.ts');
const user = { id: 1, role: 'APPLICANT', nationality: 'Filipino', current_location: 'Dubai, UAE', target_country: 'UAE, Qatar', cv_file: '/media/cv_files/Existing%20CV.pdf' };
const resume = { id: 12, title: 'Barista', position: 'Barista', aboutMe: 'Five years in specialty coffee.', languages: ['English', 'Arabic'] };

test('new candidate starts with the CV choice, before location', () => {
  const fresh = emptyCandidate();
  assert.equal(fresh.step, 'materials');
  assert.equal(profileProgress(fresh, false).next.key, 'cv');
  assert.equal(afterMaterials(fresh), 'based');
  assert.equal(candidateDestination({ status: 'not_started' }, { id: 2, role: 'APPLICANT' }, null), '/onboarding');
});
test('another browser restores existing account fields and CV instead of asking again', () => {
  const restored = hydrateCandidate(null, user, resume);
  assert.equal(restored.cvFile, 'Existing CV.pdf');
  assert.equal(restored.role, 'Barista');
  assert.equal(restored.check.languages, 'English, Arabic');
  assert.equal(restored.check.achievement, resume.aboutMe);
  assert.equal(restored.countries.join(','), 'UAE,Qatar');
  assert.equal(afterMaterials(restored), 'countries');
  assert.equal(profileProgress(restored, false).items.find((item) => item.key === 'cv').done, true);
});
test('saved unfinished answers take precedence over older profile fields', () => {
  const restored = hydrateCandidate({ step: 'check', location: 'Doha, Qatar', check: { languages: 'English, French', achievement: 'A new confirmed achievement.' }, countries: ['Saudi Arabia'] }, user, resume);
  assert.equal(restored.step, 'check');
  assert.equal(restored.location, 'Doha, Qatar');
  assert.equal(restored.check.languages, 'English, French');
  assert.equal(restored.countries.join(','), 'Saudi Arabia');
});
test('returning candidate resumes active work and respects Do later or completion', () => {
  assert.equal(candidateDestination({ status: 'in_progress' }, user, resume), '/onboarding');
  for (const status of ['deferred', 'completed']) assert.equal(candidateDestination({ status }, user, resume), '/jobs');
  assert.equal(candidateDestination({ status: 'not_started' }, user, resume), '/jobs');
  assert.equal(candidateDestination({ status: 'not_started' }, user, null), '/onboarding');
});
test('account-scoped candidate caches cannot leak a CV or answers into another sign-in', () => {
  memory.clear();
  candidateDraft.save({ ...emptyCandidate(), cvFile: 'One.pdf', step: 'countries', check: { languages: 'English' } }, 1);
  assert.equal(candidateDraft.load(1).cvFile, 'One.pdf');
  assert.equal(candidateDraft.load(2).cvFile, null);
  candidateDraft.clear(2);
  assert.equal(candidateDraft.load(1).step, 'countries');
});
test('legacy unscoped browser data is retained but never imported into another account', () => {
  memory.clear();
  candidateDraft.save({ ...emptyCandidate(), cvFile: 'Legacy.pdf' });
  profileDraft.save('chef', { languages: 'French' }, 1);
  cvConsent.save({ agreed: true, signer: 'Candidate One', signature: 'local image', signedAt: '2026-10-05' }, 1);
  assert.equal(candidateDraft.load(1).cvFile, null);
  assert.equal(candidateDraft.load().cvFile, 'Legacy.pdf');
  assert.equal(profileDraft.load(2).professionId, null);
  assert.equal(cvConsent.load(2).signedAt, null);
  assert.equal(cvConsent.load(1).signer, 'Candidate One');
});
test('progress API sends the version and scoped workflow state, including a deferred step', async () => {
  const calls = [];
  const http = { get: async (path) => { calls.push(['get', path]); return { version: 3 }; }, put: async (path, body) => { calls.push(['put', path, body]); return { version: 4 }; } };
  const { candidateProgressApi } = moduleFrom('../lib/api/candidate-progress.ts', { './client': { http } });
  await candidateProgressApi.load();
  await candidateProgressApi.save({ ...emptyCandidate(), step: 'check' }, 'deferred', 3);
  assert.equal(calls[1][1], '/api/web/candidate-onboarding/');
  assert.equal(calls[1][2].version, 3);
  assert.equal(calls[1][2].status, 'deferred');
  assert.equal(calls[1][2].draft.step, 'check');
});
