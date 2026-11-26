# Talking avatar host: prototype and what is missing

Status on 2026-11-26 (evening): prototype built, not yet run against Azure. See "Prototype" at the end. Earlier status: not built. The game has a built-in host (Ace) who speaks with the TV browser's own voice. A realistic Azure avatar needs two things this page cannot provide on its own.

## Why it cannot be switched on from the page alone

- The avatar is streamed from Azure Speech over WebRTC. The browser needs a Speech key or a short-lived token, plus relay (ICE) details that are fetched with the key.
- This page is public. A key placed in it would be readable by anyone. So a small private server must hand out short-lived tokens.

## What is needed

1. An Azure Speech resource on the Standard S0 tier, in a region that offers the avatar feature.
2. A token address on James's Azure server (HTTPS, behind Caddy) that returns three things to the game page only:
   - a short-lived Speech token and the region,
   - the relay URL, username and credential from `GET /cognitiveservices/avatar/relay/token/v1` (called with the key on the server),
   - nothing else. The key never leaves the server.
3. The page side (to build once the token address exists, so it can be tested for real):
   - load the Speech SDK for JavaScript,
   - open an `RTCPeerConnection` with the relay details, add `video` and `audio` transceivers,
   - `new SpeechSDK.AvatarSynthesizer(speechConfig, avatarConfig)`, `startAvatarAsync(peerConnection)`,
   - send every host line through `speakTextAsync(text)` instead of the browser voice,
   - show the video where Ace stands now, and fall back to Ace when the avatar is not connected.

## Limits to design around (from Microsoft's guide)

- The connection drops after 5 minutes without speech, or after 30 minutes in total. The page must reconnect by itself and keep Ace speaking during the gap.
- Supported browsers are Chrome and Edge on Windows, Android, iOS and macOS (Safari on Apple devices). A TV's built-in browser is not on the list, so plan on a laptop or an Android device on HDMI.
- The network must allow outbound UDP 3478 and TCP 443 to `relay.communication.microsoft.com`.

## Cost

Microsoft's price page shows no numbers without signing in, so the per-minute price of the real-time avatar is not confirmed here. It is billed by time. Set a spending alert on the Speech resource before the first night, and close the connection whenever the show is paused or between games.

## Source

- How to use text to speech avatar with real-time synthesis: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech-avatar/real-time-synthesis-avatar

## Prototype (built 2026-11-26)

What exists now:

- `src/avatar.js`: the page side. It is off unless the TV page is opened with `?avatar=...`.
  - `?avatar=demo` shows the layout and the flow with a stand-in host and the browser's voice. No Azure needed.
  - `?avatar=https://YOUR-SERVER/avatar-token&ak=PASSWORD` connects to Azure through the token address. The address is remembered on that TV browser; `?avatar=off` forgets it.
- `tools/avatar_token_server.py`: the token address for the Azure server. It reads `SPEECH_KEY` (or `FOUNDRY_API_KEY`), `SPEECH_REGION` and `AVATAR_PASS` from `~/.foundry.env`, allows only the game's site, needs the password, and stops after 60 tokens a day.
- `test/avatar_shots.py`: demo screenshots, plus the real connection code run against a stand-in for Azure.

How a night runs with it:

1. OK is pressed on the TV. The page asks the token address for a 10-minute token and the relay details.
2. The page opens the video connection to Azure Speech and shows the avatar in a panel at the left. The stage moves over to make room.
3. Every host line (rules, whose turn, results, standings) is sent to the avatar instead of the browser voice. A new line cuts off the old one.
4. If the avatar is not connected, the built-in voice speaks the line, so the show never waits.
5. To limit cost the page hangs up when the show is paused or after 3 quiet minutes, and reconnects on the next line. It also renews the session before Azure's 30-minute limit.

Checked with a stand-in for Azure: the order of calls, lines going to the avatar, cut-off, hang-up on pause, and the fallback when the token address refuses.

Not checked, needs the real service: that the token and relay replies have the field names the server expects, that a token from a Foundry resource is accepted by the avatar service, picture quality, delay, and the price.

To switch it on (on the Azure server, where the Foundry sign-in works):

1. Confirm the Speech or Foundry resource is Standard S0 and in a region that offers avatars.
2. Add `SPEECH_REGION=...` and `AVATAR_PASS=...` to `~/.foundry.env`.
3. Run `python3 tools/avatar_token_server.py` and put it behind HTTPS in Caddy.
4. Open the TV link once with `?avatar=https://.../avatar-token&ak=...` in Chrome or Edge on a laptop.
