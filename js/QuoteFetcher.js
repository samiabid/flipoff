import { GRID_COLS } from './constants.js';

function sanitize(str) {
  return str
    .toUpperCase()
    .replace(/[^A-Z0-9.,\-!?'\/: ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordWrap(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const w = word.slice(0, maxWidth);
    if (!current) {
      current = w;
    } else if (current.length + 1 + w.length <= maxWidth) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function formatQuote(text, author) {
  const lines = wordWrap(sanitize(text), GRID_COLS);
  const attribution = sanitize('- ' + author).slice(0, GRID_COLS);
  if (lines.length <= 1) {
    return ['', lines[0] || '', '', attribution, ''];
  } else if (lines.length === 2) {
    return ['', lines[0], lines[1], attribution, ''];
  } else {
    // 3 lines: sacrifice the blank top row
    return [lines[0], lines[1], lines[2], attribution, ''];
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class QuoteFetcher {
  constructor() {
    this._pool = [];
    this._index = 0;
    this._loaded = false;
  }

  async prefetch() {
    try {
      const res = await fetch('/data/quotes.json');
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const formatted = data.map(q => formatQuote(q.text, q.author));
      this._pool = shuffle(formatted);
      this._index = Math.floor(Math.random() * formatted.length);
      this._loaded = true;
    } catch {
      // fall through — next() will use built-in MESSAGES via the fallback pool
    }
  }

  setFallback(messages) {
    if (!this._loaded) {
      this._pool = shuffle([...messages]);
      this._index = Math.floor(Math.random() * messages.length);
    }
  }

  next() {
    if (this._pool.length === 0) return null;
    const msg = this._pool[this._index % this._pool.length];
    this._index++;
    // Reshuffle after a full cycle so the order feels fresh
    if (this._index >= this._pool.length) {
      this._index = 0;
      shuffle(this._pool);
    }
    return msg;
  }
}
