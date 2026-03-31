import { Board } from './Board.js';
import { SoundEngine } from './SoundEngine.js';
import { MessageRotator } from './MessageRotator.js';
import { KeyboardController } from './KeyboardController.js';
import { ClockMode } from './ClockMode.js';
import { DimMode } from './DimMode.js';
import { formatQuote } from './QuoteFetcher.js';

// --- Persistence helpers ---
const prefs = {
  get: (k, fallback) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set: (k, v)        => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

document.addEventListener('DOMContentLoaded', () => {
  const boardContainer = document.getElementById('board-container');
  const soundEngine = new SoundEngine();
  const board       = new Board(boardContainer, soundEngine);
  const rotator     = new MessageRotator(board);
  const clockMode   = new ClockMode(board);
  const dimMode     = new DimMode();
  const keyboard    = new KeyboardController(rotator, soundEngine, clockMode);

  // --- Restore persisted settings ---
  const savedMuted  = prefs.get('flipoff_mute',   false);
  const savedVolume = prefs.get('flipoff_volume',  0.8);
  const savedClock  = prefs.get('flipoff_clock',   false);

  // Initialize audio on first user interaction (browser autoplay policy)
  let audioInitialized = false;
  const initAudio = async () => {
    if (audioInitialized) return;
    audioInitialized = true;
    await soundEngine.init();
    soundEngine.resume();
    soundEngine.setVolume(savedVolume);
    if (savedMuted) soundEngine.toggleMute();
    document.removeEventListener('click',   initAudio);
    document.removeEventListener('keydown', initAudio);
  };
  document.addEventListener('click',   initAudio);
  document.addEventListener('keydown', initAudio);

  // Start quote rotation, then apply clock mode if it was active
  rotator.start();
  if (savedClock) keyboard._toggleClock();

  // Start dim mode (auto-dims at night)
  dimMode.start();

  // Auto-fullscreen on first interaction
  let fullscreenRequested = false;
  const requestFullscreen = () => {
    if (fullscreenRequested || document.fullscreenElement) return;
    fullscreenRequested = true;
    document.documentElement.requestFullscreen().catch(() => {});
  };
  document.addEventListener('click',   requestFullscreen, { once: true });
  document.addEventListener('keydown', requestFullscreen, { once: true });

  // --- SSE with auto-reconnect ---
  let es = null;
  let reconnectDelay = 1000;

  function connectSSE() {
    if (es) { es.close(); es = null; }
    es = new EventSource('/events');

    es.onopen = () => { reconnectDelay = 1000; };

    es.onerror = () => {
      es.close();
      es = null;
      setTimeout(connectSSE, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    };

    es.addEventListener('cmd', (e) => {
      const payload = JSON.parse(e.data);
      switch (payload.cmd) {
        case 'next':     rotator.next(); break;
        case 'prev':     rotator.prev(); break;
        case 'mute': {
          const muted = soundEngine.toggleMute();
          prefs.set('flipoff_mute', muted);
          cpMute.classList.toggle('muted', muted);
          break;
        }
        case 'clock':
          keyboard._toggleClock();
          prefs.set('flipoff_clock', clockMode.active);
          cpClock.classList.toggle('active', clockMode.active);
          break;
        case 'vol-up':
        case 'vol-down': {
          const v = soundEngine.setVolume(soundEngine.volume + (payload.cmd === 'vol-up' ? 0.1 : -0.1));
          prefs.set('flipoff_volume', v);
          break;
        }
        case 'custom': {
          if (!payload.text) break;
          const msg = formatQuote(payload.text, '');
          // Strip the empty attribution row for custom messages
          msg[3] = '';
          rotator.stop();
          board.displayMessage(msg);
          setTimeout(() => rotator.start(), 60000);
          break;
        }
      }
    });
  }

  connectSSE();

  // --- Control panel ---
  const panel   = document.getElementById('control-panel');
  const cpClock = document.getElementById('cp-clock');
  const cpMute  = document.getElementById('cp-mute');
  const cpDim   = document.getElementById('cp-dim');
  let hideTimer = null;

  // Restore UI state from prefs
  cpMute.classList.toggle('muted', savedMuted);
  cpClock.classList.toggle('active', savedClock);

  function showPanel() {
    panel.classList.add('visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => panel.classList.remove('visible'), 3000);
  }

  document.addEventListener('mousemove', showPanel);
  panel.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  panel.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(() => panel.classList.remove('visible'), 1000);
  });

  document.getElementById('cp-prev').addEventListener('click', () => rotator.prev());
  document.getElementById('cp-next').addEventListener('click', () => rotator.next());

  document.getElementById('cp-clock').addEventListener('click', () => {
    initAudio();
    keyboard._toggleClock();
    cpClock.classList.toggle('active', clockMode.active);
    prefs.set('flipoff_clock', clockMode.active);
  });

  document.getElementById('cp-mute').addEventListener('click', () => {
    initAudio();
    const muted = soundEngine.toggleMute();
    cpMute.classList.toggle('muted', muted);
    prefs.set('flipoff_mute', muted);
  });

  cpDim.addEventListener('click', () => {
    const dimmed = dimMode.toggle();
    cpDim.classList.toggle('active', dimmed);
  });

  // Keep dim button in sync with auto-dim
  setInterval(() => cpDim.classList.toggle('active', dimMode.dimmed), 60000);
});
