import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode, normalizePage, normalizeReply } from '../src/codec.js';

test('round-trips unicode and emoji', () => {
  const page = { to: 'Bübü 🐻', blocks: [{ t: 'note', text: 'love you 💗 — सदा' }] };
  assert.deepEqual(decode(encode(page)), page);
});

test('encoded output is URL safe', () => {
  const s = encode({ text: '???>>>~~~'.repeat(20) });
  assert.match(s, /^[A-Za-z0-9_-]+$/);
});

test('normalizePage drops unknown blocks and clamps values', () => {
  const page = normalizePage({
    theme: 'evil',
    to: 'x'.repeat(500),
    blocks: [{ t: 'script', src: 'x' }, { t: 'stars', max: 999 }, { t: 'ask', q: 42 }],
  });
  assert.equal(page.theme, 'strawberry');
  assert.equal(page.to.length, 40);
  assert.equal(page.blocks.length, 2);
  assert.equal(page.blocks[0].max, 10);
  assert.equal(page.blocks[1].q, 'Do you love me?');
});

test('normalizePage rejects junk', () => {
  assert.throws(() => normalizePage(null));
});

test('normalizeReply sanitizes answers', () => {
  const r = normalizeReply({ answers: [{ t: 'ask', q: 'cute?', a: 'Yes', dodges: -3 }, null] });
  assert.equal(r.answers[0].dodges, 0);
  assert.equal(r.answers[1].t, 'text');
});
