import { encode, decode, normalizePage, normalizeReply, THEMES, MASCOTS } from './codec.js';
import { TEMPLATES, NEW_BLOCKS, BLOCK_LABELS } from './templates.js';

const root = document.getElementById('app');
const STORAGE_KEY = 'chachacha:draft';

// Tiny element helper. Always uses textContent, never innerHTML: page text
// comes from URLs anyone can craft.
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function linkFor(kind, data) {
  const url = new URL(location.href);
  url.hash = `${kind}=${encode(data)}`;
  return url.toString();
}

async function shareOrCopy(url, title, button) {
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    flash(button, 'Copied! 📋');
  } catch {
    prompt('Copy this link:', url);
  }
}

function flash(button, text) {
  const old = button.textContent;
  button.textContent = text;
  setTimeout(() => (button.textContent = old), 1600);
}

function hearts(count = 24) {
  const emojis = ['💖', '💕', '✨', '💗', '🌸', '⭐'];
  for (let i = 0; i < count; i++) {
    const s = h('span', { class: 'confetti', 'aria-hidden': 'true', text: emojis[i % emojis.length] });
    s.style.left = `${Math.random() * 100}vw`;
    s.style.animationDelay = `${Math.random() * 0.6}s`;
    s.style.fontSize = `${16 + Math.random() * 22}px`;
    document.body.append(s);
    setTimeout(() => s.remove(), 3200);
  }
}

// ---------------------------------------------------------------- router

function route() {
  document.querySelectorAll('.dodger').forEach((el) => el.remove());
  root.replaceChildren();
  const hash = location.hash.slice(1);
  const [kind, data] = [hash.slice(0, 2), hash.slice(2)];
  try {
    if (kind === 'p=') return renderPlayer(normalizePage(decode(data)));
    if (kind === 'r=') return renderReply(normalizeReply(decode(data)));
  } catch {
    return renderBroken();
  }
  renderBuilder();
}

function renderBroken() {
  setTheme('strawberry');
  root.append(
    h('main', { class: 'card center' },
      h('div', { class: 'mascot big', text: '🥲' }),
      h('h1', { text: 'This link looks broken' }),
      h('p', { text: 'It may have been cut off while copying. Ask for the link again!' }),
      h('a', { class: 'btn', href: location.pathname, text: 'Make your own page' }),
    ),
  );
}

// ---------------------------------------------------------------- builder

function loadDraft() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizePage(JSON.parse(saved));
  } catch {}
  return normalizePage({ to: '', from: '', blocks: structuredClone(TEMPLATES[0].blocks) });
}

function saveDraft(page) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(page));
  } catch {}
}

