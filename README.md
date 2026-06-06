# RED WINDOW Static Site

RED WINDOW is a static horror reading site for long-form records, short stories, reported anecdotes, dream logs, and image evidence.
It is structured as a client-ready horror content package rather than a generic board.

## Structure

- `index.html`: public landing and content index.
- `record.html`: long-form record detail page.
- `lee-jihyun-admin-page.html`: private admin entry page. This file is not linked from the public site.
- `css/styles.css`: shared visual system and responsive layout.
- `data/data.js`: default content, gallery data, and localStorage key names.
- `js/main.js`: public index rendering, filtering, pagination, gallery modal, and section rendering.
- `js/record.js`: record detail rendering.
- `js/admin.js`: browser-local content creation and deletion tools.
- `assets/`: site images.

## Admin Model

The admin page is intentionally separated from public navigation and marked with `noindex,nofollow,noarchive`.
Because this is a static GitHub Pages site, admin writes are stored in the current browser's `localStorage`.
This is convenient for one-person operation, but it is not server-side authentication or a shared CMS.

## Deployment

The site is deployed through GitHub Pages from the `gh-pages` branch.

Recommended update flow:

```powershell
git -C site add -A
git -C site commit -m "Update site"
git -C site push origin main
git -C site push origin main:gh-pages
```

## Performance Notes

The public site is built around static content and lazy-loaded imagery.
Global animated horror effects were removed from runtime code so long posts and image grids stay readable on weaker devices.

## Commercial Polish Checklist

- Public readers only see content, search, pagination, and image viewing.
- Admin tools stay isolated in a separate unlinked page.
- The curation section explains the reading funnel without breaking the horror tone.
- Long-form records are paginated to keep the main page readable.
- Images are lazy-loaded or explicitly prioritized depending on their position.
