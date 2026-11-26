# Game Night!

Game shows for the whole family. The TV is the stage, every phone is a controller. No app, no accounts.

**Play:** https://jcason-sudo.github.io/raincheck/

## How to run a night

1. Open the link on the screen everyone can see and choose **This is the TV screen**. Press OK once to turn on sound.
2. **Host first.** The TV shows a host code. The person running the night scans it (or opens the link, types the room code, and types the host code on the join screen). Only that phone controls the night.
3. The TV then shows the code for everyone else. Each player scans it, types a name and picks a team.
4. The host taps a game. When it ends, the game list comes back: pick the next one, or finish the night to crown a winner.

Whoever joins first is not the host. Only the phone that scanned the host code is. To hand the night to someone else, use **Menu > Change the host** on the TV; it shows a fresh host code and the old one stops working.

## What the host can do

On the host's phone, the bar at the bottom has **Next / Skip this one**, **Pause** and **Host**. The Host panel holds:

| Control | What it does |
|---|---|
| Pause / Resume | Stops every clock and freezes the phones |
| Skip this question | Goes straight to the answer |
| Restart this game | Plays the current game again from its rules screen; scores go back to where the game began |
| Pick a different game | Leaves the game and returns to the game list |
| Finish the night | Shows the winner |
| New night | Same players and teams, scores back to zero |
| Start over | Everyone has to type a name and pick a team again; the host stays the host |
| Players | Move any player to another team (any time), remove a player, let a removed player back in, see each phone's signal |
| Teams | No teams (every player for themselves), or 2, 3, 4 or 5 teams; shuffle everyone into even teams; rename teams; add or take 50 points |
| Short games | Fewer questions per game |

Destructive buttons ask for a second tap. The number of teams can change in the lobby or between games.

The TV has a Menu too (also Space or Enter for Next, P for Pause, M for Menu on a laptop).

## The buzzer

Zoom In and the Survey Says face-off use a buzzer. The button says **WAIT** and is grey. After a pause nobody can predict, it turns green and says **GO**.

- Tap before GO: you are out for that picture or face-off and lose 50 points (so does your team).
- After GO, each phone measures how long its owner took to tap. Everyone who buzzes within half a second of the first buzz to arrive is compared on that reaction time, so a slow connection does not lose the race.
- In Zoom In a wrong answer after buzzing costs 50 points.

## The eleven games

| Game | How it works |
|---|---|
| Everybody Votes | A question with four choices. Everyone answers. A team scores the share of its players who are right. |
| Most Likely To | Vote for the person in the room who fits best. You score when you vote with the biggest group. |
| The Board | The TV names whose turn it is to pick a category and value. Then everyone answers on their own phone, 20 seconds. Every right answer scores; the fastest right answer earns a bonus and picks next. |
| True or False Blitz | A statement, 12 seconds. |
| Zoom In | A famous place comes into view. Wait for GO, then buzz. |
| Closest Call | Every answer is a number. Closest guess wins. |
| Phrase Fever | Take turns picking letters. Anyone can try to solve. Close spelling counts. |
| Name That Decade | Something happened. In which decade? |
| Word Scramble | Unscramble the word. First in wins 150, everyone else can still earn 40. Close spelling counts. |
| Crillion | Everyone types one answer to the same question. The more obscure the answer, the more it is worth: Everybody says it 10, Common 30, Rare 60, Deep cut 85, One in a million 100. If two players type the same answer they split the points. The single most obscure answer in the room wins 50 extra. Spelling does not matter. A wrong answer scores zero. |
| Survey Says | Find the top 5 answers of 1,000 imaginary people. Wait for GO, then buzz. Three strikes and the next team can steal. |

Questions do not repeat until a game's whole pool has been used. The TV remembers what it has shown, also across nights.

## Notes and limits

- Phones talk to the TV through four free public message relays at once. Nothing is installed and nothing is stored on a server.
- Close and sound-alike spelling is accepted in Crillion, Phrase Fever and Word Scramble. Words of three letters or fewer must be exact.
- Crillion is judged by a built-in answer sheet for each question (`crillion` in `src/content.js`; the "how many people would say it" numbers are estimates written by hand, not a poll). An answer that is not on the sheet goes to the host's phone as Correct or Wrong. `judgeUrl` in `src/content.js` is a hook for a private AI judge; it is empty by default, so no AI is called.
- The host character (Ace) talks using the TV browser's built-in voice. Some TV browsers have no voice; the words still show in the speech bubble.
- Zoom In has only eight pictures, so it repeats sooner than the other games.
- The page is plain ES5 with flexbox so it also runs on older TV browsers.

## Files

- `src/content.js` holds every question, phrase, survey and answer sheet.
- `src/engine.js` holds the rules. It has no screen and no network, so it can be tested alone.
- `src/app.js` is the TV screen, the phone controller and the relay connection.
- `build.js` packs everything into the single `index.html`.

## Tests

- `node test/engine.test.js` plays 300 simulated nights (2 to 5 teams and no teams) and checks the host, team, buzzer, Crillion and no-repeat rules.
- `node test/fuzzy.test.js` checks spelling tolerance.
- `python3 test/e2e.py [2|3|4|5|solo]` plays a full night in real browsers against a local relay (`node test/serve.js`).
- `python3 test/host_tour.py` plays the host: it taps every host control once and checks the result.
