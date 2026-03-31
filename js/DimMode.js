// Night hours — display dims automatically between these times
const DIM_START = 22; // 10pm
const DIM_END   = 7;  // 7am

export class DimMode {
  constructor() {
    this._timer = null;
    this._manualOverride = false; // true when user has manually toggled
    this.dimmed = false;
  }

  start() {
    this._apply();
    // Check every minute (aligns with ClockMode's minute ticks)
    this._timer = setInterval(() => {
      if (!this._manualOverride) this._apply();
    }, 60000);
  }

  stop() {
    clearInterval(this._timer);
    this._timer = null;
  }

  // Manual toggle from the control panel
  toggle() {
    this._manualOverride = true;
    this.dimmed = !this.dimmed;
    document.body.classList.toggle('dim', this.dimmed);
    // Clear manual override after the next scheduled boundary
    // so auto-dim takes over again tomorrow
    const msUntilNextHour = (60 - new Date().getMinutes()) * 60000;
    clearTimeout(this._overrideTimer);
    this._overrideTimer = setTimeout(() => {
      this._manualOverride = false;
    }, msUntilNextHour);
    return this.dimmed;
  }

  _isNightTime() {
    const h = new Date().getHours();
    return DIM_START <= 23
      ? h >= DIM_START || h < DIM_END   // spans midnight (e.g. 22–7)
      : h >= DIM_START && h < DIM_END;  // same-day range
  }

  _apply() {
    this.dimmed = this._isNightTime();
    document.body.classList.toggle('dim', this.dimmed);
  }
}
