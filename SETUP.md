# Dream Haven Construction website

Four pages (Home, ADUs, Kitchens, Bathrooms), edited from the admin panel at
dreamhavenconstruction.com/admin.

## How it works

1. You edit text, photos, reviews or ADU price ranges in /admin and press Publish.
2. The admin panel saves your change into a file in the `content` folder on GitHub.
3. Netlify sees the change, runs `node build.js`, and rebuilds all four pages.
   The live site updates in about a minute.

The pages Google sees are plain HTML, so nothing loads late and nothing depends on
JavaScript to show your content.

## Going live (one time)

1. Replace the files in your `dreamhaven-website` GitHub repo with the contents of
   this folder. Keep the repo itself; just swap the files. Delete the old
   `index.html` and `content/site-data.json` from the repo root, since this
   version no longer uses them.
2. Commit to `main`. Netlify reads `netlify.toml` and starts building from
   `build.js` automatically. You don't need to change any Netlify settings.
3. Your admin login (Netlify Identity + Git Gateway) keeps working as before.
4. In Google Search Console, resubmit `sitemap.xml`. It now lists all four pages.

The contact form keeps the same name (`contact-request`), so form notifications
and past submissions in Netlify carry over.

## What you can edit in /admin

- **Contact, reviews & shared info:** phone, email, Google rating and reviews,
  the 4 process steps, privacy notice.
- **Home page:** headline, service cards, About text and photo, recent projects.
- **ADU page:** included items, the three sizes and their price ranges, cost
  factors, design studies, FAQ.
- **Kitchens / Bathrooms pages:** services, photos, design sections, FAQ.

Each photo has a "This image is a rendering" switch. Turn it on for renderings
and the page labels them "Design visualization". Leave it off for photos of
finished jobs.

## For developers

- `node build.js` builds the site into `dist/`. No packages needed (Node 18+).
- `content/*.json` is the content; `src/` holds the stylesheet and script.
- Admin fields come from `tools/config.src.yml`. After changing fields, run
  `python3 tools/make_config.py`. It regenerates `admin/config.yml` and checks
  that every content file matches the admin fields.
