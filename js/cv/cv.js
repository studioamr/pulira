/* PULIRA · captura guiada con la cámara (opt-in). Todo local: el video no se graba, el recorte de la cara va a un Web Worker
   (js/cv/worker.js) que devuelve ajustes ±1 por eje, y la imagen se descarta. Ningún píxel ni métrica sale del navegador.
   Se carga solo si la persona dice "sí" en el paso 8 (rutina-ui.js). */
(function () {
  'use strict';
  var stream = null, video = null, timer = null, worker = null, zona = null, cb = null, intentos = 0, ocupado = false;
  var LADO = 400;         // tamaño del recorte que analiza el worker
  var MIN_CARA = 300;     // px de ancho mínimo de la cara en el video (calidad)

  function abrir(contenedor, callback) {
    zona = contenedor; cb = callback; intentos = 0;
    zona.innerHTML = '<div class="cam"><video autoplay playsinline muted></video><svg viewBox="0 0 300 400" aria-hidden="true"><ellipse cx="150" cy="200" rx="95" ry="130" fill="none" stroke="#FBFAF7" stroke-width="2" stroke-dasharray="6 6"/></svg><div class="msg" id="cam-msg">Acomoda tu cara en el óvalo y quédate quieta</div></div>' +
      '<div class="rut-acc" style="justify-content:center;margin-top:0"><button class="btn acento" type="button" id="cam-tomar">Tomar foto</button></div>';
    video = zona.querySelector('video');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then(function (s) { stream = s; video.srcObject = s; return video.play(); })
      .then(function () { if (window.FaceDetector) autoCaptura(); })
      .catch(function () { msg('No pudimos abrir la cámara. Puedes continuar sin foto.'); setTimeout(function () { terminar(null); }, 1600); });
    document.getElementById('cam-tomar').onclick = function () { captura(null); };
  }
  function msg(t) { var m = document.getElementById('cam-msg'); if (m) m.textContent = t; }
  function cerrar() {
    if (timer) { clearInterval(timer); timer = null; }
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (worker) { worker.terminate(); worker = null; }
    video = null;
  }
  function terminar(res) { var f = cb; cb = null; cerrar(); if (f) f(res); }

  /* con FaceDetector (Chrome Android): captura sola cuando hay una cara estable y grande dentro del óvalo */
  function autoCaptura() {
    var det, estable = 0;
    try { det = new FaceDetector({ fastMode: true, maxDetectedFaces: 2 }); } catch (e) { return; }
    timer = setInterval(function () {
      if (!video || video.readyState < 2 || ocupado) return;
      det.detect(video).then(function (caras) {
        if (caras.length !== 1) { estable = 0; msg(caras.length ? 'Solo una persona en la foto' : 'No vemos tu cara: acércate'); return; }
        var b = caras[0].boundingBox, cx = b.x + b.width / 2, cy = b.y + b.height / 2;
        var dentro = Math.abs(cx - video.videoWidth / 2) < video.videoWidth * 0.12 && Math.abs(cy - video.videoHeight / 2) < video.videoHeight * 0.14;
        if (b.width < MIN_CARA) { estable = 0; msg('Acércate un poco más'); return; }
        if (!dentro) { estable = 0; msg('Centra tu cara en el óvalo'); return; }
        estable++; msg('Quieta… ' + (3 - Math.min(estable, 2)));
        if (estable >= 3) { estable = 0; captura(b); }
      }).catch(function () {});
    }, 500);
  }

  /* recorte: caja de la cara detectada, o la caja del óvalo (object-fit: cover sobre un marco 3:4) */
  function cajaOvalo() {
    var vw = video.videoWidth, vh = video.videoHeight, W = Math.min(vw, vh * 3 / 4), H = Math.min(vh, vw * 4 / 3);
    var w = 0.633 * W, h = 0.65 * H;
    return { x: (vw - w) / 2, y: (vh - h) / 2, width: w, height: h };
  }
  function captura(caja) {
    if (!video || video.readyState < 2 || ocupado) return;
    ocupado = true;
    var c = caja ? { x: caja.x - caja.width * 0.05, y: caja.y - caja.height * 0.05, width: caja.width * 1.1, height: caja.height * 1.1 } : cajaOvalo();
    var full = document.createElement('canvas'); full.width = video.videoWidth; full.height = video.videoHeight;
    var g = full.getContext('2d', { willReadFrequently: true }); g.drawImage(video, 0, 0);
    // calidad: tamaño, luz y contraluz (anillo exterior vs. cara)
    var cal = calidad(g, full.width, full.height, c);
    if (!cal.ok) {
      intentos++; ocupado = false; msg(cal.motivo + (intentos >= 2 ? ' · o continúa sin foto' : ''));
      limpia(full); return;
    }
    var crop = document.createElement('canvas'); crop.width = LADO; crop.height = Math.round(LADO * c.height / c.width);
    crop.getContext('2d').drawImage(full, c.x, c.y, c.width, c.height, 0, 0, crop.width, crop.height);
    var data = crop.getContext('2d').getImageData(0, 0, crop.width, crop.height);
    limpia(full); limpia(crop);
    msg('Analizando…');
    try {
      worker = worker || new Worker('js/cv/worker.js');
      worker.onmessage = function (e) { ocupado = false; var r = e.data || {}; terminar(r.ok ? { ok: true, ajustes: r.ajustes, avisos: r.avisos } : null); };
      worker.onerror = function () { ocupado = false; terminar(null); };
      worker.postMessage({ data: data.data.buffer, width: data.width, height: data.height }, [data.data.buffer]);
    } catch (e) { ocupado = false; terminar(null); }
  }
  function limpia(cv) { cv.width = 1; cv.height = 1; }
  function calidad(g, W, H, c) {
    if (c.width < MIN_CARA) return { ok: false, motivo: 'Acércate un poco más' };
    var cara = luma(g, c.x, c.y, c.width, c.height), borde = (luma(g, 0, 0, W, H * 0.12) + luma(g, 0, H * 0.88, W, H * 0.12)) / 2;
    if (cara < 80) return { ok: false, motivo: 'Busca más luz, de frente' };
    if (cara > 200) return { ok: false, motivo: 'Hay demasiada luz: aléjate de la lámpara' };
    if (borde - cara > 60) return { ok: false, motivo: 'Estás a contraluz: ponte de frente a la ventana' };
    return { ok: true };
  }
  function luma(g, x, y, w, h) {
    var d = g.getImageData(Math.max(0, Math.round(x)), Math.max(0, Math.round(y)), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))).data, s = 0, n = d.length / 4;
    for (var i = 0; i < d.length; i += 16) s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    return s / (n / 4);
  }
  window.PULIRA_CV = { abrir: abrir, cerrar: cerrar };
})();
