/* PULIRA · dinámicas de conversión: pop-up de bienvenida (código de lanzamiento), ruleta "Gira y gana" (un giro por persona, premio
   REAL con condición y vencimiento a 48 h), barra de premio con cuenta regresiva, avisos de progreso y confeti en la rutina, y pop-up
   de salida en escritorio. Config en CONFIG.dinamicas. La bolsa (tienda.js) aplica el MEJOR código: premio y descuento del kit no se suman.
   Los premios están acotados a lo que aguanta el margen (UNIT-ECONOMICS.md): regalo barato, envío, 5 % desde $999, 8–10 % solo en kits de 3. */
(function () {
  'use strict';
  var CFG = window.CONFIG || {};
  var C = { activas: true, bienvenida: true, ruleta: true, salida: true, horasPremio: 48, retrasoMs: 1200, alScroll: false };   // alScroll: además del retraso, sale al primer scroll
  Object.keys(CFG.dinamicas || {}).forEach(function (k) { C[k] = CFG.dinamicas[k]; });
  var EV = window.EVENTOS || { emit: function () {} };
  var PREMIOS = {
    GIROESPONJAS: { corto: 'Esponjas gratis', texto: 'Esponjas de maquillaje de regalo', cond: 'en pedidos desde $999', peso: 28, regalo: 'esponjas-x4', min: 999, color: '#F3D9CF' },
    GIRO5:        { corto: '−5 %',            texto: '5 % de descuento',                 cond: 'en pedidos desde $999', peso: 24, descuento: 0.05, min: 999, color: '#FBFAF7' },
    GIROENVIO:    { corto: 'Envío gratis',    texto: 'Envío gratis',                     cond: 'en cualquier pedido',   peso: 20, envioGratis: true, color: '#F3D9CF' },
    GIROBROCHAS:  { corto: 'Brochas −50 %',   texto: 'Limpiador de brochas a mitad de precio', cond: 'con tu pedido desde $999', peso: 16, mitad: 'limpiador-brochas', min: 999, color: '#FBFAF7' },
    GIRO8:        { corto: '−8 %',            texto: '8 % de descuento',                 cond: 'en kits de 3 aparatos', peso: 8, descuento: 0.08, minAparatos: 3, color: '#F3D9CF' },
    GIRO10:       { corto: '−10 %',           texto: '10 % de descuento',                cond: 'en kits de 3 aparatos desde $1,299', peso: 4, descuento: 0.10, minAparatos: 3, min: 1299, color: '#B9432B', claro: true }
  };
  window.PREMIOS = PREMIOS;
  var IDS = Object.keys(PREMIOS);
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var MXN = function (n) { return '$' + Math.round(n).toLocaleString('es-MX'); };
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var esRutina = !!$('rutina'), EMBED = /[?&]embed=1/.test(location.search);

  function premio() { try { var p = JSON.parse(localStorage.getItem('pulira-premio') || 'null'); return p && p.codigo && PREMIOS[p.codigo] && p.vence > Date.now() ? p : null; } catch (e) { return null; } }
  function ses(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function leerDiag() { try { return JSON.parse(sessionStorage.getItem('pulira-diag') || 'null'); } catch (e) { return null; } }
  function copiar(t, btn) {
    var ok = function () { if (btn) { btn.textContent = 'Copiado'; setTimeout(function () { btn.textContent = 'Copiar'; }, 1800); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function () { window.prompt('Copia tu código:', t); });
    else window.prompt('Copia tu código:', t);
  }
  function venceTexto(pr) { try { return new Date(pr.vence).toLocaleString('es-MX', { weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false }); } catch (e) { return 'en 48 horas'; } }

  /* ---- overlay ---- */
  var pop = null;
  function escHandler(e) { if (e.key === 'Escape') cierraPop(); }
  function abrePop(html, tipo) {
    cierraPop();
    pop = document.createElement('div'); pop.className = 'pop on ' + tipo; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'true');
    pop.innerHTML = '<div class="pop-box"><button class="pop-x" type="button" aria-label="Cerrar">×</button>' + html + '</div>';
    var h2 = pop.querySelector('h2'); if (h2) { h2.id = 'pop-titulo'; pop.setAttribute('aria-labelledby', 'pop-titulo'); }
    document.body.appendChild(pop);
    pop.querySelector('.pop-x').onclick = cierraPop;
    pop.addEventListener('click', function (e) { if (e.target === pop) cierraPop(); });
    document.addEventListener('keydown', escHandler);
    Array.prototype.forEach.call(pop.querySelectorAll('[data-copia]'), function (b) { b.onclick = function () { copiar(b.dataset.copia, b); }; });
    Array.prototype.forEach.call(pop.querySelectorAll('[data-cerrar]'), function (b) { b.onclick = function (e) { e.preventDefault(); cierraPop(); }; });
    EV.emit('popup_view', { tipo: tipo });
    var f = pop.querySelector('.btn'); if (f) f.focus();
    return pop;
  }
  function cierraPop() { if (pop) { pop.remove(); pop = null; } document.removeEventListener('keydown', escHandler); }
  function irARutina() { cierraPop(); if (esRutina) { var b = $('empezar'); if (b) b.click(); } else location.href = 'rutina.html'; }
  function chip(codigo) { return '<div class="codigo-chip"><span>' + esc(codigo) + '</span><button type="button" data-copia="' + esc(codigo) + '">Copiar</button></div>'; }
  function botonesSalida(primario) {
    return '<div class="pop-acc">' + primario + (esRutina ? '<button class="btn linea" type="button" data-rutina>Armar mi rutina</button>' : '<a class="btn linea" href="rutina.html">Armar mi rutina</a>') + '<a class="link" href="#" data-cerrar>Ahora no</a></div>';
  }

  /* ---- bienvenida ---- */
  function bienvenida() {
    if (!C.bienvenida || ses('pulira-pop-bienvenida') || premio() || pop) return;
    ses('pulira-pop-bienvenida', '1');
    var promo = CFG.promo && CFG.promo.activa ? CFG.promo : null;
    var html = '<p class="eyebrow">Regalo de lanzamiento</p><h2>' + (promo ? 'Envío gratis en tu primer pedido.' : 'Tu rutina, con premio.') + '</h2>' +
      '<p>' + (promo ? 'Usa este código al pagar. ' : '') + 'Y hay más: gira la ruleta y llévate un premio extra para tu kit. Un giro por persona, premios reales.</p>' + (promo ? chip(promo.codigo) : '') +
      botonesSalida('<button class="btn acento" type="button" data-girar>Girar la ruleta</button>');
    var p = abrePop(html, 'pop-bienvenida');
    p.querySelector('[data-girar]').onclick = ruleta;
    if (p.querySelector('[data-rutina]')) p.querySelector('[data-rutina]').onclick = irARutina;
  }

  /* ---- ruleta ---- */
  function sorteo() {
    var tot = IDS.reduce(function (a, k) { return a + PREMIOS[k].peso; }, 0), r = Math.random() * tot;
    for (var i = 0; i < IDS.length; i++) { r -= PREMIOS[IDS[i]].peso; if (r <= 0) return IDS[i]; }
    return IDS[IDS.length - 1];
  }
  function svgRuleta() {
    var n = IDS.length, R = 148, out = '';
    IDS.forEach(function (k, i) {
      var a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2, am = (a0 + a1) / 2;
      var x0 = 150 + R * Math.cos(a0), y0 = 150 + R * Math.sin(a0), x1 = 150 + R * Math.cos(a1), y1 = 150 + R * Math.sin(a1);
      out += '<path d="M150 150 L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + R + ' ' + R + ' 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Z" fill="' + PREMIOS[k].color + '" stroke="#151311" stroke-width="1.2"/>';
      out += '<text transform="translate(' + (150 + 96 * Math.cos(am)).toFixed(1) + ' ' + (150 + 96 * Math.sin(am)).toFixed(1) + ') rotate(' + (am * 180 / Math.PI).toFixed(1) + ')" text-anchor="middle" dominant-baseline="middle"' + (PREMIOS[k].claro ? ' style="fill:#fff"' : '') + '>' + esc(PREMIOS[k].corto) + '</text>';
    });
    return '<svg class="ruleta" id="ruleta" viewBox="0 0 300 300" aria-hidden="true"><circle cx="150" cy="150" r="149" fill="#151311"/>' + out + '</svg>';
  }
  function ruleta() {
    if (!C.ruleta) return;
    var ya = premio(); if (ya) return muestraPremio(ya, false);
    var html = '<p class="eyebrow">Gira y gana</p><h2>Un giro, un premio real.</h2><p>Todos los premios tienen su condición y valen 48 horas. Un giro por persona.</p>' +
      '<div class="ruleta-wrap"><div class="ruleta-pin"></div>' + svgRuleta() + '<div class="ruleta-centro" id="ruleta-centro">GIRA</div></div>' +
      '<div class="pop-acc" style="justify-content:center"><button class="btn acento" type="button" id="girar">Girar</button></div>' +
      '<p class="ruleta-nota">' + IDS.map(function (k) { return PREMIOS[k].corto; }).join(' · ') + '</p>';
    var p = abrePop(html, 'pop-ruleta'), girando = false, terminado = false;
    var go = function () {
      if (girando) return; girando = true;
      var k = sorteo(), n = IDS.length, centro = (IDS.indexOf(k) + 0.5) * 360 / n;   // centro del gajo, en grados desde arriba
      var giro = 360 * 5 + (360 - centro) + (Math.random() * 24 - 12);
      var svg = $('ruleta'); $('girar').disabled = true; $('ruleta-centro').textContent = '…';
      var pr = { codigo: k, texto: PREMIOS[k].texto, cond: PREMIOS[k].cond, giro: Date.now(), vence: Date.now() + C.horasPremio * 3600 * 1000 };
      try { localStorage.setItem('pulira-premio', JSON.stringify(pr)); } catch (e) {}
      EV.emit('ruleta_spin', { premio: k });
      var fin = function () { if (terminado) return; terminado = true; muestraPremio(pr, true); };
      svg.addEventListener('transitionend', fin); setTimeout(fin, 5000);
      setTimeout(function () { svg.style.transform = 'rotate(' + giro + 'deg)'; }, 40);
    };
    $('girar').onclick = go; $('ruleta-centro').onclick = go;
  }
  function muestraPremio(pr, nuevo) {
    var d = PREMIOS[pr.codigo];
    var html = '<p class="eyebrow">' + (nuevo ? 'Te tocó' : 'Tu premio') + '</p><h2>' + esc(d.texto) + '.</h2>' +
      '<p>' + esc(cap(d.cond)) + '. Vence el ' + esc(venceTexto(pr)) + '. Se aplica en la bolsa; si tienes otro código, usamos el que más te convenga.</p>' + chip(pr.codigo) +
      '<div class="pop-acc">' + (esRutina ? '<button class="btn acento" type="button" data-rutina>Armar mi rutina</button>' : '<a class="btn acento" href="rutina.html">Armar mi rutina</a><button class="btn linea" type="button" data-bolsa>Ir a la bolsa</button>') + '<a class="link" href="#" data-cerrar>Cerrar</a></div>';
    var p = abrePop(html, 'pop-premio');
    if (p.querySelector('[data-rutina]')) p.querySelector('[data-rutina]').onclick = irARutina;
    if (p.querySelector('[data-bolsa]')) p.querySelector('[data-bolsa]').onclick = function () { cierraPop(); var b = $('btn-bolsa'); if (b) b.click(); };
    if (nuevo) confeti();
    barra();
  }

  /* ---- barra de premio con cuenta regresiva ---- */
  var barraEl = null, timer = null;
  function barra() {
    if (EMBED) return;
    var pr = premio();
    if (!pr) { if (barraEl) { barraEl.classList.remove('on'); document.body.classList.remove('con-premio'); } return; }
    if (!barraEl) { barraEl = document.createElement('div'); barraEl.className = 'premio-bar'; document.body.appendChild(barraEl); }
    var d = PREMIOS[pr.codigo];
    barraEl.innerHTML = '<span>Tu premio: ' + esc(d.texto.toLowerCase()) + ' ' + esc(d.cond) + ' · <b>' + esc(pr.codigo) + '</b></span><span class="cd" id="premio-cd"></span><button class="btn" type="button" id="premio-ver">Ver mi premio</button>';
    $('premio-ver').onclick = function () { muestraPremio(pr, false); };
    setTimeout(function () { barraEl.classList.add('on'); document.body.classList.add('con-premio'); }, 30);
    if (timer) clearInterval(timer);
    var tick = function () {
      var ms = pr.vence - Date.now();
      if (ms <= 0) { clearInterval(timer); try { localStorage.removeItem('pulira-premio'); } catch (e) {} barra(); return; }
      var h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000), el = $('premio-cd');
      if (el) el.textContent = 'vence en ' + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    };
    tick(); timer = setInterval(tick, 1000);
  }

  /* ---- avisos y confeti ---- */
  var toastEl = null, toastTimer = null;
  function toast(titulo, texto) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = '<b>' + esc(titulo) + '</b>' + esc(texto || '');
    setTimeout(function () { toastEl.classList.add('on'); }, 30);
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 3800);
  }
  function confeti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var c = document.createElement('canvas'); c.className = 'confeti'; document.body.appendChild(c);
    var g = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight, t0 = performance.now();
    var cols = ['#B9432B', '#151311', '#F3D9CF', '#2F6B4F', '#E1DBD1'], parts = [];
    for (var i = 0; i < 140; i++) parts.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: (Math.random() - 0.5) * 2.4, vy: 2.2 + Math.random() * 3.5, r: 3 + Math.random() * 4, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, col: cols[i % cols.length] });
    (function frame(now) {
      g.clearRect(0, 0, W, H);
      parts.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.rot += p.vr; g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.col; g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); g.restore(); });
      if (now - t0 < 2600) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }
  document.addEventListener('pulira:paso', function (e) {
    var n = e.detail.n, tot = e.detail.total;
    if (n === Math.ceil(tot / 2)) toast('Vas a la mitad', 'Al terminar se desbloquea el descuento de tu kit.');
    if (n === tot - 1) toast('Última pregunta', 'Tu kit está a un toque.');
  });
  document.addEventListener('pulira:resultado', function () {
    confeti();
    var pr = premio();
    toast('Desbloqueaste tu rutina', pr ? 'Tu premio ' + pr.codigo + ' te espera en la bolsa.' : (C.ruleta && !EMBED ? 'Gira la ruleta para un premio extra.' : ''));
  });
  function resumenPremio(total, aparatos) {   // para la pantalla de resultado de rutina-ui.js
    var pr = premio(); if (!pr) return null;
    var d = PREMIOS[pr.codigo], aplica = !(d.min && total < d.min) && !(d.minAparatos && aparatos < d.minAparatos);
    var txt = d.texto + ' (' + pr.codigo + '): ' + (aplica ? 'se aplica en tu bolsa' + (d.regalo || d.mitad ? ' al agregar el producto' : '') + '.' : d.cond + '. ' + (d.min && total < d.min ? 'Te faltan ' + MXN(d.min - total) + '.' : 'Tu kit tiene ' + aparatos + (aparatos === 1 ? ' aparato.' : ' aparatos.')));
    return { aplica: aplica, texto: txt, codigo: pr.codigo };
  }

  /* ---- salida (escritorio, una vez por sesión) ---- */
  function salida() {
    if (!C.salida || ses('pulira-pop-salida') || ('ontouchstart' in window)) return;
    var h = function (e) {
      if (e.relatedTarget || e.clientY > 8 || pop) return;
      document.removeEventListener('mouseout', h);
      if (ses('pulira-pop-salida')) return; ses('pulira-pop-salida', '1');
      var pr = premio(); if (pr) return muestraPremio(pr, false);
      var p = abrePop('<p class="eyebrow">Antes de irte</p><h2>Un giro, un premio real.</h2><p>Gira la ruleta: envío gratis, regalos o hasta 10 % en tu kit. Un giro por persona, vale 48 horas.</p><div class="pop-acc"><button class="btn acento" type="button" data-girar>Girar la ruleta</button><a class="link" href="#" data-cerrar>No, gracias</a></div>', 'pop-salida');
      p.querySelector('[data-girar]').onclick = ruleta;
    };
    document.addEventListener('mouseout', h);
  }

  function init() {
    if (!C.activas || EMBED) return;   // incrustada en la tienda, la tienda pone sus propios pop-ups
    barra();
    if (location.hash === '#ruleta') { ses('pulira-pop-bienvenida', '1'); setTimeout(ruleta, 300); }
    else { var d = leerDiag(); if (!esRutina || !d || d.vista === 'inicio') { setTimeout(bienvenida, C.retrasoMs); if (C.alScroll) window.addEventListener('scroll', function h() { if (window.scrollY > 240) { window.removeEventListener('scroll', h); bienvenida(); } }, { passive: true }); } }
    salida();
  }
  window.DINAMICAS = { abrirRuleta: ruleta, premio: premio, resumenPremio: resumenPremio, toast: toast, confeti: confeti, cerrar: cierraPop };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