function renderBuilder() {
  const page = loadDraft();
  setTheme(page.theme);

  const blocksEl = h('div', { class: 'blocks' });
  const mascotRow = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Mascot' });
  const themeRow = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Theme' });

  const changed = () => saveDraft(page);

  function chipRow(container, values, key, render) {
    container.replaceChildren(
      ...values.map((v) =>
        h('button', {
          type: 'button',
          class: `chip ${page[key] === v ? 'on' : ''}`,
          role: 'radio',
          'aria-checked': String(page[key] === v),
          onclick: () => {
            page[key] = v;
            if (key === 'theme') setTheme(v);
            chipRow(container, values, key, render);
            changed();
          },
        }, render(v)),
      ),
    );
  }
  chipRow(mascotRow, MASCOTS, 'mascot', (m) => m);
  chipRow(themeRow, THEMES, 'theme', (t) => h('span', { class: `swatch sw-${t}` }, t));

  function field(label, value, oninput, opts = {}) {
    const input = h(opts.multiline ? 'textarea' : 'input', {
      value: opts.multiline ? null : value,
      maxlength: opts.max ?? 200,
      placeholder: opts.placeholder ?? '',
      rows: opts.multiline ? 3 : null,
      oninput: (e) => { oninput(e.target.value); changed(); },
    });
    if (opts.multiline) input.value = value;
    return h('label', { class: 'field' }, h('span', { text: label }), input);
  }

  function drawBlocks() {
    blocksEl.replaceChildren(
      ...page.blocks.map((b, i) => {
        const set = (k) => (v) => (b[k] = v);
        const body = {
          ask: () => [
            field('Question', b.q, set('q')),
            h('div', { class: 'row' },
              field('Yes button', b.yes, set('yes'), { max: 30 }),
              field('No button (it runs away)', b.no, set('no'), { max: 30 }),
            ),
            field('Message after Yes', b.done, set('done')),
          ],
          stars: () => [
            field('Question', b.q, set('q')),
            h('label', { class: 'field' }, h('span', { text: 'Number of stars' }),
              h('select', { onchange: (e) => { b.max = Number(e.target.value); changed(); } },
                [3, 5, 10].map((n) => h('option', { value: n, selected: b.max === n }, String(n))),
              ),
            ),
          ],
          text: () => [
            field('Question', b.q, set('q')),
            field('Placeholder hint', b.ph, set('ph'), { max: 80 }),
          ],
          note: () => [field('Your note', b.text, set('text'), { multiline: true, max: 600 })],
        }[b.t]();

        const move = (d) => () => {
          const j = i + d;
          if (j < 0 || j >= page.blocks.length) return;
          [page.blocks[i], page.blocks[j]] = [page.blocks[j], page.blocks[i]];
          changed();
          drawBlocks();
        };
        return h('section', { class: 'block-edit' },
          h('header', {},
            h('strong', { text: `${i + 1}. ${BLOCK_LABELS[b.t]}` }),
            h('div', { class: 'tools' },
              h('button', { type: 'button', class: 'icon', 'aria-label': 'Move up', onclick: move(-1), disabled: i === 0 }, '↑'),
              h('button', { type: 'button', class: 'icon', 'aria-label': 'Move down', onclick: move(1), disabled: i === page.blocks.length - 1 }, '↓'),
              h('button', {
                type: 'button', class: 'icon', 'aria-label': 'Remove',
                onclick: () => { page.blocks.splice(i, 1); changed(); drawBlocks(); },
              }, '✕'),
            ),
          ),
          body,
        );
      }),
    );
    if (!page.blocks.length) blocksEl.append(h('p', { class: 'muted', text: 'Add something below 👇' }));
  }
  drawBlocks();

  const shareBtn = h('button', { type: 'button', class: 'btn', text: 'Copy share link 💌' });
  shareBtn.addEventListener('click', () => {
    if (!page.blocks.length) return flash(shareBtn, 'Add a block first!');
    shareOrCopy(linkFor('p', page), 'A little something for you 💌', shareBtn);
  });

  root.append(
    h('main', { class: 'builder' },
      h('header', { class: 'hero' },
        h('div', { class: 'mascot bob', text: page.mascot }),
        h('h1', { text: 'chachacha' }),
        h('p', { text: 'Make a tiny, silly, cute page for your person. Share the link. Watch them try to click “No”.' }),
      ),

      h('section', { class: 'card' },
        h('h2', { text: 'Start from a template' }),
        h('div', { class: 'templates' },
          TEMPLATES.map((t) =>
            h('button', {
              type: 'button', class: 'template',
              onclick: () => {
                if (page.blocks.length && !confirm(`Replace your blocks with “${t.name}”?`)) return;
                page.blocks = structuredClone(t.blocks);
                changed();
                drawBlocks();
              },
            }, h('span', { class: 'emoji', text: t.emoji }), t.name),
          ),
        ),
      ),

      h('section', { class: 'card' },
        h('h2', { text: 'Who is it for?' }),
        h('div', { class: 'row' },
          field('Their name', page.to, (v) => (page.to = v), { max: 40, placeholder: 'Bubu' }),
          field('From', page.from, (v) => (page.from = v), { max: 40, placeholder: 'Dudu' }),
        ),
        h('h3', { text: 'Mascot' }), mascotRow,
        h('h3', { text: 'Theme' }), themeRow,
      ),

      h('section', { class: 'card' },
        h('h2', { text: 'Your page' }),
        blocksEl,
        h('div', { class: 'add' },
          Object.keys(NEW_BLOCKS).map((t) =>
            h('button', {
              type: 'button', class: 'chip',
              onclick: () => {
                if (page.blocks.length >= 20) return;
                page.blocks.push(NEW_BLOCKS[t]());
                changed();
                drawBlocks();
              },
            }, `+ ${BLOCK_LABELS[t]}`),
          ),
        ),
      ),

      h('div', { class: 'actions sticky' },
        h('button', {
          type: 'button', class: 'btn ghost',
          onclick: () => window.open(linkFor('p', page), '_blank'),
        }, 'Preview 👀'),
        shareBtn,
      ),
      h('p', { class: 'muted small center', text: 'Your page lives inside the link itself — nothing is uploaded anywhere.' }),
    ),
  );
}

