# Talking avatar host: plan and what is missing

Status on 2026-11-26: not built. The game has a built-in host (Ace) who speaks with the TV browser's own voice. A realistic Azure avatar needs two things this page cannot provide on its own.

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
