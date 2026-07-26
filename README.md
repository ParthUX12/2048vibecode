# 2048

A polished, accessible implementation of the classic 2048 sliding-tile puzzle, built with React, TypeScript, and Vite.

## Project Overview

2048 is a single-player puzzle played on a 4×4 grid. On each turn the player slides all tiles in one of four directions (up, down, left, right). Tiles slide as far as they can; when two tiles of the same value collide they merge into one tile of double the value. After every move a new tile (2 or 4) appears in a random empty cell. The goal is to create a 2048 tile. The game ends when the board is full and no merges are possible.

This implementation focuses on a clean, fluid, fully-responsive layout driven by CSS custom properties (no media-query breakpoints needed for the core layout), smooth slide/merge/pop animations, keyboard and touch input, one-level undo, and persistent best score.

## Features

- Classic 4×4 2048 gameplay with single-merge-per-move rule
- Smooth CSS slide animations (180ms ease) on tile movement
- Pop-in animation for newly spawned tiles and merge-flash for merged tiles
- Keyboard controls: Arrow keys and WASD
- Touch / swipe controls with a 40px threshold and dominant-axis detection
- One-level undo of the last move (disabled on first render and immediately after use)
- Persistent best score via localStorage
- Win overlay with Continue and New Game options
- Game-over overlay with final score and New Game
- Fully responsive, fluid layout using CSS custom properties and `min()` / `clamp()`
- Accessibility: ARIA grid roles, live score region, labelled controls, visible focus rings
- Respects `prefers-reduced-motion`

## Tech Stack

- **React 18** — UI library
- **TypeScript** — type safety (strict mode)
- **Vite** — dev server and build tool
- **Tailwind CSS** — available in the template; this project primarily uses a custom CSS design system in `src/styles/global.css`
- **lucide-react** — icon library (available; UI uses minimal custom markup)

## AI-Assisted Development Workflow

This project was built using an AI-assisted workflow:

1. **Spec authoring** — a detailed design system, folder structure, and behavioural spec were written first, covering colours, typography, layout, game logic, state management, controls, animations, accessibility, and quality checks.
2. **Single-pass implementation** — the AI generated all source files (types, pure game logic, hooks, components, styles, docs) in one cohesive pass following the spec.
3. **Verification** — `npm run build` was run to confirm zero TypeScript errors and a successful production build. Manual UI verification of the golden path (move, merge, win, continue, game over, undo, new game) is recommended in the dev server.

## Architecture Overview

```
src/
  types/index.ts          # Shared types: Direction, Tile, GameState
  utils/gameLogic.ts      # Pure game logic (no React): init, spawn, move, win/over checks
  hooks/useLocalStorage.ts # Generic localStorage-backed state hook
  hooks/useGame.ts        # useReducer-based game state + keyboard/swipe input wiring
  components/
    Board.tsx             # 4×4 grid background + absolutely-positioned tile layer
    Tile.tsx              # Single tile, positioned via CSS custom properties
    Header.tsx            # Title + New Game / Undo buttons
    ScoreBoard.tsx        # Score / Best / Moves stat cards (aria-live)
    Overlay.tsx           # Win / Game-over overlay
  styles/global.css       # Design system: custom properties, layout, animations
  App.tsx                 # Composition root
  main.tsx                # React entry point
```

**State flow:** `useGame` exposes `state` plus action callbacks. `move()` is a pure function that returns new tiles, a score delta, and a `moved` flag; the reducer spawns a new tile only when `moved` is true, updates score/best, snapshots the previous state for undo, and checks win/over conditions.

**Rendering:** The board is a CSS Grid of 16 empty cells. Tiles live in an absolutely-positioned layer; each tile's `top`/`left` are computed from its `row`/`col` using the `--gap` and `--tile-size` custom properties, so CSS transitions on `top`/`left` produce smooth slides.

## Accessibility Considerations

- Board wrapper uses `role="grid"` with `aria-label="2048 game board"`.
- Empty cells and tiles use `role="gridcell"`; tiles announce `aria-label="Tile {value}"`.
- The score region is marked `aria-live="polite"` and `aria-atomic="true"` so screen readers announce updates.
- Undo and New Game buttons have descriptive `aria-label`s.
- All interactive elements show a visible focus ring (`outline` on `:focus-visible`).
- Animations are disabled when the user has `prefers-reduced-motion: reduce` set.

## Performance Optimisations

- Tile IDs are stable (`crypto.randomUUID()`) across moves so React keys are stable; this lets the browser animate `top`/`left` transitions instead of re-mounting nodes.
- Game logic is pure and allocation is minimal per move.
- `will-change: top, left` on tiles hints the compositor for smoother animation.
- Best score is written to localStorage only when it actually increases.
- No layout thrash: the board uses CSS Grid + absolute positioning rather than JS-driven transforms.

## Setup Instructions

```bash
npm install
npm run dev
```

Open the URL printed by Vite in your browser.

## Deployment

```bash
npm run build
```

This produces a static `dist/` folder. Deploy the contents of `dist/` to any static host — for example Netlify:

- Drag-and-drop the `dist/` folder onto the Netlify dashboard, or
- Connect the repository and set the build command to `npm run build` and the publish directory to `dist`.
