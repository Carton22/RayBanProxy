# RayBanProxy

A Meta Ray-Ban Display web app that shows proxy label cards in a full-frame carousel. Each label uses a `Bookshelf/` spine image (25 items, `0.png`–`24.png`). The selected label is the large center card; neighboring labels peek in from the left and right edges.

## Controls

- Click or Enter on a proxy label: toggle price selection (red card, white price, item name shown)
- Selected items stay selected when you scroll to others; multiple items can be selected
- D-pad left/right (proxy labels): move focus without clearing other selections
- Escape: clear all selections
- D-pad down (proxy labels): show filter bar (Type, Color, Topic)
- D-pad up (filter bar): hide filter bar
- D-pad left/right (filter bar): move between filters
- Enter or click active filter pill: cycle values (attribute name = no filter)
  - **Type:** Type → Book → File → Box → Type …
  - **Color:** Color → Yellow → Black → White → Color …
  - **Topic:** Topic → XR → History → HCI → Topic …
- Escape (proxy labels): jump to first visible item
- Escape (filter bar): hide filter bar

Filter-to-item mappings live in `FILTER_MAPPINGS` inside `app.js`. Until those are filled in, all 25 items stay visible while values still cycle on the filter bar.

## Files

- `index.html`: fixed 600 x 600 app shell
- `styles.css`: additive-display proxy label cards
- `app.js`: carousel positioning and D-pad/Neural Band input
- `sw.js`: offline cache for static assets
- `server.js`, `package.json`, `vercel.json`: Vercel-compatible static hosting

## Local Test

```bash
npm start
```

Then open `http://localhost:3000`.

## Glasses Test

Meta Display Glasses need a public HTTPS URL. This app is already structured for Vercel preview or production hosting.
