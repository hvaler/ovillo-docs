/* portal.js - EL script del portal Ovillo (sin librerias). Tema persistente, paleta Ctrl+K, favoritos, indice con
   scroll-spy, copiar codigo, y el motor de diapositivas (decks y modo presentacion). */
(function () {
  'use strict';
  var d = document, w = window, LS = null;
  try { LS = w.localStorage; } catch (e) { LS = null; }
  var get = function (k, def) { try { var v = LS && LS.getItem(k); return v === null || v === undefined ? def : JSON.parse(v); } catch (e) { return def; } };
  var set = function (k, v) { try { LS && LS.setItem(k, JSON.stringify(v)); } catch (e) { /* privado */ } };
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var REL = d.documentElement.getAttribute('data-rel') || '';

  // ---- tema: auto | light | dark (aplicado ya por el script inline del <head>; aqui solo el toggle)
  function applyTheme(t) { if (t === 'auto') d.documentElement.removeAttribute('data-theme'); else d.documentElement.setAttribute('data-theme', t); $$('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-label', 'Tema: ' + t); b.textContent = t === 'dark' ? '☾' : t === 'light' ? '☀' : '◑'; }); }
  var theme = get('ovillo.theme', 'auto'); applyTheme(theme);
  $$('[data-theme-toggle]').forEach(function (b) { b.addEventListener('click', function () { theme = theme === 'auto' ? 'dark' : theme === 'dark' ? 'light' : 'auto'; set('ovillo.theme', theme); applyTheme(theme); }); });

  // ---- favoritos
  var favs = get('ovillo.fav', []);
  var here = d.body.getAttribute('data-page');
  function isFav(u) { return favs.some(function (f) { return f.u === u; }); }
  function paintStar() { $$('[data-fav]').forEach(function (b) { var on = isFav(here); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.title = on ? 'Quitar de favoritos' : 'Añadir a favoritos'; }); }
  $$('[data-fav]').forEach(function (b) { b.addEventListener('click', function () { if (!here) return; if (isFav(here)) favs = favs.filter(function (f) { return f.u !== here; }); else favs.push({ u: here, t: d.title.replace(/ · Ovillo$/, '') }); set('ovillo.fav', favs); paintStar(); paintFavList(); }); });
  function paintFavList() { var box = $('[data-favs]'); if (!box) return; box.innerHTML = favs.length ? '<ul>' + favs.map(function (f) { return '<li><a href="' + REL + f.u + '">' + esc(f.t) + '</a></li>'; }).join('') + '</ul>' : '<p class="muted">Marca páginas con ☆ y aparecerán aquí (solo en este navegador).</p>'; }
  paintStar(); paintFavList();
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ---- copiar codigo
  $$('main pre').forEach(function (pre) { if (pre.closest('.slides')) return; var b = d.createElement('button'); b.className = 'copy'; b.type = 'button'; b.textContent = 'copiar'; b.addEventListener('click', function () { var t = pre.querySelector('code') ? pre.querySelector('code').textContent : pre.textContent; if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { b.textContent = 'copiado'; setTimeout(function () { b.textContent = 'copiar'; }, 1200); }); }); pre.appendChild(b); });

  // ---- indice de pagina con scroll-spy
  var tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in w) {
    var map = {}; tocLinks.forEach(function (a) { var id = a.getAttribute('href').slice(1); map[id] = a; });
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { tocLinks.forEach(function (a) { a.classList.remove('cur'); }); var a = map[e.target.id]; if (a) a.classList.add('cur'); } }); }, { rootMargin: '0px 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var el = d.getElementById(id); if (el) io.observe(el); });
  }

  // ---- paleta de busqueda (Ctrl+K, /) sobre window.OVILLO_INDEX = [{u,t,d,k,h:[{id,t}]}]
  var pal = null, palInput, palList, hits = [], sel = 0;
  function openPal(q) {
    if (!w.OVILLO_INDEX) { var s = $('[data-search]'); if (s && q) location.href = REL + 'buscar.html?q=' + encodeURIComponent(q); return; }
    if (!pal) {
      pal = d.createElement('div'); pal.className = 'palette'; pal.innerHTML = '<div class="palette-box" role="dialog" aria-label="Buscar"><input type="search" placeholder="Buscar en el portal…" aria-label="Buscar"><ol></ol><p class="palette-help">↑↓ moverse · ↵ abrir · Esc cerrar</p></div>';
      d.body.appendChild(pal); palInput = $('input', pal); palList = $('ol', pal);
      palInput.addEventListener('input', function () { search(palInput.value); });
      palInput.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, hits.length - 1); paintHits(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); paintHits(); e.preventDefault(); } else if (e.key === 'Enter' && hits[sel]) { location.href = REL + hits[sel].u; } else if (e.key === 'Escape') closePal(); });
      pal.addEventListener('click', function (e) { if (e.target === pal) closePal(); });
    }
    pal.classList.add('open'); palInput.value = q || ''; cargarCuerpo(); search(palInput.value); palInput.focus();
  }
  function closePal() { if (pal) pal.classList.remove('open'); }
  // El texto del cuerpo se descarga una sola vez, en el primer uso de la busqueda (ADR-028): asi el
  // fragmento pesado no viaja en cada pagina. Si falla la descarga, la busqueda sigue con lo ligero.
  var cuerpoPedido = false;
  function cargarCuerpo() {
    if (cuerpoPedido || w.OVILLO_BODY) return;
    cuerpoPedido = true;
    var s = d.createElement('script');
    s.src = REL + 'recursos/search-body.js';
    s.onload = function () { if (palInput && pal && pal.classList.contains('open')) search(palInput.value); };
    d.head.appendChild(s);
  }
  function search(q) {
    var toks = q.toLowerCase().split(/\s+/).filter(Boolean);
    hits = [];
    if (toks.length) {
      w.OVILLO_INDEX.forEach(function (it) {
        var title = it.t.toLowerCase(), desc = (it.d || '').toLowerCase(), score = 0, sec = null;
        toks.forEach(function (t) { if (title.indexOf(t) >= 0) score += 5; if (desc.indexOf(t) >= 0) score += 2; (it.h || []).forEach(function (h) { if (h.t.toLowerCase().indexOf(t) >= 0) { score += 3; sec = sec || h; } }); });
        // el cuerpo puntua menos que el titulo o un encabezado: encuentra, no manda
        var cuerpo = w.OVILLO_BODY && w.OVILLO_BODY[it.u];
        if (cuerpo) toks.forEach(function (t) { if (cuerpo.indexOf(t) >= 0) score += 1; });
        if (score) hits.push({ u: it.u + (sec ? '#' + sec.id : ''), t: it.t, d: sec ? '§ ' + sec.t : (it.d || ''), k: it.k, s: score });
      });
      hits.sort(function (a, b) { return b.s - a.s; }); hits = hits.slice(0, 12);
    }
    sel = 0; paintHits();
  }
  function paintHits() { palList.innerHTML = hits.length ? hits.map(function (h, i) { return '<li' + (i === sel ? ' class="sel"' : '') + '><a href="' + REL + h.u + '"><span class="k">' + esc(h.k) + '</span><b>' + esc(h.t) + '</b><small>' + esc(h.d) + '</small></a></li>'; }).join('') : (palInput.value ? '<li class="none">Sin resultados</li>' : ''); }
  $$('[data-search]').forEach(function (i) { i.addEventListener('focus', function () { if (w.OVILLO_INDEX) { openPal(i.value); i.blur(); } }); i.addEventListener('keydown', function (e) { if (e.key === 'Enter' && i.value.trim()) location.href = REL + 'buscar.html?q=' + encodeURIComponent(i.value.trim()); }); });
  d.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPal(''); } else if (e.key === '/' && !/INPUT|TEXTAREA/.test(d.activeElement.tagName) && !d.body.classList.contains('deck') && !d.body.classList.contains('present')) { e.preventDefault(); openPal(''); } });

  // ---- motor de diapositivas ------------------------------------------------------------------
  var deck = null;
  function Deck(slides, opts) {
    this.slides = slides; this.i = 0; this.frag = 0; this.opts = opts || {}; this.overview = false; this.notes = false;
    var self = this;
    slides.forEach(function (s, k) { s.setAttribute('data-n', k + 1); s.classList.add('slide'); });
    this.total = slides.length;
    this.counter = $('[data-counter]'); this.progress = $('[data-progress]');
    if (this.progress) this.progress.max = this.total;
    var h = parseInt((location.hash || '').replace(/^#(s|p)?/, ''), 10); if (h > 0 && h <= this.total) this.i = h - 1;
    this.show();
    this.onKey = function (e) { self.key(e); }; d.addEventListener('keydown', this.onKey);
    this.onHash = function () { var n = parseInt((location.hash || '').replace(/^#(s|p)?/, ''), 10); if (n > 0 && n <= self.total && n - 1 !== self.i) { self.i = n - 1; self.frag = 0; self.show(); } }; w.addEventListener('hashchange', this.onHash);
    var x0 = null; this.onTs = function (e) { x0 = e.changedTouches[0].clientX; }; this.onTe = function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) >= 40) (dx < 0 ? self.next() : self.prev()); x0 = null; };
    d.addEventListener('touchstart', this.onTs, { passive: true }); d.addEventListener('touchend', this.onTe);
    this.onClick = function (e) { if (self.overview) { var s = e.target.closest('.slide'); if (s) { self.i = self.slides.indexOf(s); self.frag = 0; self.toggleOverview(); } } };
    d.addEventListener('click', this.onClick);
  }
  Deck.prototype.fragments = function () { return $$('.fragment', this.slides[this.i]); };
  Deck.prototype.show = function () {
    var self = this;
    this.slides.forEach(function (s, k) { s.classList.toggle('active', k === self.i); s.classList.toggle('past', k < self.i); });
    this.fragments().forEach(function (f, k) { f.classList.toggle('shown', k < self.frag); });
    if (this.counter) this.counter.textContent = (this.i + 1) + ' / ' + this.total;
    if (this.progress) this.progress.value = this.i + 1;
    var hash = '#' + (this.opts.hashPrefix || 's') + (this.i + 1); if (location.hash !== hash) history.replaceState(null, '', hash);
    var n = $('.notes', this.slides[this.i]); var box = $('[data-notes]'); if (box) box.innerHTML = n ? n.innerHTML : '<p class="muted">Sin notas para esta diapositiva.</p>';
  };
  Deck.prototype.next = function () { if (this.overview) return; var f = this.fragments(); if (this.frag < f.length) { this.frag++; this.show(); return; } if (this.i < this.total - 1) { this.i++; this.frag = 0; this.show(); } };
  Deck.prototype.prev = function () { if (this.overview) return; if (this.frag > 0) { this.frag--; this.show(); return; } if (this.i > 0) { this.i--; this.frag = $$('.fragment', this.slides[this.i]).length; this.show(); } };
  Deck.prototype.go = function (n) { this.i = Math.max(0, Math.min(this.total - 1, n)); this.frag = 0; this.show(); };
  Deck.prototype.toggleOverview = function () { this.overview = !this.overview; d.body.classList.toggle('overview', this.overview); if (!this.overview) this.show(); };
  Deck.prototype.toggleNotes = function () { this.notes = !this.notes; var box = $('[data-notes]'); if (!box) { box = d.createElement('aside'); box.className = 'notes-panel'; box.setAttribute('data-notes', ''); d.body.appendChild(box); this.show(); } d.body.classList.toggle('show-notes', this.notes); };
  Deck.prototype.help = function () { var h = $('.deck-help'); if (h) { h.remove(); return; } h = d.createElement('div'); h.className = 'deck-help'; h.innerHTML = '<div><h3>Atajos</h3><ul><li><kbd>→</kbd> <kbd>↓</kbd> <kbd>espacio</kbd> <kbd>PgDn</kbd> siguiente (revela fragmentos)</li><li><kbd>←</kbd> <kbd>↑</kbd> <kbd>PgUp</kbd> anterior</li><li><kbd>Inicio</kbd> <kbd>Fin</kbd> primera y última</li><li><kbd>O</kbd> o <kbd>Esc</kbd> vista general (clic en una para ir)</li><li><kbd>N</kbd> notas de orador</li><li><kbd>F</kbd> pantalla completa</li><li>Imprimir: una diapositiva por página</li></ul><p class="muted">Pulsa <kbd>?</kbd> para cerrar.</p></div>'; d.body.appendChild(h); };
  Deck.prototype.key = function (e) {
    if (/INPUT|TEXTAREA/.test(d.activeElement.tagName)) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === ' ' || k === 'PageDown') { e.preventDefault(); this.next(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); this.prev(); }
    else if (k === 'Home') { e.preventDefault(); this.go(0); }
    else if (k === 'End') { e.preventDefault(); this.go(this.total - 1); }
    else if (k === 'o' || k === 'O') { this.toggleOverview(); }
    else if (k === 'Escape') { if (this.overview) this.toggleOverview(); else if (this.opts.onExit) this.opts.onExit(); else this.toggleOverview(); }
    else if (k === 'n' || k === 'N') { this.toggleNotes(); }
    else if (k === 'f' || k === 'F') { if (d.fullscreenElement) d.exitFullscreen(); else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen(); }
    else if (k === '?') { this.help(); }
  };
  Deck.prototype.destroy = function () { d.removeEventListener('keydown', this.onKey); w.removeEventListener('hashchange', this.onHash); d.removeEventListener('touchstart', this.onTs); d.removeEventListener('touchend', this.onTe); d.removeEventListener('click', this.onClick); var self = this; this.slides.forEach(function (s) { s.classList.remove('active', 'past', 'slide'); s.removeAttribute('data-n'); $$('.fragment', s).forEach(function (f) { f.classList.add('shown'); }); }); d.body.classList.remove('overview', 'show-notes'); var h = $('.deck-help'); if (h) h.remove(); if (self.opts.hashPrefix === 'p') history.replaceState(null, '', location.pathname); };

  // deck dedicado
  if (d.body.classList.contains('deck')) { $$('[data-prev]').forEach(function (b) { b.addEventListener('click', function () { deck.prev(); }); }); $$('[data-next]').forEach(function (b) { b.addEventListener('click', function () { deck.next(); }); }); deck = new Deck($$('[data-slides] > .slide'), { hashPrefix: 's' }); }

  // modo presentacion sobre una pagina normal: cada <section class="sec"> es una slide; portada = h1 + lede
  $$('[data-present]').forEach(function (b) { b.addEventListener('click', function () { if (d.body.classList.contains('present')) exitPresent(); else enterPresent(); }); });
  function enterPresent() {
    var main = $('main'); if (!main) return;
    var secs = $$('main .sec');
    if (!secs.length) { alert('Esta página no tiene secciones (##) que presentar.'); return; }
    var cover = $('.present-cover'); if (!cover) { cover = d.createElement('section'); cover.className = 'present-cover slide cover'; var h1 = $('h1', main), lede = $('.lede', main); cover.innerHTML = '<div class="slide-body"><p class="eyebrow">Ovillo</p>' + (h1 ? '<h1>' + h1.innerHTML + '</h1>' : '') + (lede ? '<p class="lede">' + lede.innerHTML + '</p>' : '') + '</div>'; main.insertBefore(cover, main.firstChild); }
    var bar = $('.deck-bar'); if (!bar) { bar = d.createElement('header'); bar.className = 'deck-bar'; bar.innerHTML = '<span class="deck-title">' + esc(d.title.replace(/ · Ovillo$/, '')) + '</span><span class="deck-counter" data-counter></span><progress class="deck-progress" data-progress value="1"></progress>'; d.body.appendChild(bar); }
    d.body.classList.add('present');
    deck = new Deck([cover].concat(secs), { hashPrefix: 'p', onExit: exitPresent });
  }
  function exitPresent() { if (deck) { deck.destroy(); deck = null; } d.body.classList.remove('present'); var c = $('.present-cover'); if (c) c.remove(); var b = $('.deck-bar'); if (b && !d.body.classList.contains('deck')) b.remove(); }
  if (/^#p\d+$/.test(location.hash) && $('[data-present]')) enterPresent();
})();
