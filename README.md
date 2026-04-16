# Typing Battle (Vanilla JS + Vite)

Simple singleplayer typing battle game inspired by a typing battle royale. Built with Vite, vanilla JavaScript, HTML and CSS. Deployable to GitHub Pages by building and publishing the `dist` folder.

Getting started

1. Install dependencies:

```powershell
npm install
```

2. Run dev server:

```powershell
npm run dev
```

3. Build for production (outputs to `dist`):

```powershell
npm run build
```

Files
- `index.html` - UI scaffolding
- `style.css` - styles (dark cyberpunk)
- `main.js` - game logic (startGame, updateTyping, calculateWPM, simulateAI, updateLeaderboard, endGame)

Notes for GitHub Pages
- Build via `npm run build`, then use `gh-pages` or the repository settings to publish the `dist` folder.
