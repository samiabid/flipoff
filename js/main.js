import { Board } from './Board.js';
import { SoundEngine } from './SoundEngine.js';
import { MessageRotator } from './MessageRotator.js';
import { KeyboardController } from './KeyboardController.js';
import { ClockMode } from './ClockMode.js';

document.addEventListener('DOMContentLoaded', () => {
  const boardContainer = document.getElementById('board-container');
  const soundEngine = new SoundEngine();
  const board = new Board(boardContainer, soundEngine);
  const rotator = new MessageRotator(board);
  const clockMode = new ClockMode(board);
  const keyboard = new KeyboardController(rotator, soundEngine, clockMode);

  // Initialize audio on first user interaction (browser autoplay policy)
  let audioInitialized = false;
  const initAudio = async () => {
    if (audioInitialized) return;
    audioInitialized = true;
    await soundEngine.init();
    soundEngine.resume();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
  };
  document.addEventListener('click', initAudio);
  document.addEventListener('keydown', initAudio);

  // Start message rotation
  rotator.start();

  // Auto-fullscreen on first interaction (works great with Android TV remote)
  let fullscreenRequested = false;
  const requestFullscreen = () => {
    if (fullscreenRequested || document.fullscreenElement) return;
    fullscreenRequested = true;
    document.documentElement.requestFullscreen().catch(() => {});
  };
  document.addEventListener('click', requestFullscreen, { once: true });
  document.addEventListener('keydown', requestFullscreen, { once: true });

  // Listen for commands from the phone remote via SSE
  const es = new EventSource('/events');
  es.addEventListener('cmd', (e) => {
    const { cmd } = JSON.parse(e.data);
    switch (cmd) {
      case 'next':     rotator.next(); break;
      case 'prev':     rotator.prev(); break;
      case 'mute':     soundEngine.toggleMute(); break;
      case 'clock':    keyboard._toggleClock(); break;
      case 'vol-up':   soundEngine.setVolume(soundEngine.volume + 0.1); break;
      case 'vol-down': soundEngine.setVolume(soundEngine.volume - 0.1); break;
    }
  });

  // Control panel — show on mouse movement, hide after 3s idle
  const panel     = document.getElementById('control-panel');
  const cpClock   = document.getElementById('cp-clock');
  const cpMute    = document.getElementById('cp-mute');
  let hideTimer   = null;

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
  });

  document.getElementById('cp-mute').addEventListener('click', () => {
    initAudio();
    const muted = soundEngine.toggleMute();
    cpMute.classList.toggle('muted', muted);
    cpMute.querySelector('svg').style.opacity = muted ? '0.5' : '1';
  });

});
