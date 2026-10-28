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
const BIZ = 'Dream Haven Construction';

const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'content', f), 'utf8'));
const site = read('site.json');
const C = { home: read('home.json'), adu: read('adu.json'), kitchens: read('kitchens.json'), bathrooms: read('bathrooms.json') };

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Headlines allow <em>word</em> for the brass italic; everything else is escaped.
const rich = s => esc(s).replace(/&lt;em&gt;/g, '<em>').replace(/&lt;\/em&gt;/g, '</em>');
const plain = s => String(s ?? '').replace(/<\/?em>/g, '');
const src = p => String(p || '').replace(/^\/+/, '');
const list = a => Array.isArray(a) ? a : [];

// Live site uses clean folder URLs (/adu/); the preview uses plain files (adu.html).
const PAGES = [
  { key: 'home', slug: '', file: 'index.html', nav: 'Home' },
  { key: 'adu', slug: 'adu', file: 'adu.html', nav: 'ADUs', service: 'Garage-to-ADU conversion', crumb: 'ADUs' },
  { key: 'kitchens', slug: 'kitchens', file: 'kitchens.html', nav: 'Kitchens', service: 'Kitchen remodeling', crumb: 'Kitchens' },
  { key: 'bathrooms', slug: 'bathrooms', file: 'bathrooms.html', nav: 'Bathrooms', service: 'Bathroom remodeling', crumb: 'Bathrooms' },
];
const page = k => PAGES.find(p => p.key === k) || PAGES[0];
const link = (k, hash = '') => {
  const p = page(k);
  if (PREVIEW) return p.file + hash;
  return (p.slug ? `/${p.slug}/` : '/') + hash;
};
const asset = p => (PREVIEW ? '' : '/') + src(p);
const absUrl = k => SITE_URL + (page(k).slug ? `/${page(k).slug}/` : '/');

const ct = site.contact;
const tel = `tel:+1${ct.phoneDigits}`;
const telIntl = '+1-' + String(ct.phoneDigits).replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
const an = site.analytics || {};

// JPEG/PNG pixel size, so the browser reserves space and the page doesn't jump while loading.
const dimCache = {};
function imgSize(p) {
  const f = path.join(ROOT, src(p));
  if (f in dimCache) return dimCache[f];
  let r = null;
  try {
    const b = fs.readFileSync(f);
    if (b[0] === 0x89 && b[1] === 0x50) r = { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    else if (b[0] === 0xFF && b[1] === 0xD8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xFF) { i++; continue; }
        const m = b[i + 1], len = b.readUInt16BE(i + 2);
        if (m >= 0xC0 && m <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(m)) { r = { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; break; }
        i += 2 + len;
      }
    }
  } catch { r = null; }
  return (dimCache[f] = r);
}

function img(image, alt, { eager = false, cls = '' } = {}) {
  const d = imgSize(image);
  const wh = d ? ` width="${d.w}" height="${d.h}"` : '';
  const pri = eager ? ' loading="eager" fetchpriority="high"' : ' loading="lazy" decoding="async"';
  return `<img src="${esc(asset(image))}" alt="${esc(alt)}"${wh}${pri}${cls ? ` class="${cls}"` : ''}>`;
}

function ph(image, alt, { viz = false, eager = false, label = 'Photo' } = {}) {
  const badge = viz ? '<span class="viz">Design visualization</span>' : '';
  return `<div class="ph" data-label="${esc(label)} · ${esc(src(image))}">${img(image, alt, { eager })}${badge}</div>`;
}

function sheet(code, label) { return `<div class="sheet"><b>${esc(code)}</b> ${esc(label)}</div>`; }

function secHead(code, label, title, lede) {
  return `<div class="sec-head">${sheet(code, label)}<h2>${rich(title)}</h2>${lede ? `<p class="lede">${esc(lede)}</p>` : ''}</div>`;
}

function band(bg, inner, id) {
  return `<section class="band ${bg}"${id ? ` id="${id}"` : ''}>\n<div class="wrap">\n${inner}\n</div>\n</section>`;
}

const CTA = site.ctaLabel || 'Book a Consultation';

