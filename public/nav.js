// Shared PJAX navigation — keeps sidebar persistent across page transitions
(function() {

  const PAGE_SCRIPTS = {
    '/campaign-generator.html': ['/campaign-generator.js'],
    '/tournament-generator.html': ['/tournament-generator.js'],
    '/configurator.html': ['/app.js', '/configurator-extra.js'],
  };

  let navigating = false;

  function getPathname(href) {
    try { return new URL(href, location.href).pathname; } catch(e) { return null; }
  }

  function isSameSite(href) {
    try { return new URL(href, location.href).origin === location.origin; } catch(e) { return false; }
  }

  function isInternalNav(a) {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript') || a.target) return false;
    if (!isSameSite(href)) return false;
    // Only intercept sidebar nav links (not buttons inside content)
    return !!a.closest('.sb-nav, .sidebar');
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src + '?_v=' + Date.now(); // bust cache so script re-executes
      s.dataset.pageScript = '1';
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  function updateSidebarActive(href) {
    const url = new URL(href, location.href);
    const fullHref = url.pathname + url.search;
    document.querySelectorAll('.sb-nav .nav-item').forEach(el => {
      const elHref = el.getAttribute('href') || '';
      if (!elHref) { el.classList.remove('active'); return; }
      const elUrl = new URL(elHref, location.href);
      const elFull = elUrl.pathname + elUrl.search;
      el.classList.toggle('active', elFull === fullHref);
    });
  }

  async function navigate(href) {
    if (navigating) return;
    navigating = true;

    const main = document.querySelector('.main');
    if (!main) { location.href = href; return; }

    // Fade out only .main — sidebar stays visible
    main.style.transition = 'opacity .1s ease';
    main.style.opacity = '0';

    try {
      // Fetch new page
      const res = await fetch(href);
      if (!res.ok) throw new Error('fetch failed');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const newMain = doc.querySelector('.main');
      if (!newMain) throw new Error('no .main in response');

      // Wait for fade out to finish
      await new Promise(r => setTimeout(r, 110));

      // Replace .main content
      main.replaceWith(newMain);

      // Update page title
      document.title = doc.title;

      // Update URL
      history.pushState({ href }, '', href);

      // Remove old page scripts
      document.querySelectorAll('script[data-page-script]').forEach(s => s.remove());

      // Load new page scripts
      const pathname = getPathname(href);
      const scripts = PAGE_SCRIPTS[pathname] || [];
      for (const src of scripts) {
        await loadScript(src);
      }

      // Update sidebar active state
      updateSidebarActive(href);

      // Fade in new .main
      const newMainEl = document.querySelector('.main');
      if (newMainEl) {
        newMainEl.style.opacity = '0';
        newMainEl.style.transition = 'opacity .15s ease';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          newMainEl.style.opacity = '1';
        }));
      }

    } catch(e) {
      // Fallback to normal navigation on error
      location.href = href;
      return;
    }

    navigating = false;
  }

  // Intercept clicks on sidebar navigation links
  document.addEventListener('click', function(e) {
    const a = e.target.closest('a[href]');
    if (!a || !isInternalNav(a)) return;
    e.preventDefault();
    const href = a.getAttribute('href');
    // Don't navigate if already on this page (same pathname+search)
    const current = location.pathname + location.search;
    const target = new URL(href, location.href);
    if (target.pathname + target.search === current) return;
    navigate(href);
  });

  // Handle browser back/forward
  window.addEventListener('popstate', function(e) {
    if (e.state && e.state.href) navigate(e.state.href);
  });

  // Mark current page scripts so they can be removed on navigation
  document.querySelectorAll('script[src]').forEach(s => {
    s.dataset.pageScript = '1';
  });

})();
