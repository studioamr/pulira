/* PULIRA · capa única de analítica: Meta Pixel + TikTok Pixel + GA4 + Supabase (leads y eventos) con event_id compartido para deduplicar con la CAPI.
   Fase 1 (GTM.md): Meta optimiza sobre el evento PERSONALIZADO diag_complete (no dispara el estándar Lead; el estándar Lead solo lo dispara `lead`).
   Config en window.EVENTOS_CFG (index.html / rutina.html). Todo es opcional: sin IDs no manda nada y no rompe nada.
   Contrato de eventos (ARQUITECTURA-LANZAMIENTO.md §6): diag_start · diag_step · diag_photo_optin · diag_complete · kit_cta_click · lead · add_to_cart · checkout_whatsapp · purchase (Amboras). */
(function () {
  'use strict';
  var C = window.EVENTOS_CFG || {};
  var META = { lead: 'Lead', add_to_cart: 'AddToCart', kit_cta_click: 'InitiateCheckout', checkout_whatsapp: 'InitiateCheckout', purchase: 'Purchase' }; // evento estándar de Meta que dispara cada evento propio (diag_complete solo como personalizado)
  var TIKTOK = { diag_complete: 'CompleteRegistration', kit_cta_click: 'InitiateCheckout', checkout_whatsapp: 'InitiateCheckout', add_to_cart: 'AddToCart', purchase: 'CompletePayment', lead: 'SubmitForm' }; // TikTok Pixel (Spark Ads), mismo event_id

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }
  function utm() {
    var out = {};
    try { out = JSON.parse(sessionStorage.getItem('pulira-utm') || '{}'); } catch (e) {}
    var q = location.search.replace(/^\?/, '').split('&'), hay = false;
    q.forEach(function (par) { var kv = par.split('='); var k = decodeURIComponent(kv[0] || ''); if (/^(utm_\w+|fbclid|gclid|ttclid|ref)$/.test(k)) { out[k] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); hay = true; } });
    if (hay) { out.landing = location.pathname; try { sessionStorage.setItem('pulira-utm', JSON.stringify(out)); } catch (e) {} }
    return out;
  }
  function sesion() {
    var s = null; try { s = sessionStorage.getItem('pulira-sesion'); if (!s) { s = uuid(); sessionStorage.setItem('pulira-sesion', s); } } catch (e) { s = 'sin-storage'; }
    return s;
  }
  function post(tabla, fila) {
    if (!C.supabaseUrl || !C.supabaseKey || !window.fetch) return Promise.resolve(false);
    return fetch(C.supabaseUrl + '/rest/v1/' + tabla, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey, Prefer: 'return=minimal' }, body: JSON.stringify(fila) })
      .then(function (r) { return r.ok; }).catch(function () { return false; });
  }
  function emit(nombre, props) {
    props = props || {};
    var id = props.event_id || uuid();
    var meta = META[nombre];
    try { if (window.fbq) { if (meta) fbq('track', meta, { content_ids: props.skus ? String(props.skus).split(',') : undefined, content_type: 'product', value: props.precio, currency: 'MXN' }, { eventID: id }); fbq('trackCustom', nombre, props, { eventID: id }); } } catch (e) {}
    try { if (window.gtag) gtag('event', nombre, Object.assign({ event_id: id }, props)); } catch (e) {}
    try { if (window.ttq && TIKTOK[nombre]) ttq.track(TIKTOK[nombre], { contents: props.skus ? String(props.skus).split(',').map(function (s) { return { content_id: s, content_type: 'product' }; }) : undefined, value: props.precio, currency: 'MXN' }, { event_id: id }); } catch (e) {}
    post('eventos', { nombre: nombre, props: props, event_id: id, utm: utm(), url: location.pathname + location.hash, sesion: sesion() });
    if (C.debug && window.console) console.log('[eventos]', nombre, id, props);
    return id;
  }
  /* lead: {email|whatsapp, perfil, necesidades, kit_id, skus[], precio, event_id, consent_version}. Guarda en Supabase (RLS: solo insert) o, si no hay backend, en este navegador. */
  function lead(d) {
    var fila = { email: d.email || null, whatsapp: d.whatsapp || null, perfil: d.perfil || {}, necesidades: d.necesidades || {}, kit_id: d.kit_id || 'ninguno', skus: d.skus || [], precio: d.precio || 0,
                 utm: utm(), event_id: d.event_id || uuid(), consent_at: new Date().toISOString(), consent_version: d.consent_version || '1' };
    emit('lead', { canal: d.email ? 'email' : 'whatsapp', kit_id: fila.kit_id, precio: fila.precio, event_id: fila.event_id });
    return post('diagnosticos', fila).then(function (ok) {
      if (!ok) { try { var l = JSON.parse(localStorage.getItem('pulira-leads') || '[]'); l.push(fila); localStorage.setItem('pulira-leads', JSON.stringify(l.slice(-20))); } catch (e) {} }
      return ok;
    });
  }
  function init() {
    utm();
    if (C.pixel && !window.fbq) {
      /* snippet oficial de Meta Pixel */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', C.pixel); fbq('track', 'PageView');
    }
    if (C.tiktok && !window.ttq) {
      /* snippet oficial de TikTok Pixel */
      !function (w, d, t) { w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent']; ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]); ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; }; ttq.load = function (e, n) { var r = 'https://analytics.tiktok.com/i18n/pixel/events.js', o = n && n.partner; ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; ttq._o[e] = n || {}; var s = d.createElement('script'); s.type = 'text/javascript'; s.async = true; s.src = r + '?sdkid=' + e + '&lib=' + t; var f = d.getElementsByTagName('script')[0]; f.parentNode.insertBefore(s, f); }; ttq.load(C.tiktok); ttq.page(); }(window, document, 'ttq');
    }
    if (C.ga4 && !window.gtag) {
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.ga4; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); }; gtag('js', new Date()); gtag('config', C.ga4, { anonymize_ip: true });
    }
  }
  window.EVENTOS = { emit: emit, lead: lead, utm: utm, uuid: uuid, sesion: sesion };
  init();
})();