// ---------------------------------------------------------------- player

function renderPlayer(page) {
  setTheme(page.theme);
  const answers = [];
  const stage = h('main', { class: 'stage' });
  const progress = h('div', { class: 'progress', 'aria-hidden': 'true' }, h('div'));
  root.append(progress, stage);

  const steps = page.blocks.length;
  const setProgress = (i) => (progress.firstChild.style.width = `${(i / steps) * 100}%`);

  function show(card) {
    document.querySelectorAll('.dodger').forEach((el) => el.remove());
    stage.replaceChildren(card);
  }

  function step(i) {
    setProgress(i);
    if (i >= steps) return show(finish());
    const b = page.blocks[i];
    const next = () => step(i + 1);
    show({ ask: askCard, stars: starsCard, text: textCard, note: noteCard }[b.t](b, next, answers));
  }

  function finish() {
    const answerable = answers.length > 0;
    const card = h('section', { class: 'card center pop' },
      h('div', { class: 'mascot big bob', text: page.mascot }),
      h('h1', { text: 'All done! 💕' }),
    );
    if (answerable) {
      const reply = { v: 1, to: page.to, from: page.from, theme: page.theme, mascot: page.mascot, answers };
      const btn = h('button', { type: 'button', class: 'btn', text: `Send my answers to ${page.from || 'them'} 💌` });
      btn.addEventListener('click', () => shareOrCopy(linkFor('r', reply), 'My answers 💌', btn));
      card.append(h('p', { text: 'Send your answers back so they can see them:' }), btn);
    } else {
      card.append(h('p', { text: page.from ? `With love, ${page.from}` : 'With love 💗' }));
    }
    card.append(h('a', { class: 'link small', href: location.pathname, text: 'Make one of your own →' }));
    return card;
  }

  stage.append(
    h('section', { class: 'card center pop' },
      h('div', { class: 'mascot big bob', text: page.mascot }),
      h('h1', { text: page.to ? `Hi ${page.to}!` : 'Hi you!' }),
      h('p', { text: `${page.from || 'Someone special'} made something for you 💌` }),
      h('button', { type: 'button', class: 'btn', onclick: () => step(0), text: 'Open it ✨' }),
    ),
  );
  setProgress(0);
}

function askCard(b, next, answers) {
  let dodges = 0;
  const pleas = ['are you sure?', 'really??', 'think again 🥺', 'pls', 'nope, try again', 'not an option', '🙅'];
  const yes = h('button', { type: 'button', class: 'btn yes', text: b.yes });
  const no = h('button', { type: 'button', class: 'btn ghost no', text: b.no });
  const buttons = h('div', { class: 'choices' }, yes, no);

  const dodge = (e) => {
    e?.preventDefault();
    dodges++;
    yes.style.transform = `scale(${Math.min(1 + dodges * 0.22, 3.2)})`;
    no.textContent = pleas[(dodges - 1) % pleas.length];
    // Lift No out of the layout on the first dodge so it can roam the screen.
    if (!no.classList.contains('dodger')) {
      const r = no.getBoundingClientRect();
      no.classList.add('dodger');
      no.style.left = `${r.left}px`;
      no.style.top = `${r.top}px`;
      document.body.append(no);
    }
    const pad = 12;
    const r = no.getBoundingClientRect();
    const maxX = Math.max(pad, innerWidth - r.width - pad);
    const maxY = Math.max(pad, innerHeight - r.height - pad);
    let x, y, tries = 0;
    // Pick a spot far enough from the pointer that it can't be caught.
    do {
      x = pad + Math.random() * (maxX - pad);
      y = pad + Math.random() * (maxY - pad);
      tries++;
    } while (tries < 20 && e?.clientX != null && Math.hypot(x - e.clientX, y - e.clientY) < 160);
    no.style.left = `${x}px`;
    no.style.top = `${y}px`;
  };
  no.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') dodge(e); });
  no.addEventListener('pointerdown', dodge);
  // Pointer presses already dodged on pointerdown; only keyboard clicks get here fresh.
  no.addEventListener('click', (e) => (e.detail === 0 ? dodge(e) : e.preventDefault()));
  no.addEventListener('focus', () => dodges && no.blur());

  const card = h('section', { class: 'card center pop' },
    h('h1', { class: 'question', text: b.q }),
    buttons,
  );

  yes.addEventListener('click', () => {
    no.remove();
    answers.push({ t: 'ask', q: b.q, a: b.yes, dodges });
    hearts();
    card.replaceChildren(
      h('div', { class: 'mascot big wiggle', text: '🥰' }),
      h('h1', { text: b.done }),
      dodges ? h('p', { class: 'muted', text: `(you tried to say no ${dodges} time${dodges === 1 ? '' : 's'} 😤)` }) : null,
      h('button', { type: 'button', class: 'btn', onclick: next, text: 'Next →' }),
    );
  });
  return card;
}

