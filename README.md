# Genshin Impact Training Guide

An enhanced dashboard for tracking which characters you're building and planning their upgrades. Built to mirror the in-game Training Guide feature, but allowing more than 4 characters to be tracked simultaneously.

Pick a character, set your current and desired levels, and see an itemized training plan with all the EXP, materials, and Mora you'll need.

All game data is sourced from [genshin-db](https://github.com/theBowja/genshin-db), while all user data is stored locally in your browser's local storage. No data is sent to any server.

## Feature Parity

This project aims to provide feature parity with the in-game Training Guide, while adding the ability to track multiple characters simultaneously.

### ✅ Implemented

These features from the in-game Training Guide have been implemented:

- Character selection
- Current and desired character level selection
- Current and desired talent level selection
- Level-by-level breakdown of EXP and ascension materials required

### ❌ Not Yet Implemented

These features from the in-game Training Guide have not yet been implemented:

- Weapon selection
- Current and desired weapon level selection
- Level-by-level breakdown of EXP and ascension materials required for weapons
- Artifact selection
- Current and desired artifact level selection
- Level-by-level breakdown of EXP and ascension materials required for artifacts

## Nerd Info

### Tech stack

- [Astro](https://astro.build) + [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (Base UI)
- [genshin-db](https://github.com/theBowja/genshin-db) for character and material data

### Getting started

```bash
bun install
bun dev
```

### Scripts

| Command           | Action                             |
| ----------------- | ---------------------------------- |
| `bun dev`         | Start the dev server               |
| `bun build`       | Build for production               |
| `bun preview`     | Preview the production build       |
| `bun lint`        | Run ESLint                         |
| `bun typecheck`   | Run Astro/TypeScript checks        |
| `bun format`      | Format with Prettier               |
