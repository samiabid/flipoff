const DAYS   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export class ClockMode {
  constructor(board) {
    this.board = board;
    this.active = false;
    this._minuteTimer = null;
    this._alignTimer = null;
  }

  start() {
    this.active = true;
    this._tick();

    // Align to the next minute boundary, then tick every 60s
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50;
    this._alignTimer = setTimeout(() => {
      this._tick();
      this._minuteTimer = setInterval(() => this._tick(), 60000);
    }, msToNextMinute);
  }

  stop() {
    this.active = false;
    clearTimeout(this._alignTimer);
    clearInterval(this._minuteTimer);
    this._alignTimer = null;
    this._minuteTimer = null;
  }

  _tick() {
    if (!this.active) return;
    const now = new Date();

    const day   = DAYS[now.getDay()];
    const date  = now.getDate();
    const month = MONTHS[now.getMonth()];
    const year  = now.getFullYear();

    let   h    = now.getHours();
    const m    = String(now.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;

    const dateLine = `${day} ${date} ${month} ${year}`;  // e.g. "FRI 27 MAR 2026" (15 chars)
    const timeLine = `${h}:${m} ${ampm}`;                // e.g. "10:45 PM" (8 chars)

    const onTheHour = now.getMinutes() === 0;
    this.board.displayMessage(['', dateLine, '', timeLine, ''], { silent: !onTheHour });
  }
}
