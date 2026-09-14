/* PULIRA · tienda (catálogo, picks, kits, ficha, bolsa con código y sugerencias, pedido). Vanilla, sin dependencias. */
(function () {
  'use strict';
  var GLIFOS = {
    esponjas: '<rect x="14" y="30" width="92" height="64" rx="10"/><path d="M30 76c-6 0-8-6-5-11l5-8 5 8c3 5 1 11-5 11zM50 76c-6 0-8-6-5-11l5-8 5 8c3 5 1 11-5 11zM70 76c-6 0-8-6-5-11l5-8 5 8c3 5 1 11-5 11zM90 76c-6 0-8-6-5-11l5-8 5 8c3 5 1 11-5 11z"/>',
    mascara: '<path d="M30 26h60a12 12 0 0 1 12 12v30c0 20-18 30-42 30S18 88 18 68V38a12 12 0 0 1 12-12z"/><path d="M38 52h16M66 52h16M48 76h24"/><path d="M60 26V14"/>',
    microcorriente: '<path d="M60 110V62"/><path d="M60 62 38 36"/><path d="M60 62 82 36"/><circle cx="34" cy="28" r="9"/><circle cx="86" cy="28" r="9"/><rect x="50" y="84" width="20" height="28" rx="7"/>',
    espatula: '<path d="M44 14h32l-4 40H48z"/><rect x="48" y="54" width="24" height="52" rx="8"/><path d="M60 70v20"/>',
    cepillo: '<circle cx="60" cy="50" r="34"/><circle cx="46" cy="42" r="2"/><circle cx="60" cy="38" r="2"/><circle cx="74" cy="42" r="2"/><circle cx="42" cy="56" r="2"/><circle cx="60" cy="52" r="2"/><circle cx="78" cy="56" r="2"/><circle cx="50" cy="66" r="2"/><circle cx="70" cy="66" r="2"/><path d="M48 84v18a6 6 0 0 0 6 6h12a6 6 0 0 0 6-6V84"/>',
    succion: '<rect x="44" y="34" width="32" height="74" rx="12"/><path d="M52 34V22a8 8 0 0 1 16 0v12"/><circle cx="60" cy="13" r="5"/><path d="M52 60h16"/>',
    vapor: '<path d="M40 110h40l6-50H34z"/><path d="M50 60V42M70 60V42"/><path d="M42 32c6-8 12 8 18 0s12 8 18 0"/><path d="M42 18c6-8 12 8 18 0s12 8 18 0"/>',
    guasha: '<path d="M60 108C34 90 18 74 18 52a22 22 0 0 1 42-10 22 22 0 0 1 42 10c0 22-16 38-42 56z"/><path d="M60 44v40"/>',
    ipl: '<path d="M40 14h40v40l-8 54H48l-8-54z"/><rect x="48" y="22" width="24" height="16" rx="3"/><circle cx="60" cy="80" r="5"/>',
    secador: '<rect x="40" y="12" width="40" height="56" rx="20"/><path d="M40 28h40M40 40h40M40 52h40"/><rect x="52" y="68" width="16" height="40" rx="6"/>',
    cabelludo: '<path d="M28 46a32 32 0 0 1 64 0v8H28z"/><path d="M36 54v30M50 54v40M70 54v40M84 54v30"/><circle cx="36" cy="87" r="3"/><circle cx="50" cy="97" r="3"/><circle cx="70" cy="97" r="3"/><circle cx="84" cy="87" r="3"/>',
    lampara: '<path d="M18 92V60a42 42 0 0 1 84 0v32z"/><path d="M18 92h84"/><path d="M40 76h40"/><circle cx="60" cy="44" r="4"/>',
    espejo: '<circle cx="60" cy="46" r="32"/><circle cx="60" cy="46" r="24"/><path d="M60 78v20M40 108h40"/>',
    brochas: '<path d="M30 60h60l-6 44H36z"/><path d="M60 60V26"/><path d="M50 26h20l-2-14H52z"/><path d="M40 60c0-8 40-8 40 0"/>',
    kit: '<rect x="20" y="30" width="56" height="56" rx="8"/><rect x="44" y="46" width="56" height="44" rx="8"/>'
  };
  var CATS = [['todo', 'Todo'], ['rostro', 'Rostro'], ['cuerpo', 'Cuerpo'], ['cabello', 'Cabello'], ['unas', 'Uñas'], ['kits', 'Kits']];
  var NOMBRE_CAT = { rostro: 'Rostro', cuerpo: 'Cuerpo', cabello: 'Cabello', unas: 'Uñas', kits: 'Kit' };
  var PICKS = [
    ['mascara-led', 'La categoría más vendida del beauty tech en Mercado Libre, con potencia real y ficha honesta. Diez minutos al día.'],
    ['espatula-ultrasonica', 'La limpieza profunda de un facial, cada semana, por menos de lo que cuesta uno solo.'],
    ['kit-rutina', 'Las tres piezas de la limpieza en una caja: cuesta menos que sueltas y el envío va gratis.']
  ];
  var MXN = function (n) { return '$' + Math.round(n).toLocaleString('es-MX'); };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var filtro = 'todo', q = '';
  var bolsa = {}, promo = {};
  try { bolsa = JSON.parse(localStorage.getItem('pulira-bolsa') || '{}'); } catch (e) { bolsa = {}; }
  try { promo = JSON.parse(localStorage.getItem('pulira-promo') || '{}'); } catch (e) { promo = {}; }

  // Catálogo activo + copy de ventas fusionado
  var P = CATALOGO.filter(function (p) { return p.activo !== false; }).map(function (p) { return Object.assign({}, p, (typeof COPY !== 'undefined' && COPY[p.id]) || {}); });
  function byId(id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; }
  function precioSueltos(k) { return (k.componentes || []).reduce(function (s, cid) { var c = byId(cid); return s + (c ? c.precio : 0); }, 0); }
  function ahorro(k) { return k.componentes ? precioSueltos(k) - k.precio : 0; }

  /* ---- imágenes: foto si existe, glifo si no ---- */
  function svg(glifo) { return '<svg viewBox="0 0 120 120" aria-hidden="true">' + (GLIFOS[glifo] || GLIFOS.kit) + '</svg>'; }
  window.PULIRA_glifo = function (img) { var g = img.getAttribute('data-glifo'); var span = document.createElement('span'); span.innerHTML = svg(g); img.replaceWith(span.firstChild); };
  var FOTOS = (typeof window.FOTOS === 'object' && window.FOTOS) || {};
  function vistas(p) { var v = FOTOS[p.id]; return Array.isArray(v) ? v : (v ? ['principal'] : []); }
  function fotoSrc(p, vista) { return 'img/p/' + p.id + (vista === 'principal' ? '' : '-' + vista) + '.jpg'; }
  var NOMBRE_VISTA = { principal: 'Producto', frente: 'Frente', detalle: 'Detalle', contexto: 'En uso', empaque: 'Caja' };
  function tile(p, extra) {
    var vs = vistas(p);
    var src = p.img || (vs.length ? fotoSrc(p, 'principal') : '');
    var alt = vs.indexOf('detalle') >= 0 ? '<img loading="lazy" class="alt" src="' + fotoSrc(p, 'detalle') + '" alt="">' : '';
    return '<div class="tile" data-ver="' + p.id + '"><span class="cod mono">' + esc(p.codigo) + '</span>' + (extra || '') +
      (src ? '<img loading="lazy" src="' + esc(src) + '" alt="' + esc(p.nombre) + '" data-glifo="' + esc(p.glifo) + '" onerror="PULIRA_glifo(this)">' + alt : svg(p.glifo)) + '</div>';
  }
  function galeria(p) {
    var vs = vistas(p);
    if (vs.length < 2) return tile(p).replace('data-ver="' + p.id + '"', '');
    return '<div class="galeria"><div class="tile grande"><span class="cod mono">' + esc(p.codigo) + '</span><img id="galeria-img" src="' + fotoSrc(p, vs[0]) + '" alt="' + esc(p.nombre) + '"></div>' +
      '<div class="thumbs">' + vs.map(function (v, i) { return '<button class="thumb' + (i === 0 ? ' on' : '') + '" data-vista="' + v + '" data-pid="' + p.id + '" aria-label="' + NOMBRE_VISTA[v] + '"><img src="' + fotoSrc(p, v) + '" alt=""><span>' + NOMBRE_VISTA[v] + '</span></button>'; }).join('') + '</div></div>';
  }
  function badge(p) {
    if (p.componentes) return '<span class="badge-kit gratis">Envío gratis · ahorras ' + MXN(ahorro(p)) + '</span>';
    if (p.precio >= CONFIG.envioGratisDesde) return '<span class="badge-kit gratis">Envío gratis</span>';
    return '';
  }

  /* ---- hero + picks + kits ---- */
  (function () {
    var p = byId('mascara-led') || P[0];
    var t = $('hero-tile');
    if (!t) return;                       // la landing v3 usa un hero a sangre en HTML, sin tile
    if (FOTOS.hero) {
      t.className = 'hero-tile foto';
      t.innerHTML = '<img src="img/hero.jpg" alt="' + esc(p.nombre) + '">' +
        '<div class="pie arriba"><span>' + esc(p.codigo) + '</span><span>' + esc(p.beneficio || 'Rostro') + '</span></div>' +
        '<div class="pie abajo"><span>' + esc(p.nombre.split(' · ')[0]) + '</span><span>' + MXN(p.precio) + '</span></div>';
    } else {
      t.innerHTML = '<div class="pie"><span>' + esc(p.codigo) + '</span><span>' + esc(p.beneficio || 'Rostro') + '</span></div>' + svg(p.glifo) + '<div class="pie"><span>' + esc(p.nombre.split(' · ')[0]) + '</span><span>' + MXN(p.precio) + '</span></div>';
    }
    t.addEventListener('click', function () { abreFicha(p.id); });
    t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abreFicha(p.id); } });
  })();
  (function () { var c = $('coleccion'); if (c && FOTOS.coleccion) c.innerHTML = '<img src="img/coleccion.jpg" alt="Colección PULIRA: los dispositivos del catálogo" loading="lazy">'; })();
  function pintaPicks() {
    if (!$('picks')) return;
    $('picks').innerHTML = PICKS.map(function (pk, i) {
      var p = byId(pk[0]); if (!p) return '';
      return '<article class="pick">' + tile(p, badge(p)) + '<div class="pick-info"><span class="mono">0' + (i + 1) + ' · ' + esc(p.beneficio || NOMBRE_CAT[p.cat]) + '</span><h3>' + esc(p.nombre) + '</h3><p>' + esc(pk[1]) + '</p>' +
        '<div class="fila"><span class="precio">' + MXN(p.precio) + ' MXN</span><button class="btn chico acento" data-add="' + p.id + '">Agregar</button></div></div></article>';
    }).join('');
  }
  function pintaKits() {
    $('kits-grid').innerHTML = P.filter(function (p) { return p.componentes; }).map(function (k) {
      var sueltos = precioSueltos(k);
      return '<article class="kit">' + tile(k) + '<div class="kit-info"><span class="mono">' + esc(k.codigo) + ' · ' + esc(k.beneficio || 'Kit') + '</span><h3>' + esc(k.nombre) + '</h3><p>' + esc(k.corto) + '</p>' +
        '<ul>' + k.componentes.map(function (cid) { var c = byId(cid); return c ? '<li><span>' + esc(c.nombre.split(' · ')[0]) + '</span><span>' + MXN(c.precio) + '</span></li>' : ''; }).join('') + '</ul>' +
        '<div class="kit-precio"><span class="precio">' + MXN(k.precio) + '</span><s>' + MXN(sueltos) + ' sueltos</s><span class="ahorro">ahorras ' + MXN(sueltos - k.precio) + '</span></div></div>' +
        '<div class="card-acc"><button class="btn acento" data-add="' + k.id + '">Agregar el kit</button><button class="btn linea chico" data-ver="' + k.id + '">Ver</button></div></article>';
    }).join('');
  }

  /* ---- chips + grid ---- */
  function pintaChips() {
    $('chips').innerHTML = CATS.map(function (c) { return '<button class="chip' + (c[0] === filtro ? ' on' : '') + '" data-cat="' + c[0] + '">' + c[1] + '</button>'; }).join('');
  }
  function visibles() {
    var t = q.trim().toLowerCase();
    return P.filter(function (p) {
      if (filtro !== 'todo' && p.cat !== filtro) return false;
      if (!t) return true;
      return (p.nombre + ' ' + p.corto + ' ' + p.codigo + ' ' + (p.beneficio || '')).toLowerCase().indexOf(t) >= 0;
    });
  }
  function pintaGrid() {
    var lista = visibles();
    $('conteo').textContent = lista.length + ' producto' + (lista.length === 1 ? '' : 's') + ' · garantía 12 meses en todos';
    if (!lista.length) { $('grid').innerHTML = '<p class="vacio">Nada con ese nombre. Prueba "LED", "cepillo" o "kit".</p>'; return; }
    $('grid').innerHTML = lista.map(function (p) {
      var envio = p.precio >= CONFIG.envioGratisDesde ? 'Envío gratis' : 'Envío $' + CONFIG.envio;
      return '<article class="card">' + tile(p, badge(p)) +
        '<div class="card-info"><span class="mono">' + NOMBRE_CAT[p.cat] + '</span><h3>' + esc(p.nombre) + '</h3>' + (p.beneficio ? '<p class="beneficio">' + esc(p.beneficio) + '</p>' : '') + '<p>' + esc(p.corto) + '</p>' +
        '<div class="precio-fila"><span class="precio">' + MXN(p.precio) + ' MXN</span><span class="envio-nota">' + envio + '</span></div></div>' +
        '<div class="card-acc"><button class="btn chico acento" data-add="' + p.id + '">Agregar</button><button class="btn linea chico" data-ver="' + p.id + '">Ver</button></div></article>';
    }).join('');
  }

  /* ---- ficha ---- */
  function abreFicha(id) {
    var p = byId(id); if (!p) return;
    var ml = CONFIG.mercadoLibre && CONFIG.mercadoLibre[id];
    var comp = '';
    if (p.componentes) {
      var sueltos = precioSueltos(p);
      comp = '<h4>Incluye</h4><ul>' + p.componentes.map(function (cid) { var c = byId(cid); return c ? '<li>' + esc(c.nombre) + ' <span class="mono">' + MXN(c.precio) + '</span></li>' : ''; }).join('') + '</ul><p class="nota">Sueltos costarían ' + MXN(sueltos) + ' · en kit ahorras ' + MXN(sueltos - p.precio) + ' y el envío va gratis</p>';
    }
    var specs = Object.keys(p.specs || {}).map(function (k) { return '<tr><td>' + esc(k) + '</td><td>' + esc(p.specs[k]) + '</td></tr>'; }).join('');
    var envio = p.precio >= CONFIG.envioGratisDesde ? 'Envío gratis' : 'Envío $' + CONFIG.envio + ', gratis desde ' + MXN(CONFIG.envioGratisDesde);
    $('modal').innerHTML = '<div class="modal-box">' + galeria(p) +
      '<div class="modal-txt"><span class="mono">' + esc(p.codigo) + ' · ' + NOMBRE_CAT[p.cat] + '</span><h2>' + esc(p.nombre) + '</h2>' + (p.beneficio ? '<p class="beneficio">' + esc(p.beneficio) + '</p>' : '') +
      '<p class="precio">' + MXN(p.precio) + ' MXN <span class="mono" style="font-size:11px">· ' + envio + '</span></p><p>' + esc(p.corto) + '</p>' +
      (p.paraQuien ? '<div class="para"><b>Para quién es</b>' + esc(p.paraQuien) + '</div>' : '') +
      comp +
      '<h4>Qué hace</h4><ul>' + (p.hace || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<h4>Qué no hace</h4><ul>' + (p.noHace || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      (p.resultados ? '<div class="para"><b>Qué vas a notar y cuándo</b>' + esc(p.resultados) + '</div>' : '') +
      (p.contra ? '<div class="para"><b>Por qué cuesta ' + MXN(p.precio) + '</b>' + esc(p.contra) + '</div>' : '') +
      '<h4>Ficha</h4><table class="specs">' + specs + '</table>' +
      '<h4>En la caja</h4><p>' + esc((p.caja || []).join(' · ')) + '</p>' +
      '<div class="cta"><button class="btn acento" data-add="' + p.id + '">Agregar a la bolsa</button>' + (CONFIG.whatsapp ? '<button class="btn" data-ahora="' + p.id + '">Comprar ahora por WhatsApp</button>' : '') + (ml ? '<a class="btn linea" href="' + esc(ml) + '" target="_blank" rel="noopener">Ver en Mercado Libre</a>' : '') + '</div>' +
      '<p class="nota">Garantía 12 meses · Cambio en 30 días · ' + envio + '</p></div>' +
      '<button class="cerrar" id="cerrar-ficha" aria-label="Cerrar">×</button></div>';
    $('modal').classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function cierraFicha() { $('modal').classList.remove('on'); document.body.style.overflow = ''; }

  /* ---- bolsa ---- */
  function guarda() { try { localStorage.setItem('pulira-bolsa', JSON.stringify(bolsa)); localStorage.setItem('pulira-promo', JSON.stringify(promo)); } catch (e) {} }
  function promoActiva() { return !!(CONFIG.promo && CONFIG.promo.activa && promo.codigo && promo.codigo.toUpperCase() === String(CONFIG.promo.codigo).toUpperCase()); }
  function totales() {
    var sub = 0, n = 0;
    Object.keys(bolsa).forEach(function (id) { var p = byId(id); if (!p) { delete bolsa[id]; return; } sub += p.precio * bolsa[id]; n += bolsa[id]; });
    var desc = promoActiva() ? Math.round(sub * (CONFIG.promo.descuento || 0)) : 0;
    var gratis = sub >= CONFIG.envioGratisDesde || (promoActiva() && CONFIG.promo.envioGratis);
    var envio = n === 0 ? 0 : (gratis ? 0 : CONFIG.envio);
    return { sub: sub, n: n, desc: desc, envio: envio, total: sub - desc + envio };
  }
  function sugerencias() {
    var out = [], enBolsa = Object.keys(bolsa);
    // 1) un kit que contenga algo de la bolsa y no esté ya
    P.filter(function (k) { return k.componentes && !bolsa[k.id]; }).forEach(function (k) {
      var dentro = k.componentes.filter(function (cid) { return bolsa[cid]; });
      if (dentro.length && out.length < 1) {
        var faltan = k.componentes.filter(function (cid) { return !bolsa[cid]; }).map(function (cid) { return byId(cid).nombre.split(' · ')[0]; });
        out.push({ tipo: 'kit', id: k.id, titulo: 'Cámbialo por el ' + k.nombre.split(' · ')[0], texto: (faltan.length ? 'Incluye además ' + faltan.join(' y ') + '. ' : '') + 'Ahorras ' + MXN(ahorro(k)) + ' y el envío va gratis.', boton: 'Cambiar por el kit' });
      }
    });
    // 2) para llegar al envío gratis
    var t = totales();
    if (t.n && t.envio > 0) {
      var falta = CONFIG.envioGratisDesde - t.sub;
      var cand = P.filter(function (p) { return !bolsa[p.id] && !p.componentes && p.precio >= falta; }).sort(function (a, b) { return a.precio - b.precio; })[0];
      if (cand) out.push({ tipo: 'add', id: cand.id, titulo: 'Te faltan ' + MXN(falta) + ' para envío gratis', texto: 'Agrega ' + cand.nombre.split(' · ')[0] + ' (' + MXN(cand.precio) + ') y te ahorras los $' + CONFIG.envio + ' de envío.', boton: 'Agregar' });
    }
    return out.slice(0, 2);
  }
  function pintaBolsa() {
    var t = totales();
    $('bolsa-n').textContent = t.n;
    var ids = Object.keys(bolsa);
    if (!ids.length) $('bolsa-items').innerHTML = '<p class="vacio">Tu bolsa está vacía.</p>';
    else $('bolsa-items').innerHTML = ids.map(function (id) {
      var p = byId(id);
      return '<div class="item"><div><b>' + esc(p.nombre) + '</b><span class="sub">' + esc(p.codigo) + ' · ' + MXN(p.precio) + '</span></div>' +
        '<div class="qty"><button data-menos="' + id + '" aria-label="Quitar uno">−</button><span>' + bolsa[id] + '</span><button data-mas="' + id + '" aria-label="Agregar uno">+</button></div></div>';
    }).join('');
    $('bolsa-sugerencias').innerHTML = ids.length ? sugerencias().map(function (s) { return '<div class="sug"><b>' + esc(s.titulo) + '</b><p>' + esc(s.texto) + '</p><button class="btn chico" data-sug="' + s.tipo + '" data-id="' + s.id + '">' + esc(s.boton) + '</button></div>'; }).join('') : '';
    $('t-sub').textContent = MXN(t.sub);
    $('fila-desc').hidden = t.desc === 0; $('t-desc').textContent = '−' + MXN(t.desc);
    $('t-envio').textContent = t.envio === 0 ? (t.n ? 'Gratis' : '$0') : MXN(t.envio);
    $('t-total').textContent = MXN(t.total);
    $('codigo').value = promo.codigo || '';
    $('nota-codigo').textContent = promoActiva() ? 'Código ' + CONFIG.promo.codigo + ' aplicado' + (CONFIG.promo.envioGratis ? ': envío gratis' : '') + (CONFIG.promo.descuento ? ' y ' + Math.round(CONFIG.promo.descuento * 100) + '% de descuento' : '') + '.' : (CONFIG.promo && CONFIG.promo.activa ? CONFIG.promo.texto + '.' : '');
    $('btn-pedir').disabled = t.n === 0;
    $('btn-pedir').style.opacity = t.n === 0 ? .5 : 1;
    $('btn-pedir').textContent = CONFIG.whatsapp ? 'Pedir por WhatsApp' : 'Copiar pedido';
    $('nota-pedido').textContent = CONFIG.whatsapp ? 'Te confirmamos existencia y forma de pago por WhatsApp. Pagas por transferencia o Mercado Pago.' : (t.n ? 'Canales oficiales próximamente. Tu bolsa se guarda en este navegador.' : '');
  }
  function agrega(id) { bolsa[id] = (bolsa[id] || 0) + 1; guarda(); pintaBolsa(); abreBolsa(); }
  function abreBolsa() { $('drawer').classList.add('on'); $('velo').classList.add('on'); }
  function cierraBolsa() { $('drawer').classList.remove('on'); $('velo').classList.remove('on'); }
  function textoPedido(items) {
    var t = totales();
    var lineas = Object.keys(items).map(function (id) { var p = byId(id); return '• ' + items[id] + ' × ' + p.nombre + ' (' + p.codigo + ') — ' + MXN(p.precio * items[id]); });
    return 'Hola PULIRA, quiero pedir:\n' + lineas.join('\n') + '\nSubtotal ' + MXN(t.sub) + (t.desc ? ' · Descuento −' + MXN(t.desc) : '') + ' · Envío ' + (t.envio ? MXN(t.envio) : 'gratis') + ' · Total ' + MXN(t.total) + (promoActiva() ? '\nCódigo: ' + CONFIG.promo.codigo : '') + '\nNombre:\nCiudad y C.P.:\nPago: transferencia / Mercado Pago';
  }
  function pedir() {
    if (!totales().n) return;
    var texto = textoPedido(bolsa);
    if (CONFIG.whatsapp) { window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto), '_blank'); return; }
    var ok = function () { $('nota-pedido').textContent = 'Pedido copiado. Pégalo en el chat cuando abramos canales.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, function () { window.prompt('Copia tu pedido:', texto); });
    else window.prompt('Copia tu pedido:', texto);
  }
  function comprarAhora(id) {
    var p = byId(id); if (!p) return;
    var texto = 'Hola PULIRA, quiero comprar ' + p.nombre + ' (' + p.codigo + ') — ' + MXN(p.precio) + '\nNombre:\nCiudad y C.P.:';
    window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto), '_blank');
  }

  /* ---- topbar, canales, WhatsApp flotante, newsletter ---- */
  (function () {
    var col = $('btn-colabora');
    if (col) {
      var msg = encodeURIComponent('Hola PULIRA, creo contenido de belleza y quiero colaborar. Mis redes: ');
      if (CONFIG.whatsapp) { col.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + msg; col.target = '_blank'; col.rel = 'noopener'; }
      else if (CONFIG.correo) { col.href = 'mailto:' + CONFIG.correo + '?subject=' + encodeURIComponent('Colaboración PULIRA') + '&body=' + msg; }
      else { col.addEventListener('click', function (e) { e.preventDefault(); col.textContent = 'Canales oficiales próximamente'; }); }
    }
    if (CONFIG.promo && CONFIG.promo.activa) $('topbar').textContent = CONFIG.promo.texto + ' · Garantía 12 meses · Cambio en 30 días';
    var c = $('canales'), html = '';
    if (CONFIG.whatsapp) { html += '<a href="https://wa.me/' + CONFIG.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a>'; var w = $('wa-float'); w.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent('Hola PULIRA, tengo una duda sobre '); w.hidden = false; }
    if (CONFIG.instagram) html += '<a href="https://instagram.com/' + esc(CONFIG.instagram) + '" target="_blank" rel="noopener">Instagram</a>';
    if (CONFIG.correo) html += '<a href="mailto:' + esc(CONFIG.correo) + '">Correo</a>';
    c.innerHTML = html || '<span>Canales oficiales próximamente</span>';
    $('form-news').addEventListener('submit', function (e) {
      e.preventDefault();
      var mail = $('news-mail').value.trim(); if (!mail) return;
      var lista = []; try { lista = JSON.parse(localStorage.getItem('pulira-news') || '[]'); } catch (err) {}
      if (lista.indexOf(mail) < 0) lista.push(mail);
      try { localStorage.setItem('pulira-news', JSON.stringify(lista)); } catch (err) {}
      $('form-news').innerHTML = '<span class="ok">Listo. Te avisamos cuando entre algo nuevo.</span>';
    });
  })();

  /* ---- eventos ---- */
  document.addEventListener('click', function (ev) {
    var th = ev.target.closest('.thumb');
    if (th) { var pp = byId(th.dataset.pid); if (pp) { $('galeria-img').src = fotoSrc(pp, th.dataset.vista); } document.querySelectorAll('.thumb').forEach(function (b) { b.classList.toggle('on', b === th); }); return; }
    var t = ev.target.closest('[data-add],[data-ver],[data-cat],[data-mas],[data-menos],[data-ahora],[data-sug]');
    if (t) {
      if (t.dataset.add) { agrega(t.dataset.add); return; }
      if (t.dataset.ahora) { comprarAhora(t.dataset.ahora); return; }
      if (t.dataset.ver) { abreFicha(t.dataset.ver); return; }
      if (t.dataset.cat) { filtro = t.dataset.cat; pintaChips(); pintaGrid(); if (!t.classList.contains('chip')) { ev.preventDefault(); $('catalogo').scrollIntoView({ behavior: 'smooth' }); } return; }
      if (t.dataset.mas) { bolsa[t.dataset.mas]++; guarda(); pintaBolsa(); return; }
      if (t.dataset.menos) { bolsa[t.dataset.menos]--; if (bolsa[t.dataset.menos] <= 0) delete bolsa[t.dataset.menos]; guarda(); pintaBolsa(); return; }
      if (t.dataset.sug) {
        if (t.dataset.sug === 'kit') { var k = byId(t.dataset.id); k.componentes.forEach(function (cid) { delete bolsa[cid]; }); bolsa[k.id] = (bolsa[k.id] || 0) + 1; }
        else bolsa[t.dataset.id] = (bolsa[t.dataset.id] || 0) + 1;
        guarda(); pintaBolsa(); return;
      }
    }
    if (ev.target.id === 'cerrar-ficha' || ev.target.id === 'modal') cierraFicha();
  });
  $('buscar').addEventListener('input', function (e) { q = e.target.value; pintaGrid(); });
  $('btn-bolsa').addEventListener('click', abreBolsa);
  $('cerrar-bolsa').addEventListener('click', cierraBolsa);
  $('velo').addEventListener('click', cierraBolsa);
  $('btn-pedir').addEventListener('click', pedir);
  $('btn-codigo').addEventListener('click', function () { promo.codigo = $('codigo').value.trim().toUpperCase(); guarda(); pintaBolsa(); if (promo.codigo && !promoActiva()) $('nota-codigo').textContent = 'Ese código no existe o ya venció.'; });
  $('codigo').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('btn-codigo').click(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { cierraFicha(); cierraBolsa(); } });

  pintaPicks(); pintaKits(); pintaChips(); pintaGrid(); pintaBolsa();
})();
