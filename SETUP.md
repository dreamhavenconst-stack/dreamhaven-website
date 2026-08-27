# Dream Haven Construction — Go-Live Setup

Everything is built. These are the manual account steps — about 15 minutes,
one time only. I can't do these for you since they require your own GitHub
and Netlify logins.

## 1. Download real photos (do this first)

Photos currently load from GoDaddy's servers. Before going live, download
your 4 originals and put them in the `images` folder here, replacing the
GoDaddy links in `index.html` with local paths like `images/kitchen.jpg`.
Otherwise photos break the day you touch the GoDaddy site.

## 2. Create a GitHub repo

1. Go to github.com → New repository → name it `dreamhaven-website` → Create
2. Upload every file in this folder (drag the whole thing into the GitHub
   web uploader, or use GitHub Desktop if you prefer a normal app)
3. Commit to the `main` branch

## 3. Connect Netlify

1. Go to app.netlify.com → Add new site → Import an existing project → GitHub
2. Pick `dreamhaven-website`. Leave build settings blank (publish directory `.`)
3. Deploy — you'll get a live `*.netlify.app` URL immediately

## 4. Point your domain at it

1. In Netlify: Site settings → Domain management → Add a domain →
   `dreamhavenconstruction.com`
2. Netlify shows you 1-2 DNS records to add
3. In GoDaddy: My Products → DNS → add those records
4. Takes a few minutes to a few hours to propagate. Netlify gives free SSL
   automatically once it does.

## 5. Turn on the admin panel (this is the CMS)

1. In Netlify: Site settings → Identity → Enable Identity
2. Under Registration, set it to "Invite only"
3. Under Services, enable Git Gateway
4. Go to the Identity tab → Invite users → enter your own email
5. Check your email, accept the invite, set a password
6. Go to `dreamhavenconstruction.com/admin` and log in

You'll see a form-based editor: Hero Section, Contact Info, ADU Pricing,
Google Rating, and Reviews (with an "Add Review" button). Change anything,
hit Publish, and the live site updates in under a minute — no code, works
from your phone.

## 6. Submit to Google

1. Go to search.google.com/search-console → Add property →
   `dreamhavenconstruction.com`
2. Verify (Netlify DNS makes this a one-click option, or use the HTML tag
   method)
3. Submit `sitemap.xml` under Sitemaps
4. Request indexing on the homepage URL

## What's already built in

- LocalBusiness structured data (name, address, phone, license, rating) —
  lets Google show a rich result with stars
- Open Graph tags — controls how the link looks when shared on
  Facebook/Instagram/iMessage
- `sitemap.xml` and `robots.txt`
- Every editable field is wired to `content/site-data.json`, which the
  admin panel edits directly

## What still needs a decision from you

- Photo hosting (step 1 above)
- Whether to eventually split into separate pages (`/adu`,
  `/kitchen-remodel`, `/bathroom-remodel`) so each targets a different
  search term — a bigger project, worth doing once the single-page site is
  live and you're seeing what people search for