function header(cur) {
  const AC = ' aria-current="page"';
  const links = PAGES.slice(1).map(p => `<a href="${link(p.key)}"${p.key === cur ? AC : ''}>${p.nav}</a>`).join('')
    + `<a href="${link('home', '#about')}">About</a><a href="${link('home', '#projects')}">Projects</a>`;
  return `<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap">
    <a class="brand" href="${link('home')}" aria-label="${BIZ} home">
      <span class="mark" aria-hidden="true"></span>
      <span class="brand-txt"><span>Dream Haven</span><span>CSLB LIC. ${esc(ct.license)}</span></span>
    </a>
    <nav class="main" aria-label="Main">${links}</nav>
    <a class="top-phone" href="${tel}" data-track="call">${esc(ct.phoneDisplay)}</a>
    <a class="btn btn-solid" href="#contact">${esc(CTA)}</a>
    <button class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="mobile-nav">Menu</button>
  </div>
  <div class="mobile-nav" id="mobile-nav" hidden>
    <div class="wrap">
      <a href="${link('home')}"${cur === 'home' ? AC : ''}>Home</a>${links}<a href="${tel}" data-track="call">Call ${esc(ct.phoneDisplay)}</a>
      <a class="btn btn-solid" href="#contact">${esc(CTA)}</a>
    </div>
  </div>
</header>`;
}

// Phone-only bar pinned to the bottom of the screen: the two actions that turn visitors into leads.
function mobileBar() {
  return `<div class="mbar" role="region" aria-label="Contact Dream Haven">
  <a class="mbar-call" href="${tel}" data-track="call"><span aria-hidden="true">☎</span> Call ${esc(ct.phoneDisplay)}</a>
  <a class="mbar-quote" href="#contact">${esc(CTA)}</a>
</div>`;
}

