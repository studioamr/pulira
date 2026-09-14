/* PULIRA · "Tu rutina en 60 segundos": pantallas, estado, resultado y salida a la bolsa.
   Motor puro en js/diagnostico.js (DIAG). Eventos en js/eventos.js (EVENTOS). Sin framework.
   Estado en sessionStorage ('pulira-diag') para no perder el progreso al volver de la cámara. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var MXN = function (n) { return '$' + Math.round(n).toLocaleString('es-MX'); };
  var CFG = window.CONFIG || {};
  var EV = window.EVENTOS || { emit: function () { return ''; }, lead: function () { return Promise.resolve(false); }, uuid: function () { return String(Date.now()); }, utm: function () { return {}; } };
  var DIAG = window.DIAG;
  var CAT = {}; (window.CATALOGO || []).forEach(function (p) { CAT[p.id] = p; });
  var COPY = window.COPY || {}, FOTOS = window.FOTOS || {};
  var app = null;   // contenedor: #app de rutina.html, o el pop-up que abre js/dinamicas.js en el inicio (RUTINA.abrir)
  if (!DIAG) return;
  var EMBED = /[?&]embed=1/.test(location.search);   // incrustada en la tienda (iframe): sin header/footer, y "Armar mi kit" enlaza a las fichas de la tienda
  var TIENDAS = { amboras: 'https://my-store-0ws91dzq.amboras.com/products/' };
  var mt = /[?&]tienda=(\w+)/.exec(location.search); if (mt && TIENDAS[mt[1]]) CFG.amboras = TIENDAS[mt[1]];
  if (EMBED) document.documentElement.classList.add('embed');

  var EJE = { lum: 'Luminosidad y manchas', firm: 'Firmeza y líneas', poros: 'Poros, puntos negros o grasa', tex: 'Textura y brotes', hidra: 'Hidratación', maq: 'Maquillaje que asiente mejor', cab: 'Cabello con forma, sin frizz', unas: 'Uñas de gel en casa', relax: 'Relajarme y desinflamar' };
  var EJE_CORTO = { lum: 'luminosidad', firm: 'firmeza', poros: 'poros más limpios', tex: 'mejor textura', hidra: 'hidratación', maq: 'mejor maquillaje', cab: 'cabello con forma', unas: 'uñas en casa', relax: 'relajarte' };
  var PIEL = { grasa: 'grasa', mixta: 'mixta', normal: 'normal', seca: 'seca', sensible: 'sensible' };
  var COND = { embarazo: 'embarazo o lactancia', marcapasos: 'marcapasos o implante', fotosensibilidad: 'fotosensibilidad', rosacea: 'rosácea', botox: 'botox o rellenos recientes', retinoides: 'retinoides o ácidos', dermatitis: 'dermatitis', sensible: 'piel sensible' };
  var DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  var DIAS_SEM = { 7: [0, 1, 2, 3, 4, 5, 6], 5: [0, 1, 2, 3, 4], 4: [0, 2, 4, 6], 3: [0, 2, 4], 2: [1, 5], 1: [5] };

  var PASOS = [
    { id: 'prioridades', multi: true, max: 2, h: '¿Qué quieres mejorar primero?', sub: 'Elige hasta dos. El orden importa: la primera pesa más.', ops: Object.keys(EJE).map(function (k) { return [k, EJE[k]]; }) },
    { id: 'piel', h: '¿Cómo describes tu piel?', sub: 'La que tienes la mayor parte del año.', ops: [['grasa', 'Grasa', 'brilla a media mañana'], ['mixta', 'Mixta', 'brilla en la zona T'], ['normal', 'Normal', 'ni brillo ni tirantez'], ['seca', 'Seca', 'tirante, se descama'], ['sensible', 'Sensible', 'se enrojece fácil']] },
    { id: 'edad', h: '¿Qué edad tienes?', sub: 'Cambia qué conviene priorizar.', ops: [[22, 'Menos de 25'], [29, '25 a 34'], [39, '35 a 44'], [50, '45 o más']] },
    { id: 'minutos', h: '¿Cuántos minutos al día sí le vas a dedicar?', sub: 'Sé honesta: un kit que no usas no sirve.', ops: [[5, '5 minutos', 'lo mínimo'], [10, '10 minutos', 'lo normal'], [15, '15 o más', 'me gusta el ritual']] },
    { id: 'presupuesto', h: '¿Cuánto quieres invertir hoy?', sub: 'Puedes cambiarlo al final. Envío gratis desde $999.', ops: [[500, 'Hasta $500'], [900, '$500 a $900'], [1500, '$900 a $1,500'], [0, 'Sin límite']] },
    { id: 'condiciones', multi: true, exclusivo: 'ninguna', h: 'Salud: marca lo que aplique', sub: 'Con esto quitamos lo que no debes usar. Estas respuestas no se guardan con tu contacto.', ops: [['embarazo', 'Embarazo o lactancia'], ['marcapasos', 'Marcapasos o implante electrónico'], ['fotosensibilidad', 'Epilepsia o fotosensibilidad'], ['rosacea', 'Rosácea o cuperosis'], ['botox', 'Botox o rellenos hace menos de 2 semanas'], ['retinoides', 'Uso retinoides o ácidos fuertes'], ['dermatitis', 'Dermatitis o piel lastimada (rostro o cuero cabelludo)'], ['ninguna', 'Ninguna']] },
    { id: 'yaTiene', multi: true, exclusivo: 'ninguno', h: '¿Ya usas algún aparato?', sub: 'Para no venderte lo que ya tienes.', ops: [['ninguno', 'Ninguno'], ['mascara-led', 'Máscara LED'], ['microcorriente', 'Microcorriente'], ['cepillo-facial', 'Cepillo facial'], ['espatula-ultrasonica', 'Espátula ultrasónica'], ['vaporizador', 'Vaporizador'], ['cepillo-secador', 'Cepillo secador'], ['lampara-unas', 'Lámpara de uñas'], ['otro', 'Otro']] },
    { id: 'foto', h: '¿Una foto para afinar?', sub: 'Opcional. Se analiza en tu teléfono y no se guarda ni se sube: mide brillo, rojez y textura, nada más.', ops: [['si', 'Sí, usar la cámara', '20 segundos'], ['no', 'No, saltar']] }
  ];
  var N = PASOS.length;

  /* ---- estado ---- */
  var S = leer() || nuevo();
  function nuevo() { return { vista: 'inicio', paso: 0, r: {}, extras: [], t0: Date.now(), event_id: EV.uuid(), utm: EV.utm() }; }
  function leer() { try { var s = JSON.parse(sessionStorage.getItem('pulira-diag') || 'null'); return s && s.r ? s : null; } catch (e) { return null; } }
  function guardar() { try { sessionStorage.setItem('pulira-diag', JSON.stringify(S)); } catch (e) {} }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  function respuestas() {
    var r = S.r, pr = r.prioridades || [];
    var cond = (r.condiciones || []).filter(function (c) { return c !== 'ninguna'; });
    if (r.cv && r.cv.avisos && r.cv.avisos.indexOf('sensible') >= 0 && cond.indexOf('sensible') < 0) cond.push('sensible');
    return { prioridad1: pr[0], prioridad2: pr[1], piel: r.piel, edad: r.edad, minutos: r.minutos || 15, presupuesto: r.presupuesto || undefined, condiciones: cond,
             yaTiene: (r.yaTiene || []).filter(function (id) { return id !== 'ninguno' && id !== 'otro'; }), cv: r.cv && r.cv.ajustes ? { ajustes: r.cv.ajustes } : null };
  }

  /* ---- render ---- */
  function render(sinScroll) {
    guardar();
    if (!sinScroll) { var caja = app.closest && app.closest('.pop-box'); if (caja) caja.scrollTop = 0; else window.scrollTo(0, 0); }
    if (S.vista === 'paso') return paso();
    if (S.vista === 'camara') return camara();
    if (S.vista === 'calculando') return calculando();
    if (S.vista === 'resultado') return resultado();
    return inicio();
  }

  function inicio() {
    if (!$('empezar')) app.innerHTML = '<section class="rut-inicio"><p class="eyebrow">Sin registro · 60 segundos</p><h1>Tu rutina en 60 segundos.</h1>' +
      '<p class="lead">Ocho preguntas y te decimos qué aparatos sí valen la pena para ti, cuántos minutos al día y cuánto cuesta el kit. El resultado se ve sin dejar tu correo.</p>' +
      '<div class="cta"><button class="btn acento" type="button" id="empezar">Empezar</button><a class="btn linea" href="index.html#catalogo" data-catalogo>Ver catálogo</a></div>' +
      '<div class="promesa"><span>Garantía 12 meses</span><span>Cambio en 30 días</span><span>Stock en México</span></div>' +
      '<p class="rut-nota">No es una valoración médica: es una guía para elegir bien. Si tienes una condición de piel, consúltalo con tu dermatóloga antes de usar cualquier aparato.</p></section>';
    $('empezar').onclick = function () { S = nuevo(); S.vista = 'paso'; S.paso = 0; EV.emit('diag_start', { event_id: S.event_id }); render(); };
    enlazaCatalogo();
  }

  function paso() {
    var P = PASOS[S.paso], sel = S.r[P.id];
    var faltan = Math.round((N - S.paso) * 7);
    var html = '<div class="rut-top"><span>' + (S.paso + 1) + ' de ' + N + '</span><span>faltan ~' + faltan + ' s</span></div><div class="rut-bar"><i style="width:' + Math.round(S.paso / N * 100) + '%"></i></div>' +
      '<h1>' + esc(P.h) + '</h1><p class="sub">' + esc(P.sub) + '</p><div class="opcs' + (P.ops.length > 6 && !P.multi ? ' dos' : '') + '" role="group" aria-label="' + esc(P.h) + '">';
    html += P.ops.map(function (o, i) {
      var on = P.multi ? (sel || []).indexOf(o[0]) >= 0 : sel === o[0];
      var num = P.multi && P.max === 2 && on ? '<span class="num">' + (sel.indexOf(o[0]) + 1) + '.º</span>' : '';
      return '<button class="opc" type="button" data-i="' + i + '" aria-pressed="' + on + '"><span>' + esc(o[1]) + num + '</span>' + (o[2] ? '<small>' + esc(o[2]) + '</small>' : '') + '</button>';
    }).join('');
    html += '</div><div class="rut-acc"><button class="btn atras" type="button" id="atras">Atrás</button>' + (P.multi ? '<button class="btn" type="button" id="sigue"' + ((sel || []).length ? '' : ' disabled') + '>Continuar</button>' : '') + '</div>';
    app.innerHTML = html;
    Array.prototype.forEach.call(app.querySelectorAll('.opc'), function (b) {
      b.onclick = function () {
        var v = P.ops[+b.dataset.i][0];
        if (P.multi) {
          var lista = (S.r[P.id] || []).slice(), k = lista.indexOf(v);
          if (k >= 0) lista.splice(k, 1);
          else if (P.exclusivo && v === P.exclusivo) lista = [v];
          else { lista = lista.filter(function (x) { return x !== P.exclusivo; }); if (P.max && lista.length >= P.max) lista.splice(P.max - 1, 1); lista.push(v); }
          S.r[P.id] = lista; paso(); return;
        }
        S.r[P.id] = v;
        Array.prototype.forEach.call(app.querySelectorAll('.opc'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        setTimeout(function () {
          if (P.id === 'foto') { if (v === 'si') { S.vista = 'camara'; render(); } else { EV.emit('diag_photo_optin', { optin: false, event_id: S.event_id }); S.r.cv = null; calcular(); } return; }
          avanzar();
        }, 160);
      };
    });
    $('atras').onclick = function () { if (S.paso === 0) S.vista = 'inicio'; else S.paso--; render(); };
    if ($('sigue')) $('sigue').onclick = avanzar;
  }
  function avanzar() {
    EV.emit('diag_step', { n: S.paso + 1, event_id: S.event_id });
    try { document.dispatchEvent(new CustomEvent('pulira:paso', { detail: { n: S.paso + 1, total: N } })); } catch (e) {}
    if (S.paso < N - 1) { S.paso++; S.vista = 'paso'; render(); } else calcular();
  }

  /* ---- cámara (opt-in, todo local) ---- */
  function camara() {
    app.innerHTML = '<div class="rut-top"><span>Foto · opcional</span><span>en tu teléfono</span></div><div class="rut-bar"><i style="width:95%"></i></div><h1>Coloca tu cara en el óvalo</h1>' +
      '<p class="sub">Luz de frente, sin lentes y, si se puede, sin maquillaje. La foto no sale de tu teléfono y se borra al terminar.</p><div id="cam-zona"><p class="rut-nota">Abriendo la cámara…</p></div>' +
      '<div class="rut-acc"><button class="btn atras" type="button" id="atras">Atrás</button><button class="btn linea" type="button" id="saltar">Continuar sin foto</button></div>';
    EV.emit('diag_photo_optin', { optin: true, event_id: S.event_id });
    var seguro = location.protocol === 'https:' || location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var apto = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && seguro;
    $('atras').onclick = function () { if (window.PULIRA_CV) window.PULIRA_CV.cerrar(); S.vista = 'paso'; render(); };
    $('saltar').onclick = function () { if (window.PULIRA_CV) window.PULIRA_CV.cerrar(); terminaCV(null); };
    if (!apto) { $('cam-zona').innerHTML = '<p class="rut-nota">Tu navegador no deja usar la cámara aquí. Seguimos sin foto.</p>'; setTimeout(function () { terminaCV(null); }, 1400); return; }
    cargaScript('js/cv/cv.js', function () {
      if (!window.PULIRA_CV) return terminaCV(null);
      window.PULIRA_CV.abrir($('cam-zona'), function (res) { terminaCV(res); });
    });
  }
  function terminaCV(res) {
    if (window.PULIRA_CV) window.PULIRA_CV.cerrar();
    S.r.cv = res && res.ok ? { ajustes: res.ajustes || {}, avisos: res.avisos || [] } : null;
    S.r.fotoOk = !!(res && res.ok);
    calcular();
  }
  function cargaScript(src, cb) {
    if (document.querySelector('script[src="' + src + '"]')) return cb();
    var s = document.createElement('script'); s.src = src; s.onload = cb; s.onerror = function () { cb(); }; document.body.appendChild(s);
  }

  /* ---- calculando → resultado ---- */
  function calcular() { S.vista = 'calculando'; render(); }
  function calculando() {
    var r = S.r, pills = (r.prioridades || []).map(function (e) { return EJE_CORTO[e]; });
    if (r.piel) pills.push('piel ' + PIEL[r.piel]); if (r.minutos) pills.push(r.minutos + ' min al día');
    app.innerHTML = '<div class="calc"><p class="eyebrow">Armando tu rutina</p><h1>Cruzando tus respuestas con el catálogo</h1><div class="pills">' + pills.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') + '</div></div>';
    setTimeout(function () {
      var resp = respuestas();
      S.res = DIAG.recomendar(resp); S.extras = S.extras || [];
      if (!S.completado) { S.completado = true; EV.emit('diag_complete', { kit_id: S.res.kit.id, skus: S.res.kit.skus.join(','), precio: S.res.kit.precio, foto: !!r.fotoOk, perfil_hash: hash(JSON.stringify(resp)), segundos: Math.round((Date.now() - (S.t0 || Date.now())) / 1000), event_id: S.event_id }); }
      S.vista = 'resultado'; render();
    }, 800);
  }

  function entrega(ids) { return ids.some(function (id) { return /3 a 6/.test((CAT[id] && CAT[id].entrega) || ''); }) ? '3 a 6 días hábiles' : '1 a 3 días hábiles'; }   // Full = 1–3; AliExpress desde México = 3–6 (UNIT-ECONOMICS §6)
  function nombre(id) { var p = CAT[id]; return p ? p.nombre.split(' · ')[0] : (DIAG.P[id] ? DIAG.P[id].nombre : id); }
  function beneficio(id) { var c = COPY[id]; return c && c.beneficio ? c.beneficio : (CAT[id] && CAT[id].hace ? CAT[id].hace[0] : ''); }
  function precio(id) { return CAT[id] ? CAT[id].precio : (DIAG.P[id] ? DIAG.P[id].precio : 0); }
  function foto(id) {
    if (!FOTOS[id]) return '<span class="sin" aria-hidden="true"></span>';
    return '<picture><source type="image/webp" srcset="img/t/' + id + '.webp"><img src="img/t/' + id + '.jpg" alt="' + esc(nombre(id)) + '" width="96" height="96" loading="lazy"></picture>';
  }
  function tarjeta(id, extra, quitar) {
    var p = DIAG.P[id], tag = p && p.sem ? p.sem + (p.sem === 1 ? ' vez' : ' veces') + ' por semana · ' + p.min + ' min' : 'Complemento';
    return '<div class="res-card">' + foto(id) + '<div><h3>' + esc(nombre(id)) + '</h3><p>' + esc(beneficio(id)) + '</p><span class="tag">' + esc(extra || tag) + '</span></div>' +
      '<div class="p">' + MXN(precio(id)) + (quitar ? '<button type="button" data-quita="' + id + '">Quitar</button>' : '') + (CFG.amboras ? '<a href="' + esc(CFG.amboras + id) + '" target="_blank" rel="noopener">Ver en la tienda</a>' : '') + '</div></div>';
  }
  function textoLocal(res, aparatos) {
    var r = S.r, pr = (r.prioridades || []).map(function (e) { return EJE_CORTO[e]; }).join(' y ');
    var partes = aparatos.map(function (id) { return nombre(id) + ' (' + beneficio(id).toLowerCase() + ')'; });
    var t = (pr ? 'Para ' + pr : 'Para tu piel') + (r.piel ? ' con piel ' + PIEL[r.piel] : '') + ', ' + (aparatos.length === 1 ? 'un aparato basta: ' : aparatos.length + ' aparatos: ') + partes.join('; ') + '. ';
    t += 'En promedio te toma ' + res.kit.minutosDia + ' minutos al día' + (res.kit.complemento ? ', y ' + nombre(res.kit.complemento).toLowerCase() + ' completa la rutina' : '') + '. ';
    var ritmo = aparatos.filter(function (id) { return DIAG.P[id].sem; }).map(function (id) { var p = DIAG.P[id]; return p.nombre.toLowerCase() + (p.sem >= 7 ? ' a diario' : ' ' + p.sem + (p.sem === 1 ? ' vez' : ' veces') + ' por semana'); });
    if (ritmo.length) t += 'Ritmo: ' + ritmo.join(', ').replace(/, ([^,]*)$/, ' y $1') + '.';
    return t;
  }
  function plan(res) {
    if (!res.kit.plan.length) return '';
    return '<div class="plan"><h4>Tu semana</h4>' + res.kit.plan.map(function (it) {
      var d = DIAS_SEM[it.vecesSemana] || DIAS_SEM[3];
      return '<div class="fila"><span>' + esc(it.nombre) + '</span><span class="dias">' + DIAS.map(function (x, i) { return '<i class="' + (d.indexOf(i) >= 0 ? 'on' : '') + '">' + x + '</i>'; }).join('') + '</span><span class="min">' + it.minutos + ' min por uso · ' + it.vecesSemana + (it.vecesSemana === 1 ? ' vez' : ' veces') + ' por semana</span></div>';
    }).join('') + '</div>';
  }

  function resultado() {
    var res = S.res || (S.res = DIAG.recomendar(respuestas()));
    var k = res.kit, r = S.r, pr = r.prioridades || [];
    var aparatos = k.skus.filter(function (id) { return DIAG.P[id].tipo !== 'complemento'; });
    var extras = (S.extras || []).filter(function (id) { return k.skus.indexOf(id) < 0 && DIAG.P[id]; });
    var total = k.precio + extras.reduce(function (a, id) { return a + precio(id); }, 0);
    var envio = total >= (CFG.envioGratisDesde || 999) ? 0 : (CFG.envio || 99);
    var perfil = [r.piel ? 'Piel ' + PIEL[r.piel] : null, pr.length ? 'quieres ' + pr.map(function (e) { return EJE_CORTO[e]; }).join(' y ') : null, r.minutos ? r.minutos + ' min al día' : null].filter(Boolean).join(' · ');
    var excl = Object.keys(res.excluidos).map(nombre);
    var html = '<div class="rut-top"><span>Tu rutina</span><span><button class="btn atras chico" type="button" id="denuevo" style="padding:0;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase">Volver a empezar</button></span></div><div class="rut-bar"><i style="width:100%"></i></div><p class="res-perfil">' + esc(perfil) + '</p>';

    if (!aparatos.length) {
      var seguros = ['esponjas-x4', 'espejo-led', 'limpiador-brochas'].filter(function (id) { return !res.excluidos[id] && (r.yaTiene || []).indexOf(id) < 0; });
      html += '<h1>Para tu caso, primero una valoración dermatológica.</h1><p class="sub">Con lo que marcaste no hay aparato que te recomendemos sin que lo vea un especialista. Lo que sí puedes usar hoy:</p>' +
        '<div class="res-kit">' + seguros.map(function (id) { return tarjeta(id, 'Sin contraindicación'); }).join('') + '</div>' +
        '<div class="res-cta"><button class="btn acento" type="button" id="armar" data-ids="' + seguros.join(',') + '">Agregar a la bolsa</button><a class="btn linea" href="index.html#catalogo" data-catalogo>Ver catálogo</a></div>';
      html += legal(res, excl); app.innerHTML = html; enlaza(res, seguros); return;
    }

    var titulo = DIAG.KITS[k.id] ? k.nombre : (aparatos.length > 1 ? 'Tu kit: ' + aparatos.map(nombre).join(' + ') : nombre(aparatos[0]));
    html += '<h1>' + esc(titulo) + '</h1><p class="sub">' + aparatos.length + (aparatos.length === 1 ? ' aparato' : ' aparatos') + (k.complemento ? ' y un complemento' : '') + ' · ' + k.minutosDia + ' min al día en promedio · llega en ' + entrega(k.skus) + (k.skus.length > 1 ? ' (hasta ' + k.skus.length + ' paquetes, sin costo extra)' : '') + '.</p>';
    html += '<div class="res-kit">' + k.skus.map(function (id) { return tarjeta(id); }).join('') + extras.map(function (id) { return tarjeta(id, 'Agregado por ti', true); }).join('') + '</div>';
    html += plan(res);
    html += '<div class="explica" id="explica"><b>Por qué este kit</b>' + esc(textoLocal(res, aparatos)) + '</div>';
    var sueltos = k.precio + k.ahorro + extras.reduce(function (a, id) { return a + precio(id); }, 0);
    html += '<div class="res-total"><div><span class="precio">' + MXN(total) + '</span>' + (sueltos > total ? '<s>' + MXN(sueltos) + '</s>' : '') +
      (k.ahorro > 0 ? '<span class="ahorro">Ahorras ' + MXN(k.ahorro) + (k.descuento ? ' · ' + Math.round(k.descuento * 100) + '% con el código ' + codigo(k) : ' vs. piezas sueltas') + '</span>' : '') + '</div>' +
      '<div class="entrega">' + (envio ? 'Envío $' + envio + ' · gratis desde ' + MXN(CFG.envioGratisDesde || 999) : 'Envío gratis') + '<br>Garantía 12 meses · cambio en 30 días</div></div>';
    var prem = window.DINAMICAS && DINAMICAS.resumenPremio(total, aparatos.length);
    if (prem) html += '<div class="desbloqueo"><b>' + (prem.aplica ? 'Tu premio de la ruleta' : 'Tu premio de la ruleta, casi') + '</b>' + esc(prem.texto) + '</div>';
    if (aparatos.length < 3 && res.alternativas.length) {
      var alt = res.alternativas.filter(function (id) { return extras.indexOf(id) < 0; })[0];
      if (alt) html += '<div class="sube"><div><b>Súmale ' + esc(nombre(alt)) + '</b>' + esc(beneficio(alt)) + '</div><button class="btn" type="button" data-suma="' + alt + '">+ ' + MXN(precio(alt)) + '</button></div>';
    }
    html += '<div class="res-cta"><button class="btn acento" type="button" id="armar" data-ids="' + k.skus.concat(extras).join(',') + '">Armar mi kit · ' + MXN(total) + '</button><button class="btn linea" type="button" id="guardar-btn">Guardar mi rutina</button>' + (CFG.whatsapp ? '<button class="btn linea" type="button" id="wa">Pedir por WhatsApp</button>' : '') + '</div>';
    html += '<div class="guardar" id="guardar" hidden><h3>Te la mandamos</h3><p>Correo o WhatsApp. Solo para enviarte esta rutina y avisarte de ofertas del kit; nada más.</p>' +
      '<form id="f-lead"><input type="text" id="contacto" placeholder="tu@correo.com o WhatsApp a 10 dígitos" autocomplete="email" required aria-label="Correo o WhatsApp"><button class="btn" type="submit">Enviar</button>' +
      '<label class="chk"><input type="checkbox" id="consent" required> Acepto que PULIRA guarde mi contacto y el perfil de esta rutina (sin tus respuestas de salud) para enviármela. <a href="privacidad.html" target="_blank" rel="noopener">Aviso de privacidad</a></label><span id="lead-msg"></span></form></div>';
    var alts = res.alternativas.filter(function (id) { return extras.indexOf(id) < 0; });
    if (alts.length) html += '<details class="faq" style="margin-top:14px"><summary>Ver alternativas</summary><div class="alts">' + alts.map(function (id) { return tarjeta(id, 'Alternativa · ' + (DIAG.P[id].sem ? DIAG.P[id].sem + ' veces por semana' : 'complemento')).replace('<div class="p">', '<div class="p"><button type="button" data-suma="' + id + '" style="margin-bottom:6px">Súmala</button>'); }).join('') + '</div></details>';
    html += legal(res, excl);
    app.innerHTML = html;
    enlaza(res, k.skus.concat(extras));
    explicaRemota(res, aparatos);
    if (!S.confeti) { S.confeti = true; guardar(); try { document.dispatchEvent(new CustomEvent('pulira:resultado', { detail: { kit: k.id, total: total, aparatos: aparatos.length } })); } catch (e) {} }
  }
  function codigo(k) { var pct = Math.round(k.descuento * 100); return (CFG.codigosRutina || {})[pct] || ('RUTINA' + pct); }
  function legal(res, excl) {
    return (excl.length ? '<p class="excluidos">Por lo que marcaste, dejamos fuera: ' + esc(excl.join(', ')) + '.</p>' : '') +
      '<p class="legal">PULIRA vende aparatos de belleza para usar en casa. Esta guía no sustituye la valoración de un dermatólogo: si tienes una condición de piel, consúltalo antes de usar cualquier aparato. Precios en pesos con IVA; el envío se calcula en la bolsa. Los resultados dependen del uso constante y varían de persona a persona.</p>';
  }

  function enModal() { return !!(app && app.closest && app.closest('.pop')); }
  function enlazaCatalogo() { var c = app.querySelector('[data-catalogo]'); if (c && enModal()) c.onclick = function (e) { e.preventDefault(); cerrar(); location.hash = '#catalogo'; }; }
  function enlaza(res, ids) {
    var k = res.kit;
    enlazaCatalogo();
    if ($('denuevo')) $('denuevo').onclick = function () { S = nuevo(); render(); };
    Array.prototype.forEach.call(app.querySelectorAll('[data-suma]'), function (b) { b.onclick = function () { S.extras = (S.extras || []).concat([b.dataset.suma]); render(true); }; });
    Array.prototype.forEach.call(app.querySelectorAll('[data-quita]'), function (b) { b.onclick = function () { S.extras = (S.extras || []).filter(function (x) { return x !== b.dataset.quita; }); render(true); }; });
    if ($('armar')) $('armar').onclick = function () {
      var lista = $('armar').dataset.ids.split(',').filter(Boolean), bolsa = {};
      if (DIAG.KITS[k.id]) { var K = DIAG.KITS[k.id]; lista = [k.id].concat(lista.filter(function (id) { return K.skus.indexOf(id) < 0; })); }
      if (EMBED && CFG.amboras) {   // dentro de la tienda: enlaces a cada ficha + código, y aviso al padre por si la tienda arma el carrito sola (postMessage)
        var cod = k.descuento > 0 ? codigo(k) : '';
        try { window.parent.postMessage({ tipo: 'pulira-kit', kit_id: k.id, skus: lista, precio: k.precio, codigo: cod, event_id: S.event_id }, '*'); } catch (e) {}
        EV.emit('kit_cta_click', { destino: 'amboras', kit_id: k.id, precio: k.precio, event_id: S.event_id });
        var caja = document.createElement('div'); caja.className = 'desbloqueo';
        caja.innerHTML = '<b>Agrega tu kit en la tienda</b>' + lista.map(function (id) { return '<a class="btn linea chico" style="margin:6px 6px 0 0" href="' + esc(CFG.amboras + id) + '" target="_top">' + esc(nombre(id)) + '</a>'; }).join('') + (cod ? '<p class="rut-nota">Tu código de descuento: <b>' + esc(cod) + '</b>. Escríbelo al pagar.</p>' : '');
        $('armar').replaceWith(caja); return;
      }
      try { bolsa = JSON.parse(localStorage.getItem('pulira-bolsa') || '{}'); } catch (e) {}
      lista.forEach(function (id) { if (CAT[id] && !bolsa[id]) bolsa[id] = 1; });
      try {
        localStorage.setItem('pulira-bolsa', JSON.stringify(bolsa));
        if (k.descuento > 0) localStorage.setItem('pulira-promo', JSON.stringify({ codigo: codigo(k) }));
        localStorage.setItem('pulira-eid', S.event_id);
      } catch (e) {}
      EV.emit('kit_cta_click', { destino: 'bolsa', kit_id: k.id, precio: k.precio, event_id: S.event_id });
      if (window.TIENDA) { TIENDA.recargar(); cerrar(); TIENDA.abrir(); return; }   // misma página (pop-up en el inicio): la bolsa se abre ahí mismo
      location.href = 'index.html?abrir=bolsa#catalogo';
    };
    if ($('guardar-btn')) $('guardar-btn').onclick = function () { $('guardar').hidden = false; $('contacto').focus(); $('guardar-btn').hidden = true; };
    if ($('wa')) $('wa').onclick = function () {
      EV.emit('kit_cta_click', { destino: 'whatsapp', kit_id: k.id, precio: k.precio, event_id: S.event_id });
      window.open('https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(textoPedido(res, ids)), '_blank');
    };
    if ($('f-lead')) $('f-lead').onsubmit = function (e) {
      e.preventDefault();
      var c = $('contacto').value.trim(), msg = $('lead-msg'), email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c), tel = c.replace(/\D/g, '');
      if (!email && tel.length < 10) { msg.className = 'err'; msg.textContent = 'Escribe un correo válido o un WhatsApp a 10 dígitos.'; return; }
      if (!$('consent').checked) { msg.className = 'err'; msg.textContent = 'Necesitamos tu permiso para guardar el contacto.'; return; }
      var resp = respuestas(); delete resp.condiciones; delete resp.cv;  // datos de salud: nunca se guardan con el contacto
      msg.className = ''; msg.textContent = 'Guardando…';
      EV.lead({ email: email ? c : null, whatsapp: email ? null : tel, perfil: resp, necesidades: res.necesidades, kit_id: k.id, skus: ids, precio: k.precio, event_id: S.event_id, consent_version: (window.EVENTOS_CFG || {}).consentVersion || '1' })
        .then(function (remoto) { msg.className = 'ok'; msg.textContent = remoto ? 'Listo. Te la mandamos a ' + c + '.' : 'Listo, la tenemos. Te llega a ' + c + ' en cuanto abramos el envío de rutinas.'; $('f-lead').querySelector('button').disabled = true; });
    };
  }
  function textoPedido(res, ids) {
    var k = res.kit, lineas = ids.map(function (id) { return '· ' + nombre(id) + ' ' + MXN(precio(id)); });
    return 'Hola PULIRA, hice mi rutina en 60 s y quiero este kit:\n' + lineas.join('\n') + '\nTotal ' + MXN(k.precio) + (k.descuento ? ' con el código ' + codigo(k) : '') + '\nRef: ' + S.event_id + '\nNombre:\nCiudad y C.P.:';
  }
  function explicaRemota(res, aparatos) {
    var E = window.EVENTOS_CFG || {}; if (!E.supabaseUrl || !E.supabaseKey || !window.fetch) return;
    var cuerpo = { perfil: { piel: S.r.piel, edad: S.r.edad, minutos: S.r.minutos, prioridades: (S.r.prioridades || []).map(function (e) { return EJE[e]; }) }, condiciones: res.condiciones,
      kit: { id: res.kit.id, nombre: res.kit.nombre, minutosDia: res.kit.minutosDia, precio: res.kit.precio, skus: res.kit.skus.map(function (id) { return { id: id, nombre: nombre(id), hace: (CAT[id] && CAT[id].hace || []).slice(0, 3), vecesSemana: DIAG.P[id].sem, minutos: DIAG.P[id].min }; }) } };
    fetch(E.supabaseUrl + '/functions/v1/explica', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: E.supabaseKey, Authorization: 'Bearer ' + E.supabaseKey }, body: JSON.stringify(cuerpo) })
      .then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.texto && $('explica')) $('explica').innerHTML = '<b>Por qué este kit</b>' + esc(j.texto); }).catch(function () {});
  }

  function abrir(el) { app = el; S = leer() || nuevo(); render(true); }
  function cerrar() { if (enModal() && window.DINAMICAS) DINAMICAS.cerrar(); }
  window.RUTINA = { abrir: abrir, cerrar: cerrar, reiniciar: function () { S = nuevo(); if (app) render(true); } };
  var inicial = $('app'); if (inicial) abrir(inicial);   // rutina.html (y modo incrustado para Amboras)
})();
