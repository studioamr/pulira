/* PULIRA · motor de recomendación "Tu rutina en 60 segundos".
   Puro: sin DOM, corre en Node y en el navegador (UMD). Matriz de eficacia y contraindicaciones validadas por la Instancia 2
   (PRODUCTO-ANCLA.md §1–2, 14-sep-2026); precios de PROVEEDORES.md. Este archivo es PÚBLICO: los costos no viven aquí. El descuento
   máximo por combinación sale de js/descuentos.js (generado por herramientas/genera_descuentos.py con la forma cerrada de
   UNIT-ECONOMICS.md §4.4: pasarela real Mercado Pago/Stripe y piso de margen 38 %). Márgenes con costos: herramientas/margen.js (no se publica). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./descuentos.js'));
  else root.DIAG = factory(root.DESCUENTOS_MAX || {});
}(typeof self !== 'undefined' ? self : this, function (DMAX) {
  var EJES = ['lum', 'firm', 'poros', 'tex', 'hidra', 'maq', 'cab', 'unas', 'relax'];
  // eficacia 0-3 por eje (solo con evidencia de ficha o manual; lo no probado baja a 1), minutos por uso, usos por semana, tipo
  var P = {
    'mascara-led':          { e: [2,1,1,1,0,0,0,0,1], min: 10, sem: 4, tipo: 'luz',      precio: 599, nombre: 'Máscara LED 7 colores' },        // sin 830 nm ni irradiancia declaradas
    'microcorriente':       { e: [1,2,0,0,0,0,0,0,1], min: 5,  sem: 5, tipo: 'tono',     precio: 749, nombre: 'Microcorriente INSKIN' },         // sin µA declarados
    'espatula-ultrasonica': { e: [1,0,2,1,1,0,0,0,0], min: 3,  sem: 2, tipo: 'profunda', precio: 349, nombre: 'Espátula ultrasónica' },          // sin kHz declarados
    'cepillo-facial':       { e: [1,0,2,1,0,0,0,0,0], min: 1,  sem: 7, tipo: 'limpieza', precio: 399, nombre: 'Cepillo facial sónico' },
    'removedor-puntos':     { e: [0,0,3,1,0,0,0,0,0], min: 5,  sem: 1, tipo: 'profunda', precio: 249, nombre: 'Aspirador de puntos negros' },
    'vaporizador':          { e: [1,0,2,1,2,0,0,0,1], min: 10, sem: 2, tipo: 'prep',     precio: 749, nombre: 'Vaporizador nano iónico' },       // fichas incompatibles (200 W/160 ml vs 350 W/220 ml)
    'gua-sha-electrico':    { e: [1,1,0,0,1,0,0,0,2], min: 5,  sem: 5, tipo: 'tono',     precio: 449, nombre: 'Gua Sha eléctrico' },             // sin temperatura declarada
    'espejo-led':           { e: [0,0,0,0,0,3,0,0,0], min: 0,  sem: 0, tipo: 'complemento', precio: 449, nombre: 'Espejo tríptico LED' },
    'esponjas-x4':          { e: [0,0,0,0,0,3,0,0,0], min: 0,  sem: 0, tipo: 'complemento', precio: 149, nombre: 'Esponjas · pack de 14' },
    'limpiador-brochas':    { e: [0,0,0,1,0,2,0,0,0], min: 1,  sem: 1, tipo: 'complemento', precio: 279, nombre: 'Limpiador de brochas' },
    'cepillo-secador':      { e: [0,0,0,0,0,0,2,0,0], min: 8,  sem: 3, tipo: 'cabello',  precio: 599, nombre: 'Cepillo secador 3 en 1' },        // sin watts declarados
    'masajeador-cabelludo': { e: [0,0,0,0,0,0,1,0,3], min: 5,  sem: 4, tipo: 'cabello',  precio: 399, nombre: 'Masajeador de cuero cabelludo' }, // sin evidencia sobre el cabello
    'lampara-unas':         { e: [0,0,0,0,0,0,0,3,0], min: 1,  sem: 1, tipo: 'unas',     precio: 349, nombre: 'Lámpara UV/LED 48 W' }
  };
  // exclusiones duras por condición declarada (§5 + manuales de equivalentes según PRODUCTO-ANCLA.md §2)
  var EXCLUYE = {
    embarazo:        ['mascara-led', 'microcorriente', 'espatula-ultrasonica', 'masajeador-cabelludo', 'vaporizador'],
    marcapasos:      ['microcorriente', 'masajeador-cabelludo', 'espatula-ultrasonica'],
    fotosensibilidad:['mascara-led', 'lampara-unas'],
    rosacea:         ['espatula-ultrasonica', 'cepillo-facial', 'removedor-puntos', 'vaporizador', 'gua-sha-electrico', 'microcorriente'],
    botox:           ['microcorriente', 'gua-sha-electrico'],
    retinoides:      ['mascara-led', 'espatula-ultrasonica', 'removedor-puntos'],
    dermatitis:      ['masajeador-cabelludo', 'vaporizador', 'espatula-ultrasonica', 'microcorriente'],
    sensible:        ['removedor-puntos', 'vaporizador']
  };
  // kits oficiales que el motor puede proponer. Kit Rutina queda FUERA (margen 17 %, UNIT-ECONOMICS.md §5.3) hasta cambiar los proveedores del cepillo y la espátula.
  var KITS = {
    'kit-glow':    { skus: ['mascara-led', 'microcorriente'],           precio: 1199, nombre: 'Kit Glow' },
    'kit-cabello': { skus: ['cepillo-secador', 'masajeador-cabelludo'], precio: 899,  nombre: 'Kit Cabello' }
  };
  // envio/envioGratisDesde: lo que paga el cliente; pasarela (Mercado Pago al instante, con IVA) y piso solo documentan cómo se generó js/descuentos.js
  var CFG = { envio: 99, envioGratisDesde: 999, pasarela: { pct: 0.0405, fijo: 4.64 }, margenPiso: 0.38, desc: { 2: 0.08, 3: 0.12 }, tolerancia3: 1.15 };

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function minutosDia(id) { var p = P[id]; return p.sem ? (p.min * p.sem) / 7 : 0; }

  function necesidades(r) {
    var N = {}; EJES.forEach(function (e) { N[e] = 0; });
    if (r.prioridad1) N[r.prioridad1] = 3;
    if (r.prioridad2 && r.prioridad2 !== r.prioridad1) N[r.prioridad2] = 2;
    if (r.piel === 'grasa') N.poros = clamp(N.poros + 1, 0, 3);
    if (r.piel === 'seca') N.hidra = clamp(N.hidra + 1, 0, 3);
    if (r.piel === 'mixta') N.poros = clamp(N.poros + 0.5, 0, 3);
    if ((r.edad || 0) >= 45) { N.firm = clamp(N.firm + 1, 0, 3); N.lum = clamp(N.lum + 1, 0, 3); }
    else if ((r.edad || 0) >= 35) N.firm = clamp(N.firm + 0.5, 0, 3);
    if (r.cv && r.cv.ajustes) Object.keys(r.cv.ajustes).forEach(function (e) { if (e in N) N[e] = clamp(N[e] + r.cv.ajustes[e], 0, 3); });
    return N;
  }

  function condiciones(r) {
    var c = (r.condiciones || []).slice();
    if (r.piel === 'sensible' && c.indexOf('sensible') < 0) c.push('sensible');
    return c;
  }

  function excluidos(r) {
    var out = {}; condiciones(r).forEach(function (c) { (EXCLUYE[c] || []).forEach(function (id) { out[id] = c; }); });
    return out;
  }

  function score(id, N, r) {
    var p = P[id], s = 0;
    EJES.forEach(function (e, i) { s += N[e] * p.e[i]; });
    if (r.prioridad1 && EJES.indexOf(r.prioridad1) >= 0) s += 0.05 * N[r.prioridad1] * p.e[EJES.indexOf(r.prioridad1)];   // desempate: lo que sirve a la 1.ª prioridad va primero
    if (r.minutos && minutosDia(id) > r.minutos) s -= 0.3 * s;
    return s;
  }

  // descuento máximo (0–0.12) que soporta una combinación de aparatos sin romper el piso de margen; tabla js/descuentos.js (clave: ids ordenados con '+')
  function descuentoMax(skus, tope) {
    var d = DMAX[skus.slice().sort().join('+')];
    return Math.max(0, Math.min(tope || 0, (typeof d === 'number' ? d : 0) / 100));
  }

  function kitOficial(elegidos) {
    var mejor = null;
    Object.keys(KITS).forEach(function (k) {
      var comunes = KITS[k].skus.filter(function (s) { return elegidos.indexOf(s) >= 0 && P[s].tipo !== 'complemento'; }).length;
      if (comunes >= 2 && (!mejor || comunes > mejor.comunes)) mejor = { id: k, comunes: comunes };
    });
    return mejor && mejor.id;
  }

  function recomendar(r) {
    r = r || {};
    var N = necesidades(r), ex = excluidos(r), presupuesto = r.presupuesto || Infinity, minutos = r.minutos || 15;
    var yaTiene = (r.yaTiene || []).filter(function (id) { return P[id]; });
    var cand = Object.keys(P).filter(function (id) { return !ex[id] && yaTiene.indexOf(id) < 0; })
      .map(function (id) { return { id: id, s: score(id, N, r) }; })
      .filter(function (c) { return c.s > 0; })
      .sort(function (a, b) { return b.s - a.s; });
    var elegidos = [], tiempo = 0, gasto = 0, hayProfunda = false;
    cand.forEach(function (c) {
      var p = P[c.id];
      if (p.tipo === 'complemento' || elegidos.length === 3) return;
      if (p.tipo === 'profunda' && hayProfunda) return;
      var tope = presupuesto * (elegidos.length >= 2 ? CFG.tolerancia3 : 1);
      if (gasto + p.precio > tope) return;
      if (tiempo + minutosDia(c.id) > minutos + 0.01) return;
      elegidos.push(c.id); gasto += p.precio; tiempo += minutosDia(c.id); if (p.tipo === 'profunda') hayProfunda = true;
    });
    // complemento: el mejor que quepa en lo que sobra del presupuesto (y que no esté ya en el kit oficial)
    var oficial = kitOficial(elegidos), base = oficial ? KITS[oficial].skus : elegidos, kit;
    var comp = cand.filter(function (c) { return P[c.id].tipo === 'complemento' && base.indexOf(c.id) < 0 && elegidos.indexOf(c.id) < 0 && P[c.id].precio <= presupuesto - gasto; })[0];
    if (oficial) {
      var K = KITS[oficial], skus = K.skus.slice();
      var extra = elegidos.filter(function (id) { return skus.indexOf(id) < 0; });          // 3.º aparato fuera del kit
      var precio = K.precio; extra.forEach(function (id) { precio += P[id].precio; skus.push(id); });
      var sueltos = skus.reduce(function (a, id) { return a + P[id].precio; }, 0);
      kit = { id: oficial, nombre: K.nombre + (extra.length ? ' + ' + P[extra[0]].nombre : ''), skus: skus, precio: precio, ahorro: sueltos - precio, descuento: 0 };
    } else {
      var desc = descuentoMax(elegidos, CFG.desc[elegidos.length] || 0);   // "hasta −8 % / −12 %": el escalón es un tope, no una promesa
      var suma = elegidos.reduce(function (a, id) { return a + P[id].precio; }, 0);
      kit = { id: elegidos.length > 1 ? 'personalizado' : (elegidos[0] || 'ninguno'), nombre: elegidos.length > 1 ? 'Tu kit' : (elegidos[0] ? P[elegidos[0]].nombre : 'Sin aparato recomendado'),
              skus: elegidos.slice(), precio: Math.round(suma * (1 - desc)), ahorro: Math.round(suma * desc), descuento: desc };
    }
    if (comp) { kit.skus.push(comp.id); kit.precio += P[comp.id].precio; kit.complemento = comp.id; }
    kit.minutosDia = Math.round(kit.skus.filter(function (id) { return P[id].tipo !== 'complemento'; }).reduce(function (a, id) { return a + minutosDia(id); }, 0) * 10) / 10; // solo aparatos
    kit.envio = kit.precio >= CFG.envioGratisDesde ? 0 : CFG.envio;
    kit.plan = kit.skus.filter(function (id) { return P[id].sem; }).map(function (id) { return { sku: id, nombre: P[id].nombre, minutos: P[id].min, vecesSemana: P[id].sem }; });
    var alternativas = cand.filter(function (c) { return kit.skus.indexOf(c.id) < 0 && P[c.id].tipo !== 'complemento'; }).slice(0, 2).map(function (c) { return c.id; });
    kit.usaLoQueTienes = yaTiene;
    return { necesidades: N, excluidos: ex, condiciones: condiciones(r), ranking: cand, kit: kit, alternativas: alternativas };
  }

  return { EJES: EJES, P: P, EXCLUYE: EXCLUYE, KITS: KITS, CFG: CFG, necesidades: necesidades, excluidos: excluidos, score: score, descuentoMax: descuentoMax, minutosDia: minutosDia, recomendar: recomendar };
}));
