# uistdemo

UIST demo version of RayBanProxy, using ten supplied object images and the approved attribute assignments.

Live app: https://uistdemo.vercel.app/

Item assignments: https://uistdemo.vercel.app/review.html

## Run locally

Requires Node.js. No dependencies or build step are needed.

```sh
npm start
```

Open http://localhost:4310/. Use `PORT=3000 npm start` to choose a different port.

```sh
npm test
```

## Controls

- Left/right: move between objects, or choose a filter when filters are open.
- Enter/click object: toggle selection and the inherited sample price.
- Down: open filters. Up: hide filters.
- Enter/click filter: cycle its values; the attribute name means no filter.
- Escape: clear selections and focus the first visible object, or hide filters.
- Filters combine with AND. Empty combinations show a reset button.

The display retains the 600 × 600 layout and scales down for smaller viewports. Desktop preview controls appear below the canvas when the viewport is at least 680 pixels tall.

## Attributes

- Type: Book, Pen, Box
- Color: Yellow, Black, Green, Red
- Topic: Art, CS

`catalog.js` supplies the carousel and the review page. `items/item1.png` through `items/item10.png` are the unchanged supplied images. Binders count as Book. The beige Ray-Ban box is assigned Yellow/CS; the magnet box is Red/Art. These assignments were approved for this demo. Prices are sample values inherited from the reference.

## Deployment

This branch uses the repository's root-level static app layout. Its app files match the verified Vercel deployment. Existing Bookshelf assets and the old service worker remain as historical source assets and are excluded from deployment; uistdemo uses only `items/` and does not register a service worker.

To redeploy, link this checkout to the existing Vercel project `uistdemo` in `liu03008-9488s-projects` and run:

```sh
vercel link --yes --project uistdemo --scope liu03008-9488s-projects
vercel deploy --prod --yes --scope liu03008-9488s-projects
```

Vercel account metadata and credentials are not tracked. This branch does not change the original RayBanProxy project or its deployment.
