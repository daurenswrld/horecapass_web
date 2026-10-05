const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
const calls = [];
const compiled = ts.transpileModule(fs.readFileSync(require.resolve('../lib/api/billing.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
vm.runInNewContext(compiled, { exports: exportsObject, URL, require: () => ({ request: async (...args) => { calls.push(args); return {}; } }) });
const { billingApi, checkoutDestination } = exportsObject;
const order = { id: 'example', is_test: true, fulfillment: 'test_only_no_live_access', status: 'pending', checkout_url: 'https://checkout.stripe.com/c/pay/cs_test_example' };

test('checkout posts only server plan, owned resource identifier and retry key', async () => {
  await billingApi.checkout('cv_download', 12, 'request-key');
  assert.equal(calls.at(-1)[0], '/api/billing/checkout/');
  assert.equal(JSON.stringify(calls.at(-1)[1].body), JSON.stringify({ plan: 'cv_download', resource_id: 12, request_key: 'request-key' }));
});
test('pending test orders redirect only to HTTPS Stripe checkout', () => {
  assert.equal(checkoutDestination(order), order.checkout_url);
  for (const url of ['https://evil.example/', 'http://checkout.stripe.com/', 'https://checkout.stripe.com.evil.example/', 'javascript:alert(1)', 'https://name:secret@checkout.stripe.com/']) {
    assert.throws(() => checkoutDestination({ ...order, checkout_url: url }));
  }
});
test('live or unknown fulfillment modes are rejected', () => {
  assert.throws(() => checkoutDestination({ ...order, is_test: false }));
  assert.throws(() => checkoutDestination({ ...order, fulfillment: 'live' }));
});
test('completed and expired orders return to server confirmation instead of charging again', () => {
  for (const status of ['paid', 'expired', 'refunded']) {
    assert.equal(checkoutDestination({ ...order, status }), '/billing/return?order=example');
  }
});
