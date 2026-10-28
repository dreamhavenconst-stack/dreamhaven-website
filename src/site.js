(function(){
  const LIVE = /dreamhavenconstruction\.com$|netlify\.app$/.test(location.hostname);
  const T = window.DH_TRACK || {};
  const send = (name, params) => { try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {} };
  const adsConversion = label => { if (T.adsId && label) send('conversion', { send_to: T.adsId + '/' + label }); };

  // Missing photos: on the live site hide optional items; elsewhere show a labeled frame.
  document.querySelectorAll('.ph img').forEach(img => {
    const fail = () => {
      const hideBox = img.closest('[data-hide-if-missing]');
      if (LIVE && hideBox) { hideBox.hidden = true; return; }
      img.closest('.ph').classList.add('missing'); img.remove();
    };
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
    else img.addEventListener('error', fail, { once: true });
  });

  // Before/after sliders
  document.querySelectorAll('.ba-frame').forEach(f => {
    const r = f.querySelector('input');
    const set = () => f.style.setProperty('--pos', r.value + '%');
    r.addEventListener('input', set); set();
  });

  // Mobile menu
  const btn = document.getElementById('menu-btn'), nav = document.getElementById('mobile-nav');
  if (btn && nav) {
    btn.addEventListener('click', () => { const open = nav.hidden; nav.hidden = !open; btn.setAttribute('aria-expanded', open); btn.textContent = open ? 'Close' : 'Menu'; });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.hidden = true; btn.setAttribute('aria-expanded', false); btn.textContent = 'Menu'; }));
  }

  // Lead tracking: calls, emails and WhatsApp taps (sent to Google Analytics / Ads when set up in /admin).
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-track]');
    if (!a) return;
    const kind = a.getAttribute('data-track');
    send(kind === 'call' ? 'click_to_call' : kind === 'whatsapp' ? 'click_whatsapp' : 'click_email', { link_url: a.href, page_path: location.pathname });
    if (kind === 'call') adsConversion(T.callLabel);
  });

  // Thank-you page = a submitted lead.
  if (window.DH_LEAD) { send('generate_lead', { form: 'contact-request' }); adsConversion(T.leadLabel); }

  // Form: posts to Netlify Forms on the live site; anywhere else shows a note instead.
  document.querySelectorAll('form.lead').forEach(form => {
    const msg = form.querySelector('.form-msg');
    let started = false;
    form.addEventListener('input', () => { if (!started) { started = true; send('form_start', { form: 'contact-request' }); } });
    form.addEventListener('submit', e => {
      if (LIVE) { const b = form.querySelector('button[type=submit]'); if (b) { b.disabled = true; b.textContent = 'Sending…'; } return; }
      e.preventDefault();
      msg.hidden = false;
      msg.textContent = 'Preview only. On dreamhavenconstruction.com this form sends your request to the Dream Haven inbox.';
    });
  });

  // Hide the phone call bar while the contact form is on screen, so it never covers the form.
  const bar = document.querySelector('.mbar'), contact = document.getElementById('contact');
  if (bar && contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(en => bar.classList.toggle('away', en.isIntersecting)), { threshold: 0.15 }).observe(contact);
  }
})();
