import { MESSAGES, MESSAGE_INTERVAL, TOTAL_TRANSITION } from './constants.js';
import { QuoteFetcher } from './QuoteFetcher.js';

export class MessageRotator {
  constructor(board) {
    this.board = board;
    this.fetcher = new QuoteFetcher();
    this._history = [];
    this._historyIndex = -1;
    this._timer = null;
    this._paused = false;
  }

  start() {
    // Seed with static quotes immediately so there's always something to show
    this.fetcher.setFallback(MESSAGES);

    // Kick off async load of the full quotes file
    this.fetcher.prefetch();

    this.next();
    this._startTimer();
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  next() {
    if (this._historyIndex < this._history.length - 1) {
      this._historyIndex++;
      this.board.displayMessage(this._history[this._historyIndex]);
    } else {
      const msg = this.fetcher.next();
      if (!msg) return;
      this._history.push(msg);
      this._historyIndex = this._history.length - 1;
      this.board.displayMessage(msg);
    }
  }

  prev() {
    if (this._historyIndex > 0) {
      this._historyIndex--;
      this.board.displayMessage(this._history[this._historyIndex]);
      this._resetAutoRotation();
    }
  }

  _startTimer() {
    this._timer = setInterval(() => {
      if (!this._paused && !this.board.isTransitioning) {
        this.next();
      }
    }, MESSAGE_INTERVAL + TOTAL_TRANSITION);
  }

  _resetAutoRotation() {
    if (this._timer) {
      clearInterval(this._timer);
      this._startTimer();
    }
  }
}
