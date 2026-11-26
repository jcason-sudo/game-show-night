# Rain Check!

A family game show for rainy days. The TV shows the show, every phone is a buzzer and answer pad. No app, no accounts.

**Play:** https://jcason-sudo.github.io/raincheck/

## How to run a show

1. Open the link on the screen everyone can see and choose **This is the TV screen**. Press OK once to turn on sound.
2. Each player scans the QR code (or opens the link and types the 4-letter room code), enters a name and picks a team (no team pick when the show is set to every player for themselves).
3. The first player to join runs the show. Their phone shows the **game menu**: tap any game to start it.
4. When a game ends, the menu comes back. Pick the next one, replay one, or tap **Finish the show** to crown a winner.

During a game the showrunner's phone has **Next** (on score and answer screens), **Skip this one**, **Pause** and **Menu**. Menu holds **Back to the game menu**, score fixes and a list of each phone's connection quality.

The TV can run the menu too: every game on the menu screen is a button, and on a laptop Space or Enter is Next, P is Pause, M opens the menu.

## Teams or every player for themselves

The showrunner's menu has **How do you want to play?** with two choices: **Two teams** or **Every player for themselves**. Set it in the lobby or between games. Either way every player has their own points, and the TV shows the full ranking after each game and at the end.

## The eleven games

Play them in any order, as many times as you like. "Short rounds" on the menu trims every game.

| Game | How it works |
|---|---|
| Everybody Votes | Everyone answers on their phone. A team scores the share of its players who are right, so uneven teams stay fair. |
| Most Likely To | No trivia. Vote for the person in the room who fits. You score when you vote with the biggest group. |
| The Board | One player picks a category and value. Then everyone answers on their own phone, with 20 seconds on the clock. Every right answer scores the tile, and the fastest right answer earns half the tile on top. There is no buzzer. |
| True or False Blitz | A statement, 12 seconds, true or false. |
| Zoom In | A drawing of a famous place zooms out or uncovers tile by tile. Buzz early for more points. |
| Closest Call | Every answer is a number. Everyone types a guess. Closest wins 150. |
| Phrase Fever | Take turns on letters. Anyone can hit Solve and type the phrase. Five misses lose the puzzle. |
| Name That Decade | Something happened. Pick the decade. |
| Word Scramble | Unscramble the word. First in wins 150, everyone else can still score 40. |
| Crillion | Everyone types one answer to the same question. A correct answer scores 100 minus the number of people out of 100 who would say it. If someone else in the room types the same answer, those players split the points, so the answer nobody else thought of wins. A wrong answer scores zero. In team play a team gets the average of its players. |
| Survey Says | Find the top 5 answers. Three strikes and the other team can steal. The numbers are the show's own made-up poll of 1,000 people, not a real survey. |

The look is "Studio 74", a 1970s game-show set: cocoa, mustard, orange and teal, with a marquee board and a dome buzzer.

## How it is built

- `index.html` is the whole game in one file. `node build.js` rebuilds it from `src/`.
- `src/content.js` holds every question, phrase and survey. The first option of each question is the right answer. Edit it to add your own.
- `src/engine.js` is the rules, with no screen or network code. `node test/engine.test.js` plays 300 simulated shows, team and solo. `test/repro_vote.py` with `test/zombie-proxy.js` reproduces a phone whose connection has gone silent.
- A Next tap only counts for the screen it was tapped on, and not in the first second after a screen opens. This stops a double tap from skipping the question that just came up. Answer buttons also ignore taps for half a second after they appear.
- Every Crillion question has 30 to 70 right answers on its sheet, so a room of 12 does not pile onto the same few.
- Crillion is judged by a built-in answer sheet for each question (`crillion` in `src/content.js`, with made-up "said by" numbers). An answer that is not on the sheet goes to the showrunner's phone as Correct or Wrong. `judgeUrl` in `src/content.js` is a hook for a private AI judge: when it holds an address, the TV sends off-sheet answers there first. It is empty by default, so no AI is called.
- Typed answers (Crillion, Phrase Fever, Word Scramble) do not need perfect spelling. The engine accepts an answer that is a few letters off or that sounds the same ("Kolumbeea" for Colombia). `node test/fuzzy.test.js` checks misspellings that must pass and different words that must not.
- `src/app.js` is the TV screen, the phone screen and the relay connection.
- Phones and TV talk through free public MQTT relays (EMQX, Eclipse, HiveMQ, Mosquitto) over secure websockets. The page connects to all four and needs only one to work.

## Limits to know

- The relays are public test services with no uptime promise. Room traffic (first names, answers) is not private. Do not type anything sensitive.
- The TV page is the game's brain. Keep it open. If it reloads, it picks the game back up.
- A phone that leaves the browser (camera, messages) loses its connection. It reconnects by itself about 5 seconds after it comes back, and it keeps resending a tap until the TV confirms it.
- The host voice uses the browser's built-in speech. Some TV browsers have none; the host's words still show on screen.
