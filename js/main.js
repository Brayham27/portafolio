/* =========================================================
   BJS Portfolio 2026 — main.js
   1. Language toggle (EN / ES)
   2. Resizable Figma selection boxes
   3. Comment tool -> fun random comment
   4. Rulers + scroll reveal
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     1. LANGUAGE TOGGLE
     --------------------------------------------------------- */
  var langToggle = document.getElementById('langToggle');
  var STORE_KEY = 'bjs-lang';

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-en]').forEach(function (el) {
      var val = el.getAttribute('data-' + lang);
      if (val == null) return;
      // labels may contain <br>; use innerHTML only when needed
      if (val.indexOf('<') !== -1) { el.innerHTML = val; }
      else { el.textContent = val; }
    });
    if (langToggle) langToggle.textContent = lang.toUpperCase();
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
  }

  var saved = 'en';
  try { saved = localStorage.getItem(STORE_KEY) || 'en'; } catch (e) {}
  applyLang(saved);

  if (langToggle) {
    langToggle.addEventListener('click', function () {
      applyLang(document.documentElement.lang === 'es' ? 'en' : 'es');
    });
  }

  /* ---------------------------------------------------------
     1b. THEME TOGGLE (light / dark)
     --------------------------------------------------------- */
  var themeToggle = document.getElementById('themeToggle');
  var THEME_KEY = 'bjs-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  // sync aria with whatever the head script already set
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  // follow the OS only while the user hasn't chosen manually
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onMq = function (e) {
      var chosen; try { chosen = localStorage.getItem(THEME_KEY); } catch (err) {}
      if (!chosen) applyTheme(e.matches ? 'dark' : 'light');
    };
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }

  /* ---------------------------------------------------------
     1c. HAMBURGER MENU (mobile)
     --------------------------------------------------------- */
  var nav = document.querySelector('.nav');
  var burger = document.getElementById('navBurger');
  if (nav && burger) {
    var closeMenu = function () {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    };
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // tapping a link closes the menu
    nav.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    // click outside or Escape closes it
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    // scrollspy: check-mark the section currently in view (Figma "current tool" style)
    // only for in-page anchors that exist on this page (cross-page links are skipped)
    var spyItems = Array.prototype.slice.call(nav.querySelectorAll('.nav__item'))
      .map(function (a) {
        var href = a.getAttribute('href') || '';
        return (href.charAt(0) === '#' && document.querySelector(href)) ? { a: a, sel: href } : null;
      })
      .filter(Boolean);
    if (spyItems.length) {
      var updateSpy = function () {
        var mid = window.innerHeight * 0.4;
        var current = spyItems[0].sel;
        spyItems.forEach(function (it) {
          if (document.querySelector(it.sel).getBoundingClientRect().top <= mid) current = it.sel;
        });
        spyItems.forEach(function (it) {
          it.a.classList.toggle('is-current', it.sel === current);
        });
      };
      var spyTick = false;
      window.addEventListener('scroll', function () {
        if (spyTick) return;
        spyTick = true;
        requestAnimationFrame(function () { spyTick = false; updateSpy(); });
      }, { passive: true });
      updateSpy();
    }
  }

  /* ---------------------------------------------------------
     2. RESIZABLE SELECTION BOXES
     --------------------------------------------------------- */
  var MIN_W = 220, MIN_H = 90;

  document.querySelectorAll('[data-resizable]').forEach(function (box) {
    box.querySelectorAll('.handle').forEach(function (handle) {
      handle.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        startResize(box, handle, e);
      });
    });
  });

  function startResize(box, handle, e) {
    var rect = box.getBoundingClientRect();
    var startX = e.clientX, startY = e.clientY;
    var startW = rect.width, startH = rect.height;
    var cls = handle.className;
    var east = cls.indexOf('-e') !== -1 || cls.indexOf('-ne') !== -1 || cls.indexOf('-se') !== -1;
    var west = cls.indexOf('-w') !== -1 || cls.indexOf('-nw') !== -1 || cls.indexOf('-sw') !== -1;
    var south = cls.indexOf('-s') !== -1 || cls.indexOf('-se') !== -1 || cls.indexOf('-sw') !== -1;
    var north = cls.indexOf('-n') !== -1 || cls.indexOf('-ne') !== -1 || cls.indexOf('-nw') !== -1;

    box.classList.add('is-resizing');
    try { handle.setPointerCapture(e.pointerId); } catch (err) {}

    function onMove(ev) {
      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;
      if (east)  box.style.width  = Math.max(MIN_W, startW + dx) + 'px';
      if (west)  box.style.width  = Math.max(MIN_W, startW - dx) + 'px';
      if (south) box.style.height = Math.max(MIN_H, startH + dy) + 'px';
      if (north) box.style.height = Math.max(MIN_H, startH - dy) + 'px';
    }
    function onUp(ev) {
      box.classList.remove('is-resizing');
      try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
    }
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  }

  /* ---------------------------------------------------------
     3. COMMENT TOOL -> fun random comment
     --------------------------------------------------------- */
  var commentTool = document.getElementById('commentTool');
  var commentsLayer = document.getElementById('comments');

  var FUN = {
    en: [
      { n: 'You', t: 'ship it 🚀' },
      { n: 'Design crit', t: 'can we make the logo bigger?' },
      { n: 'PM', t: 'love it. one tiny tweak…' },
      { n: 'QA', t: 'looks pixel-perfect 👌' },
      { n: 'Future you', t: 'add more whitespace ✨' },
      { n: 'Client', t: 'make it pop! 🎨' },
      { n: 'Dev', t: 'is this a component? 😅' }
    ],
    es: [
      { n: 'Tú', t: '¡a lanzarlo! 🚀' },
      { n: 'Design crit', t: '¿el logo más grande? 😅' },
      { n: 'PM', t: 'me encanta, solo un detalle…' },
      { n: 'QA', t: 'pixel perfect 👌' },
      { n: 'Tú del futuro', t: 'más aire ✨' },
      { n: 'Cliente', t: '¡que resalte más! 🎨' },
      { n: 'Dev', t: '¿esto es un componente?' }
    ]
  };
  var funIdx = 0;

  function spawnComment() {
    if (!commentsLayer) return;
    var lang = document.documentElement.lang === 'es' ? 'es' : 'en';
    var list = FUN[lang];
    var item = list[funIdx % list.length];
    funIdx++;

    var el = document.createElement('div');
    el.className = 'comment';
    // scatter in the lower-middle band, near the toolbar where the click happened
    el.style.left = (24 + Math.random() * 44) + '%';
    el.style.top = (50 + Math.random() * 26) + '%';
    el.innerHTML =
      '<span class="comment__avatar">' + item.n.charAt(0).toUpperCase() + '</span>' +
      '<div class="comment__bubble">' +
        '<span class="comment__name">' + item.n + ' <em>' + (lang === 'es' ? 'ahora' : 'now') + '</em></span>' +
        '<span class="comment__text">' + item.t + '</span>' +
      '</div>';
    commentsLayer.appendChild(el);

    // keep the canvas from overflowing with bubbles
    var extras = commentsLayer.querySelectorAll('.comment:not(.comment--seed)');
    if (extras.length > 4) extras[0].remove();
  }

  if (commentTool) {
    commentTool.addEventListener('click', function () {
      commentTool.classList.remove('is-flash');
      // force reflow to restart animation
      void commentTool.offsetWidth;
      commentTool.classList.add('is-flash');
      commentTool.classList.add('seen'); // dismiss the red notification badge
      spawnComment();
    });
  }

  /* ---------------------------------------------------------
     3b. SCATTER — cursor/finger repulsion + drag that STAYS put
     Shared by brand logos AND About-page stickers.
     Drag an item → it stays; double-click/tap → back home.
     --------------------------------------------------------- */
  function initScatter(items, opts) {
    if (!items || !items.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    opts = opts || {};
    var repelC = opts.repelContainer || null;
    var RADIUS = opts.radius || 170;
    var PUSH = opts.push || 30;
    var enableDrift = !!opts.drift;
    var isMobile = window.matchMedia('(max-width: 720px)').matches;
    var dragging = null, sx = 0, sy = 0, baseX = 0, baseY = 0, moved = false;
    var placed = [];
    var pointerActive = false;

    function isPlaced(el) { return placed.indexOf(el) !== -1; }
    function getVar(el, n) { return parseFloat(el.style.getPropertyValue(n)) || 0; }
    function set(el, dx, dy, dr, ds) {
      el.style.setProperty('--dx', dx + 'px');
      el.style.setProperty('--dy', dy + 'px');
      el.style.setProperty('--dr', dr + 'deg');
      el.style.setProperty('--ds', ds);
    }
    function reset(el) { set(el, 0, 0, 0, 1); }

    if (repelC) {
      repelC.addEventListener('pointermove', function (e) {
        if (dragging) return;
        pointerActive = true;
        items.forEach(function (el) {
          if (isPlaced(el)) return;
          var r = el.getBoundingClientRect();
          var dx = (r.left + r.width / 2) - e.clientX;
          var dy = (r.top + r.height / 2) - e.clientY;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < RADIUS) {
            var f = 1 - dist / RADIUS;
            var nx = dx / dist, ny = dy / dist;
            set(el, (nx * PUSH * f).toFixed(1), (ny * PUSH * f).toFixed(1), (nx * 9 * f).toFixed(1), (1 + 0.06 * f).toFixed(3));
          } else {
            reset(el);
          }
        });
      });
      var releaseRepel = function () {
        pointerActive = false;
        if (!dragging) items.forEach(function (el) { if (!isPlaced(el)) reset(el); });
      };
      repelC.addEventListener('pointerleave', releaseRepel);
      repelC.addEventListener('pointerup', releaseRepel);
      repelC.addEventListener('pointercancel', releaseRepel);
    }

    items.forEach(function (el) {
      el.addEventListener('pointerdown', function (e) {
        dragging = el; sx = e.clientX; sy = e.clientY; moved = false;
        baseX = getVar(el, '--dx'); baseY = getVar(el, '--dy'); // resume from current spot
        el.classList.add('is-grabbing');
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
      });
      el.addEventListener('pointermove', function (e) {
        if (dragging !== el) return;
        var mx = e.clientX - sx, my = e.clientY - sy;
        if (Math.abs(mx) + Math.abs(my) > 3) moved = true;
        set(el, (baseX + mx).toFixed(1), (baseY + my).toFixed(1), (mx * 0.05).toFixed(1), '1.07');
      });
      var end = function () {
        if (dragging !== el) return;
        dragging = null;
        el.classList.remove('is-grabbing');
        if (moved) {
          placed.push(el);
          el.classList.add('is-placed');
          el.style.setProperty('--dr', '0deg');
          el.style.setProperty('--ds', '1');
        } else {
          reset(el);
        }
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('dblclick', function () {
        var i = placed.indexOf(el);
        if (i !== -1) placed.splice(i, 1);
        el.classList.remove('is-placed');
        reset(el);
      });
    });

    // mobile ambient scroll drift (logos only) when not interacting
    if (enableDrift && isMobile) {
      var ticking = false;
      var drift = function () {
        ticking = false;
        if (pointerActive) return;
        var vh = window.innerHeight;
        items.forEach(function (el, i) {
          if (isPlaced(el) || el === dragging) return;
          var r = el.getBoundingClientRect();
          var rel = (r.top + r.height / 2 - vh / 2) / vh;
          var dir = (i % 2 === 0) ? 1 : -1;
          el.style.setProperty('--dy', (rel * 18 * dir).toFixed(1) + 'px');
          el.style.setProperty('--dr', (rel * 2.5 * dir).toFixed(1) + 'deg');
        });
      };
      var onScroll = function () { if (ticking) return; ticking = true; requestAnimationFrame(drift); };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      drift();
    }
  }

  // wire it up
  var brandsGrid = document.querySelector('.brands__grid');
  if (brandsGrid) {
    initScatter(Array.prototype.slice.call(brandsGrid.querySelectorAll('.logo-ph')), { repelContainer: brandsGrid, drift: true });
  }
  var heroStickers = document.getElementById('heroStickers');
  if (heroStickers) {
    initScatter(Array.prototype.slice.call(heroStickers.querySelectorAll('.sticker')), { repelContainer: heroStickers, radius: 150, push: 26 });
  }

  /* ---------------------------------------------------------
     3c. OFF THE CLOCK — seamless right→left marquee
     --------------------------------------------------------- */
  (function () {
    var tracks = document.querySelectorAll('.carousel__track');
    if (!tracks.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // duplicate each row's photos so translateX(-50%) loops seamlessly
    Array.prototype.slice.call(tracks).forEach(function (track) {
      Array.prototype.slice.call(track.children).forEach(function (node) {
        var clone = node.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    });
  })();

  /* ---------------------------------------------------------
     4a. RULERS
     --------------------------------------------------------- */
  function buildRulers() {
    var top = document.getElementById('rulerTop');
    var left = document.getElementById('rulerLeft');
    if (!top || !left) return;
    top.innerHTML = ''; left.innerHTML = '';
    var STEP = 100;              // px between labeled ticks
    var UNIT = 20;               // px per ruler unit -> label = px / UNIT (0,5,10,...)
    var w = window.innerWidth;
    var h = window.innerHeight;
    for (var x = STEP; x < w; x += STEP) {
      var tx = document.createElement('span');
      tx.className = 'tick'; tx.style.left = x + 'px'; tx.textContent = Math.round(x / UNIT);
      top.appendChild(tx);
    }
    for (var y = STEP; y < h; y += STEP) {
      var ty = document.createElement('span');
      ty.className = 'tick'; ty.style.top = y + 'px'; ty.textContent = Math.round(y / UNIT);
      left.appendChild(ty);
    }
  }
  buildRulers();
  var rulerT;
  window.addEventListener('resize', function () {
    clearTimeout(rulerT); rulerT = setTimeout(buildRulers, 200);
  });
  window.addEventListener('load', buildRulers);

  /* ---------------------------------------------------------
     4b. SCROLL REVEAL
     --------------------------------------------------------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
