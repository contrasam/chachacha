export const TEMPLATES = [
  {
    name: 'Cutie patootie check',
    emoji: '🥺',
    blocks: [
      { t: 'ask', q: 'Am I a cutie patootie?', yes: 'YES 💖', no: 'no', done: 'I knew it hehe 🥰' },
      { t: 'stars', q: 'How cute am I, out of 5?', max: 5 },
      { t: 'text', q: 'What is the cutest thing about me?', ph: 'be honest…' },
    ],
  },
  {
    name: 'Date night?',
    emoji: '🍜',
    blocks: [
      { t: 'note', text: 'I have been thinking about you all day ✨' },
      { t: 'ask', q: 'Will you go on a date with me this weekend?', yes: 'Obviously 💕', no: 'Nope', done: 'Yay!! Wear something comfy 🍜' },
      { t: 'text', q: 'Where should we go?', ph: 'ramen? movies? picnic?' },
    ],
  },
  {
    name: 'Rate our day',
    emoji: '⭐',
    blocks: [
      { t: 'stars', q: 'How was our day together?', max: 5 },
      { t: 'stars', q: 'How good was my cooking? 😅', max: 5 },
      { t: 'text', q: 'What should we do next time?', ph: '' },
    ],
  },
  {
    name: 'Be my valentine',
    emoji: '💘',
    blocks: [
      { t: 'ask', q: 'Will you be my valentine?', yes: 'Yes!!', no: 'No', done: 'Best. Day. Ever. 💘' },
      { t: 'note', text: 'Thank you for being you. I love you lots 💗' },
    ],
  },
];

export const NEW_BLOCKS = {
  ask: () => ({ t: 'ask', q: 'Do you love me?', yes: 'Yes!', no: 'No', done: 'Yay! 💕' }),
  stars: () => ({ t: 'stars', q: 'Rate me out of 5', max: 5 }),
  text: () => ({ t: 'text', q: 'Tell me something sweet', ph: '' }),
  note: () => ({ t: 'note', text: 'You make me so happy 💗' }),
};

export const BLOCK_LABELS = {
  ask: '🙈 Yes / dodging No',
  stars: '⭐ Star rating',
  text: '✏️ Free answer',
  note: '💌 Sweet note',
};
