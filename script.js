/* Datamint — small progressive enhancements. The page is fully readable
   without any of this. */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Theme toggle ─────────────────────────────────────────────────────── */

  var toggle = document.getElementById('themeToggle');

  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function syncToggleLabel() {
    if (!toggle) return;
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    toggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('datamint-theme', next); } catch (e) {}
      syncToggleLabel();
    });
    syncToggleLabel();
  }

  /* ── Reveal on scroll ─────────────────────────────────────────────────── */

  var revealables = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });

    revealables.forEach(function (el) { revealer.observe(el); });
  }

  /* ── Scroll thread + sticky header ────────────────────────────────────── */

  var header = document.getElementById('header');
  var rail = document.getElementById('rail');
  var railFill = document.getElementById('railFill');
  var sections = Array.prototype.slice.call(
    document.querySelectorAll('main > section[id]')
  );
  var nodes = [];

  function scrollable() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  // One node per section, placed at that section's position in the scroll range.
  function buildNodes() {
    nodes.forEach(function (n) { n.el.remove(); });
    nodes = [];
    if (!rail) return;

    var range = scrollable();
    sections.forEach(function (section) {
      // Clamp rather than drop: the last section usually starts past the final
      // scroll position (it plus the footer is shorter than the viewport), and
      // an unclamped value would silently lose its node.
      var pct = Math.max(0, Math.min(100, (section.offsetTop / range) * 100));
      var el = document.createElement('span');
      el.className = 'rail__node';
      el.style.top = pct + '%';
      rail.appendChild(el);
      nodes.push({ el: el, pct: pct });
    });
  }

  function onScroll() {
    var progress = (window.scrollY / scrollable()) * 100;
    progress = Math.max(0, Math.min(100, progress));

    if (railFill) railFill.style.height = progress + '%';
    nodes.forEach(function (n) {
      n.el.classList.toggle('is-passed', progress >= n.pct - 0.5);
    });

    if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
  }

  // Coalesce scroll work into one frame.
  var ticking = false;
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', function () {
    buildNodes();
    requestUpdate();
  });

  // Section offsets shift once webfonts swap in.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      buildNodes();
      requestUpdate();
    });
  }

  buildNodes();
  onScroll();

  /* ── Email links ──────────────────────────────────────────────────────────
     The markup carries the address in a human-readable, non-harvestable form
     ("hello (at) datamint (dot) com"). Decode it back into a real address and
     turn the placeholders into working mailto links. If the markup ever drifts
     into something that is not an address, leave the fallback text alone. */

  var emailEl = document.querySelector('[data-email]');

  if (emailEl) {
    var address = emailEl.textContent
      .replace(/\(at\)/gi, '@')
      .replace(/\(dot\)/gi, '.')
      .replace(/\s+/g, '');

    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
      emailEl.textContent = address;
      emailEl.href = 'mailto:' + address;

      Array.prototype.forEach.call(
        document.querySelectorAll('[data-email-link]'),
        function (el) { el.href = 'mailto:' + address; }
      );
    }
  }

  /* ── Footer year ──────────────────────────────────────────────────────── */

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
