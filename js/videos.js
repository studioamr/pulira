/* PULIRA · "Así se usa": videos públicos de YouTube por aparato en un carril de scroll infinito (se vuelve a empezar solo).
   Lite embed: miniatura + botón; el iframe se crea al tocar (youtube-nocookie). Lista tomada de las fichas de Amboras (13-sep-2026). */
(function () {
  'use strict';
  var VIDEOS = [{"id": "M61yGnG7XPc", "h": "cepillo-facial", "n": "Cepillo facial sónico", "e": false}, {"id": "aZp_uHQ29wM", "h": "cepillo-facial", "n": "Cepillo facial sónico", "e": false}, {"id": "cekY0yPE-tk", "h": "cepillo-secador", "n": "Cepillo secador", "e": false}, {"id": "p04Ny-rGyY0", "h": "cepillo-secador", "n": "Cepillo secador", "e": false}, {"id": "JqgCx82iM54", "h": "espatula-ultrasonica", "n": "Espátula ultrasónica", "e": false}, {"id": "LTX5_aws4Qs", "h": "espatula-ultrasonica", "n": "Espátula ultrasónica", "e": false}, {"id": "oVDvVL8scFU", "h": "espejo-led", "n": "Espejo LED", "e": false}, {"id": "shuMY-d1g_Q", "h": "espejo-led", "n": "Espejo LED", "e": false}, {"id": "Qdu8XQIR2Og", "h": "esponjas-x4", "n": "Esponjas · técnica", "e": false}, {"id": "TkyK_RJutYo", "h": "esponjas-x4", "n": "Esponjas · técnica", "e": false}, {"id": "GKSV2TCnLgE", "h": "gua-sha-electrico", "n": "Gua Sha eléctrico", "e": false}, {"id": "Yh8FONS2wmY", "h": "gua-sha-electrico", "n": "Gua Sha eléctrico", "e": false}, {"id": "bfilXkptOrI", "h": "kit-cabello", "n": "Kit Cabello", "e": false}, {"id": "EGBpQmzxQK8", "h": "kit-glow", "n": "Kit Glow", "e": false}, {"id": "Odnt9A44cu0", "h": "kit-glow", "n": "Kit Glow", "e": false}, {"id": "RGc8BfULgoI", "h": "lampara-unas", "n": "Lámpara UV/LED SUN 5", "e": true}, {"id": "XgVc2bEIkYE", "h": "lampara-unas", "n": "Lámpara UV/LED SUN 5", "e": true}, {"id": "Upvessct2j0", "h": "limpiador-brochas", "n": "Limpiador de brochas", "e": false}, {"id": "mOxv9htBSuo", "h": "limpiador-brochas", "n": "Limpiador de brochas", "e": false}, {"id": "Oki0PGU31is", "h": "masajeador-cabelludo", "n": "Masajeador de cuero cabelludo", "e": false}, {"id": "fRZm4U2ElkA", "h": "mascara-led", "n": "Máscara LED", "e": false}, {"id": "HTCf5IxXcuU", "h": "microcorriente", "n": "Microcorriente", "e": false}, {"id": "DvpeZada9Nk", "h": "removedor-puntos", "n": "Removedor de puntos negros", "e": false}, {"id": "UsaOjnx1pg8", "h": "removedor-puntos", "n": "Removedor de puntos negros", "e": false}, {"id": "rHJZXWmeDCE", "h": "vaporizador", "n": "Vaporizador K.Skin KD33S", "e": true}];
  var carril = document.getElementById('carril-videos');
  if (!carril || !VIDEOS.length) return;
  var pasadas = 0, MAX_FIG = 120;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function figura(v) {
    var f = document.createElement('figure');
    f.className = 'video'; f.dataset.id = v.id;
    f.innerHTML = '<button class="play" type="button" aria-label="Reproducir: ' + esc(v.n) + '">' +
      '<img src="https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg" alt="" loading="lazy" decoding="async"><span class="tri" aria-hidden="true"></span></button>' +
      '<figcaption>' + esc(v.n) + (v.e ? ' · modelo exacto' : '') + '</figcaption>';
    return f;
  }
  function pasada() {
    var frag = document.createDocumentFragment();
    VIDEOS.forEach(function (v) { frag.appendChild(figura(v)); });
    carril.appendChild(frag); pasadas++;
    // no dejar crecer el DOM sin límite: se quitan las primeras figuras cuando ya quedaron muy atrás
    while (carril.children.length > MAX_FIG) {
      var p = carril.firstElementChild, w = p.getBoundingClientRect().width + 14;
      if (carril.scrollLeft < w * 2) break;
      carril.removeChild(p); carril.scrollLeft -= w;
    }
  }
  pasada(); pasada();
  var ocupado = false;
  carril.addEventListener('scroll', function () {
    if (ocupado) return;
    if (carril.scrollLeft + carril.clientWidth > carril.scrollWidth - carril.clientWidth * 1.5) { ocupado = true; pasada(); ocupado = false; }
  }, { passive: true });
  carril.addEventListener('click', function (e) {
    var b = e.target.closest('button.play'); if (!b) return;
    var f = b.closest('figure'), id = f.dataset.id;
    // solo un video sonando a la vez
    carril.querySelectorAll('iframe').forEach(function (i) { var g = i.closest('figure'); var v = VIDEOS.filter(function (x) { return x.id === g.dataset.id; })[0]; if (v) g.replaceWith(figura(v)); });
    var ifr = document.createElement('iframe');
    ifr.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1&modestbranding=1';
    ifr.title = f.querySelector('figcaption').textContent; ifr.allow = 'autoplay; encrypted-media; picture-in-picture'; ifr.allowFullscreen = true; ifr.loading = 'lazy';
    b.replaceWith(ifr);
    if (window.EVENTOS) try { EVENTOS.emit('video_play', { video_id: id }); } catch (err) {}
  });
})();
