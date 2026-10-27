// Dream Haven Construction site builder.
// Netlify runs `node build.js` on every publish: it reads content/*.json (edited in /admin)
// and writes static pages to dist/. No packages needed.
// `node build.js --preview` writes a Claude-preview copy to preview/ instead.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PREVIEW = process.argv.includes('--preview');
const OUT = path.join(ROOT, PREVIEW ? 'preview' : 'dist');
const SITE_URL = 'https://www.dreamhavenconstruction.com';

const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'content', f), 'utf8'));
const site = read('site.json');
const C = { home: read('home.json'), adu: read('adu.json'), kitchens: read('kitchens.json'), bathrooms: read('bathrooms.json') };

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Headlines allow <em>word</em> for the brass italic; everything else is escaped.
const rich = s => esc(s).replace(/&lt;em&gt;/g, '<em>').replace(/&lt;\/em&gt;/g, '</em>');
const src = p => String(p || '').replace(/^\/+/, '');
const list = a => Array.isArray(a) ? a : [];

const PAGES = [
  { key: 'home', file: 'index.html', nav: 'Home', url: '/' },
  { key: 'adu', file: 'adu.html', nav: 'ADUs', url: '/adu' },
  { key: 'kitchens', file: 'kitchens.html', nav: 'Kitchens', url: '/kitchens' },
  { key: 'bathrooms', file: 'bathrooms.html', nav: 'Bathrooms', url: '/bathrooms' },
];
const ct = site.contact;
const tel = `tel:+1${ct.phoneDigits}`;

function ph(image, alt, { viz = false, eager = false, label = 'Photo' } = {}) {
  const s = src(image);
  const badge = viz ? '<span class="viz">Design visualization</span>' : '';
  return `<div class="ph" data-label="${esc(label)} · ${esc(s)}"><img src="${esc(s)}" alt="${esc(alt)}" loading="${eager ? 'eager' : 'lazy'}">${badge}</div>`;
}

function sheet(code, label) { return `<div class="sheet"><b>${esc(code)}</b> ${esc(label)}</div>`; }

function secHead(code, label, title, lede) {
  return `<div class="sec-head">${sheet(code, label)}<h2>${rich(title)}</h2>${lede ? `<p class="lede">${esc(lede)}</p>` : ''}</div>`;
}

function band(bg, inner, id) {
  return `<section class="band ${bg}"${id ? ` id="${id}"` : ''}>\n<div class="wrap">\n${inner}\n</div>\n</section>`;
}

function header(cur) {
  const AC = ' aria-current="page"';
  const links = PAGES.slice(1).map(p => `<a href="${p.file}"${p.key === cur ? AC : ''}>${p.nav}</a>`).join('')
    + '<a href="index.html#about">About</a><a href="index.html#projects">Projects</a>';
  return `<header class="top">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="Dream Haven Construction home">
      <span class="mark" aria-hidden="true"></span>
      <span class="brand-txt"><span>Dream Haven</span><span>CSLB LIC. ${esc(ct.license)}</span></span>
    </a>
    <nav class="main" aria-label="Main">${links}</nav>
    <a class="top-phone" href="${tel}">${esc(ct.phoneDisplay)}</a>
    <a class="btn btn-solid" href="#contact">Book a Consultation</a>
    <button class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="mobile-nav">Menu</button>
  </div>
  <div class="mobile-nav" id="mobile-nav" hidden>
    <div class="wrap">
      <a href="index.html"${cur === 'home' ? AC : ''}>Home</a>${links}<a href="${tel}">Call ${esc(ct.phoneDisplay)}</a>
      <a class="btn btn-solid" href="#contact">Book a Consultation</a>
    </div>
  </div>
</header>`;
}

