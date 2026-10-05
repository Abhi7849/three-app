# three-app

A minimalist, high-performance 3D web scene built with **Three.js** and **Vite**, with a fully automated Playwright test loop and one-command ship pipeline.

## 🚀 Quick Start

```bash
npm install
npm run dev          # → http://localhost:5173
```

## 🎮 Controls

| Input | Action |
|---|---|
| **Drag** | Orbit camera |
| **Scroll** | Zoom in / out |
| **Right-drag** | Pan |

## 📦 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm test` | Run 10 Playwright tests |
| `npm run test:headed` | Tests with visible browser |
| `npm run test:ui` | Interactive Playwright UI |
| `npm run autofix` | Test loop (retries up to 5×) |
| `npm run ship -- "msg"` | Build → tests → commit → push |

## 🔄 Ship Pipeline

```
npm run ship -- "feat: added particle trails"
```

1. **Build** — Vite production build
2. **Test loop** — Playwright (auto-retries up to 5× on transient failures)
3. **Commit** — descriptive message
4. **Push** — to `origin/main` (skipped if no remote configured)

Add retries or target branch:
```bash
npm run ship -- "fix: timing" --tries 3 --branch develop
```

## 🔗 GitHub Setup (one-time)

1. Create a repo at [github.com/new](https://github.com/new) named `three-app`
2. Generate a token: **GitHub → Settings → Developer settings → Personal access tokens → Classic** (scope: `repo`)
3. Add remote:

```bash
git remote add origin https://<TOKEN>@github.com/<USERNAME>/three-app.git
git push -u origin main
```

After that, `npm run ship` pushes automatically.

## 🧪 Test Suite (10 tests)

| # | Test |
|---|---|
| 1 | Canvas rendered and sized |
| 2 | HUD overlay visible |
| 3 | HUD shows DRAG / SCROLL hints |
| 4 | Canvas has non-black pixels after animation tick |
| 5 | Page title correct |
| 6 | No console errors on load |
| 7 | Scroll-to-zoom changes screenshot |
| 8 | Scene animates over time |
| 9 | Drag orbit changes camera view |
| 10 | Resize without crash |

## 🏗 Project Structure

```
three-app/
├── index.html              # Entry point
├── src/
│   └── main.js             # Three.js scene
├── tests/
│   └── scene.spec.ts       # Playwright tests
├── scripts/
│   ├── ship.mjs            # Ship pipeline
│   └── autofix.mjs         # Retry test loop
├── playwright.config.ts    # Playwright config
├── vite.config.js          # Vite config
└── package.json
```

## 🌐 Scene Features

- Rotating cube with metallic material + wireframe overlay
- 4 orbiting satellites (tetrahedron, octahedron, icosahedron, torus)
- 2500-star particle field with slow drift
- Animated ring with scale pulse
- Dynamic blue + pink point lights
- ACES filmic tone mapping
- Orbit controls with damping
- Live FPS counter HUD
- Exponential fog
