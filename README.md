# Rain Check!

A family game show for rainy days. The TV shows the show, every phone is a buzzer and answer pad. No app, no accounts.

**Play:** https://jcason-sudo.github.io/raincheck/

## How to run a game

1. Open the link on the screen everyone can see and choose **This is the TV screen**. Press OK once to turn on sound.
2. Each player scans the QR code (or opens the link and types the 4-letter room code), enters a name and picks a team.
3. Each player answers three secret surveys. They feed the last round.
4. The first player to join runs the show. Their phone gets **Start**, **Next** and **Pause**.

On a laptop, Space or Enter is Next, P is Pause, M opens the menu.

## The five rounds

| Round | How it works |
|---|---|
| Everybody Votes | Everyone answers on their phone. A team scores the share of its players who are right, so uneven teams stay fair. |
| The Board | Pick a category and value, buzz in, answer on your phone. A miss lets the other team steal. |
| Zoom In | A drawing of a famous place zooms out or uncovers tile by tile. Buzz early for more points. |
| Phrase Fever | Take turns on letters. Anyone can hit Solve and type the phrase. Five misses lose the puzzle. |
| Survey Says | Top 5 answers from this family's own secret surveys. Three strikes and the other team can steal. |

## How it is built

- `index.html` is the whole game in one file. `node build.js` rebuilds it from `src/`.
- `src/content.js` holds every question, phrase and survey. The first option of each question is the right answer. Edit it to add your own.
- `src/engine.js` is the rules, with no screen or network code. `node test/engine.test.js` plays 300 simulated games.
- `src/app.js` is the TV screen, the phone screen and the relay connection.
- Phones and TV talk through free public MQTT relays (EMQX, Eclipse, HiveMQ, Mosquitto) over secure websockets. The page connects to all four and needs only one to work.

## Limits to know

- The relays are public test services with no uptime promise. Room traffic (first names, answers) is not private. Do not type anything sensitive.
- The TV page is the game's brain. Keep it open. If it reloads, it picks the game back up.
- The host voice uses the browser's built-in speech. Some TV browsers have none; the host's words still show on screen.