function starsCard(b, next, answers) {
  let value = 0;
  const nextBtn = h('button', { type: 'button', class: 'btn', disabled: true, text: 'Next →' });
  const stars = h('div', { class: 'stars', role: 'radiogroup', 'aria-label': b.q });
  const draw = (hover = value) =>
    [...stars.children].forEach((s, i) => s.classList.toggle('on', i < hover));
  for (let i = 1; i <= b.max; i++) {
    stars.append(h('button', {
      type: 'button', class: 'star', role: 'radio', 'aria-label': `${i} of ${b.max}`,
      onclick: () => {
        value = i;
        nextBtn.disabled = false;
        [...stars.children].forEach((s, j) => s.setAttribute('aria-checked', String(j + 1 === i)));
        draw();
        if (i === b.max) hearts(12);
      },
      onpointerenter: () => draw(i),
      onpointerleave: () => draw(),
    }, '★'));
  }
  nextBtn.addEventListener('click', () => {
    answers.push({ t: 'stars', q: b.q, a: String(value), max: b.max });
    next();
  });
  return h('section', { class: 'card center pop' }, h('h1', { class: 'question', text: b.q }), stars, nextBtn);
}

function textCard(b, next, answers) {
  const input = h('textarea', { rows: 4, maxlength: 1000, placeholder: b.ph || 'type here…' });
  const nextBtn = h('button', { type: 'button', class: 'btn', text: 'Next →' });
  nextBtn.addEventListener('click', () => {
    answers.push({ t: 'text', q: b.q, a: input.value.trim() });
    next();
  });
  return h('section', { class: 'card center pop' },
    h('h1', { class: 'question', text: b.q }),
    h('label', { class: 'field' }, h('span', { class: 'sr-only', text: b.q }), input),
    nextBtn,
  );
}

function noteCard(b, next) {
  return h('section', { class: 'card center pop note' },
    h('div', { class: 'mascot big', text: '💌' }),
    h('p', { class: 'note-text', text: b.text }),
    h('button', { type: 'button', class: 'btn', onclick: next, text: 'Next →' }),
  );
}

// ---------------------------------------------------------------- reply

function renderReply(reply) {
  setTheme(reply.theme);
  root.append(
    h('main', { class: 'stage' },
      h('section', { class: 'card pop' },
        h('div', { class: 'center' },
          h('div', { class: 'mascot big bob', text: reply.mascot }),
          h('h1', { text: `${reply.to || 'Your person'} answered! 💞` }),
        ),
        h('ol', { class: 'answers' },
          reply.answers.map((a) =>
            h('li', {},
              h('p', { class: 'q', text: a.q }),
              a.t === 'stars'
                ? h('p', { class: 'a stars-read', 'aria-label': `${a.a} of ${a.max} stars` },
                    '★'.repeat(Number(a.a) || 0), h('span', { class: 'dim', text: '★'.repeat(Math.max(0, a.max - (Number(a.a) || 0))) }))
                : h('p', { class: 'a', text: a.a || '(left blank 🤐)' }),
              a.dodges ? h('p', { class: 'muted small', text: `tried to click “No” ${a.dodges} time${a.dodges === 1 ? '' : 's'} first 😤` }) : null,
            ),
          ),
        ),
        h('div', { class: 'center' }, h('a', { class: 'btn', href: location.pathname, text: 'Make another page 💌' })),
      ),
    ),
  );
  hearts();
}

addEventListener('hashchange', route);
route();
