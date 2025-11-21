# Hall of Shame

Party game for EA FC 26 Pro Clubs where a host opens a lobby, everyone joins, and the squad votes on who deserves the Hall of Shame crown. Rounds run on a countdown, record votes per round, and roll everything up to a final “overall loser” when the session is ended, and the Wheel of Misfortune is used if there's a draw.

## Features
- Create/join sessions with a short code; host controls round flow.
- 60s voting timer with live leaderboard after you cast your ballot.
- Self-votes allowed; votes stored per round and across the session for final totals.
- Tie detection and Wheel of Misfortune to break ties or pick the ultimate loser.
- Multiple rounds per session; host can start another round or end the session.

## Getting Started
**Prerequisites:** Node.js 18+ and npm.

1) Install dependencies  
`npm install`

2) Configure Firebase (see `.env`)  
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

3) Run the app  
`npm run dev`

## Scripts
- `npm run dev` — start the Vite dev server.
- `npm run build` — production build.
- `npm run preview` — preview the production build locally.

## Gameplay Flow
1) Host creates a session and shares the code.  
2) Players join and wait in the lobby.  
3) Host starts a voting round (60s timer).  
4) Everyone votes (including themselves). Live leaderboard shows progress.  
5) Round ends automatically when time is up or everyone has voted; results are shown with options to start another round or end the session.  
6) When the session ends, totals across all rounds are used to pick the overall loser (Wheel for ties).

## Tech Stack
- React + Vite + TypeScript  
- Firebase (Firestore)  
- Recharts for leaderboards
