(() => {
  'use strict';
  const input = document.getElementById('q');
  const out = document.getElementById('out');
  const clearBtn = document.getElementById('clear');

  if (!window.AIRPORTS) {
    out.innerHTML = '<p class="empty">Airport data not found. Run <code>node scripts/build-data.mjs</code> first.</p>';
    return;
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Lowercase, strip accents, drop apostrophes/periods, hyphens become spaces ("O'Hare" -> "ohare", "St. Louis" -> "st louis").
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’`.]/g, '').replace(/-/g, ' ');

  let regionNames;
  try { regionNames = new Intl.DisplayNames(['en'], { type: 'region' }); } catch { /* fall back to codes */ }
  const country = cc => { try { return regionNames?.of(cc) || cc; } catch { return cc; } };
  const flag = cc => /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '';

  const SIZE_LABEL = { L: 'Major hub', M: 'Regional', S: 'Local' };

  // ---- data ----
  const airports = window.AIRPORTS.map(([iata, icao, name, city, cc, lat, lon, size]) => {
    const countryName = country(cc);
    return { iata, icao, name, city, cc, lat, lon, size, countryName, nName: norm(name), nCity: norm(city), nCountry: norm(countryName) };
  });
  const byCode = new Map(airports.map(a => [a.iata, a]));

  const metros = Object.entries(window.METROS || {}).map(([code, m]) => ({
    code, name: m.name, cc: m.cc, countryName: country(m.cc), nName: norm(m.name),
    airports: m.airports.filter(c => byCode.has(c)),
  }));
  const metroByCode = new Map(metros.map(m => [m.code, m]));
  const metroOf = new Map();
  metros.forEach(m => m.airports.forEach(c => { if (!metroOf.has(c)) metroOf.set(c, m); }));

  // ---- search ----
  function search(raw) {
    const q = norm(raw).trim();
    if (q.length < 2) return [];
    const Q = q.toUpperCase();
    const wq = ' ' + q;
    const res = [];

    for (const a of airports) {
      let s = 0;
      if (a.iata === Q) s = 1000;
      else if (a.icao === Q) s = 950;
      else if (a.nCity === q) s = 80;
      else if (a.nCity.startsWith(q)) s = 70;
      else if (a.nName.startsWith(q)) s = 60;
      else if ((' ' + a.nCity).includes(wq)) s = 55;
      else if ((' ' + a.nName).includes(wq)) s = 50;
      else if (q.length >= 3 && a.nCity.includes(q)) s = 35;
      else if (q.length >= 3 && a.nName.includes(q)) s = 30;
      else if (q.length >= 4 && (' ' + a.nCountry).includes(wq)) s = 12;
      else if (a.iata.startsWith(Q)) s = 20;
      if (s) res.push({ kind: 'airport', ref: a, score: s + (a.size === 'L' ? 8 : a.size === 'M' ? 4 : 0) });
    }
    for (const m of metros) {
      let s = 0;
      if (m.code === Q) s = 900;
      else if (m.nName === q) s = 90;
      else if (m.nName.startsWith(q)) s = 75;
      else if ((' ' + m.nName).includes(wq)) s = 52;
      else if (m.code.startsWith(Q)) s = 20;
      if (s) res.push({ kind: 'metro', ref: m, score: s });
      if (s >= 75 && s < 900) { // searched a city name: include every airport under that city code (Tokyo -> HND + NRT)
        for (const code of m.airports) {
          const a = byCode.get(code);
          const hit = res.find(r => r.ref === a);
          const score = s - 5 + (a.size === 'L' ? 1 : 0);
          if (hit) hit.score = Math.max(hit.score, score);
          else res.push({ kind: 'airport', ref: a, score });
        }
      }
    }
    return res.sort((x, y) => y.score - x.score).slice(0, 30);
  }

  // ---- "did you mean" ----
  const ALIASES = window.ALIASES || {};
  const SIZE_W = { L: 3, M: 2, S: 1 };
  const STOP = new Set(['international', 'airport', 'regional', 'municipal', 'county', 'field', 'memorial', 'national', 'airfield', 'aerodrome', 'heliport', 'executive', 'metropolitan', 'central', 'civil', 'joint', 'island', 'domestic', 'intercontinental']);
  let vocab;

  function buildVocab() {
    vocab = new Map();
    const add = (term, label, weight) => {
      if (term.length < 4) return;
      const e = vocab.get(term);
      if (!e) vocab.set(term, { label, weight });
      else if (weight > e.weight) e.weight = weight;
    };
    for (const a of airports) {
      add(a.nCity, a.city, SIZE_W[a.size]);
      add(a.nCountry, a.countryName, 3.5);
      for (const raw of a.name.split(/\s+/)) {
        const w = norm(raw);
        if (w.length >= 5 && !STOP.has(w)) add(w, raw, SIZE_W[a.size] * 0.5);
      }
    }
    for (const m of metros) add(m.nName, m.name, 3);
  }

  // Edit distance where swapping two adjacent letters counts as one edit.
  function editDistance(a, b) {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 3) return 9;
    let prev2 = null, prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
        cur[j] = v;
      }
      prev2 = prev; prev = cur;
    }
    return prev[n];
  }

  function suggest(raw) {
    const q = norm(raw).trim();
    if (q.length < 3) return [];
    const found = [];
    if (/^[a-z]{3}$/.test(q)) { // swapped letters in a code: JKF -> JFK
      const Q = q.toUpperCase();
      for (const a of airports) {
        const c = a.iata;
        if (a.size !== 'S' && ((c[0] === Q[1] && c[1] === Q[0] && c[2] === Q[2]) || (c[0] === Q[0] && c[1] === Q[2] && c[2] === Q[1]))) {
          found.push({ label: c, sub: a.name, d: 1, w: 10 + SIZE_W[a.size] });
        }
      }
    }
    if (!vocab) buildVocab();
    const max = q.length <= 5 ? 1 : q.length <= 9 ? 2 : 3;
    for (const [term, e] of vocab) {
      const d = editDistance(q, term);
      if (d <= max) found.push({ label: e.label, sub: '', d, w: e.weight + (term[0] === q[0] ? 5 : 0) });
    }
    found.sort((x, y) => x.d - y.d || y.w - x.w);
    const seen = new Set();
    return found.filter(s => !seen.has(s.label.toLowerCase()) && seen.add(s.label.toLowerCase())).slice(0, 4);
  }

  // ---- nearby ----
  const R_MI = 3958.8;
  function miles(a, b) {
    const rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R_MI * Math.asin(Math.sqrt(h));
  }

  function pinnedFor(code) {
    const res = new Map();
    for (const m of metros) {
      if (m.airports.includes(code)) m.airports.forEach(c => { if (c !== code && !res.has(c)) res.set(c, m.code + ' metro'); });
    }
    for (const g of window.CLUSTERS || []) {
      if (g.includes(code)) g.forEach(c => { if (c !== code && byCode.has(c) && !res.has(c)) res.set(c, 'Same area'); });
    }
    return [...res].map(([c, tag]) => ({ a: byCode.get(c), tag }));
  }

  function nearby(a, limit = 7) {
    const pinned = pinnedFor(a.iata).map(p => ({ ...p, d: miles(a, p.a) }));
    const seen = new Set([a.iata, ...pinned.map(p => p.a.iata)]);
    const others = airports.filter(x => !seen.has(x.iata) && x.size !== 'S').map(x => ({ a: x, d: miles(a, x), tag: '' }));
    const byDist = (x, y) => x.d - y.d;
    const auto = [
      ...others.filter(o => o.a.size === 'L' && o.d <= 150).sort(byDist),
      ...others.filter(o => o.a.size === 'M' && o.d <= 100).sort(byDist),
    ];
    if (auto.length + pinned.length < 3) {
      const have = new Set(auto.map(o => o.a.iata));
      auto.push(...others.filter(o => o.d <= 300 && !have.has(o.a.iata)).sort(byDist).slice(0, 3 - auto.length - pinned.length));
    }
    return [...pinned, ...auto].slice(0, limit);
  }

  // ---- rendering ----
  const planeSvg = '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>';
  const chevron = '<svg class="chev" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6"/></svg>';

  function airportRow(a, { d, tag } = {}) {
    const place = [a.city, a.countryName].filter(Boolean).join(', ');
    return `<button class="row" data-go="${esc(a.iata)}">
      <span class="badge size-${a.size}">${esc(a.iata)}</span>
      <span class="info"><b>${esc(a.name)}</b><small>${esc(place)}</small>${tag ? `<em class="tag">${esc(tag)}</em>` : ''}</span>
      ${d == null ? chevron : `<span class="dist">${Math.round(d)}<small>mi</small></span>`}
    </button>`;
  }

  function metroRow(m) {
    return `<button class="row" data-go="${esc(m.code)}">
      <span class="badge metro">${esc(m.code)}</span>
      <span class="info"><b>${esc(m.name)}</b><small>City code · ${m.airports.length} airports</small></span>
      ${chevron}
    </button>`;
  }

  function airportDetail(a, near) {
    const m = metroOf.get(a.iata);
    return `<article class="pass">
      <div class="pass-top">
        <div class="pass-label"><span>Airport</span><span>${flag(a.cc)} ${esc(a.countryName)}</span></div>
        <div class="code">${esc(a.iata)}</div>
        <h2>${esc(a.name)}</h2>
        <p class="loc">${esc([a.city, a.countryName].filter(Boolean).join(', '))}</p>
        <span class="plane">${planeSvg}</span>
      </div>
      <div class="pass-bottom">
        <div class="meta">
          <div><span>ICAO</span><b>${esc(a.icao || '—')}</b></div>
          <div><span>Class</span><b>${SIZE_LABEL[a.size]}</b></div>
          <div><span>City code</span>${m ? `<button class="link" data-go="${esc(m.code)}">${esc(m.code)}</button>` : '<b>—</b>'}</div>
        </div>
      </div>
    </article>
    <section class="block">
      <h3>Nearby airports</h3>
      ${near.length ? `<div class="rows">${near.map(n => airportRow(n.a, n)).join('')}</div>` : '<p class="empty small">No major airports close by.</p>'}
    </section>`;
  }

  function metroDetail(m) {
    return `<article class="pass metro-pass">
      <div class="pass-top">
        <div class="pass-label"><span>City code</span><span>${flag(m.cc)} ${esc(m.countryName)}</span></div>
        <div class="code">${esc(m.code)}</div>
        <h2>${esc(m.name)}</h2>
        <p class="loc">${m.airports.length} airports</p>
        <span class="plane">${planeSvg}</span>
      </div>
      <div class="pass-bottom">
        <div class="meta"><div><span>Covers</span><b>${m.airports.join(' · ')}</b></div></div>
      </div>
    </article>
    <section class="block">
      <h3>Airports</h3>
      <div class="rows">${m.airports.map(c => airportRow(byCode.get(c))).join('')}</div>
    </section>`;
  }

  function resultList(res, note) {
    return `<section class="block">
      <h3>${res.length} result${res.length === 1 ? '' : 's'}${note ? ` for ${esc(note)}` : ''}</h3>
      <div class="rows">${res.map(r => r.kind === 'metro' ? metroRow(r.ref) : airportRow(r.ref)).join('')}</div>
    </section>`;
  }

  function home() {
    const chips = ['JFK', 'NYC', 'LHR', 'LAX', 'Tokyo', 'Paris'];
    return `<section class="home">
      <p class="lead">Type a 3-letter airport code, a city code, or a city or airport name.</p>
      <div class="chips">${chips.map(c => `<button class="chip" data-go="${c}">${c}</button>`).join('')}</div>
      <ul class="tips">
        <li><b>JFK</b> shows the airport and the ones nearby, like LGA and EWR</li>
        <li><b>NYC</b> is a city code that covers all the airports in a metro</li>
        <li><b>Newark</b> or <b>Paris</b> searches by city or name</li>
      </ul>
    </section>`;
  }

  function render() {
    const raw = input.value;
    const q = raw.trim();
    clearBtn.hidden = !raw;
    let html;
    if (!q) html = home();
    else if (norm(q).length < 2) html = '<p class="empty">Keep typing…</p>';
    else {
      let res = search(q), note = '';
      const alias = ALIASES[norm(q)];
      // Use the alias when nothing was found, only weak hits came back, or a short alias like "uk" isn't an exact airport code.
      if (alias && (!res.length || res[0].score < 50 || (q.length <= 3 && res[0].score < 900))) {
        const viaAlias = search(alias);
        if (viaAlias.length) { res = viaAlias; note = alias; }
      }
      if (!res.length) {
        const sug = suggest(q);
        html = `<div class="empty"><p>No airports found for “${esc(q)}”.</p>` + (sug.length
          ? `<p class="dym">Did you mean</p><div class="chips">${sug.map(s => `<button class="chip" data-go="${esc(s.label)}">${esc(s.label)}${s.sub ? ` <small>${esc(s.sub)}</small>` : ''}</button>`).join('')}</div>`
          : '<small>Try a 3-letter code or a nearby city.</small>') + '</div>';
      } else {
        const top = res[0];
        if (top.score >= 900 || res.length === 1) {
          html = top.kind === 'metro' ? metroDetail(top.ref) : airportDetail(top.ref, nearby(top.ref));
        } else html = resultList(res, note);
      }
    }
    out.innerHTML = html;
  }

  // ---- events ----
  let timer;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(render, 70); clearBtn.hidden = !input.value; });
  clearBtn.addEventListener('click', () => { input.value = ''; render(); input.focus(); });

  function go(q) {
    input.value = q;
    history.pushState(null, '', '#' + encodeURIComponent(q));
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  out.addEventListener('click', e => {
    const b = e.target.closest('[data-go]');
    if (b) go(b.dataset.go);
  });

  function fromHash() {
    try { input.value = decodeURIComponent(location.hash.slice(1)); } catch { input.value = ''; }
    render();
  }
  window.addEventListener('popstate', fromHash);
  fromHash();
  if (!input.value) input.focus();
})();
