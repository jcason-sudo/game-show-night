# Game Show Night

Game shows for the whole family. The TV is the stage, every phone is a controller. No app, no accounts.

**Play:** https://jcason-sudo.github.io/game-show-night/

## How to run a night

1. Open the link on the screen everyone can see and choose **This is the TV screen**. Press OK once to turn on sound.
2. **Host first.** The TV shows a host code. The person running the night scans it (or opens the link, types the room code, and types the host code on the join screen). Only that phone controls the night.
3. The TV then shows the code for everyone else. Each player scans it and types a name. A night starts with no teams.
4. Teams are the host's call. On the host's phone, tap 2, 3, 4 or 5 teams: everyone is dealt out evenly. Type the team names (Family Casey, Kids, Adults...), tap a team next to a name to move that person, or let people tap their own team on their phone.
5. The host taps a game. When it ends, the game list comes back: pick the next one, or finish the night to crown a winner.

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

- Tap before GO: you lose 50 points (so does your team). You are not knocked out; you can buzz again after GO. Every early tap costs another 50.
- After GO, each phone measures how long its owner took to tap. Everyone who buzzes within half a second of the first buzz to arrive is compared on that reaction time, so a slow connection does not lose the race.
- In Zoom In a wrong answer after buzzing costs 50 points.

## The twelve games

| Game | How it works |
|---|---|
| Everybody Votes | A question with four choices. Everyone answers. A team scores the share of its players who are right. |
| Most Likely To | Vote for the person in the room who fits best. You score when you vote with the biggest group. |
| The Board | The TV names whose turn it is to pick a category and value. Then everyone answers on their own phone, 20 seconds. Every right answer scores; the fastest right answer earns a bonus and picks next. |
| True or False Blitz | A statement, 12 seconds. |
| Know Your Family | Everyone types one true thing about themselves that most people do not know. The game hides it among three made-up facts on the same topic. Everybody else votes for the true one: 100 points for picking it, and the person scores for everyone they fool. |
| Zoom In | A real photograph of a famous place starts close up and slightly soft, then pulls back over 45 seconds. It starts six times closer than the full picture and is sharp after about 15 seconds. Wait for GO, then buzz. The earlier you get it, the more it is worth (500 down to 100). |
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
- Zoom In has 50 photographs (in `img/zoom/`). A game shows five, so it takes ten games before one repeats. The photographers and licences are in [CREDITS.md](CREDITS.md), and each credit shows under the picture once the answer is revealed (not before, so it cannot give the place away).
- The page is plain ES5 with flexbox so it also runs on older TV browsers.

## Files

- `src/content.js` holds every question, phrase, survey and answer sheet.
- `src/engine.js` holds the rules. It has no screen and no network, so it can be tested alone.
- `src/app.js` is the TV screen, the phone controller and the relay connection.
- `build.js` packs everything into the single `index.html`.

- In Know Your Family the made-up facts come from a bank of 270 written in advance (`fam` in `src/content.js`), matched to the topic of what the player typed and to whether they said they are a kid or a grown-up. They are not written live by an AI model; that needs a private server with a model key.

- Crillion questions with a complete list of right answers (countries, U.S. states and capitals, presidents, NFL and NBA teams, elements) are marked `closed` in `src/content.js`. On those, an answer that is not on the list is wrong and scores nothing; it never goes to the host to judge. Open questions (fruits, birds, dog breeds...) still send an unknown answer to the host.

- Know Your Family fixes the spelling of each typed fact before it goes on the TV, so a typo does not give the true one away. It runs in the page with no server: `src/spell.js` holds 22,000 common English words to correct towards and a bit filter of 50,000 rarer English, Spanish and Portuguese words that are left alone. Names with a capital, players' names and words with accents are never changed. Rebuild the data with `node tools/make_spell.js`.
- Sound: when OK is pressed on the TV the host says a sound-check line, and the corner of the TV shows `Voice on`, `No voice in this browser` or `Voice is not working here`. Menu > Test the sound repeats the check. The voice is the browser's own; Chrome or Edge on a laptop has one, many TV browsers do not.

- Avatar host (prototype, off by default): add `?avatar=demo` to the link to see where a talking avatar would stand and how the show flows. The real Azure connection needs a token address on a private server; see `docs/avatar-plan.md`.

## Tests

- `node test/engine.test.js` plays 300 simulated nights (2 to 5 teams and no teams) and checks the host, team, buzzer, Crillion and no-repeat rules.
- `node test/fuzzy.test.js` checks spelling tolerance.
- `python3 test/e2e.py [2|3|4|5|solo]` plays a full night in real browsers against a local relay (`node test/serve.js`).
- `python3 test/host_tour.py` plays the host: it taps every host control once and checks the result.
- `python3 test/zoom_shots.py` plays two Zoom In pictures at TV size and saves screenshots through the minute-long pull-back.
- `python3 test/fam_shots.py` plays Know Your Family with four phones and saves screenshots.
- `python3 test/teams_shots.py` checks that people join with only a name and that the host can make, name and fill teams.
- `python3 test/avatar_shots.py` shows the avatar demo and runs the connection code against a stand-in for Azure.