function trust() {
  const items = list(site.trustLine).slice();
  items.splice(Math.min(2, items.length), 0, `${Number(site.rating.score).toFixed(1)} ★ on Google`);
  return `<div class="trust">${items.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
}

function hero(h, crumbKey, secondary) {
  const crumb = crumbKey ? `<nav class="crumb" aria-label="Breadcrumb"><a href="${link('home')}">Home</a> / <span aria-current="page">${esc(page(crumbKey).crumb)}</span></nav>` : '';
  return `<div class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      ${crumb}
      <div class="sheet"><b>${esc(h.eyebrow)}</b></div>
      <h1>${rich(h.headline)}</h1>
      <p class="lede">${esc(h.lede)}</p>
      <div class="ctas"><a class="btn btn-solid" href="#contact">${esc(CTA)}</a>${secondary}</div>
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
  <div class="ph" data-label="${esc(tb)} · ${esc(src(c.before))}">${img(c.before, c.beforeAlt)}</div>
  <div class="ph after" data-label="${esc(ta)} · ${esc(src(c.after))}">${img(c.after, c.afterAlt)}</div>
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
    <p><a class="btn btn-line" href="#contact">${esc(CTA)}</a></p>
  </div>
  <figure class="dim">${ph(d.image, d.imageAlt, { viz: d.visualization })}<figcaption>${esc(d.caption)}</figcaption></figure>
</div>
</section>`;
}

function reviewCards(n) {
  return `<div class="rev-grid">${list(site.reviews).slice(0, n).map(v => `<figure class="rev"><div class="stars" aria-hidden="true">★★★★★</div><blockquote>“${esc(v.text)}”</blockquote><figcaption><strong>${esc(v.name)}</strong> · ${esc(v.project)}</figcaption></figure>`).join('')}</div>`;
}

function reviewsBand(code, bg, title, n, id) {
  const r = site.rating;
  return band(bg, `<div class="sec-head">${sheet(code, 'Client feedback')}
  <div class="rev-top"><h2 class="ruled">${rich(title)}</h2>
    <div class="score"><span class="big">${Number(r.score).toFixed(1)}</span><div><div class="stars" aria-label="${esc(r.score)} out of 5 stars">★★★★★</div><div class="src">From ${esc(r.count)} Google reviews</div></div></div></div>
</div>
${reviewCards(n)}
<div class="rev-more"><a class="btn btn-line" href="${esc(site.reviewUrl)}" target="_blank" rel="noopener">Read all reviews on Google</a></div>`, id);
}

// Service pages link to each other: helps visitors planning more than one project, and helps Google.
function crossLinks(cur) {
  const blurbs = {
    adu: ['Garage-to-ADU conversions', 'Studio and one-bedroom units, with sizes and price ranges.'],
    kitchens: ['Kitchen remodels', 'Layouts, cabinetry and wall removals, designed before we build.'],
    bathrooms: ['Bathroom remodels', 'Walk-in showers, layout changes and waterproofing done to spec.'],
  };
  const others = Object.keys(blurbs).filter(k => k !== cur);
  return band('white', `<div class="xlinks"><p class="xl-label">Planning more than one project?</p>${others.map(k => `<a class="xl" href="${link(k)}"><strong>${blurbs[k][0]}</strong><span>${blurbs[k][1]}</span></a>`).join('')}</div>`);
}

function areasBand(code, bg) {
  const areas = list(site.areas);
  if (!areas.length) return '';
  return band(bg, `<div class="areas-wrap">
  <div>${sheet(code, 'Service area')}<h2 class="ruled">Remodeling across <em>Los Angeles</em></h2>
  <p class="lede">Based in ${esc(ct.office)}, we take on kitchen, bathroom and ADU projects throughout ${esc(ct.serviceArea)}. Not sure if you're in range? Call and ask.</p></div>
  <ul class="areas">${areas.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
</div>`, 'areas');
}

function contact(code, type, key, bg = 'deep') {
  const opts = ['ADU / Garage conversion', 'Kitchen remodel', 'Bathroom remodel', 'Whole-home renovation', 'Structural / Other'];
  const next = list(site.nextSteps);
  return `<section class="band ${bg}" id="contact">
<div class="wrap contact-grid">
  <div class="contact-info">
    ${sheet(code, 'Get started')}
    <h2>${rich(site.contactTitle || 'Book a <em>consultation</em>')}</h2>
    <p class="lede">${esc(site.contactLede || 'Tell us about the project. We respond within one business day.')}</p>
    ${next.length ? `<ol class="next">${next.map(n => `<li><strong>${esc(n.title)}</strong><span>${esc(n.text)}</span></li>`).join('')}</ol>` : ''}
    <dl class="info">
      <div><dt>Phone</dt><dd><a href="${tel}" data-track="call">${esc(ct.phoneDisplay)}</a></dd></div>
      <div><dt>Email</dt><dd><a href="mailto:${esc(ct.email)}" data-track="email">${esc(ct.email)}</a></dd></div>
      <div><dt>WhatsApp</dt><dd><a href="https://wa.me/${esc(ct.whatsapp)}" target="_blank" rel="noopener" data-track="whatsapp">Message us</a></dd></div>
      <div><dt>Office</dt><dd>${esc(ct.office)}</dd></div>
      <div><dt>License</dt><dd><a href="https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx" target="_blank" rel="noopener">CSLB #${esc(ct.license)}</a></dd></div>
    </dl>
  </div>
  <form class="lead" name="contact-request" method="POST" action="${PREVIEW ? '#' : '/thank-you/'}" data-netlify="true" netlify-honeypot="bot-field" enctype="multipart/form-data">
    <input type="hidden" name="form-name" value="contact-request">
    <input type="hidden" name="source_page" value="${esc(page(key).nav)} page">
    <p class="hp"><label for="bot-field">Leave this empty</label><input id="bot-field" name="bot-field" tabindex="-1" autocomplete="off"></p>
    <div class="fld"><label for="f-name">Name</label><input id="f-name" name="name" required autocomplete="name"></div>
    <div class="fld"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" required autocomplete="tel" inputmode="tel"></div>
    <div class="fld"><label for="f-email">Email <small>(optional)</small></label><input id="f-email" name="email" type="email" autocomplete="email"></div>
    <div class="fld"><label for="f-type">Project type</label><select id="f-type" name="project_type">${opts.map(o => `<option${o === type ? ' selected' : ''}>${o}</option>`).join('')}</select></div>
    <div class="fld full"><label for="f-addr">Property address or ZIP</label><input id="f-addr" name="address" autocomplete="street-address"></div>
    <div class="fld full"><label for="f-details">Project details <small>(optional)</small></label><textarea id="f-details" name="details" placeholder="What you want to change, rough timing, and anything you already know about the property."></textarea></div>
    <div class="fld full"><label for="f-photos">Photos <small>(optional)</small></label><input id="f-photos" name="photos" type="file" accept="image/*"></div>
    <div class="form-foot">
      <p>No obligation. We reply within one business day. Your details are only used to respond to you (<a href="#privacy">privacy</a>).</p>
      <button class="btn btn-solid" type="submit">Send request</button>
    </div>
    <div class="form-msg" hidden></div>
  </form>
</div>
</section>`;
}

function footer() {
  const areas = list(site.areas);
  return `<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-col">
        <div class="foot-logo" role="img" aria-label="${BIZ}"></div>
        <p>${esc(site.footerBlurb)}</p>
      </div>
      <div class="foot-col"><h4>Services</h4><a href="${link('adu')}">Garage-to-ADU conversions</a><a href="${link('kitchens')}">Kitchen remodeling</a><a href="${link('bathrooms')}">Bathroom remodeling</a><a href="${link('home', '#services')}">Structural work</a></div>
      <div class="foot-col"><h4>Company</h4><a href="${link('home', '#about')}">About</a><a href="${link('home', '#projects')}">Projects</a><a href="${link('home', '#reviews')}">Reviews</a><a href="#contact">Contact</a></div>
      <div class="foot-col"><h4>Contact</h4><a href="${tel}" data-track="call">${esc(ct.phoneDisplay)}</a><a href="mailto:${esc(ct.email)}" data-track="email">${esc(ct.email)}</a><a href="https://www.instagram.com/${esc(ct.instagram)}" target="_blank" rel="noopener">Instagram</a><p>${esc(ct.office)}</p></div>
    </div>
    ${areas.length ? `<p class="foot-areas"><strong>Serving:</strong> ${areas.map(esc).join(' · ')}</p>` : ''}
    <div class="privacy" id="privacy"><h4>Privacy notice</h4><p>${esc(site.privacy)}</p></div>
    <div class="foot-base"><span>© ${new Date().getFullYear()} ${BIZ}</span><span>CSLB License #${esc(ct.license)} · Licensed, bonded &amp; insured</span></div>
  </div>
</footer>`;
}

// ---------- pages ----------
function homePage() {
  const h = C.home, s = h.services, a = h.about, pr = h.projects;
  let out = hero(h.hero, null, '<a class="btn btn-line" href="#services">Explore services</a>');
  out += band('tint', secHead('Sheet A-100', 'Scope of work', s.title, s.lede) + `
<div class="cards">${list(s.cards).map(c => `<a class="card" href="${link(c.page)}">${ph(c.image, c.imageAlt, { viz: c.visualization })}<div class="card-body"><span class="code">${esc(c.code)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><span class="go">${esc(c.linkText)}</span></div></a>`).join('')}</div>
<div class="also"><p><strong>${esc(s.structuralTitle)}</strong> ${esc(s.structuralText)}</p><a class="text-link" href="#contact">Ask about structural work</a></div>`, 'services');
  out += reviewsBand('Sheet A-200', 'white', h.reviews.title, 3, 'reviews');
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
  out += band('tint', secHead('Sheet A-500', 'Sequence', h.process.title, h.process.lede) + steps(), 'process');
  out += areasBand('Sheet A-600', 'white');
  out += contact('Sheet A-700', 'ADU / Garage conversion', 'home');
  return out;
}

function aduPage() {
  const d = C.adu;
  let out = hero(d.hero, 'adu', '<a class="btn btn-line" href="#sizes">See sizes &amp; ranges</a>');
  out += band('tint', secHead('Sheet ADU-100', "What's included", d.included.title, d.included.lede) + feats(d.included.items), 'included');
  const tiers = `<div class="tiers">${list(d.sizes.tiers).map(t => `<article class="tier${t.featured ? ' feat-tier' : ''}">${t.featured ? '<span class="flag">Most requested</span>' : ''}
  <h3>${esc(t.name)}</h3><span class="size">${esc(String(t.size).toUpperCase())}</span>
  <div><div class="label">Typical project range</div><div class="range">${esc(t.low)}<span>–</span>${esc(t.high)}</div></div>
  <ul>${list(t.items).map(i => `<li>${esc(i)}</li>`).join('')}</ul>
  <a class="btn btn-line tier-cta" href="#contact">Check my garage</a></article>`).join('')}</div>`;
  out += band('white', secHead('Sheet ADU-200', 'Sizes & price ranges', d.sizes.title, d.sizes.lede) + tiers + `<p class="fine">${esc(d.sizes.note)}</p>`, 'sizes');
  out += band('tint', secHead('Sheet ADU-300', 'What moves the price', d.factors.title) + `<div class="factors">${list(d.factors.items).map(f => `<div class="factor"><strong>${esc(f.title)}</strong><span>${esc(f.text)}</span></div>`).join('')}</div>`);
  out += reviewsBand('Sheet ADU-400', 'white', 'What clients say about <em>working with us</em>', 3);
  out += band('tint', secHead('Sheet ADU-500', 'Design studies', d.studies.title, d.studies.lede) + gallery(d.studies.comparisons, d.studies.gallery) + (d.studies.note ? `<p class="fine">${esc(d.studies.note)}</p>` : ''));
  out += band('white', secHead('Sheet ADU-600', 'Sequence', d.processTitle) + steps());
  out += band('tint', secHead('Sheet ADU-700', 'General notes', d.faq.title) + faq(d.faq.items));
  out += crossLinks('adu');
  out += contact('Sheet ADU-800', 'ADU / Garage conversion', 'adu');
  return out;
}

function kitchensPage() {
  const d = C.kitchens;
  let out = hero(d.hero, 'kitchens', '<a class="btn btn-line" href="#kitchen-work">See our kitchens</a>');
  out += band('tint', secHead('Sheet K-100', 'What we do', d.services.title) + feats(d.services.items));
  out += band('white', secHead('Sheet K-200', 'Completed work', d.work.title, d.work.lede) + gallery(d.work.comparisons, d.work.gallery), 'kitchen-work');
  out += reviewsBand('Sheet K-300', 'tint', 'What kitchen clients <em>say</em>', 3);
  out += split('Sheet K-400', 'Design approach', d.design, 'white');
  out += band('tint', secHead('Sheet K-500', 'Design studies', d.studies.title, d.studies.lede) + gallery(d.studies.comparisons, d.studies.gallery));
  out += band('white', secHead('Sheet K-600', 'Sequence', d.processTitle) + steps());
  out += band('tint', secHead('Sheet K-700', 'General notes', d.faq.title) + faq(d.faq.items));
  out += crossLinks('kitchens');
  out += contact('Sheet K-800', 'Kitchen remodel', 'kitchens');
  return out;
}

function bathroomsPage() {
  const d = C.bathrooms;
  let out = hero(d.hero, 'bathrooms', '<a class="btn btn-line" href="#bath-detail">How we build them</a>');
  out += band('tint', secHead('Sheet B-100', 'What we do', d.services.title) + feats(d.services.items));
  out += split('Sheet B-200', 'Wet-area detail', d.detail, 'white', 'bath-detail');
  out += reviewsBand('Sheet B-300', 'tint', 'What clients say about <em>working with us</em>', 3);
  out += band('white', secHead('Sheet B-400', 'Design studies', d.studies.title, d.studies.lede) + gallery(d.studies.comparisons, d.studies.gallery));
  out += band('tint', secHead('Sheet B-500', 'Sequence', d.processTitle) + steps());
  out += band('white', secHead('Sheet B-600', 'General notes', d.faq.title) + faq(d.faq.items));
  out += crossLinks('bathrooms');
  out += contact('Sheet B-700', 'Bathroom remodel', 'bathrooms');
  return out;
}

const RENDER = { home: homePage, adu: aduPage, kitchens: kitchensPage, bathrooms: bathroomsPage };

// ---------- structured data (what Google reads to understand the business) ----------
function schema(p) {
  const bizId = SITE_URL + '/#business';
  const areas = list(site.areas).map(n => ({ '@type': 'City', name: n }));
  const graph = [];
  graph.push({
    '@type': 'GeneralContractor', '@id': bizId, name: BIZ, url: SITE_URL + '/',
    telephone: telIntl, email: ct.email,
    image: SITE_URL + '/' + src(C.home.hero.image),
    address: { '@type': 'PostalAddress', addressLocality: 'West Hollywood', addressRegion: 'CA', addressCountry: 'US' },
    areaServed: areas.length ? areas : 'Los Angeles, CA',
    founder: { '@type': 'Person', name: C.home.about.name },
    hasCredential: { '@type': 'EducationalOccupationalCredential', credentialCategory: 'Contractor license', identifier: 'CSLB ' + ct.license, recognizedBy: { '@type': 'Organization', name: 'Contractors State License Board' } },
    knowsAbout: ['Kitchen remodeling', 'Bathroom remodeling', 'Garage-to-ADU conversions', 'Load-bearing wall removal', 'Electrical panel upgrades'],
    sameAs: ['https://www.instagram.com/' + ct.instagram].concat(site.googleProfileUrl ? [site.googleProfileUrl] : []),
  });
  const d = C[p.key];
  graph.push({ '@type': 'WebPage', '@id': absUrl(p.key) + '#page', url: absUrl(p.key), name: d.seo.title, description: d.seo.description, about: { '@id': bizId }, inLanguage: 'en-US' });
  if (p.key !== 'home') {
    graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absUrl('home') },
      { '@type': 'ListItem', position: 2, name: p.crumb, item: absUrl(p.key) } ] });
    graph.push({ '@type': 'Service', name: p.service + ' in Los Angeles', serviceType: p.service, provider: { '@id': bizId }, areaServed: areas.length ? areas : 'Los Angeles, CA', url: absUrl(p.key), description: d.seo.description });
    if (list(d.faq && d.faq.items).length) graph.push({ '@type': 'FAQPage', mainEntity: d.faq.items.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  }
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
}

// ---------- document ----------
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${asset('site.css')}">`;

// Google Analytics 4 and Google Ads tags, only when IDs are filled in under /admin.
function analyticsTag() {
  if (PREVIEW) return '';
  const ids = [an.ga4Id, an.adsId].filter(Boolean);
  if (!ids.length) return '';
  const cfg = JSON.stringify({ adsId: an.adsId || '', leadLabel: an.adsLeadLabel || '', callLabel: an.adsCallLabel || '' });
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(ids[0])}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${ids.map(i => `gtag('config',${JSON.stringify(i)});`).join('')}window.DH_TRACK=${cfg};</script>\n`;
}

// Admin login links (invite / password reset) land on the home page; load the login widget only then.
const IDENTITY = `<script>if(/(invite|recovery|confirmation|email_change)_token|access_token/.test(location.hash)){var s=document.createElement('script');s.src='https://identity.netlify.com/v1/netlify-identity-widget.js';s.onload=function(){var n=window.netlifyIdentity;n.on('init',function(u){if(!u)n.on('login',function(){location.href='/admin/';});});n.init();};document.head.appendChild(s);}</script>\n`;

function head(p, { title, description, canonical, image, noindex = false, extra = '' }) {
  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">`}
<meta name="theme-color" content="#0B0E33">
<meta property="og:type" content="website"><meta property="og:site_name" content="${BIZ}"><meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">
${canonical ? `<meta property="og:url" content="${canonical}">` : ''}${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">
${extra}${FONTS}
${analyticsTag()}</head>`;
}

function doc(p, body) {
  const d = C[p.key];
  const tail = `${mobileBar()}\n<script src="${asset('site.js')}" defer></script>`;
  if (PREVIEW && p.key === 'home') {
    // Claude preview wraps its main page itself, so it gets content only.
    return `<title>${BIZ}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${FONTS}\n${body}\n${tail}\n`;
  }
  const heroImg = src(d.hero.image);
  const extra = `<link rel="preload" as="image" href="${esc(asset(heroImg))}" fetchpriority="high">\n${PREVIEW ? '' : schema(p) + '\n'}${!PREVIEW && p.key === 'home' ? IDENTITY : ''}`;
  return `${head(p, { title: d.seo.title, description: d.seo.description, canonical: absUrl(p.key), image: SITE_URL + '/' + heroImg, extra })}
<body>
${body}
${tail}
</body>
</html>
`;
}

function simplePage(title, description, inner, { noindex = true, trackLead = false } = {}) {
  const lead = trackLead ? `<script>window.DH_LEAD=true;</script>\n` : '';
  return `${head(null, { title, description, noindex })}
<body>
${header('')}
<main id="main" class="band white ty"><div class="wrap">
  <div class="foot-logo" role="img" aria-label="${BIZ}"></div>
  ${inner}
</div></main>
${footer()}
${lead}<script src="${asset('site.js')}" defer></script>
</body>
</html>
`;
}

function thankYou() {
  const next = list(site.nextSteps);
  return simplePage(`Thank You | ${BIZ}`, 'Your request has been received.', `<h1>Thank <em>you</em>.</h1>
  <p class="lede">Your request has been received. Ayman will personally follow up within one business day to confirm details and schedule a walkthrough.</p>
  ${next.length ? `<ol class="next">${next.map(n => `<li><strong>${esc(n.title)}</strong><span>${esc(n.text)}</span></li>`).join('')}</ol>` : ''}
  <p class="lede">Need us sooner? Call <a href="${tel}" data-track="call">${esc(ct.phoneDisplay)}</a>.</p>
  <p><a class="btn btn-solid" href="${link('home')}">Back to home</a></p>`, { trackLead: true });
}

function notFound() {
  return simplePage(`Page not found | ${BIZ}`, 'This page does not exist.', `<h1>That page <em>moved</em>.</h1>
  <p class="lede">The page you were looking for isn't here. These are the pages most people want:</p>
  <div class="xlinks nf">${['adu', 'kitchens', 'bathrooms'].map(k => `<a class="xl" href="${link(k)}"><strong>${page(k).service}</strong><span>See the page</span></a>`).join('')}</div>
  <p class="lede">Or call <a href="${tel}" data-track="call">${esc(ct.phoneDisplay)}</a>.</p>`);
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(p => `  <url><loc>${absUrl(p.key)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
}

// ---------- write ----------
function copyDir(from, to, skip = []) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (skip.includes(e.name) || e.name === '.DS_Store') continue;
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}
function write(rel, html) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}

