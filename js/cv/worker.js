/* PULIRA · análisis local de la cara (Web Worker). Entrada: ImageData del recorte (ancho ~400 px, cara centrada, frente arriba).
   Salida: { ok, ajustes: {eje: ±1}, avisos: ['sensible'] }. Son proxies groseros, no un diagnóstico: cada métrica mueve como máximo
   un punto de un eje del motor (ARQUITECTURA-LANZAMIENTO.md §2.4). La imagen se descarta al responder; no se guarda nada.
   Umbrales (U) calibrables con fotos reales; ROI en fracciones del recorte. */
var U = { brillo: 0.06, rojez: 6, textura: 0.045, manchas: 6, lineas: 0.12 };
var ROI = { frente: [0.30, 0.10, 0.70, 0.30], nariz: [0.42, 0.34, 0.58, 0.62], mejI: [0.12, 0.44, 0.36, 0.70], mejD: [0.64, 0.44, 0.88, 0.70], ojoI: [0.04, 0.32, 0.20, 0.46], ojoD: [0.80, 0.32, 0.96, 0.46] };

self.onmessage = function (e) {
  var d = e.data;
  try { self.postMessage(analiza(new Uint8ClampedArray(d.data), d.width, d.height)); }
  catch (err) { self.postMessage({ ok: false, motivo: 'error' }); }
};

function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function flab(t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; }
function rect(w, h, r) { return { x0: Math.round(r[0] * w), y0: Math.round(r[1] * h), x1: Math.round(r[2] * w), y1: Math.round(r[3] * h) }; }

function analiza(px, w, h) {
  var n = w * h, L = new Float32Array(n), A = new Float32Array(n);
  var i, x, y;
  for (i = 0; i < n; i++) {
    var r = lin(px[i * 4]), g = lin(px[i * 4 + 1]), b = lin(px[i * 4 + 2]);
    var X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    var fx = flab(X), fy = flab(Y);
    L[i] = 116 * fy - 16; A[i] = 500 * (fx - fy);
  }
  var R = {}; Object.keys(ROI).forEach(function (k) { R[k] = rect(w, h, ROI[k]); });

  // 1) brillo/grasa en zona T: fracción de píxeles con V > 0.92 y S < 0.15
  var brillantes = 0, tot = 0;
  [R.frente, R.nariz].forEach(function (q) {
    for (y = q.y0; y < q.y1; y++) for (x = q.x0; x < q.x1; x++) {
      i = (y * w + x) * 4; var mx = Math.max(px[i], px[i + 1], px[i + 2]), mn = Math.min(px[i], px[i + 1], px[i + 2]);
      var V = mx / 255, S = mx ? (mx - mn) / mx : 0; if (V > 0.92 && S < 0.15) brillantes++; tot++;
    }
  });
  var brillo = tot ? brillantes / tot : 0;

  // 2) rojez: a* medio de mejillas menos frente
  function media(arr, q) { var s = 0, c = 0; for (y = q.y0; y < q.y1; y++) for (x = q.x0; x < q.x1; x++) { s += arr[y * w + x]; c++; } return c ? s / c : 0; }
  var rojez = (media(A, R.mejI) + media(A, R.mejD)) / 2 - media(A, R.frente);

  // 3) textura: desviación local (ventana 5×5) de L en mejillas, normalizada por la L media
  function texturaEn(q) {
    var s = 0, c = 0;
    for (y = q.y0 + 2; y < q.y1 - 2; y += 2) for (x = q.x0 + 2; x < q.x1 - 2; x += 2) {
      var m = 0, m2 = 0;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) { var v = L[(y + dy) * w + x + dx]; m += v; m2 += v * v; }
      m /= 25; m2 = m2 / 25 - m * m; s += Math.sqrt(Math.max(0, m2)); c++;
    }
    return c ? s / c : 0;
  }
  var Lmej = (media(L, R.mejI) + media(L, R.mejD)) / 2;
  var textura = Lmej ? (texturaEn(R.mejI) + texturaEn(R.mejD)) / 2 / Lmej : 0;

  // 4) manchas: componentes conexos oscuros (L < media − 1.2σ) de 5–80 px (escalados al tamaño del recorte) en mejillas
  var escala = (w / 350) * (w / 350), minA = 5 * escala, maxA = 80 * escala, manchas = 0;
  [R.mejI, R.mejD].forEach(function (q) {
    var qw = q.x1 - q.x0, qh = q.y1 - q.y0, m = media(L, q), s2 = 0, c = 0;
    for (y = q.y0; y < q.y1; y++) for (x = q.x0; x < q.x1; x++) { var dv = L[y * w + x] - m; s2 += dv * dv; c++; }
    var sd = Math.sqrt(s2 / Math.max(1, c)), umbral = m - 1.2 * sd;
    var bin = new Uint8Array(qw * qh), vis = new Uint8Array(qw * qh);
    for (y = 0; y < qh; y++) for (x = 0; x < qw; x++) bin[y * qw + x] = L[(y + q.y0) * w + x + q.x0] < umbral ? 1 : 0;
    var pila = [];
    for (var p = 0; p < bin.length; p++) {
      if (!bin[p] || vis[p]) continue;
      var area = 0; pila.push(p); vis[p] = 1;
      while (pila.length) {
        var k = pila.pop(); area++; var kx = k % qw, ky = (k / qw) | 0;
        var vecinos = [k - 1, k + 1, k - qw, k + qw];
        for (var v = 0; v < 4; v++) { var nb = vecinos[v]; if (nb < 0 || nb >= bin.length || !bin[nb] || vis[nb]) continue; if ((v === 0 && kx === 0) || (v === 1 && kx === qw - 1)) continue; vis[nb] = 1; pila.push(nb); }
      }
      if (area >= minA && area <= maxA) manchas++;
    }
  });

  // 5) líneas periorbitales: densidad de bordes (Sobel sobre L) en las esquinas externas de los ojos
  function bordes(q) {
    var c = 0, e = 0;
    for (y = q.y0 + 1; y < q.y1 - 1; y++) for (x = q.x0 + 1; x < q.x1 - 1; x++) {
      var i0 = y * w + x;
      var gx = -L[i0 - w - 1] + L[i0 - w + 1] - 2 * L[i0 - 1] + 2 * L[i0 + 1] - L[i0 + w - 1] + L[i0 + w + 1];
      var gy = -L[i0 - w - 1] - 2 * L[i0 - w] - L[i0 - w + 1] + L[i0 + w - 1] + 2 * L[i0 + w] + L[i0 + w + 1];
      if (Math.sqrt(gx * gx + gy * gy) > 40) e++; c++;
    }
    return c ? e / c : 0;
  }
  var lineas = (bordes(R.ojoI) + bordes(R.ojoD)) / 2;

  var ajustes = {}, avisos = [];
  if (brillo > U.brillo) ajustes.poros = 1;
  if (textura > U.textura) ajustes.tex = 1;
  if (manchas >= U.manchas) ajustes.lum = 1;
  if (lineas > U.lineas) ajustes.firm = 1;
  if (rojez > U.rojez) avisos.push('sensible');
  return { ok: true, ajustes: ajustes, avisos: avisos, metricas: { brillo: +brillo.toFixed(3), rojez: +rojez.toFixed(1), textura: +textura.toFixed(3), manchas: manchas, lineas: +lineas.toFixed(3) } };
}
