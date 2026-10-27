(function(){
  const LIVE = /dreamhavenconstruction\.com$|netlify\.app$/.test(location.hostname);

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

  // Form: posts to Netlify Forms on the live site; anywhere else shows a note instead.
  document.querySelectorAll('form.lead').forEach(form => {
    const msg = form.querySelector('.form-msg');
    form.addEventListener('submit', e => {
      if (LIVE) return;
      e.preventDefault();
      msg.hidden = false;
      msg.textContent = 'Preview only. On dreamhavenconstruction.com this form sends your request to the Dream Haven inbox.';
    });
  });

  // Admin login: invite and password-reset links land on the home page; send them on to /admin.
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on('init', user => {
      if (!user) window.netlifyIdentity.on('login', () => { document.location.href = '/admin/'; });
    });
  }
})();
