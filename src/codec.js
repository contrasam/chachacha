// Pages and replies live entirely in the URL hash: JSON -> UTF-8 -> base64url.
// Nothing is stored on a server, so a link *is* the page.

export function encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export const THEMES = ['strawberry', 'matcha', 'lavender', 'sky'];
export const MASCOTS = ['🐰', '🐻', '🐱', '🐶', '🐼', '🐥', '🦊', '🐸'];
export const BLOCK_TYPES = ['ask', 'stars', 'text', 'note'];

const str = (v, max, fallback = '') =>
  typeof v === 'string' ? v.slice(0, max) : fallback;

// Links come from strangers' URLs, so never trust the shape of decoded data.
export function normalizePage(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Not a page');
  const blocks = (Array.isArray(raw.blocks) ? raw.blocks : [])
    .slice(0, 20)
    .map(normalizeBlock)
    .filter(Boolean);
  return {
    v: 1,
    to: str(raw.to, 40),
    from: str(raw.from, 40),
    theme: THEMES.includes(raw.theme) ? raw.theme : THEMES[0],
    mascot: MASCOTS.includes(raw.mascot) ? raw.mascot : MASCOTS[0],
    blocks,
  };
}

function normalizeBlock(b) {
  if (!b || !BLOCK_TYPES.includes(b.t)) return null;
  switch (b.t) {
    case 'ask':
      return {
        t: 'ask',
        q: str(b.q, 200, 'Do you love me?'),
        yes: str(b.yes, 30, 'Yes!'),
        no: str(b.no, 30, 'No'),
        done: str(b.done, 200, 'Yay!'),
      };
    case 'stars': {
      const max = Number.isInteger(b.max) ? Math.min(Math.max(b.max, 3), 10) : 5;
      return { t: 'stars', q: str(b.q, 200, 'Rate me!'), max };
    }
    case 'text':
      return { t: 'text', q: str(b.q, 200, 'Tell me something'), ph: str(b.ph, 80) };
    case 'note':
      return { t: 'note', text: str(b.text, 600, '💌') };
  }
}

export function normalizeReply(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Not a reply');
  const answers = (Array.isArray(raw.answers) ? raw.answers : []).slice(0, 20).map((a) => ({
    t: ['ask', 'stars', 'text'].includes(a?.t) ? a.t : 'text',
    q: str(a?.q, 200),
    a: str(a?.a, 1000),
    max: Number.isInteger(a?.max) ? Math.min(Math.max(a.max, 3), 10) : 5,
    dodges: Number.isInteger(a?.dodges) ? Math.max(0, Math.min(a.dodges, 9999)) : 0,
  }));
  return {
    v: 1,
    to: str(raw.to, 40),
    from: str(raw.from, 40),
    theme: THEMES.includes(raw.theme) ? raw.theme : THEMES[0],
    mascot: MASCOTS.includes(raw.mascot) ? raw.mascot : MASCOTS[0],
    answers,
  };
}