const ROBOTS = `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const p of PAGES) {
  baCount = 0;
  const body = `${header(p.key)}\n<main id="main">\n${RENDER[p.key]()}\n</main>\n${footer()}`;
  write(PREVIEW ? p.file : (p.slug ? `${p.slug}/index.html` : 'index.html'), doc(p, body));
}
fs.copyFileSync(path.join(ROOT, 'src', 'site.css'), path.join(OUT, 'site.css'));
fs.copyFileSync(path.join(ROOT, 'src', 'site.js'), path.join(OUT, 'site.js'));
copyDir(path.join(ROOT, 'images'), path.join(OUT, 'images'));
if (!PREVIEW) {
  write('thank-you/index.html', thankYou());
  write('404.html', notFound());
  write('sitemap.xml', sitemap());
  write('robots.txt', ROBOTS);
  copyDir(path.join(ROOT, 'admin'), path.join(OUT, 'admin'));
  // Your web tools (Scope Builder, ADU Selections, ...) stay at /tools/<name>/.
  // The two admin-config helper files in tools/ are not published.
  copyDir(path.join(ROOT, 'tools'), path.join(OUT, 'tools'), ['config.src.yml', 'make_config.py']);
}
console.log(`Built ${PAGES.length} pages to ${path.relative(ROOT, OUT)}/`);
