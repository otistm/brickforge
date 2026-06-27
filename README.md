# BrickForge

A 3D LEGO-style builder and parts planner. Place bricks, slopes, arches and more on a
baseplate, watch a live "Pick a Brick"-style shopping list build itself, generate printable
step-by-step instruction booklets, and share builds via URL.

Built with [Three.js](https://threejs.org/) and bundled with [Vite](https://vitejs.dev/) +
TypeScript.

## Getting started

```bash
npm install
npm run dev       # start the dev server
```

Then open the printed local URL (default http://localhost:5173).

## Scripts

| Script              | Description                                      |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start the Vite dev server with HMR.              |
| `npm run build`     | Type-check then build a static bundle to `dist`. |
| `npm run preview`   | Serve the production build locally.              |
| `npm run typecheck` | Run `tsc --noEmit`.                              |

## Project structure

```
index.html              Markup only; loads src/main.ts as a module
src/
  main.ts               Entry point: wires hooks, UI, input and the render loop
  config/               Pure data tables (no DOM, no Three.js)
    constants.ts        Stud/plate sizing and baseplate dimensions
    colors.ts           LEGO color palette (name + hex)
    shapes.ts           Shape definitions and size tables
    pricing.ts          Pick a Brick price estimate + service-fee logic
  core/
    types.ts            Shared TypeScript interfaces/types
    store.ts            Shared mutable state (bricks, occupancy, selection, view flags)
  engine/               Three.js layer
    scene.ts            Renderer, camera, lights, baseplate, shadow catcher
    geometry.ts         Geometry builders per shape
    pieceFactory.ts     Mesh/material factory for placed pieces
    bricks.ts           Add/remove bricks, occupancy and validity checks
    placement.ts        Raycasting: screen -> grid cell, pick a brick
    ghost.ts            Translucent placement preview
    highlight.ts        Erase-tool hover highlight
    cameraControls.ts   Orbit/pan/zoom + tap-to-place/erase input
    loop.ts             Resize handling and the render loop
  features/
    pieceSvg.ts         2D SVG thumbnails for the inventory + booklet
    inventory.ts        Live parts list, totals and fee logic
    serialize.ts        Save/load, share encode/decode, camera framing
    shareIo.ts          Share link, JSON import/export, PNG export
    display.ts          Presentation/display mode
    booklet.ts          Step capture + printable instruction booklet
  ui/
    dom.ts              Typed element lookup helpers
    toast.ts            Toast + hint messaging
    controls.ts         Tool rail (color/piece/size/tools) + keyboard shortcuts
    mobileTabs.ts       Mobile bottom-sheet tab toggles
  styles/               CSS split by concern, aggregated in index.css
```

### Architecture notes

- `core/store.ts` holds all shared mutable state and exposes an `onInventoryChange`
  hook plus a `setFlashHint` injection point, which `main.ts` wires up. This keeps the
  dependency direction clean (engine never imports features/UI) and avoids import cycles.
- Modules are organized so imports flow `config -> core -> engine -> features/ui -> main`.

## Dependencies

- `three` is pinned to `0.128.0` to match the original prototype's exact rendering
  behavior. Newer Three.js releases changed default color management (sRGB), which would
  shift the displayed colors; upgrading is a deliberate follow-up rather than an automatic
  bump.
- Fonts (Fredoka, Inter) are self-hosted via `@fontsource` (latin subsets) instead of the
  Google Fonts CDN.

## License

MIT
