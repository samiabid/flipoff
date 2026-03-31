# FlipOff.

**Turn any TV into a retro split-flap display.** The classic flip-board look, without the $3,500 hardware. And it's free.

![FlipOff Screenshot](screenshot.png)

## What is this?

FlipOff is a free, open-source web app that emulates a classic mechanical split-flap (flip-board) airport terminal display — the kind you'd see at train stations and airports. It runs full-screen in any browser, turning a TV or large monitor into a beautiful retro display.

No accounts. No subscriptions. No $199 fee.

## Features

- Realistic split-flap animation with colorful scramble transitions
- Authentic mechanical clacking sound (recorded from a real split-flap display)
- 150+ bundled quotes, randomly shuffled — works fully offline
- Clock mode — shows date and time, flipping on every minute
- Hover control panel — move your pointer to the top of the screen for on-screen controls
- Phone remote — control the display from your phone over your local network
- Volume control and mute
- Auto-fullscreen on first interaction
- TV-first layout — dark, full-screen, no browser chrome
- Responsive from mobile to 4K

## Quick Start

Requires Node.js (for the remote control server).

```bash
git clone https://github.com/samiabid/flipoff.git
cd flipoff
node server.js
# Open http://localhost:8080 on your display
# Open http://localhost:8080/remote.html on your phone
```

On a TV on the same network, navigate to `http://<your-machine-ip>:8080`.

## Controls

### On-screen panel
Move the mouse/pointer to the top of the screen. A control bar slides down with buttons for Prev, Next, Clock, and Sound.

### Keyboard / TV remote (D-pad)

| Key | Action |
|-----|--------|
| `Enter` / `Space` / `→` | Next quote |
| `←` | Previous quote |
| `↑` | Toggle clock mode |
| `F` | Toggle fullscreen |
| `M` | Toggle mute |
| `C` | Toggle clock mode |
| `Escape` | Exit fullscreen |

### Phone remote

Open `http://<your-machine-ip>:8080/remote.html` on your phone. Buttons for Prev, Next, Clock, Mute, and Volume. State stays in sync between the remote and the display in real time.

## Clock Mode

Pressing `↑` (D-pad up on Android TV), `C`, or the Clock button in the panel or remote switches the board to a live clock:

```
       FRI 27 MAR 2026
          10:45 PM
```

The board flips exactly on the minute. The flip sound only plays on the hour. Press the same button again to return to quotes.

## Customisation

### Quotes

Edit `data/quotes.json` — plain JSON array, one object per quote:

```json
[
  { "text": "Your quote here.", "author": "Author Name" },
  ...
]
```

Quotes are shuffled randomly on every load and start at a random position. The board wraps to the beginning after cycling through all quotes.

**Supported characters:** `A–Z 0–9 . , - ! ? ' / : space`

**Max length:** quotes are word-wrapped across up to 3 rows of 22 characters each.

### Timing

Edit `js/constants.js`:

| Constant | Default | Description |
|----------|---------|-------------|
| `MESSAGE_INTERVAL` | `600000` | How long each quote is displayed (10 minutes) |
| `SCRAMBLE_DURATION` | `800` | Duration of the scramble animation (ms) |
| `STAGGER_DELAY` | `25` | Per-tile stagger delay (ms) |
| `GRID_COLS` / `GRID_ROWS` | `22` / `5` | Board dimensions |

### Colors

`SCRAMBLE_COLORS` and `ACCENT_COLORS` in `js/constants.js` control the colors used during transitions and the accent squares.

## File Structure

```
flipoff/
  index.html              — Main display page
  remote.html             — Phone remote control page
  server.js               — Node.js server (static files + SSE remote control)
  data/
    quotes.json           — Quote library (edit to customise)
  css/
    reset.css             — CSS reset
    layout.css            — Page layout and control panel
    board.css             — Board container and accent bars
    tile.css              — Tile styling and 3D flip animation
    responsive.css        — Media queries for all screen sizes
  js/
    main.js               — Entry point and UI wiring
    Board.js              — Grid manager and transition orchestration
    Tile.js               — Individual tile animation logic
    SoundEngine.js        — Audio playback with Web Audio API and volume control
    MessageRotator.js     — Quote rotation using QuoteFetcher
    QuoteFetcher.js       — Loads and shuffles quotes from data/quotes.json
    ClockMode.js          — Live clock display, updates on the minute
    KeyboardController.js — Keyboard and D-pad shortcut handling
    constants.js          — Configuration (grid size, timing, colors)
    flapAudio.js          — Embedded audio data (base64)
```

## License

MIT — do whatever you want with it.