function trust() {
  const items = list(site.trustLine).slice();
  items.splice(Math.min(2, items.length), 0, `${Number(site.rating.score).toFixed(1)} on Google`);
  return `<div class="trust">${items.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
}

function hero(h, crumb, secondary) {
  return `<div class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      ${crumb ? `<div class="crumb"><a href="index.html">Home</a> / ${esc(crumb)}</div>` : ''}
      <div class="sheet"><b>${esc(h.eyebrow)}</b></div>
      <h1>${rich(h.headline)}</h1>
      <p class="lede">${esc(h.lede)}</p>
      <div class="ctas"><a class="btn btn-solid" href="#contact">Book a Consultation</a>${secondary}</div>
      ${trust()}
    </div>
    <figure class="dim">${ph(h.image, h.imageAlt, { viz: h.visualization, eager: true, label: 'Hero photo' })}<figcaption>${esc(h.caption)}</figcaption></figure>
  </div>
</div>`;
}

function feats(items) {
  return `<div class="feat-grid">${list(items).map(i => `<div class="feat"><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></div>`).join('')}</div>`;
}

function steps() {
  return `<div class="steps">${list(site.process).map(s => `<div class="step"><span class="n"></span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><span class="out">You get: ${esc(s.outcome)}</span></div>`).join('')}</div>`;
}

let baCount = 0;
function ba(c) {
  baCount++;
  const tb = c.beforeLabel || 'Before', ta = c.afterLabel || 'After';
  const badge = c.visualization ? '<span class="viz viz-ba">Design visualization</span>' : '';
  return `<figure class="ba"><div class="ba-frame">
  <div class="ph" data-label="${esc(tb)} · ${esc(src(c.before))}"><img src="${esc(src(c.before))}" alt="${esc(c.beforeAlt)}" loading="lazy"></div>
  <div class="ph after" data-label="${esc(ta)} · ${esc(src(c.after))}"><img src="${esc(src(c.after))}" alt="${esc(c.afterAlt)}" loading="lazy"></div>
  <span class="handle"></span><span class="tag b">${esc(tb)}</span><span class="tag a">${esc(ta)}</span>${badge}
  <input type="range" id="ba-${baCount}" min="0" max="100" value="50" aria-label="Compare ${esc(tb.toLowerCase())} and ${esc(ta.toLowerCase())}: ${esc(c.caption)}">
</div><figcaption><span>${esc(c.caption)}</span><span>${esc(c.kind)}</span></figcaption></figure>`;
}

function gal(g) {
  return `<figure class="gal" data-hide-if-missing>${ph(g.image, g.alt, { viz: g.visualization })}<figcaption><span>${esc(g.caption)}</span><span>${esc(g.kind)}</span></figcaption></figure>`;
}

// Comparisons sit two-up; a gallery photo fills an odd slot; the rest run three-up.
function gallery(comparisons, items) {
  const comps = list(comparisons), gl = list(items).slice();
  let top = comps.length % 2 === 1 ? 1 : (comps.length === 0 && gl.length % 3 === 2 ? 2 : 0);
  top = Math.min(top, gl.length);
  const topItems = gl.splice(0, top);
  const first = comps.length + topItems.length ? `<div class="ba-grid">${comps.map(ba).join('')}${topItems.map(gal).join('')}</div>` : '';
  const rest = gl.length ? `<div class="gal-grid"${first ? '' : ' style="margin-top:0"'}>${gl.map(gal).join('')}</div>` : '';
  return first + rest;
}

function faq(items) {
  return `<div class="faq">${list(items).map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>`;
}

function split(code, label, d, bg, id) {
  return `<section class="band ${bg}"${id ? ` id="${id}"` : ''}>
<div class="wrap split">
  <div>
    ${sheet(code, label)}
    <h2 class="ruled">${rich(d.title)}</h2>
    <p>${esc(d.text)}</p>
    <ul class="checks">${list(d.checks).map(c => `<li>${esc(c)}</li>`).join('')}</ul>
  </div>
  <figure class="dim">${ph(d.image, d.imageAlt, { viz: d.visualization })}<figcaption>${esc(d.caption)}</figcaption></figure>
</div>
</section>`;
}

function contact(code, type, bg = 'deep') {
  const opts = ['ADU / Garage conversion', 'Kitchen remodel', 'Bathroom remodel', 'Whole-home renovation', 'Structural / Other'];
  return `<section class="band ${bg}" id="contact">
<div class="wrap contact-grid">
  <div class="contact-info">
    ${sheet(code, 'Get started')}
    <h2>Book a <em>consultation</em></h2>
    <p class="lede">Tell us about the project. We respond within one business day to schedule a walkthrough and confirm feasibility.</p>
    <dl class="info">
      <div><dt>Phone</dt><dd><a href="${tel}">${esc(ct.phoneDisplay)}</a></dd></div>
      <div><dt>Email</dt><dd><a href="mailto:${esc(ct.email)}">${esc(ct.email)}</a></dd></div>
      <div><dt>WhatsApp</dt><dd><a href="https://wa.me/${esc(ct.whatsapp)}" target="_blank" rel="noopener">Message us</a></dd></div>
      <div><dt>Instagram</dt><dd><a href="https://www.instagram.com/${esc(ct.instagram)}" target="_blank" rel="noopener">@${esc(ct.instagram)}</a></dd></div>
      <div><dt>Office</dt><dd>${esc(ct.office)}</dd></div>
      <div><dt>Service area</dt><dd>${esc(ct.serviceArea)}</dd></div>
      <div><dt>License</dt><dd><a href="https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx" target="_blank" rel="noopener">CSLB #${esc(ct.license)}</a></dd></div>
    </dl>
  </div>
  <form class="lead" name="contact-request" method="POST" action="/thank-you.html" data-netlify="true" netlify-honeypot="bot-field" enctype="multipart/form-data">
    <input type="hidden" name="form-name" value="contact-request">
    <p class="hp"><label for="bot-field">Leave this empty</label><input id="bot-field" name="bot-field" tabindex="-1" autocomplete="off"></p>
    <div class="fld"><label for="f-name">Name</label><input id="f-name" name="name" required autocomplete="name"></div>
    <div class="fld"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" required autocomplete="tel"></div>
    <div class="fld"><label for="f-email">Email</label><input id="f-email" name="email" type="email" required autocomplete="email"></div>
    <div class="fld"><label for="f-type">Project type</label><select id="f-type" name="project_type">${opts.map(o => `<option${o === type ? ' selected' : ''}>${o}</option>`).join('')}</select></div>
    <div class="fld full"><label for="f-addr">Property address</label><input id="f-addr" name="address" autocomplete="street-address"></div>
    <div class="fld full"><label for="f-details">Project details</label><textarea id="f-details" name="details" placeholder="What you want to change, rough timing, and anything you already know about the property."></textarea></div>
    <div class="fld full"><label for="f-photos">Photos (optional)</label><input id="f-photos" name="photos" type="file" accept="image/*"></div>
    <div class="form-foot">
      <p>We use your details only to respond to this request. See the privacy notice at the bottom of the page.</p>
      <button class="btn btn-solid" type="submit">Send request</button>
    </div>
    <div class="form-msg" hidden></div>
  </form>
</div>
</section>`;
}

function footer() {
  return `<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-col">
        <div class="foot-logo" role="img" aria-label="Dream Haven Construction"></div>
        <p>${esc(site.footerBlurb)}</p>
      </div>
      <div class="foot-col"><h4>Services</h4><a href="adu.html">Garage-to-ADU</a><a href="kitchens.html">Kitchens</a><a href="bathrooms.html">Bathrooms</a><a href="index.html#services">Structural</a></div>
      <div class="foot-col"><h4>Company</h4><a href="index.html#about">About</a><a href="index.html#projects">Projects</a><a href="index.html#reviews">Reviews</a><a href="#contact">Contact</a></div>
      <div class="foot-col"><h4>Contact</h4><a href="${tel}">${esc(ct.phoneDisplay)}</a><a href="mailto:${esc(ct.email)}">${esc(ct.email)}</a><a href="https://www.instagram.com/${esc(ct.instagram)}" target="_blank" rel="noopener">Instagram</a><p>${esc(ct.office)}</p></div>
    </div>
    <div class="privacy" id="privacy"><h4>Privacy notice</h4><p>${esc(site.privacy)}</p></div>
    <div class="foot-base"><span>© ${new Date().getFullYear()} Dream Haven Construction</span><span>CSLB License #${esc(ct.license)} · Licensed, bonded &amp; insured</span></div>
  </div>
</footer>`;
}

// ---------- pages ----------
function homePage() {
  const h = C.home, s = h.services, a = h.about, pr = h.projects;
  const pageOf = k => (PAGES.find(p => p.key === k) || PAGES[0]).file;
  let out = hero(h.hero, null, '<a class="btn btn-line" href="#services">Explore services</a>');
  out += band('tint', secHead('Sheet A-100', 'Scope of work', s.title, s.lede) + `
<div class="cards">${list(s.cards).map(c => `<a class="card" href="${pageOf(c.page)}">${ph(c.image, c.imageAlt, { viz: c.visualization })}<div class="card-body"><span class="code">${esc(c.code)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><span class="go">${esc(c.linkText)}</span></div></a>`).join('')}</div>
<div class="also"><p><strong>${esc(s.structuralTitle)}</strong> ${esc(s.structuralText)}</p><a class="text-link" href="#contact">Ask about structural work</a></div>`, 'services');
  out += band('white', secHead('Sheet A-200', 'Sequence', h.process.title, h.process.lede) + steps(), 'process');
  out += `<section class="band tint" id="about">
<div class="wrap about-grid">
  <figure class="dim">${ph(a.photo, `${a.name}, ${a.role}`, { label: 'Owner photo' })}<figcaption>${esc(a.photoCaption)}</figcaption></figure>
  <div class="about-copy">
    ${sheet('Sheet A-300', "Who you're working with")}
    <h2 class="ruled">${rich(a.title)}</h2>
    ${list(a.paragraphs).map(p => `<p>${esc(p)}</p>`).join('\n    ')}
    <p class="sig">${esc(a.name)}<small>${esc(a.role)}</small></p>
    <div class="quals">${list(a.quals).map(q => `<div class="qual"><strong>${esc(q.title)}</strong><span>${esc(q.text)}</span></div>`).join('')}</div>
  </div>
</div>
</section>`;
  out += band('white', secHead('Sheet A-400', 'Completed work', pr.title, pr.lede) + gallery(pr.comparisons, pr.gallery), 'projects');
  const r = site.rating;
  out += band('tint', `<div class="sec-head">${sheet('Sheet A-500', 'Client feedback')}
  <div class="rev-top"><h2 class="ruled">${rich(h.reviews.title)}</h2>
    <div class="score"><span class="big">${Number(r.score).toFixed(1)}</span><div><div class="stars" aria-label="${r.score} out of 5 stars">★★★★★</div><div class="src">From ${esc(r.count)} Google reviews</div></div></div></div>
</div>
<div class="rev-grid">${list(site.reviews).map(v => `<figure class="rev"><blockquote>“${esc(v.text)}”</blockquote><figcaption><strong>${esc(v.name)}</strong> · ${esc(v.project)}</figcaption></figure>`).join('')}</div>
<div class="rev-more"><a class="btn btn-line" href="${esc(site.reviewUrl)}" target="_blank" rel="noopener">Read all reviews on Google</a></div>`, 'reviews');
  out += contact('Sheet A-600', 'ADU / Garage conversion');
  return out;
}

function aduPage() {
  const d = C.adu;
  let out = hero(d.hero, 'ADUs', '<a class="btn btn-line" href="#sizes">See sizes &amp; ranges</a>');
  out += band('tint', secHead('Sheet ADU-100', "What's included", d.included.title, d.included.lede) + feats(d.included.items), 'included');
  const tiers = `<div class="tiers">${list(d.sizes.tiers).map(t => `<article class="tier${t.featured ? ' feat-tier' : ''}">${t.featured ? '<span class="flag">Most requested</span>' : ''}
  <h3>${esc(t.name)}</h3><span class="size">${esc(String(t.size).toUpperCase())}</span>
  <div><div class="label">Typical project range</div><div class="range">${esc(t.low)}<span>–</span>${esc(t.high)}</div></div>
  <ul>${list(t.items).map(i => `<li>${esc(i)}</li>`).join('')}</ul></article>`).join('')}</div>`;
  out += band('white', secHead('Sheet ADU-200', 'Sizes & price ranges', d.sizes.title, d.sizes.lede) + tiers + `<p class="fine">${esc(d.sizes.note)}</p>`, 'sizes');
  out += band('tint', secHead('Sheet ADU-300', 'What moves the price', d.factors.title) + `<div class="factors">${list(d.factors.items).map(f => `<div class="factor"><strong>${esc(f.title)}</strong><span>${esc(f.text)}</span></div>`).join('')}</div>`);
  out += band('white', secHead('Sheet ADU-400', 'Design studies', d.studies.title, d.studies.lede) + gallery(d.studies.comparisons, d.studies.gallery) + (d.studies.note ? `<p class="fine">${esc(d.studies.note)}</p>` : ''));
  out += band('tint', secHead('Sheet ADU-500', 'Sequence', d.processTitle) + steps());
  out += band('white', secHead('Sheet ADU-600', 'General notes', d.faq.title) + faq(d.faq.items));
  out += contact('Sheet ADU-700', 'ADU / Garage conversion');
  return out;
}

function kitchensPage() {
  const d = C.kitchens;
  let out = hero(d.hero, 'Kitchens', '<a class="btn btn-line" href="#kitchen-work">See our kitchens</a>');
  out += band('tint', secHead('Sheet K-100', 'What we do', d.services.title) + feats(d.services.items));
  out += band('white', secHead('Sheet K-200', 'Completed work', d.work.title, d.work.lede) + gallery(d.work.comparisons, d.work.gallery), 'kitchen-work');
  out += split('Sheet K-300', 'Design approach', d.design, 'tint');
  out += band('white', secHead('Sheet K-400', 'Design studies', d.studies.title, d.studies.lede) + gallery(d.studies.comparisons, d.studies.gallery));
  out += band('tint', secHead('Sheet K-500', 'Sequence', d.processTitle) + steps());
  out += band('white', secHead('Sheet K-600', 'General notes', d.faq.title) + faq(d.faq.items));
  out += contact('Sheet K-700', 'Kitchen remodel');
  return out;
}

function bathroomsPage() {
  const d = C.bathrooms;
  let out = hero(d.hero, 'Bathrooms', '<a class="btn btn-line" href="#bath-detail">How we build them</a>');
  out += band('tint', secHead('Sheet B-100', 'What we do', d.services.title) + feats(d.services.items));
  out += split('Sheet B-200', 'Wet-area detail', d.detail, 'white', 'bath-detail');
  out += band('tint', secHead('Sheet B-300', 'Design studies', d.studies.title, d.studies.lede) + gallery(d.studies.comparisons, d.studies.gallery));
  out += band('white', secHead('Sheet B-400', 'Sequence', d.processTitle) + steps());
  out += band('tint', secHead('Sheet B-500', 'General notes', d.faq.title) + faq(d.faq.items));
  out += contact('Sheet B-600', 'Bathroom remodel');
  return out;
}

const RENDER = { home: homePage, adu: aduPage, kitchens: kitchensPage, bathrooms: bathroomsPage };

// ---------- document ----------
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="site.css">`;

function jsonLd() {
  const r = site.rating;
  return JSON.stringify({
    '@context': 'https://schema.org', '@type': 'GeneralContractor', name: 'Dream Haven Construction', url: SITE_URL + '/',
    telephone: '+1-' + ct.phoneDigits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'), email: ct.email,
    image: SITE_URL + '/' + src(C.home.hero.image),
    address: { '@type': 'PostalAddress', addressLocality: 'West Hollywood', addressRegion: 'CA', addressCountry: 'US' },
    areaServed: 'Los Angeles, CA', sameAs: ['https://www.instagram.com/' + ct.instagram],
    aggregateRating: { '@type': 'AggregateRating', ratingValue: r.score, reviewCount: r.count },
  }).replace(/</g, '\\u003c');
}

function doc(p, body) {
  const d = C[p.key], url = SITE_URL + p.url, img = SITE_URL + '/' + src(d.hero.image);
  const tail = `<script src="site.js"></script>`;
  if (PREVIEW && p.key === 'home') {
    // Claude preview wraps its main page itself, so it gets content only.
    return `<title>Dream Haven Construction</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${FONTS}\n${body}\n${tail}\n`;
  }
  const identity = PREVIEW ? '' : '<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>\n';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<title>${esc(d.seo.title)}</title>
<meta name="description" content="${esc(d.seo.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Dream Haven Construction">
<meta property="og:title" content="${esc(d.seo.title)}"><meta property="og:description" content="${esc(d.seo.description)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
${p.key === 'home' ? `<script type="application/ld+json">${jsonLd()}</script>\n` : ''}${FONTS}
${identity}</head>
<body>
${body}
${tail}
</body>
</html>
`;
}

function thankYou() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Thank You | Dream Haven Construction</title>
${FONTS}
<style>.ty{min-height:70vh;display:grid;place-items:center;text-align:center}.ty .wrap{display:grid;gap:1.4rem;justify-items:center;max-width:620px}.ty .foot-logo{margin:0 auto 1rem}</style>
</head>
<body>
<main class="band white ty"><div class="wrap">
  <div class="foot-logo" role="img" aria-label="Dream Haven Construction"></div>
  <h1>Thank <em>you</em>.</h1>
  <p class="lede">Your request has been received. Ayman will personally follow up within one business day to confirm details and schedule a walkthrough.</p>
  <a class="btn btn-solid" href="index.html">Back to home</a>
  <p class="lede">Need us sooner? Call <a href="${tel}">${esc(ct.phoneDisplay)}</a>.</p>
</div></main>
</body>
</html>
`;
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(p => `  <url><loc>${SITE_URL}${p.url}</loc><lastmod>${today}</lastmod><priority>${p.key === 'home' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`;
}

// ---------- write ----------
function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const p of PAGES) {
  baCount = 0;
  const body = `${header(p.key)}\n<main>\n${RENDER[p.key]()}\n</main>\n${footer()}`;
  fs.writeFileSync(path.join(OUT, p.file), doc(p, body));
}
fs.copyFileSync(path.join(ROOT, 'src', 'site.css'), path.join(OUT, 'site.css'));
fs.copyFileSync(path.join(ROOT, 'src', 'site.js'), path.join(OUT, 'site.js'));
copyDir(path.join(ROOT, 'images'), path.join(OUT, 'images'));
if (!PREVIEW) {
  fs.writeFileSync(path.join(OUT, 'thank-you.html'), thankYou());
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap());
  copyDir(path.join(ROOT, 'admin'), path.join(OUT, 'admin'));
  copyDir(path.join(ROOT, 'content'), path.join(OUT, 'content'));
  if (fs.existsSync(path.join(ROOT, 'robots.txt'))) fs.copyFileSync(path.join(ROOT, 'robots.txt'), path.join(OUT, 'robots.txt'));
}
console.log(`Built ${PAGES.length} pages to ${path.relative(ROOT, OUT)}/`);
