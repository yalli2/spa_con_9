/* Lección 09 · Me gusta mucho viajar — 쓰기시험 대비 인터랙티브 사이트 */
(function () {
  'use strict';
  const D = window.L9;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

  /* ---------- 저장 ---------- */
  const KEY = 'spa_con_9_v1';
  let S = { items: {}, errors: {}, name: '', sel: {}, exams: [], examA: null, essay: '' };
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch (e) { }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } updateProgress(); }
  const REG = {};
  const reg = (id, sec, skill) => { REG[id] = { sec, skill }; };
  function record(id, score, errs, extra) {
    const it = S.items[id] || { a: 0 };
    it.a++; it.last = score; Object.assign(it, extra || {});
    S.items[id] = it;
    (errs || []).forEach(e => { S.errors[e] = (S.errors[e] || 0) + 1; });
    save();
  }

  /* ---------- 발음 (Web Speech) + 소리 점검 ---------- */
  const TTS_OK = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let VOICES = [], VOICE = null, KEEP = [], watchdog = null;
  const ttsSet = () => (S.tts = S.tts || { voice: '', rate: 0.9 });
  function pickVoice() {
    if (!TTS_OK) return;
    try {
      VOICES = speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang));
      const want = ttsSet().voice;
      VOICE = VOICES.find(v => v.name === want) || VOICES.find(v => /^es[-_]ES/i.test(v.lang) && v.localService) || VOICES.find(v => /^es[-_]ES/i.test(v.lang)) || VOICES[0] || null;
      if (typeof drawCheck === 'function') drawCheck();
    } catch (e) { }
  }
  if (TTS_OK) { pickVoice(); speechSynthesis.addEventListener ? speechSynthesis.addEventListener('voiceschanged', pickVoice) : (speechSynthesis.onvoiceschanged = pickVoice); setTimeout(pickVoice, 500); setTimeout(pickVoice, 2000); }
  function utter(t, pitch) {
    const u = new SpeechSynthesisUtterance(t.replace(/[\[\]]/g, ''));
    u.lang = VOICE ? VOICE.lang : 'es-ES'; if (VOICE) u.voice = VOICE;
    u.rate = ttsSet().rate || 0.9; u.pitch = pitch || 1; u.volume = 1;
    KEEP.push(u); if (KEEP.length > 40) KEEP.shift();   // 크롬 GC로 재생이 끊기는 문제 방지
    return u;
  }
  let playingBtn = null;
  const mark = (btn, on) => { if (playingBtn && playingBtn !== btn) playingBtn.classList.remove('playing'); playingBtn = on ? btn : null; if (btn) btn.classList.toggle('playing', on); };
  function run(list, btn) {
    if (!TTS_OK) { toast('이 브라우저는 음성 읽기 기능을 지원하지 않아요. 크롬·엣지·사파리 최신 버전에서 열어 주세요.'); return; }
    if (!VOICES.length) pickVoice();
    try { speechSynthesis.cancel(); speechSynthesis.resume(); } catch (e) { }
    clearTimeout(watchdog);
    let started = false;
    list[0].addEventListener('start', () => { started = true; clearTimeout(watchdog); hideToast(); });
    list[list.length - 1].addEventListener('end', () => mark(btn, false));
    list.forEach(u => u.addEventListener('error', e => { if (e.error !== 'interrupted' && e.error !== 'canceled') { mark(btn, false); toast(`재생 오류(${e.error}). 🔊 소리 점검을 열어 확인해 보세요.`, true); } }));
    mark(btn, true);
    setTimeout(() => { list.forEach(u => speechSynthesis.speak(u)); }, 60);   // cancel 직후 바로 speak 하면 무시되는 크롬 버그 회피
    watchdog = setTimeout(() => {
      if (started) return;
      mark(btn, false);
      try { speechSynthesis.cancel(); } catch (e) { }
      toast(VOICES.length ? '음성이 시작되지 않았어요. 한 번 더 눌러 보고, 계속 안 되면 소리 점검을 열어 주세요.' : '이 기기에 스페인어 음성이 없어 재생되지 않아요. 소리 점검에서 설치 방법을 확인하세요.', true);
    }, 3000);
  }
  function speak(t, btn) { run([utter(t)], btn); }
  function playLines(lines, btn) {
    const who = [...new Set(lines.map(l => l.who))];
    run(lines.map(l => utter(l.es, who.indexOf(l.who) % 2 ? 1.2 : 0.9)), btn);
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) speak(b.dataset.say, b); });

  /* 알림 토스트 */
  function toast(msg, withCheck) {
    let t = $('#toast');
    if (!t) { t = el('<div id="toast" class="toast" role="status"><span class="tm"></span><button class="btn sm tchk">🔊 소리 점검</button><button class="tx" aria-label="닫기">✕</button></div>'); document.body.appendChild(t); $('.tx', t).onclick = hideToast; $('.tchk', t).onclick = () => { hideToast(); openCheck(); }; }
    $('.tm', t).textContent = msg; $('.tchk', t).hidden = !withCheck; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(hideToast, 9000);
  }
  function hideToast() { const t = $('#toast'); if (t) t.classList.remove('on'); }

  /* 소리 점검 창 */
  let drawCheck = null;
  function openCheck() {
    let m = $('#sndchk');
    if (!m) {
      m = el(`<div id="sndchk" class="modal" role="dialog" aria-label="소리 점검"><div class="mbox">
        <button class="mx" aria-label="닫기">✕</button>
        <h2>🔊 소리 점검</h2>
        <div class="chk-status"></div>
        <div class="chk-row"><label>스페인어 음성</label><select class="vsel"></select></div>
        <div class="chk-row"><label>말하기 속도 <b class="rv"></b></label><input class="rate" type="range" min="0.6" max="1.2" step="0.05"></div>
        <div class="chk-row"><button class="btn big ttest">▶ 테스트 재생: “¡Hola! Me gusta mucho viajar.”</button></div>
        <div class="chk-res"></div>
        <details open><summary>그래도 안 들릴 때 확인할 것</summary><ul class="chk-tips">
          <li>🔈 기기 <b>볼륨</b>과 음소거, <b>이어폰·블루투스</b> 연결(소리가 다른 기기로 나가는지) 확인</li>
          <li>🧭 크롬·엣지: 탭을 마우스 오른쪽 클릭 → <b>사이트 음소거 해제</b> / 주소창 왼쪽 자물쇠 → 사이트 설정 → 소리 <b>허용</b></li>
          <li>📱 아이폰·아이패드: 옆면 <b>무음 스위치</b>를 끄고(주황색이 안 보이게) 볼륨 올리기</li>
          <li>🪟 Windows에 스페인어 음성이 없으면: 설정 → 시간 및 언어 → 음성 → <b>음성 추가</b> → Español(España) 설치 후 브라우저 다시 열기</li>
          <li>🤖 안드로이드: 설정 → 접근성(또는 일반) → <b>텍스트 음성 변환</b> → Google 음성 엔진 → 스페인어 음성 데이터 설치</li>
          <li>🏠 홈페이지(크리에이터링크) 안에서 열었다면 <a href="https://yalli2.github.io/spa_con_9/" target="_blank" rel="noopener">사이트를 새 창으로 열기</a></li>
        </ul></details></div></div>`);
      document.body.appendChild(m);
      $('.mx', m).onclick = () => m.classList.remove('on');
      m.addEventListener('click', e => { if (e.target === m) m.classList.remove('on'); });
      $('.vsel', m).onchange = e => { ttsSet().voice = e.target.value; save(); pickVoice(); };
      $('.rate', m).oninput = e => { ttsSet().rate = +e.target.value; $('.rv', m).textContent = '×' + (+e.target.value).toFixed(2); save(); };
      $('.ttest', m).onclick = () => {
        const res = $('.chk-res', m); res.className = 'chk-res wait'; res.textContent = '재생 요청 중…';
        if (!TTS_OK) { res.className = 'chk-res bad'; res.textContent = '✕ 이 브라우저는 음성 읽기를 지원하지 않습니다.'; return; }
        const u = utter('¡Hola! Me gusta mucho viajar.');
        let ok = false;
        u.addEventListener('start', () => { ok = true; res.className = 'chk-res good'; res.innerHTML = `✔ 재생이 시작됐어요 (${esc(VOICE ? VOICE.name : '기본 음성')}).<br>소리가 들리면 정상입니다. <b>재생은 됐는데 안 들리면</b> 아래 볼륨·음소거·출력 기기를 확인하세요.`; });
        u.addEventListener('error', e => { if (e.error === 'interrupted') return; ok = true; res.className = 'chk-res bad'; res.textContent = '✕ 재생 오류: ' + e.error; });
        run([u], $('.ttest', m));
        setTimeout(() => { if (!ok) { res.className = 'chk-res bad'; res.innerHTML = '✕ 재생이 시작되지 않았어요. ' + (VOICES.length ? '브라우저를 완전히 닫았다 다시 열어 보세요.' : '이 기기에 <b>스페인어 음성이 설치되어 있지 않아요</b>. 아래 설치 방법을 따라 주세요.'); } }, 3200);
      };
    }
    drawCheck = () => {
      const st = $('.chk-status', m);
      const nAll = TTS_OK ? speechSynthesis.getVoices().length : 0;
      st.innerHTML = `<div class="${TTS_OK ? 'y' : 'n'}">${TTS_OK ? '✔' : '✕'} 음성 읽기 기능 ${TTS_OK ? '지원' : '미지원'}</div>
        <div class="${VOICES.length ? 'y' : 'n'}">${VOICES.length ? '✔' : '✕'} 스페인어 음성 ${VOICES.length}개 (전체 ${nAll}개)</div>`;
      const sel = $('.vsel', m);
      sel.innerHTML = VOICES.length ? VOICES.map(v => `<option value="${esc(v.name)}" ${VOICE && v.name === VOICE.name ? 'selected' : ''}>${esc(v.name)} (${v.lang})${v.localService ? '' : ' · 온라인'}</option>`).join('') : '<option>스페인어 음성 없음 — 기본 음성 사용</option>';
      sel.disabled = !VOICES.length;
      const r = ttsSet().rate || 0.9; $('.rate', m).value = r; $('.rv', m).textContent = '×' + r.toFixed(2);
    };
    pickVoice(); drawCheck();
    $('.chk-res', m).className = 'chk-res'; $('.chk-res', m).textContent = '';
    m.classList.add('on');
  }
  const say = t => `<button class="say" data-say="${esc(t)}" title="듣기" aria-label="듣기">🔊</button>`;

  /* ---------- 채점 엔진 ---------- */
  const PUNCT = /[¿?¡!.,;:"“”'«»()\/…–—-]/g;
  const norm = s => s.toLowerCase().replace(/ /g, ' ').replace(PUNCT, ' ').replace(/\s+/g, ' ').trim();
  const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const acc = s => strip(s.toLowerCase()).replace(/[aeioun]/g, c => ({ a: '[aá]', e: '[eé]', i: '[ií]', o: '[oó]', u: '[uúü]', n: '[nñ]' }[c]));
  const L = '\\p{L}', W0 = `(?<!${L})`, W1 = `(?!${L})`;
  const ERR_LABEL = {
    acento: '악센트(tilde) 누락', puntuacion: '¿ ¡ 부호 누락', concordancia: 'gusta / gustan 일치',
    pronombre: '대명사 me·te·le·nos·os·les', conjugacion: '동사 변화', estructura: '문장 구조', otro: '철자 · 어휘'
  };
  const ERR_TIP = {
    acento: 'también, música, película, fútbol, a mí … 악센트도 철자예요. 시험에서는 감점됩니다.',
    puntuacion: '스페인어 의문문·감탄문은 앞에도 ¿ ¡ 를 씁니다.',
    concordancia: '좋아하는 대상이 주어! 단수·동사원형 → gusta, 복수 명사 → gustan',
    pronombre: 'a mí→me, a ti→te, a él/ella→le, a nosotros→nos, a vosotros→os, a ellos→les',
    conjugacion: 'preferir: prefiero, prefieres, prefiere, preferimos, preferís, prefieren',
    estructura: '"Yo gusto"(✕) 대신 "Me gusta"(○). encantar 에는 mucho를 붙이지 않아요.',
    otro: '철자와 관사(el/la/los/las)를 꼼꼼히 확인하세요.'
  };
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let p = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
    return p[n];
  }
  function classify(i, a) {
    const ti = i.split(' '), ta = a.split(' ');
    const sw = (x, y) => (ti.includes(x) && ta.includes(y));
    if (sw('gusta', 'gustan') || sw('gustan', 'gusta') || sw('encanta', 'encantan') || sw('encantan', 'encanta')) return 'concordancia';
    const P = ['me', 'te', 'le', 'nos', 'os', 'les'];
    if (ti.filter(w => P.includes(w)).join() !== ta.filter(w => P.includes(w)).join()) return 'pronombre';
    const vi = ti.find(w => /^pref/.test(w)), va = ta.find(w => /^pref/.test(w));
    if (va && vi !== va) return 'conjugacion';
    if (ti.includes('gusto')) return 'estructura';
    return 'otro';
  }
  function grade(input, answers, prefix) {
    const ni = norm(input);
    if (!ni) return { empty: true, score: 0 };
    const eq = (a, b) => prefix ? (a === b || a.startsWith(b + ' ')) : a === b;
    for (const a of answers) {
      if (eq(ni, norm(a))) {
        const errs = []; let score = 1;
        if (/^\s*¿/.test(a) && !/¿/.test(input)) { errs.push('puntuacion'); score = 0.5; }
        if (/^\s*¡/.test(a) && !/¡/.test(input)) { errs.push('puntuacion'); score = 0.5; }
        return { score, errs, best: a };
      }
    }
    for (const a of answers) if (eq(strip(ni), strip(norm(a)))) return { score: 0.5, errs: ['acento'], best: a };
    const sn = strip(ni);
    const best = answers.slice().sort((x, y) => lev(sn, strip(norm(x))) - lev(sn, strip(norm(y))))[0];
    return { score: 0, errs: [classify(ni, norm(best))], best };
  }
  const tl = a => esc(a).replace(/[áéíóúñüÁÉÍÓÚÑ¿¡]/g, m => `<b class="tl">${m}</b>`);
  const MARK = s => s >= 0.999 ? '<span class="mk ok">○</span>' : s > 0 ? '<span class="mk half">△</span>' : '<span class="mk no">✕</span>';
  function fbHTML(r) {
    if (r.score >= 1) return `<span class="good">¡Correcto! 👏</span>`;
    const tag = r.errs.map(e => `<span class="etag e-${e}">${ERR_LABEL[e]}</span>`).join(' ');
    if (r.score > 0) return `${tag} 거의 맞았어요 → <span class="ans">${tl(r.best)}</span>`;
    return `${tag} 정답 예시 → <span class="ans">${tl(r.best)}</span>`;
  }

  /* 자유작문 오류 탐지 (빨간 펜) */
  const ERR_RULES = [
    { re: W0 + 'yo gusto' + W1, t: 'estructura', msg: '"Yo gusto"(✕) → "Me gusta"' },
    { re: W0 + 'mi gustan?' + W1, t: 'pronombre', msg: '"mi gusta"(✕) → "me gusta"' },
    { re: W0 + '(me|te|le|nos|os|les) gusta (las|los|mis|tus)' + W1, t: 'concordancia', msg: '복수 명사 앞 → gustan' },
    { re: W0 + '(me|te|le|nos|os|les) encanta (las|los|mis|tus)' + W1, t: 'concordancia', msg: '복수 명사 앞 → encantan' },
    { re: W0 + '(me|te|le|nos|os|les) (gustan|encantan) (leer|ver|ir|jugar|bailar|cantar|cocinar|nadar|pintar|viajar|escuchar|tocar|esquiar|pasear|hacer|comer|navegar|subir|estudiar)' + W1, t: 'concordancia', msg: '동사원형 앞 → gusta / encanta' },
    { re: W0 + 'encantan? mucho' + W1, t: 'estructura', msg: 'encantar + mucho(✕) → "Me encanta" 또는 "Me gusta mucho"' },
    { re: W0 + '(prefero|prefiro|preferio|prefiere?mos|prefieris|prefierís|preferen|preferes|prefere)' + W1, t: 'conjugacion', msg: 'preferir 변화: prefiero · prefieres · prefiere · preferimos · preferís · prefieren' },
    { re: W0 + 'y(?= h?[ií](?![eéa]))', t: 'estructura', msg: 'i-/hi- 앞의 y → e (navegar por Internet e ir…)' },
    { re: W0 + 'mas' + W1, t: 'acento', msg: '비교의 "más"' },
    { re: '(?<=¿\\s?)(que|cual|cuales|quien|donde|cuando|como)' + W1, t: 'acento', msg: '의문사에는 악센트: qué · cuál · quién · dónde · cuándo · cómo' },
    { re: '(?<=¿\\s?por )que' + W1, t: 'acento', msg: '¿por qué?' },
    { re: '(?<=' + W0 + 'a )mi(?=\\s*((me|tambi[eé]n|tampoco|no|s[ií])' + W1 + '|[,.?!]))', t: 'acento', msg: '전치사 뒤 "a mí"' },
    { re: '(?<=' + W0 + 'a m[ií] )si' + W1, t: 'acento', msg: '"A mí sí" (긍정의 sí)' },
    { re: '(?<=¿y )tu' + W1, t: 'acento', msg: '"¿Y tú?" (주어 tú)' },
    { re: W0 + 'tí' + W1, t: 'acento', msg: '"ti"에는 악센트가 없어요' }
  ];
  const ACC_WORDS = ['también', 'música', 'películas', 'película', 'fútbol', 'esquí', 'frío', 'natación', 'clásica', 'clásicas',
    'canción', 'canciones', 'montaña', 'español', 'matemáticas', 'américa', 'violín', 'acción', 'cómicas', 'románticas', 'café',
    'béisbol', 'sábados', 'sábado', 'día', 'días', 'después', 'allí', 'aquí', 'habitación', 'compañero', 'compañera', 'compañeros',
    'mañana', 'niños', 'exposición', 'jardín', 'fácil', 'difícil', 'baloncesto', 'balón', 'lápiz', 'teléfono', 'película', 'televisión',
    'miércoles', 'pequeño', 'también', 'año', 'años', 'último', 'música', 'género', 'acción', 'guitarra', 'batería', 'violonchelo', 'tampoco'];
  const ACC_RE = [...new Set(ACC_WORDS)].map(w => ({ w, re: new RegExp(W0 + acc(w) + W1, 'giu') }));
  function findErrors(text) {
    const low = text.toLowerCase(), out = [];
    ERR_RULES.forEach(r => { for (const m of low.matchAll(new RegExp(r.re, 'giu'))) out.push({ s: m.index, e: m.index + m[0].length, t: r.t, msg: r.msg }); });
    ACC_RE.forEach(({ w, re }) => { for (const m of low.matchAll(re)) if (m[0] !== w) out.push({ s: m.index, e: m.index + m[0].length, t: 'acento', msg: `→ ${w}` }); });
    out.sort((a, b) => a.s - b.s);
    return out.filter((x, i) => !out.slice(0, i).some(y => x.s < y.e && y.s < x.e));
  }
  function annotate(text, checks, errs) {
    const marks = errs.map((x, i) => ({ s: x.s, e: x.e, cls: 'bad', n: i + 1 }));
    checks.forEach(c => (c.spans || []).forEach(([s, e]) => { if (!marks.some(m => s < m.e && m.s < e)) marks.push({ s, e, cls: 'goodm' }); }));
    marks.sort((a, b) => a.s - b.s);
    let html = '', pos = 0;
    marks.forEach(m => { if (m.s < pos) return; html += esc(text.slice(pos, m.s)) + `<mark class="${m.cls}">${esc(text.slice(m.s, m.e))}${m.n ? `<sup>${m.n}</sup>` : ''}</mark>`; pos = m.e; });
    html += esc(text.slice(pos));
    const notes = errs.map((x, i) => `<li><b>${i + 1}</b> <span class="etag e-${x.t}">${ERR_LABEL[x.t]}</span> ${esc(x.msg)}</li>`).join('');
    return `<div class="redpen">${html.replace(/\n/g, '<br>')}</div>${notes ? `<ol class="pen-notes">${notes}</ol>` : ''}`;
  }
  function analyze(text, must, minWords) {
    const low = text.toLowerCase();
    const checks = must.map(m => {
      const ms = [...low.matchAll(new RegExp(m.re, 'giu'))];
      return { label: m.label, ok: ms.length >= (m.min || 1), spans: ms.map(x => [x.index, x.index + x[0].length]) };
    });
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (minWords) checks.push({ label: `${minWords}단어 이상 (지금 ${words}단어)`, ok: words >= minWords, spans: [] });
    const errs = findErrors(text);
    let score = checks.length ? checks.filter(c => c.ok).length / checks.length : 1;
    score = Math.max(0, Math.round((score - 0.1 * errs.length) * 100) / 100);
    return { checks, errs, score, words, html: annotate(text, checks, errs) };
  }
  const FREQ = '(siempre|todos los d[ií]as|todas las semanas|cada (d[ií]a|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|semana|fin de semana)|a menudo|de vez en cuando|nunca|a veces|(una|dos|tres|cuatro|cinco|\\d+) vez|(una|dos|tres|cuatro|cinco|\\d+) veces|los (lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados|domingos|fines de semana))';

  /* ---------- 공통 UI 조각 ---------- */
  const actHead = (n, title, o = {}) => `<div class="act-head"><span class="act-pill">${o.listen ? '<span class="hp">🎧</span>' : ''}ACTIVIDAD<b>${n}</b></span><span class="act-bar"></span></div><h2 class="act-title">${title}</h2>${o.kr ? `<p class="kr-sub">${o.kr}</p>` : ''}`;
  const dlgHead = (n, title) => `<div class="dlg-head"><span class="dlg-pill">Diálogo ${n}</span><span class="dlg-hatch"></span></div>${title ? `<p class="scene">${title}</p>` : ''}`;
  const modelo = html => `<div class="modelo"><span class="modelo-tab">modelo</span><div class="modelo-in">${html}</div></div>`;
  const tip = html => `<div class="tip"><span class="tip-ic">💡</span><div>${html}</div></div>`;
  const hl = (s, i) => `<span class="hlc c${i % 3}">${s}</span>`;
  const withAmi = arr => arr.flatMap(a => [a, 'A mí ' + a.charAt(0).toLowerCase() + a.slice(1)]);

  /* writeItem: 한 문장 쓰기 */
  function writeItem(c) {
    reg(c.id, c.sec, c.skill);
    const w = el(`<div class="item ${c.cls || ''}">${c.prompt ? `<div class="item-p">${c.prompt}</div>` : ''}
      <div class="item-row"><input class="inp" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(c.ph || '스페인어로 쓰세요')}">
      <button class="btn chk">확인</button><span class="mkbox"></span></div><div class="fb"></div></div>`);
    const inp = $('.inp', w), fb = $('.fb', w), mk = $('.mkbox', w);
    function show(score, html) { w.classList.remove('is-ok', 'is-half', 'is-no'); w.classList.add(score >= 1 ? 'is-ok' : score > 0 ? 'is-half' : 'is-no'); mk.innerHTML = MARK(score); fb.innerHTML = html; }
    const prev = S.items[c.id]; if (prev && prev.v != null) { inp.value = prev.v; show(prev.last, prev.fb || ''); }
    function check() {
      const ans = typeof c.answers === 'function' ? c.answers() : c.answers;
      if (!ans) { fb.innerHTML = '<span class="warn">먼저 위에서 선택하세요.</span>'; return; }
      const r = grade(inp.value, ans, c.prefix);
      if (r.empty) { fb.innerHTML = '<span class="warn">답을 입력하세요.</span>'; return; }
      const html = fbHTML(r);
      record(c.id, r.score, r.errs, { v: inp.value, fb: html });
      show(r.score, html);
      if (c.onCheck) c.onCheck(r);
    }
    $('.chk', w).onclick = check;
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    return w;
  }

  /* freeItem: 자유작문 + 첨삭 */
  function freeItem(c) {
    reg(c.id, c.sec, c.skill || 'lib');
    const w = el(`<div class="item free">${c.prompt ? `<div class="item-p">${c.prompt}</div>` : ''}
      ${c.line ? `<input class="inp wide" type="text" autocomplete="off" spellcheck="false" placeholder="${esc(c.ph || '스페인어로 쓰세요')}">` : `<textarea class="ta" rows="${c.rows || 4}" spellcheck="false" placeholder="${esc(c.ph || '스페인어로 쓰세요')}"></textarea>`}
      <div class="item-row"><span class="wc"></span><button class="btn chk">첨삭 받기 ✍️</button><span class="mkbox"></span></div>
      <div class="fb"></div></div>`);
    const inp = $('.inp, .ta', w), fb = $('.fb', w), mk = $('.mkbox', w), wc = $('.wc', w);
    const upd = () => { const n = inp.value.trim() ? inp.value.trim().split(/\s+/).length : 0; wc.textContent = c.line ? '' : `${n} palabras`; };
    inp.addEventListener('input', upd);
    function show(score, html) { w.classList.remove('is-ok', 'is-half', 'is-no'); w.classList.add(score >= 1 ? 'is-ok' : score > 0 ? 'is-half' : 'is-no'); mk.innerHTML = MARK(score); fb.innerHTML = html; }
    const prev = S.items[c.id]; if (prev && prev.v != null) { inp.value = prev.v; show(prev.last, prev.fb || ''); }
    upd();
    function check() {
      const must = typeof c.must === 'function' ? c.must() : c.must;
      if (!must) { fb.innerHTML = `<span class="warn">${c.needMsg || '먼저 위에서 선택하세요.'}</span>`; return; }
      if (!inp.value.trim()) { fb.innerHTML = '<span class="warn">문장을 써 보세요.</span>'; return; }
      const a = analyze(inp.value, must, c.minWords);
      const list = a.checks.map(x => `<li class="${x.ok ? 'y' : 'n'}">${x.ok ? '✔' : '✘'} ${x.label}</li>`).join('');
      const html = `<ul class="checklist">${list}</ul>${a.html}${c.model ? `<details class="model"><summary>모범 답안 보기</summary>${say(c.model)} ${esc(c.model)}</details>` : ''}`;
      record(c.id, a.score, [...new Set(a.errs.map(x => x.t))], { v: inp.value, fb: html });
      show(a.score, html);
    }
    $('.chk', w).onclick = check;
    if (c.line) inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    return w;
  }

  /* cloze: 문장 속 빈칸 */
  function cloze(c) {
    let k = 0;
    const blanks = [];
    const html = c.text.replace(/\[([^\]]+)\]/g, (m, a) => {
      const id = `${c.id}-${k++}`, ans = a.split('|');
      blanks.push({ id, ans }); reg(id, c.sec, c.skill);
      const wd = Math.max(3, ans[0].length) * 0.62 + 1.4;
      return `<span class="blank"><input class="cz" data-id="${id}" style="width:${wd}em" autocomplete="off" autocapitalize="off" spellcheck="false"><span class="czm"></span></span>`;
    });
    const w = el(`<div class="cloze ${c.cls || ''}">${c.title ? `<div class="item-p">${c.title}</div>` : ''}<div class="cz-body">${html}</div>
      <div class="item-row"><button class="btn chk">전체 채점</button><span class="cz-score"></span></div></div>`);
    const paint = (inp, id) => {
      const it = S.items[id]; if (!it) return;
      const sp = inp.nextElementSibling;
      inp.classList.remove('ok', 'half', 'no'); inp.classList.add(it.last >= 1 ? 'ok' : it.last > 0 ? 'half' : 'no');
      sp.innerHTML = it.last >= 1 ? '' : `<span class="czfix">${tl(it.best)}</span>`;
    };
    $$('.cz', w).forEach(inp => { const it = S.items[inp.dataset.id]; if (it && it.v != null) { inp.value = it.v; paint(inp, inp.dataset.id); } });
    $('.chk', w).onclick = () => {
      let tot = 0;
      $$('.cz', w).forEach(inp => {
        const b = blanks.find(x => x.id === inp.dataset.id);
        const r = grade(inp.value || ' ', b.ans);
        const sc = r.empty ? 0 : r.score;
        record(b.id, sc, r.empty ? ['otro'] : r.errs, { v: inp.value, best: b.ans[0] });
        paint(inp, b.id); tot += sc;
      });
      $('.cz-score', w).innerHTML = `${MARK(tot / blanks.length)} <b>${Math.round(tot * 10) / 10} / ${blanks.length}</b>`;
    };
    $$('.cz', w).forEach(inp => inp.addEventListener('keydown', e => { if (e.key === 'Enter') $('.chk', w).click(); }));
    return w;
  }

  /* choiceItem: 선택형 */
  function choiceItem(c) {
    reg(c.id, c.sec, c.skill);
    const w = el(`<div class="item choice"><div class="item-p">${c.prompt}</div><div class="opts">${c.options.map(o => `<button class="opt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div><span class="mkbox"></span></div>`);
    const paint = v => {
      $$('.opt', w).forEach(b => { b.classList.remove('ok', 'no'); if (b.dataset.o === c.answer && v) b.classList.add('ok'); if (b.dataset.o === v && v !== c.answer) b.classList.add('no'); });
      $('.mkbox', w).innerHTML = MARK(v === c.answer ? 1 : 0);
    };
    const prev = S.items[c.id]; if (prev && prev.v) paint(prev.v);
    $$('.opt', w).forEach(b => b.onclick = () => { const ok = b.dataset.o === c.answer; record(c.id, ok ? 1 : 0, ok ? [] : [c.err || 'otro'], { v: b.dataset.o }); paint(b.dataset.o); });
    return w;
  }

  /* scramble: 단어 배열 */
  function scramble(c) {
    reg(c.id, c.sec, c.skill);
    const toks = c.target.split(' ');
    const w = el(`<div class="item scr"><div class="scr-line"></div><div class="scr-bank"></div><div class="item-row"><button class="btn ghost rst">다시</button><button class="btn chk">확인</button>${say(c.target)}<span class="mkbox"></span></div><div class="fb"></div></div>`);
    const line = $('.scr-line', w), bank = $('.scr-bank', w);
    let order = [];
    function draw() {
      const order2 = shuffle(toks.map((t, i) => i));
      bank.innerHTML = order2.map(i => `<button class="tok" data-i="${i}">${esc(toks[i])}</button>`).join('');
      line.innerHTML = ''; order = [];
      $$('.tok', bank).forEach(b => b.onclick = () => { if (b.disabled) return; b.disabled = true; order.push(+b.dataset.i); const t = el(`<button class="tok in">${esc(toks[+b.dataset.i])}</button>`); t.onclick = () => { order.splice(order.indexOf(+b.dataset.i), 1); t.remove(); b.disabled = false; }; line.appendChild(t); });
    }
    draw();
    $('.rst', w).onclick = draw;
    $('.chk', w).onclick = () => {
      if (order.length < toks.length) { $('.fb', w).innerHTML = '<span class="warn">모든 단어를 배열하세요.</span>'; return; }
      const s = order.map(i => toks[i]).join(' ');
      const ok = s === c.target;
      record(c.id, ok ? 1 : 0, ok ? [] : ['estructura'], {});
      w.classList.remove('is-ok', 'is-no'); w.classList.add(ok ? 'is-ok' : 'is-no');
      $('.mkbox', w).innerHTML = MARK(ok ? 1 : 0);
      $('.fb', w).innerHTML = ok ? '<span class="good">¡Perfecto!</span>' : `정답 → <span class="ans">${tl(c.target)}</span>`;
    };
    const prev = S.items[c.id]; if (prev) { w.classList.add(prev.last >= 1 ? 'is-ok' : 'is-no'); $('.mkbox', w).innerHTML = MARK(prev.last); }
    return w;
  }

  /* ---------- 섹션 빌더 ---------- */
  const B = {};
  const sec = (id, html) => { const s = $('#sec-' + id); s.innerHTML = html; return s; };
  const put = (s, sel, ...nodes) => { const box = $(sel, s); nodes.forEach(n => box.appendChild(n)); return box; };

  B.inicio = () => {
    const s = sec('inicio', `
      <div class="cover">
        <div class="cover-hero"><div class="sun"></div><div class="sea"></div><div class="sand"></div><div class="reader">📖<span>👒</span></div>
          <div class="badge"><small>Lección</small>09</div></div>
        <div class="cover-body">
          <h1>Me gusta mucho viajar</h1>
          <table class="obj">
            <tr><th>Tema y vocabulario</th><td>Deportes y actividades de tiempo libre<br>Gustos personales</td></tr>
            <tr><th>Comunicación</th><td>Expresar gustos personales<br>Expresar coincidencia y diferencia de gustos<br>Expresar diversos grados de gustos personales</td></tr>
            <tr><th>Gramática</th><td>Verbos: <i>gustar, encantar, preferir</i><br>Pronombres de objeto indirecto<br>Adverbios: <i>también, tampoco, sí, no</i><br>Comparaciones</td></tr>
          </table>
        </div>
      </div>
      <div class="grid2">
        <div class="card"><h3>👩‍🎓 학생 정보</h3><label class="lbl">이름 · Nombre</label><input id="stuName" class="inp wide" placeholder="이름을 쓰세요"><p class="small">이름은 성적표와 모의시험 결과지에 표시됩니다. 기록은 이 기기의 브라우저에만 저장돼요.</p></div>
        <div class="card center"><h3>📈 나의 진도</h3><div id="ring"></div><button class="btn big" id="goNext">이어서 학습하기 →</button></div>
      </div>
      <div class="card"><h3>✍️ 채점 표식 읽는 법</h3>
        <div class="legend">
          <div><span class="mk ok">○</span> 정답</div><div><span class="mk half">△</span> 부분 정답 (악센트 · ¿¡ 부호)</div><div><span class="mk no">✕</span> 오답 — 정답 예시가 나와요</div>
          <div><mark class="goodm">초록 형광펜</mark> 잘 쓴 핵심 구조</div><div><mark class="bad">빨간 펜<sup>1</sup></mark> 고칠 부분 (번호별 설명)</div>
          <div><span class="tl-demo">t<b class="tl">é</b></span> 정답 속 악센트 · 부호 강조</div><div>${say('Me gusta mucho viajar')} 원어민 발음 듣기 — 소리가 안 나면 상단 <b>🔊 소리 점검</b></div>
        </div>
        <p class="small">모든 문항은 <b>직접 써서</b> 답하는 쓰기시험 형식입니다. Enter 키로도 채점할 수 있어요.</p>
      </div>`);
    const nm = $('#stuName', s); nm.value = S.name || ''; nm.oninput = () => { S.name = nm.value; save(); };
    $('#goNext', s).onclick = () => { const nx = D.sections.find(x => x.id !== 'inicio' && x.id !== 'resultados' && secPct(x.id) < 0.999 && secCount(x.id) > 0); go(nx ? nx.id : 'resultados'); };
  };

  B.vocab = () => {
    const s = sec('vocab', `<div class="ribbon-head"><span class="ribbon">Antes de empezar</span><span class="act-bar y"></span></div>
      <p class="lead">Los españoles y latinoamericanos tienen muchas y diferentes aficiones. Cuando tienen tiempo libre, les gusta disfrutar de ellas. Entre sus aficiones están: nadar, subir a la montaña, jugar al tenis, ir al cine, etc. ${say('Los españoles y latinoamericanos tienen muchas y diferentes aficiones. Cuando tienen tiempo libre, les gusta disfrutar de ellas.')}</p>
      <h3 class="h3">① 카드를 눌러 뜻을 확인하세요</h3><div class="flipgrid"></div>
      <h3 class="h3">② 쓰기 연습 — 그림과 뜻을 보고 스페인어로 쓰세요</h3><div class="items two"></div>`);
    const fg = $('.flipgrid', s);
    D.aficiones.forEach(a => {
      const c = el(`<div class="flip"><div class="flip-in"><div class="ff"><span class="emo">${a.e}</span><span>${a.es}</span></div><div class="fbk"><span>${a.kr}</span>${say(a.es)}</div></div></div>`);
      c.onclick = e => { if (!e.target.closest('.say')) c.classList.toggle('on'); };
      fg.appendChild(c);
    });
    D.aficiones.forEach((a, i) => put(s, '.items', writeItem({ id: 'voc-' + i, sec: 'vocab', skill: 'voc', prompt: `<span class="emo-sm">${a.e}</span> ${a.kr}`, answers: [a.es] })));
  };

  B.gram = () => {
    const s = sec('gram', `<div class="ribbon-head"><span class="ribbon red">Gramática</span><span class="act-bar"></span></div>
      <div class="gcard"><h3>1. gustar — 좋아하는 <u>대상</u>이 주어!</h3>
        <div class="blocks"><span class="bk p">(A mí)</span><span class="bk o">me</span><span class="bk v">gusta</span><span class="bk s">leer / la música</span></div>
        <div class="blocks"><span class="bk p">(A mí)</span><span class="bk o">me</span><span class="bk v">gustan</span><span class="bk s">las películas de terror</span></div>
        <div class="legend-mini"><span class="bk p">강조 (생략 가능)</span><span class="bk o">간접목적대명사</span><span class="bk v">gustar 3인칭</span><span class="bk s">주어 = 좋아하는 것</span></div>
        ${tip('동사원형 · 단수 명사 → <b>gusta</b> / 복수 명사 → <b>gustan</b>. 동사원형이 두 개여도 단수: <b>Me gusta bailar y cantar.</b>')}
        <div class="g1"></div></div>
      <div class="gcard"><h3>2. 간접목적대명사 (Pronombres de objeto indirecto)</h3>
        ${tip('사람 이름이 오면 <b>a</b> + 이름 + le: <b>A Olga le gusta</b> tocar la guitarra. "a mí"의 mí 에는 악센트!')}
        <div class="g2a"></div><div class="g2b"></div></div>
      <div class="gcard"><h3>3. 좋아하는 정도 (Grados de gusto)</h3>
        <div class="scale">
          <div class="st s5"><span>😍</span><b>Me encanta(n)</b><small>정말 좋아해</small></div>
          <div class="st s4"><span>😊</span><b>Me gusta(n) mucho</b><small>아주 좋아해</small></div>
          <div class="st s3"><span>🙂</span><b>Me gusta(n)</b><small>좋아해</small></div>
          <div class="st s2"><span>😐</span><b>No me gusta(n) mucho</b><small>별로야</small></div>
          <div class="st s1"><span>😖</span><b>No me gusta(n) nada</b><small>전혀 싫어</small></div>
        </div>
        ${tip('<b>Me encanta mucho</b> ✕ — encantar 자체가 "아주 좋아하다"라서 mucho를 붙이지 않아요.')}
        <div class="items g3"></div></div>
      <div class="gcard"><h3>4. preferir (e → ie) — 더 좋아하다</h3>
        <div class="boot-wrap"><div class="g4a"></div><div class="boot-note">👢 <b>부츠 모양</b>: nosotros · vosotros 만 e 그대로!<br><br><b>Prefiero A a B</b> : B보다 A가 좋다<br>Prefiero el cine <b>al</b> teatro. (a + el = al)</div></div>
        <div class="g4b"></div></div>
      <div class="gcard"><h3>5. 맞장구 — también / tampoco / sí / no</h3>
        <table class="acu"><tr><th>상대방 문장</th><th class="agr">나도 같아요 🤝</th><th class="dis">나는 달라요 🙅</th></tr>
          <tr><td>긍정 · <i>Me gusta esquiar.</i></td><td class="agr">A mí <b>también</b>. ${say('A mí también.')}</td><td class="dis">A mí <b>no</b>. ${say('A mí no.')}</td></tr>
          <tr><td>부정 · <i>No me gusta el fútbol.</i></td><td class="agr">A mí <b>tampoco</b>. ${say('A mí tampoco.')}</td><td class="dis">A mí <b>sí</b>. ${say('A mí sí.')}</td></tr></table>
        <div class="items g5"></div></div>
      <div class="gcard"><h3>6. 비교 (Comparaciones)</h3>
        <div class="blocks"><span class="bk o">Me gusta</span><span class="bk v">más</span><span class="bk s">A</span><span class="bk v">que</span><span class="bk s">B</span><span class="small">B보다 A가 더 좋다</span></div>
        <div class="blocks"><span class="bk o">Me gusta</span><span class="bk p">menos</span><span class="bk s">A</span><span class="bk p">que</span><span class="bk s">B</span><span class="small">B보다 A가 덜 좋다</span></div>
        ${tip('A가 복수 명사면 <b>gustan</b>: Me gustan más los gatos que los perros.')}
        <div class="items g6"></div></div>`);
    put(s, '.g1', cloze({ id: 'g1', sec: 'gram', skill: 'gus', title: '빈칸에 gusta / gustan / encanta / encantan 을 쓰세요.', cls: 'lines', text:
      ['(A mí) me [gusta] leer.', '(A mí) me [gustan] las películas de terror.', '¿Te [gusta] bailar y cantar?', '¿Te [gustan] el béisbol y el tenis?',
        'Me [gusta] la música.', 'No me [gustan] las motos.', 'Me [encanta] el chocolate. <i>(encantar)</i>', 'Me [encantan] los perros. <i>(encantar)</i>'].map(x => `<p>${x}</p>`).join('') }));
    put(s, '.g2a', cloze({ id: 'g2a', sec: 'gram', skill: 'pro', title: '표를 완성하세요.', cls: 'table2', text:
      [['a mí', 'me'], ['a ti', 'te'], ['a él / ella / usted', 'le'], ['a nosotros/as', 'nos'], ['a vosotros/as', 'os'], ['a ellos / ellas / ustedes', 'les']].map(([a, b]) => `<p><span>${a}</span> → [${b}] gusta</p>`).join('') }));
    put(s, '.g2b', cloze({ id: 'g2b', sec: 'gram', skill: 'pro', title: '알맞은 대명사를 쓰세요.', cls: 'lines', text:
      ['A ellos [les] gusta bailar.', 'A nosotros [nos] encanta la paella.', '¿A ti [te] gustan los perros?', 'A Olga [le] gusta tocar la guitarra.', 'A vosotros [os] gusta el cine.', 'A mis padres [les] gusta pasear.'].map(x => `<p>${x}</p>`).join('') }));
    [['😍', 'la música', 'encantar', ['Me encanta la música.']], ['😍', 'los videojuegos', 'encantar', ['Me encantan los videojuegos.']],
      ['😊', 'viajar', 'gustar mucho', ['Me gusta mucho viajar.']], ['😐', 'el fútbol', 'no … mucho', ['No me gusta mucho el fútbol.']],
      ['😖', 'las motos', 'no … nada', ['No me gustan nada las motos.']]].forEach(([e, o, v, a], i) =>
      put(s, '.g3', writeItem({ id: 'g3-' + i, sec: 'gram', skill: 'gus', prompt: `<span class="emo-sm">${e}</span> <b>${o}</b> <span class="small">(${v})</span>`, answers: withAmi(a) })));
    put(s, '.g4a', cloze({ id: 'g4a', sec: 'gram', skill: 'pre', cls: 'boot', text:
      [['yo', 'prefiero', 1], ['tú', 'prefieres', 1], ['él / ella / usted', 'prefiere', 1], ['nosotros/as', 'preferimos', 0], ['vosotros/as', 'preferís', 0], ['ellos / ellas / ustedes', 'prefieren', 1]]
        .map(([p, f, b]) => `<p class="${b ? 'in' : 'out'}"><span>${p}</span>[${f}]</p>`).join('') }));
    put(s, '.g4b', cloze({ id: 'g4b', sec: 'gram', skill: 'pre', cls: 'lines', title: 'preferir 를 알맞게 바꾸세요.', text:
      ['Mis padres [prefieren] la montaña.', 'Nosotros [preferimos] ver películas.', '¿Qué [prefieres] tú, el té o el café?', 'Yo [prefiero] el cine [al] teatro.'].map(x => `<p>${x}</p>`).join('') }));
    [['A: Me gusta esquiar.', '나도 좋아', 'A mí también.'], ['A: No me gusta el fútbol.', '나도 싫어', 'A mí tampoco.'],
      ['A: Me gustan los gatos.', '나는 싫어', 'A mí no.'], ['A: No me gusta cocinar.', '나는 좋아', 'A mí sí.']].forEach(([q, k, a], i) =>
      put(s, '.g5', writeItem({ id: 'g5-' + i, sec: 'gram', skill: 'acu', prompt: `${q} → <span class="small">B (${k})</span>`, answers: [a], prefix: true })));
    [['🎾 el tenis', '>', '⚽ el fútbol', ['Me gusta más el tenis que el fútbol.', 'Me gusta menos el fútbol que el tenis.']],
      ['📚 leer', '>', '📺 ver la tele', ['Me gusta más leer que ver la tele.', 'Me gusta menos ver la tele que leer.']],
      ['🏖️ la playa', '<', '⛰️ la montaña', ['Me gusta menos la playa que la montaña.', 'Me gusta más la montaña que la playa.']],
      ['🐈 los gatos', '>', '🐕 los perros', ['Me gustan más los gatos que los perros.', 'Me gustan menos los perros que los gatos.']]].forEach(([a, op, b, ans], i) =>
      put(s, '.g6', writeItem({ id: 'g6-' + i, sec: 'gram', skill: 'com', prompt: `${a} <b class="op">${op}</b> ${b}`, answers: withAmi(ans) })));
  };

  function dialogHTML(lines, cls) {
    let ci = 0;
    return `<div class="chat ${cls || ''}">${lines.map(l => {
      const side = (l.who === 'C' || l.who === 'María' || l.who === 'Adriana') ? 'r' : 'l';
      const name = { J: 'Juan', C: 'Cristina' }[l.who] || l.who;
      const av = { Juan: '🧑🏻‍🦱', Cristina: '👩🏼‍🦰', 'María': '👱🏼‍♀️', Pedro: '🧑🏽', Marcos: '👦🏻', Adriana: '👧🏽' }[name];
      const txt = esc(l.es).replace(/\[([^\]]+)\]/g, (m, a) => hl(a, ci++));
      return `<div class="msg ${side}"><span class="av">${av}<small>${name}</small></span><div class="bub">${txt} ${say(l.es)}</div></div>`;
    }).join('')}</div>`;
  }
  const clozeFromDialog = lines => lines.map(l => `<p><b class="who">${{ J: 'Juan', C: 'Cristina' }[l.who] || l.who}:</b> ${l.es}</p>`).join('');

  B.d1 = () => {
    const s = sec('d1', `${dlgHead(1, 'Juan habla con Cristina sobre sus gustos.')}
      <h3 class="h3"><span class="hp">🎧</span> a) Escucha el diálogo y practica con tus compañeros. <button class="btn ghost sm" id="play1">▶ 대화 전체 듣기</button> <button class="btn ghost sm" id="hide1">본문 가리기</button></h3>
      <div id="d1txt">${dialogHTML(D.dialogo1, 'comic')}</div>
      <h3 class="h3">✍️ 빈칸 받아쓰기 — 본문을 가리고 핵심 표현을 쓰세요</h3><div class="d1c"></div>
      <h3 class="h3">b) Practica utilizando las siguientes expresiones.</h3>
      <div class="chips"><span class="hlc c0">me encanta</span><span class="hlc c1">especialmente</span><span class="hlc c2">hacer un viaje</span><span class="hlc c0">sobre todo</span></div>
      <div class="items d1b"></div>
      <h3 class="h3">c) 나만의 대화 쓰기</h3><div class="d1f"></div>`);
    $('#play1', s).onclick = e => playLines(D.dialogo1, e.currentTarget);
    $('#hide1', s).onclick = e => { const t = $('#d1txt', s); t.classList.toggle('blur'); e.target.textContent = t.classList.contains('blur') ? '본문 보기' : '본문 가리기'; };
    put(s, '.d1c', cloze({ id: 'd1c', sec: 'd1', skill: 'gus', cls: 'lines', text: clozeFromDialog(D.dialogo1) }));
    [['"Me gusta mucho leer." → <b>encantar</b>로 바꿔 쓰세요.', ['Me encanta leer.']],
      ['음악을 좋아해, 특히 록을. <span class="small">(sobre todo)</span>', ['Me gusta la música, sobre todo el rock.']],
      ['이번 여름에 멕시코로 여행 가고 싶어. <span class="small">Este verano quiero … (hacer un viaje)</span>', ['Este verano quiero hacer un viaje a México.']],
      ['여행하는 걸 좋아해, 특히 스페인으로. <span class="small">(especialmente)</span>', ['Me gusta viajar, especialmente a España.']]].forEach(([p, a], i) =>
      put(s, '.d1b', writeItem({ id: 'd1b-' + i, sec: 'd1', skill: 'gus', prompt: p, answers: withAmi(a) })));
    put(s, '.d1f', freeItem({ id: 'd1f', sec: 'd1', rows: 6, prompt: '친구와 취미에 대해 이야기하는 대화를 4~6줄로 쓰세요. (A: … / B: …)',
      ph: 'A: ¿Te gusta …?\nB: Sí, me gusta mucho …',
      must: [{ re: '¿\\s*te gustan?', label: '¿Te gusta(n) …? 질문' }, { re: W0 + 'me (gustan?|encantan?)' + W1, label: 'Me gusta(n) / Me encanta(n)' },
        { re: 'a m[ií] (tambi[eé]n|tampoco|no|s[ií])' + W1, label: '맞장구 (A mí también / tampoco / no / sí)' }, { re: W0 + 'prefiero' + W1, label: 'prefiero' },
        { re: '(sobre todo|especialmente)', label: 'sobre todo / especialmente' }],
      model: 'A: ¿Te gusta escuchar música? B: Sí, me encanta, sobre todo el pop. ¿Y a ti? A: A mí también, pero prefiero tocar la guitarra.' }));
  };

  B.a1 = () => {
    const s = sec('a1', `${actHead(1, 'Pregunta a tu compañero si le gustan las cosas de la lista.')}
      <div class="ybox two-col"><div><b>¿Te gusta ...?</b><p>ir al cine</p><p>la música</p><p>bailar y cantar</p><p>hacer deporte</p></div><div><b>¿Te gustan ...?</b><p>las películas de terror</p><p>las películas cómicas</p><p>el tango y la salsa</p><p>el béisbol y el tenis</p></div></div>
      ${modelo('A: ¿Te gusta ir al cine?<br>B: Sí, me gusta mucho.<br>A: ¿Qué tipo de películas te gusta?<br>B: Me encantan las películas de terror.')}
      <h3 class="h3">✍️ 질문을 완성해서 쓰세요 (¿ ? 부호까지!)</h3><div class="items two"></div>
      <h3 class="h3">✍️ "¿Qué tipo de películas te gusta?"에 답하세요</h3><div class="f"></div>`);
    ['ir al cine', 'las películas de terror', 'la música', 'las películas cómicas', 'bailar y cantar', 'el tango y la salsa', 'hacer deporte', 'el béisbol y el tenis'].forEach((x, i) => {
      const pl = /^(las|los)|y la salsa|y el tenis/.test(x);
      put(s, '.items', writeItem({ id: 'a1-' + i, sec: 'a1', skill: 'gus', prompt: `<span class="chip">${x}</span>`, ph: '¿Te …?', answers: [`¿Te ${pl ? 'gustan' : 'gusta'} ${x}?`] }));
    });
    put(s, '.f', freeItem({ id: 'a1-f', sec: 'a1', line: true, ph: 'Me encantan las películas …', must: [{ re: W0 + 'me (encantan|gustan)( mucho)? las pel[ií]culas', label: 'Me encantan / Me gustan las películas …' }], model: 'Me encantan las películas cómicas.' }));
  };

  const CHAIN = ['leer', 'ver los partidos de fútbol', 'jugar al tenis', 'escuchar música', 'ir a la playa', 'cocinar'];
  const CHAIN_E = ['📚', '⚽', '🎾', '🎧', '🏖️', '🍳'];
  B.a2 = () => {
    const s = sec('a2', `${actHead(2, 'Utiliza el verbo <i>preferir</i> y haz una cadena.', { kr: '앞 문장의 "prefiero ~"를 받아 다음 문장을 이어 쓰는 사슬 만들기' })}
      ${modelo('<div class="wave">Me gusta leer, pero prefiero ver los partidos de fútbol.<br>Me gusta ver los partidos de fútbol, pero prefiero jugar al tenis.<br>Me gusta jugar al tenis, pero …</div>')}
      <div class="chain"></div><div class="items"></div>
      <h3 class="h3">⭐ 도전 — 3인칭으로 쓰기</h3><div class="items ch"></div>`);
    const drawChain = () => {
      $('.chain', s).innerHTML = CHAIN.map((c, i) => {
        const done = i === 0 || i === 1 || (S.items['a2-' + (i - 1)] && S.items['a2-' + (i - 1)].last > 0);
        return `${i ? '<span class="link ' + (done ? 'on' : '') + '">⛓</span>' : ''}<span class="node ${done ? 'on' : ''}"><span>${CHAIN_E[i]}</span>${c}</span>`;
      }).join('');
    };
    for (let i = 2; i < CHAIN.length; i++) {
      const k = i - 1;
      put(s, '.items', writeItem({ id: 'a2-' + k, sec: 'a2', skill: 'pre', prompt: `<b>${k + 1}.</b> 앞 고리: <span class="chip">${CHAIN[i - 1]}</span> → 다음 고리: ${CHAIN_E[i]} <span class="chip">${CHAIN[i]}</span>`,
        ph: `Me gusta ${CHAIN[i - 1]}, pero …`, answers: [`Me gusta ${CHAIN[i - 1]}, pero prefiero ${CHAIN[i]}.`], onCheck: drawChain }));
    }
    put(s, '.ch', writeItem({ id: 'a2-c', sec: 'a2', skill: 'pre', prompt: '후안은 독서를 좋아하지만 영화 보는 것을 더 좋아한다.', ph: 'A Juan …', answers: ['A Juan le gusta leer, pero prefiere ver películas.'] }));
    drawChain();
  };

  B.a3 = () => {
    const s = sec('a3', `${actHead(3, 'a) Relaciona los dibujos con una de las expresiones del recuadro.', { kr: '표현을 누른 뒤 그림 카드를 누르면 연결돼요.' })}
      <div class="ybox bank"></div><div class="pics"></div><div class="item-row"><button class="btn chk m">채점하기</button><span class="mscore"></span></div>
      <h2 class="act-title">b) ¿Te gusta hacer las cosas de la lista de arriba? ¿Y a tu compañero?</h2>
      ${modelo('A: A mí me gusta esquiar, ¿y a ti?<br>B: A mí también. / A mí no. Me gusta jugar al fútbol.<br>A: A mí no me gusta ver exposiciones, ¿y a ti?<br>B: A mí tampoco. / A mí sí. A mí me gusta mucho.')}
      ${tip('먼저 <b>나의 취향</b>(❤️/🙅)을 고르고, 그에 맞는 맞장구를 쓰세요.')}
      <div class="items react"></div>`);
    const st = S.sel.a3 || (S.sel.a3 = {});
    let picked = null;
    const words = shuffle(D.act3.map(x => x.es));
    const bank = $('.bank', s), pics = $('.pics', s);
    bank.innerHTML = words.map(w => `<button class="wchip" data-w="${esc(w)}">${w}</button>`).join('');
    pics.innerHTML = D.act3.map((p, i) => { reg('a3-m' + i, 'a3', 'voc'); return `<div class="pic" data-i="${i}"><span class="num">${i + 1})</span><span class="emo">${p.e}</span><span class="slot"></span><span class="mkbox"></span></div>`; }).join('');
    const paint = () => {
      $$('.pic', pics).forEach(p => { const v = st[p.dataset.i]; $('.slot', p).textContent = v || '?'; p.classList.toggle('filled', !!v); });
      $$('.wchip', bank).forEach(b => { b.classList.toggle('used', Object.values(st).includes(b.dataset.w)); b.classList.toggle('sel', b.dataset.w === picked); });
    };
    $$('.wchip', bank).forEach(b => b.onclick = () => { picked = b.dataset.w; paint(); });
    $$('.pic', pics).forEach(p => p.onclick = () => {
      if (!picked) { if (st[p.dataset.i]) { delete st[p.dataset.i]; save(); paint(); } return; }
      Object.keys(st).forEach(k => { if (st[k] === picked) delete st[k]; });
      st[p.dataset.i] = picked; picked = null; save(); paint();
    });
    $('.m', s).onclick = () => {
      let ok = 0;
      $$('.pic', pics).forEach(p => { const i = +p.dataset.i, good = st[i] === D.act3[i].es; if (good) ok++; record('a3-m' + i, good ? 1 : 0, good ? [] : ['otro'], {}); p.classList.remove('ok', 'no'); p.classList.add(good ? 'ok' : 'no'); $('.mkbox', p).innerHTML = MARK(good ? 1 : 0) + (good ? '' : `<small>${D.act3[i].es}</small>`); });
      $('.mscore', s).innerHTML = `<b>${ok} / 9</b>`;
    };
    paint();
    const R = [['A mí me gusta esquiar, ¿y a ti?', true], ['A mí no me gusta ver exposiciones, ¿y a ti?', false], ['A mí me encanta cocinar, ¿y a ti?', true], ['A mí no me gusta lavar la ropa, ¿y a ti?', false]];
    const rs = S.sel.a3r || (S.sel.a3r = {});
    R.forEach(([q, pos], i) => {
      const box = el(`<div class="react-row"><div class="q">A: ${q} ${say(q)}</div><div class="tg"><button data-v="1">❤️ 나는 좋아</button><button data-v="0">🙅 나는 싫어</button></div></div>`);
      const tg = () => $$('.tg button', box).forEach(b => b.classList.toggle('on', rs[i] === b.dataset.v));
      $$('.tg button', box).forEach(b => b.onclick = () => { rs[i] = b.dataset.v; save(); tg(); });
      tg();
      box.appendChild(writeItem({ id: 'a3-r' + i, sec: 'a3', skill: 'acu', ph: 'B: A mí …', prefix: true,
        answers: () => rs[i] == null ? null : [pos ? (rs[i] === '1' ? 'A mí también.' : 'A mí no.') : (rs[i] === '1' ? 'A mí sí.' : 'A mí tampoco.')] }));
      put(s, '.react', box);
    });
  };

  B.a4 = () => {
    const s = sec('a4', `${actHead(4, 'Habla con tus compañeros siguiendo el modelo.')}
      ${modelo('A: ¿Qué país te gusta?<br>B: España.<br>A: ¿Por qué?<br>B: Porque estudio español y tengo muchos amigos allí.')}
      ${tip('<b>¿Por qué?</b> (왜?) — 띄어 쓰고 악센트 / <b>Porque</b> (왜냐하면) — 붙여 쓰고 악센트 없음.<br>복수 명사를 물을 때: ¿Qué actividades culturales te <b>gustan</b>?')}
      <h3 class="h3">✍️ 질문 쓰기</h3><div class="items two"></div>
      <h3 class="h3">✍️ 대답 쓰기 — 위 주제 중 3개를 골라 이유(porque)와 함께</h3><div class="f"></div>`);
    [['película', '영화'], ['comida', '음식'], ['deporte', '스포츠'], ['actividades culturales', '문화 활동'], ['lugar de vacaciones', '휴가지'], ['canción', '노래']].forEach(([w, k], i) => {
      const pl = w === 'actividades culturales';
      put(s, '.items', writeItem({ id: 'a4-' + i, sec: 'a4', skill: 'gus', prompt: `${i + 1}) <span class="chip">${w}</span> <span class="small">어떤 ${k}을(를) 좋아해?</span>`, ph: '¿Qué …?',
        answers: pl ? ['¿Qué actividades culturales te gustan?'] : [`¿Qué ${w} te gusta?`] }));
    });
    put(s, '.f', freeItem({ id: 'a4-f', sec: 'a4', rows: 5, ph: 'Me gusta el fútbol porque …',
      must: [{ re: W0 + 'porque' + W1, label: 'porque 3번 이상', min: 3 }, { re: W0 + 'me (gustan?|encantan?)' + W1, label: 'Me gusta(n) / Me encanta(n) 3번 이상', min: 3 }],
      model: 'Me gusta la paella porque es muy rica. Me encanta el fútbol porque es emocionante. Me gusta Cancún porque tiene playas bonitas.' }));
  };

  const A5 = [['jugar al fútbol', 'M+'], ['cocinar', 'M+'], ['los platos mexicanos', 'M+'], ['bailar', 'M-'], ['las discotecas', 'M-'],
    ['el tenis', 'A+'], ['la salsa', 'A+'], ['las películas de terror', 'A+'], ['el fútbol', 'A-'], ['hacer la compra', 'A-']];
  B.a5 = () => {
    const s = sec('a5', `${actHead(5, 'Escucha esta conversación entre Marcos y Adriana. A continuación, habla de sus gustos.', { listen: true })}
      <div class="notice">🎧 교재 음원 대신 <b>읽기 · 듣기 자료</b>로 구성했어요 (교재 원음원과 내용이 다를 수 있음). ▶ 버튼으로 들어 보세요.</div>
      <h3 class="h3"><button class="btn ghost sm" id="play5">▶ 대화 듣기</button> <button class="btn ghost sm" id="hide5">대화 가리기</button></h3>
      <div id="d5txt">${dialogHTML(D.dialogo5)}</div>
      <h3 class="h3">① 표 완성 — 표현을 누르고 알맞은 칸을 누르세요</h3>
      <div class="ybox bank5"></div>
      <table class="lg"><tr><th></th><th>le gusta 😊</th><th>no le gusta 🙁</th></tr>
        <tr><th>A Marcos</th><td data-c="M+"></td><td data-c="M-"></td></tr><tr><th>A Adriana</th><td data-c="A+"></td><td data-c="A-"></td></tr></table>
      <div class="item-row"><button class="btn chk t">표 채점</button><span class="tscore"></span></div>
      <h3 class="h3">② 3인칭으로 쓰기 — A Marcos le gusta …</h3><div class="items two w5"></div>`);
    $('#play5', s).onclick = e => playLines(D.dialogo5, e.currentTarget);
    $('#hide5', s).onclick = e => { const t = $('#d5txt', s); t.classList.toggle('blur'); e.target.textContent = t.classList.contains('blur') ? '대화 보기' : '대화 가리기'; };
    const st = S.sel.a5 || (S.sel.a5 = {});
    let picked = null;
    A5.forEach((x, i) => reg('a5-t' + i, 'a5', 'pro'));
    const bank = $('.bank5', s);
    const order = shuffle(A5.map((x, i) => i));
    const paint = () => {
      bank.innerHTML = order.filter(i => !st[i]).map(i => `<button class="wchip ${picked === i ? 'sel' : ''}" data-i="${i}">${A5[i][0]}</button>`).join('') || '<span class="small">모두 배치했어요 ✔</span>';
      $$('td[data-c]', s).forEach(td => { td.innerHTML = Object.keys(st).filter(i => st[i] === td.dataset.c).map(i => `<button class="wchip in" data-i="${i}">${A5[i][0]}</button>`).join(''); });
      $$('.wchip', s).forEach(b => b.onclick = ev => { ev.stopPropagation(); const i = +b.dataset.i; if (b.classList.contains('in')) { if (picked != null) { st[picked] = b.closest('td').dataset.c; picked = null; } else delete st[i]; save(); } else picked = i; paint(); });
    };
    $$('td[data-c]', s).forEach(td => td.onclick = () => { if (picked == null) return; st[picked] = td.dataset.c; picked = null; save(); paint(); });
    paint();
    $('.t', s).onclick = () => {
      let ok = 0;
      A5.forEach(([w, c], i) => { const g = st[i] === c; if (g) ok++; record('a5-t' + i, g ? 1 : 0, g ? [] : ['otro'], {}); });
      $$('td[data-c] .wchip', s).forEach(b => { const i = +b.dataset.i; b.classList.add(A5[i][1] === st[i] ? 'ok' : 'no'); });
      $('.tscore', s).innerHTML = `${MARK(ok / A5.length)} <b>${ok} / ${A5.length}</b>`;
    };
    [['마르코스는 춤추는 것을 좋아하지 않는다.', ['A Marcos no le gusta bailar.']], ['아드리아나는 공포 영화를 정말 좋아한다.', ['A Adriana le encantan las películas de terror.', 'A Adriana le gustan mucho las películas de terror.']],
      ['마르코스는 멕시코 요리를 정말 좋아한다.', ['A Marcos le encantan los platos mexicanos.', 'A Marcos le gustan mucho los platos mexicanos.']], ['아드리아나는 축구를 좋아하지 않는다.', ['A Adriana no le gusta el fútbol.']],
      ['아드리아나는 축구보다 테니스를 더 좋아한다. (preferir)', ['Adriana prefiere el tenis al fútbol.', 'Adriana prefiere el tenis.']]].forEach(([p, a], i) =>
      put(s, '.w5', writeItem({ id: 'a5-w' + i, sec: 'a5', skill: i === 4 ? 'pre' : 'pro', prompt: p, answers: a })));
  };

  const FREQ_ORDER = ['siempre', 'todos los días', 'a menudo', 'de vez en cuando', 'nunca'];
  B.d2 = () => {
    const s = sec('d2', `${dlgHead(2, 'Dos amigos, María y Pedro, hablan sobre sus deportes favoritos a la salida del colegio.')}
      <h3 class="h3"><span class="hp">🎧</span> a) Escucha el diálogo y practica. <button class="btn ghost sm" id="play2">▶ 대화 전체 듣기</button> <button class="btn ghost sm" id="hide2">본문 가리기</button></h3>
      <div id="d2txt">${dialogHTML(D.dialogo2)}</div>
      <h3 class="h3">① 내용 확인 — ¿Verdadero o falso?</h3><div class="items vf"></div>
      <h3 class="h3">b) 표현 바꿔 쓰기</h3>
      <div class="chips"><span class="hlc c0">los martes</span><span class="hlc c1">por semana</span><span class="hlc c2">¿por qué no vienes?</span><span class="hlc c0">magnífico</span></div>
      <div class="items rep"></div>
      <h3 class="h3">② 빈도 표현 (Frecuencia)</h3>
      <div class="freq">${[['siempre', '항상', 100], ['todos los días / cada día', '매일', 85], ['a menudo', '자주', 65], ['dos veces a la semana / por semana', '일주일에 두 번', 45], ['de vez en cuando', '가끔', 25], ['nunca', '전혀 ~않다', 3]]
        .map(([e, k, p]) => `<div class="fr"><span class="fl">${e} ${say(e.split(' / ')[0])}</span><span class="fbar"><i style="width:${p}%"></i></span><span class="fk">${k}</span></div>`).join('')}</div>
      ${tip('<b>nunca</b>가 동사 앞이면 no 없이: Nunca voy a la piscina. / 동사 뒤면 no와 함께: No voy nunca a la piscina.')}
      <div class="item sortq"><div class="item-p">자주 하는 순서대로 누르세요 (많이 → 적게)</div><div class="sort-line"></div><div class="sort-bank"></div><div class="item-row"><button class="btn ghost rst">다시</button><button class="btn chk">확인</button><span class="mkbox"></span></div></div>`);
    $('#play2', s).onclick = e => playLines(D.dialogo2, e.currentTarget);
    $('#hide2', s).onclick = e => { const t = $('#d2txt', s); t.classList.toggle('blur'); e.target.textContent = t.classList.contains('blur') ? '본문 보기' : '본문 가리기'; };
    [['El deporte favorito de Pedro es el baloncesto.', 'Verdadero'], ['Pedro va a la piscina dos veces a la semana.', 'Falso'], ['María va al parque a menudo con su mascota.', 'Verdadero'], ['Pedro va a Sierra Nevada en verano.', 'Falso']]
      .forEach(([p, a], i) => put(s, '.vf', choiceItem({ id: 'd2-vf' + i, sec: 'd2', skill: 'fre', prompt: p, options: ['Verdadero', 'Falso'], answer: a })));
    [['Juego al baloncesto <u>cada martes</u>.', 'los martes', 'Juego al baloncesto los martes.'], ['Voy a la piscina dos veces <u>a la semana</u>.', 'por semana', 'Voy a la piscina dos veces por semana.'],
      ['Voy al parque con mis amigos, <u>¿te vienes?</u>', '¿por qué no vienes?', 'Voy al parque con mis amigos, ¿por qué no vienes?'], ['Sí, <u>¡genial!</u>', 'magnífico', 'Sí, ¡magnífico!']]
      .forEach(([p, k, a], i) => put(s, '.rep', writeItem({ id: 'd2-r' + i, sec: 'd2', skill: 'fre', prompt: `${p} → <span class="chip">${k}</span>`, answers: [a] })));
    reg('d2-sort', 'd2', 'fre');
    const sq = $('.sortq', s); let ord = [];
    const draw = () => {
      ord = [];
      $('.sort-line', sq).innerHTML = '';
      $('.sort-bank', sq).innerHTML = shuffle(FREQ_ORDER).map(f => `<button class="tok">${f}</button>`).join('');
      $$('.sort-bank .tok', sq).forEach(b => b.onclick = () => { if (b.disabled) return; b.disabled = true; ord.push(b.textContent); $('.sort-line', sq).insertAdjacentHTML('beforeend', `<span class="tok in">${ord.length}. ${b.textContent}</span>`); });
    };
    draw();
    $('.rst', sq).onclick = draw;
    $('.chk', sq).onclick = () => { if (ord.length < 5) return; const ok = ord.join() === FREQ_ORDER.join(); record('d2-sort', ok ? 1 : 0, ok ? [] : ['otro'], {}); $('.mkbox', sq).innerHTML = MARK(ok ? 1 : 0) + (ok ? '' : ` <span class="ans">${FREQ_ORDER.join(' › ')}</span>`); };
  };

  B.a6 = () => {
    const s = sec('a6', `${actHead(6, 'De estas actividades, elige tres que te gustan y tres que no te gustan y anótalas en tu cuaderno. Luego habla con tu compañero. ¿Qué cosas os gustan a los dos?')}
      <div class="mode"><button data-m="like" class="on">❤️ 좋아하는 것 고르기 (3)</button><button data-m="dis">🙅 싫어하는 것 고르기 (3)</button></div>
      <div class="ybox pick6"></div>
      ${modelo('A mí me gusta mucho tocar el piano, navegar por Internet <b>e</b> ir a la playa, pero no me gusta hacer los deberes <b>ni</b> subir a la montaña.')}
      ${tip('<b>y → e</b> : i-/hi- 로 시작하는 단어 앞에서는 y 대신 e (navegar por Internet <b>e</b> ir…).<br><b>ni</b> : 부정문에서 "~도 …도 아니다" (no me gusta A <b>ni</b> B).')}
      <div class="f1"></div>
      <h3 class="h3">🤝 짝꿍과 비교하기 — 벤 다이어그램</h3>
      <p class="small">짝꿍이 좋아하는 것 3개를 고르거나, 🎲 가상 짝꿍을 만들어 보세요.</p>
      <div class="ybox pickp"></div><button class="btn ghost sm" id="rnd">🎲 가상 짝꿍</button>
      <div class="venn"><div class="c1"></div><div class="c2"></div><div class="vt"><div class="vl"><b>Yo</b><div class="v-a"></div></div><div class="vm"><b>A los dos</b><div class="v-b"></div></div><div class="vr"><b>Mi compañero</b><div class="v-c"></div></div></div></div>
      <div class="f2"></div>`);
    const st = S.sel.a6 || (S.sel.a6 = { like: [], dis: [], partner: [] });
    let mode = 'like';
    const pick = $('.pick6', s), pp = $('.pickp', s);
    const paint = () => {
      pick.innerHTML = D.act6.map(a => `<button class="wchip ${st.like.includes(a) ? 'lk' : ''} ${st.dis.includes(a) ? 'dk' : ''}" data-a="${esc(a)}">${st.like.includes(a) ? '❤️ ' : st.dis.includes(a) ? '🙅 ' : ''}${a}</button>`).join('');
      pp.innerHTML = D.act6.map(a => `<button class="wchip ${st.partner.includes(a) ? 'pk' : ''}" data-a="${esc(a)}">${a}</button>`).join('');
      $$('.wchip', pick).forEach(b => b.onclick = () => {
        const a = b.dataset.a, arr = st[mode], other = st[mode === 'like' ? 'dis' : 'like'];
        if (arr.includes(a)) arr.splice(arr.indexOf(a), 1); else { if (arr.length >= 3) arr.shift(); if (other.includes(a)) other.splice(other.indexOf(a), 1); arr.push(a); }
        save(); paint();
      });
      $$('.wchip', pp).forEach(b => b.onclick = () => { const a = b.dataset.a; if (st.partner.includes(a)) st.partner.splice(st.partner.indexOf(a), 1); else { if (st.partner.length >= 3) st.partner.shift(); st.partner.push(a); } save(); paint(); });
      const both = st.like.filter(a => st.partner.includes(a));
      $('.v-a', s).innerHTML = st.like.filter(a => !both.includes(a)).map(a => `<span>${a}</span>`).join('') || '<i>—</i>';
      $('.v-b', s).innerHTML = both.map(a => `<span>${a}</span>`).join('') || '<i>—</i>';
      $('.v-c', s).innerHTML = st.partner.filter(a => !both.includes(a)).map(a => `<span>${a}</span>`).join('') || '<i>—</i>';
    };
    $$('.mode button', s).forEach(b => b.onclick = () => { mode = b.dataset.m; $$('.mode button', s).forEach(x => x.classList.toggle('on', x === b)); });
    $('#rnd', s).onclick = () => { st.partner = shuffle(D.act6).slice(0, 3); save(); paint(); };
    paint();
    const itemRe = a => ({ re: acc(a).replace(/ /g, '\\s+'), label: `“${a}”` });
    put(s, '.f1', freeItem({ id: 'a6-f1', sec: 'a6', rows: 4, prompt: '내가 고른 활동으로 modelo처럼 한 문장(또는 두 문장)을 쓰세요.', needMsg: '좋아하는 것 3개, 싫어하는 것 3개를 먼저 고르세요.',
      must: () => (st.like.length < 3 || st.dis.length < 3) ? null : [{ re: W0 + 'me gusta' + W1, label: 'me gusta' }, ...st.like.map(itemRe), { re: W0 + 'no me gusta' + W1, label: 'no me gusta' }, ...st.dis.map(itemRe), { re: W0 + 'ni' + W1, label: 'ni (부정 나열)' }],
      model: 'A mí me gusta mucho tocar el piano, pintar e ir a la playa, pero no me gusta hacer los deberes ni ordenar mi habitación ni subir a la montaña.' }));
    put(s, '.f2', freeItem({ id: 'a6-f2', sec: 'a6', skill: 'pro', line: true, prompt: '벤 다이어그램을 보고 쓰세요. 공통점이 있으면 <b>A los dos nos gusta …</b>, 없으면 <b>A mí me gusta …, pero a mi compañero le gusta …</b>', needMsg: '내 취향(좋아하는 것)과 짝꿍 취향을 먼저 고르세요.',
      must: () => {
        if (st.like.length < 1 || st.partner.length < 1) return null;
        const both = st.like.filter(a => st.partner.includes(a));
        return both.length ? [{ re: 'a los dos nos gusta', label: 'A los dos nos gusta' }, ...both.map(itemRe)]
          : [{ re: 'a m[ií] me gusta', label: 'A mí me gusta' }, { re: 'a mi compa[nñ]er[oa] le gusta', label: 'a mi compañero le gusta' }];
      } }));
  };

  B.a7 = () => {
    const s = sec('a7', `${actHead(7, 'Practica con tu compañero siguiendo el modelo.')}
      ${modelo('A: ¿Qué te gusta hacer cuando hace viento?<br>B: Cuando hace viento, me gusta volar una cometa en la playa. ¿Y a ti?<br>A: Me gusta escuchar música.')}
      <div class="wx">${D.clima.map(c => `<div class="wxc"><span>${c.e}</span><b>${c.k}</b><small>${c.kr}</small></div>`).join('')}</div>
      <h3 class="h3">✍️ 질문 쓰기</h3><div class="items q7"></div>
      <h3 class="h3">✍️ 날씨별로 나의 대답 쓰기 — Cuando …, me gusta …</h3><div class="items a7"></div>`);
    put(s, '.q7', writeItem({ id: 'a7-q', sec: 'a7', skill: 'gus', prompt: '🌧️ 비가 올 때 뭐 하는 걸 좋아해?', ph: '¿Qué te gusta …?', answers: ['¿Qué te gusta hacer cuando llueve?'] }));
    D.clima.forEach((c, i) => put(s, '.a7', freeItem({ id: 'a7-' + i, sec: 'a7', line: true, prompt: `<span class="emo-sm">${c.e}</span> ¿Qué te gusta hacer cuando ${c.k}?`, ph: `Cuando ${c.k}, me gusta …`,
      must: [{ re: 'cuando ' + acc(c.k), label: `Cuando ${c.k}` }, { re: W0 + 'me (gusta|encanta)' + W1, label: 'me gusta / me encanta + 동사원형' }] })));
  };

  B.a8 = () => {
    const s = sec('a8', `${actHead(8, 'Escucha la encuesta que le están haciendo a una chica mexicana. ¿Qué le gusta? Selecciona a o b.', { listen: true, kr: '교재 음원 대신 — 나라면 a와 b 중 무엇이 더 좋은지 골라 비교 문장을 써요.' })}
      <div class="pairs"></div>
      <h2 class="act-title">Ahora te toca a ti, ¿qué te gusta más?</h2>
      ${modelo('A mí me gusta más ________ que ________.')}<div class="items w8"></div>`);
    const st = S.sel.a8 || (S.sel.a8 = {});
    const pr = $('.pairs', s);
    const paint = () => {
      pr.innerHTML = D.act8.map((p, i) => `<div class="pair"><b>${i + 1})</b>${['a', 'b'].map(k => `<button class="pc ${st[i] === k ? 'on' : ''}" data-i="${i}" data-k="${k}"><small>${k}.</small><span>${p[k].e}</span>${p[k].es}</button>`).join('')}</div>`).join('');
      $$('.pc', pr).forEach(b => b.onclick = () => { st[b.dataset.i] = b.dataset.k; save(); paint(); });
    };
    paint();
    D.act8.forEach((p, i) => put(s, '.w8', writeItem({ id: 'a8-' + i, sec: 'a8', skill: 'com', prompt: `${i + 1}) ${p.a.e} ${p.a.es} vs ${p.b.e} ${p.b.es}`, ph: 'A mí me gusta más …',
      answers: () => { const k = st[i]; if (!k) return null; const x = p[k].es, y = p[k === 'a' ? 'b' : 'a'].es; return withAmi([`Me gusta más ${x} que ${y}.`]); } })));
  };

  B.a9 = () => {
    const s = sec('a9', `${actHead(9, 'Habla de tus gustos con tu compañero siguiendo el modelo.')}
      <div class="ybox wordbank">단어 상자: <span>aficiones</span><span>a ti</span><span>nadar</span><span>algún</span><span>sábados</span><span>más</span><span>teatro</span></div>
      <div class="c9"></div>
      <h3 class="h3">✍️ 나의 대답</h3><div class="items f9"></div>`);
    put(s, '.c9', cloze({ id: 'a9c', sec: 'a9', skill: 'gus', cls: 'lines modelo-like', text:
      ['A: ¿Qué [aficiones] tienes?', 'B: Me gusta ir al [teatro]. Y [a ti], ¿qué te gusta hacer?', 'A: Me gusta [nadar] en la piscina. ¿Tú haces [algún] deporte?',
        'B: Sí, yo juego al tenis todos los [sábados] por la tarde con mi hermana.', 'A: Yo también juego al tenis, pero me gusta [más] la natación.'].map(x => `<p>${x}</p>`).join('') }));
    put(s, '.f9', freeItem({ id: 'a9-1', sec: 'a9', line: true, prompt: '¿Qué aficiones tienes?', ph: 'Me gusta …', must: [{ re: W0 + 'me (gusta|encanta)n?' + W1, label: 'Me gusta / Me encanta' }], minWords: 4 }));
    put(s, '.f9', freeItem({ id: 'a9-2', sec: 'a9', line: true, prompt: '¿Tú haces algún deporte? ¿Cuándo?', ph: 'Sí, juego al … los …', must: [{ re: W0 + '(juego|hago|practico|no hago|no practico|no juego|nado|corro|esqu[ií]o)' + W1, label: '1인칭 동사 (juego / hago / practico …)' }, { re: FREQ, label: '빈도 표현 (los sábados, a menudo …)' }] }));
  };

  B.a10 = () => {
    const s = sec('a10', `${actHead(10, 'Habla con tus compañeros.', { kr: '질문의 동사를 1인칭으로 바꿔 대답해요: practicas → practico, ves → veo, vas → voy' })}<div class="items"></div>`);
    [['¿Qué deporte te gusta más? ¿Por qué?', [{ re: W0 + 'me gustan? m[aá]s' + W1, label: 'Me gusta más …' }, { re: W0 + 'porque' + W1, label: 'porque' }]],
      ['¿Te gusta el fútbol? ¿El tenis? ¿El baloncesto?', [{ re: W0 + '(no )?me (gustan?|encantan?)' + W1, label: '(No) me gusta …' }, { re: '(f[uú]tbol|tenis|baloncesto)', label: '종목 이름' }]],
      ['¿Practicas algún deporte?', [{ re: W0 + '(practico|no practico|juego|no juego|hago|no hago)' + W1, label: 'practico / juego / hago' }]],
      ['¿Con qué frecuencia lo practicas?', [{ re: FREQ, label: '빈도 표현' }]],
      ['¿Ves partidos de fútbol en la televisión?', [{ re: W0 + '(veo|no veo|nunca veo)' + W1, label: 'veo / no veo' }]],
      ['¿Vas a ver partidos de béisbol?', [{ re: W0 + '(voy|no voy|nunca voy)' + W1, label: 'voy / no voy' }]]]
      .forEach(([q, m], i) => put(s, '.items', freeItem({ id: 'a10-' + i, sec: 'a10', skill: i === 3 ? 'fre' : 'lib', line: true, prompt: `${i + 1}) ${q} ${say(q)}`, must: m })));
  };

  B.a11 = () => {
    const s = sec('a11', `${actHead(11, '¿Qué prefieres? Explícale a tu compañero por qué.')}
      ${modelo('Prefiero la playa <b>porque</b> me gusta nadar y tomar el sol.')}<div class="p11"></div>
      <h3 class="h3">📊 나의 선택 그래프</h3><div class="poll"></div>`);
    const st = S.sel.a11 || (S.sel.a11 = {});
    const drawPoll = () => {
      $('.poll', s).innerHTML = D.act11.map((p, i) => { const k = st[i]; return `<div class="pl"><span>${p.tema}</span><div class="plb"><i class="${k === 'a' ? 'on' : ''}">${p.a.e} ${p.a.es}</i><i class="${k === 'b' ? 'on' : ''}">${p.b.e} ${p.b.es}</i></div></div>`; }).join('');
    };
    D.act11.forEach((p, i) => {
      const box = el(`<div class="pair11"><div class="ph">${i + 1}) ${p.tema}: ${p.a.es} / ${p.b.es}</div><div class="pr2">${['a', 'b'].map(k => `<button class="pc" data-k="${k}"><span>${p[k].e}</span>${p[k].es}</button>`).join('')}</div></div>`);
      const tg = () => $$('.pc', box).forEach(b => b.classList.toggle('on', st[i] === b.dataset.k));
      $$('.pc', box).forEach(b => b.onclick = () => { st[i] = b.dataset.k; save(); tg(); drawPoll(); });
      tg();
      box.appendChild(freeItem({ id: 'a11-' + i, sec: 'a11', skill: 'pre', line: true, ph: 'Prefiero … porque …',
        must: () => st[i] ? [{ re: W0 + 'prefiero' + W1, label: 'Prefiero' }, { re: acc(p[st[i]].es.replace(/^(el|la) /, '')), label: `내가 고른 것: ${p[st[i]].es}` }, { re: W0 + 'porque' + W1, label: 'porque + 이유' }] : null }));
      put(s, '.p11', box);
    });
    drawPoll();
  };

  B.util = () => {
    const kr = ['뭐 하는 걸 좋아해?', '책 읽는 건 좋아하지만 영화관은 안 좋아해.', '나는 디스코텍과 오토바이를 좋아해.', '그림 그리는 걸 아주 좋아해.', '춤추고 노래하는 걸 정말 좋아해.',
      '눈 속에서 노는 걸 좋아해.', '나도. / 나는 아니야.', '축구도 테니스도 안 좋아해.', '나도 안 좋아해. / 나는 좋아해.', '기타 치는 걸 누가 좋아해?', '올가는 기타 치는 걸 좋아해.'];
    const s = sec('util', `<div class="note"><span class="clip">📎</span><span class="note-t">Expresiones útiles</span>
        <ul class="ul">${D.utiles.map((u, i) => `<li>${say(u)} <b>${u}</b><small>${kr[i]}</small></li>`).join('')}</ul></div>
      <h3 class="h3">✍️ 단어를 순서대로 배열하세요</h3><div class="items scr-wrap"></div>
      <div class="prov"><span class="prov-t">💬 Proverbio</span><p>¿Hay algún proverbio semejante en tu lengua?</p><p class="pv">Quien busca, halla. ${say('Quien busca, halla.')}</p><span class="det">🕵️</span></div>
      <div class="items pq"></div>`);
    ['Me gusta leer, pero no me gusta el cine.', 'Me gustan las discotecas y las motos.', '¿Qué te gusta hacer?', 'No me gusta el fútbol ni el tenis.', '¿A quién le gusta tocar la guitarra?', 'A Olga le gusta tocar la guitarra.']
      .forEach((t, i) => put(s, '.scr-wrap', scramble({ id: 'ut-s' + i, sec: 'util', skill: i === 3 ? 'gus' : 'pro', target: t })));
    put(s, '.pq', choiceItem({ id: 'ut-p', sec: 'util', skill: 'voc', prompt: '"Quien busca, halla."와 뜻이 가장 비슷한 우리말은?', answer: '구하라, 그러면 찾을 것이다',
      options: ['티끌 모아 태산', '구하라, 그러면 찾을 것이다', '원숭이도 나무에서 떨어진다', '가는 말이 고와야 오는 말이 곱다'] }));
  };

  /* ---------- 쓰기 모의시험 ---------- */
  const RUB = [
    { k: 'ext', label: '분량 (60단어 이상)', max: 10, ax: 'Extensión' },
    { k: 'mus', label: '음악 취향 (tipo de música)', max: 8, re: 'm[uú]sica|pop|rock|jazz|reguet[oó]n|k-?pop|salsa|tango|flamenco|hip ?hop|cantante|artista|grupo', ax: 'Contenido' },
    { k: 'ins', label: '악기 (instrumento)', max: 8, re: 'guitarra|piano|viol[ií]n|flauta|violonc?h?elo|trompeta|bater[ií]a|ukelele|instrumento', ax: 'Contenido' },
    { k: 'pel', label: '영화 장르 (películas)', max: 8, re: 'pel[ií]culas?|cine', ax: 'Contenido' },
    { k: 'gus', label: 'gustar (gusta / gustan)', max: 8, re: W0 + '(me|te|le|nos|os|les) gustan?' + W1, ax: 'Gramática' },
    { k: 'enc', label: 'encantar', max: 6, re: W0 + '(me|te|le|nos|os|les) encantan?' + W1, ax: 'Gramática' },
    { k: 'pre', label: 'preferir', max: 8, re: W0 + '(prefiero|prefieres|prefiere|preferimos|prefer[ií]s|prefieren)' + W1, ax: 'Gramática' },
    { k: 'com', label: '비교 más / menos … que', max: 8, re: W0 + '(m[aá]s|menos)' + W1 + '[^.?!]*' + W0 + 'que' + W1, ax: 'Gramática' },
    { k: 'acu', label: 'también / tampoco / ni', max: 6, re: W0 + '(tambi[eé]n|tampoco|ni)' + W1, ax: 'Gramática' },
    { k: 'con', label: '연결어 3종 이상 (pero, porque, sobre todo, especialmente, y/e…)', max: 10, ax: 'Cohesión' },
    { k: 'pre2', label: '정확성 (오류 1개당 −3)', max: 20, ax: 'Precisión' }
  ];
  function rubric(text) {
    const low = text.toLowerCase();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const errs = findErrors(text);
    const checks = [];
    const out = RUB.map(r => {
      let pts = 0, spans = [];
      if (r.k === 'ext') pts = words >= 60 ? 10 : words >= 40 ? 6 : words >= 20 ? 3 : 0;
      else if (r.k === 'con') {
        const C = ['pero', 'porque', 'sobre todo', 'especialmente', 'y', 'e', 'también', 'además', 'cuando'];
        const found = C.filter(c => new RegExp(W0 + acc(c) + W1, 'iu').test(low));
        pts = found.length >= 3 ? 10 : found.length * 3;
        [...low.matchAll(new RegExp(W0 + '(pero|porque|sobre todo|especialmente|adem[aá]s)' + W1, 'giu'))].forEach(m => spans.push([m.index, m.index + m[0].length]));
      } else if (r.k === 'pre2') pts = words ? Math.max(0, 20 - 3 * errs.length) : 0;
      else { const ms = [...low.matchAll(new RegExp(W0 + '(' + r.re + ')' + W1, 'giu'))]; pts = ms.length ? r.max : 0; spans = ms.map(m => [m.index, m.index + m[0].length]); }
      checks.push({ spans });
      return { ...r, pts };
    });
    const total = out.reduce((a, r) => a + r.pts, 0);
    const axes = {}; out.forEach(r => { axes[r.ax] = axes[r.ax] || [0, 0]; axes[r.ax][0] += r.pts; axes[r.ax][1] += r.max; });
    return { out, total, words, errs, axes, html: annotate(text, checks, errs) };
  }
  const GRADE = p => p >= 90 ? ['Sobresaliente', '최우수', 'g5'] : p >= 75 ? ['Notable', '우수', 'g4'] : p >= 60 ? ['Bien', '양호', 'g3'] : p >= 50 ? ['Suficiente', '보통', 'g2'] : ['¡Ánimo!', '노력 요함', 'g1'];

  function radar(labels, vals, size = 300) {
    const n = labels.length, c = size / 2, r = size / 2 - 58;
    const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v]; };
    let g = '';
    [0.25, 0.5, 0.75, 1].forEach(k => { g += `<polygon class="rg" points="${labels.map((_, i) => pt(i, k).join(',')).join(' ')}"/>`; });
    labels.forEach((l, i) => { const [x, y] = pt(i, 1); g += `<line class="rg" x1="${c}" y1="${c}" x2="${x}" y2="${y}"/>`; const [tx, ty] = pt(i, 1.2); g += `<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle">${esc(l)}</text>`; });
    g += `<polygon class="rv" points="${vals.map((v, i) => pt(i, Math.max(0.02, v)).join(',')).join(' ')}"/>`;
    vals.forEach((v, i) => { const [x, y] = pt(i, Math.max(0.02, v)); g += `<circle class="rd" cx="${x}" cy="${y}" r="4"/>`; });
    return `<svg class="radar" viewBox="0 0 ${size} ${size}" role="img">${g}</svg>`;
  }

  B.examen = () => {
    const s = sec('examen', `<div class="ribbon-head"><span class="ribbon orange">🎯 ¡Compruébalo!</span><span class="act-bar"></span></div>
      <div class="exam-top card"><div><h2 class="act-title">쓰기 모의시험 · Examen de escritura</h2>
        <p>Parte A 문법 쓰기 <b>10문항 (40점)</b> + Parte B 작문 <b>(60점)</b> = 100점. 제출 후 채점표와 첨삭이 나옵니다.</p></div>
        <div class="timer"><span id="tm">20:00</span><button class="btn ghost sm" id="tmb">⏱ 타이머 시작</button></div></div>
      <div class="card"><h3>Parte A · 빈칸에 알맞은 말을 쓰세요 <button class="btn ghost sm" id="newA">🔀 새 문제</button></h3><ol class="exa"></ol></div>
      <div class="card"><h3>Parte B · Charla con tus compañeros → 글로 쓰기</h3>
        <div class="bubbles"><span>🎻</span><span>🎸</span><span>🎬</span></div>
        <ol class="qs" type="a"><li>¿Qué tipo de música prefieres? ¿Cuáles son tus artistas favoritos? ¿Prefieres escuchar la música clásica o la música pop?</li>
          <li>¿Qué tipo de instrumento sabes tocar? (guitarra, piano, violín, flauta, violonchelo, trompeta)</li>
          <li>¿Qué tipo de películas te gusta? (románticas, cómicas, musicales, de acción, de misterio, de terror)</li></ol>
        <p class="small">위 세 질문에 모두 답하는 글을 <b>60~100단어</b>로 쓰세요. gustar · encantar · preferir · 비교 · también/tampoco 를 활용하면 높은 점수!</p>
        <textarea id="essay" class="ta" rows="9" spellcheck="false" placeholder="Me encanta la música pop, sobre todo …"></textarea>
        <div class="item-row"><span class="wc" id="ewc">0 palabras</span><button class="btn big" id="submit">📝 제출하고 채점받기</button></div></div>
      <div id="report"></div>`);
    if (!S.examA) S.examA = shuffle(D.examBank.map((_, i) => i)).slice(0, 10);
    const drawA = () => { $('.exa', s).innerHTML = S.examA.map(k => `<li><span class="ep">${D.examBank[k].p}</span><input class="inp ea" data-k="${k}" autocomplete="off" spellcheck="false"><span class="mkbox"></span></li>`).join(''); };
    drawA();
    $('#newA', s).onclick = () => { S.examA = shuffle(D.examBank.map((_, i) => i)).slice(0, 10); save(); drawA(); };
    const es = $('#essay', s); es.value = S.essay || '';
    const wc = () => { $('#ewc', s).textContent = (es.value.trim() ? es.value.trim().split(/\s+/).length : 0) + ' palabras'; };
    es.oninput = () => { S.essay = es.value; save(); wc(); }; wc();
    let tmr = null, left = 1200;
    $('#tmb', s).onclick = e => {
      if (tmr) { clearInterval(tmr); tmr = null; e.target.textContent = '⏱ 다시 시작'; return; }
      e.target.textContent = '⏸ 일시정지';
      tmr = setInterval(() => { left--; $('#tm', s).textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`; if (left <= 0) { clearInterval(tmr); tmr = null; $('#tm', s).textContent = '¡Tiempo!'; $('#tm', s).classList.add('over'); } }, 1000);
    };
    $('#submit', s).onclick = () => {
      let aPts = 0; const aRows = [];
      $$('.ea', s).forEach(inp => {
        const q = D.examBank[+inp.dataset.k];
        const r = grade(inp.value || ' ', q.a);
        const sc = r.empty ? 0 : r.score;
        aPts += sc;
        inp.nextElementSibling.innerHTML = MARK(sc) + (sc < 1 ? ` <span class="ans">${tl(q.a[0])}</span>` : '');
        inp.classList.remove('ok', 'half', 'no'); inp.classList.add(sc >= 1 ? 'ok' : sc > 0 ? 'half' : 'no');
        (r.errs || []).forEach(e => { S.errors[e] = (S.errors[e] || 0) + 1; });
        aRows.push(sc);
      });
      const A = Math.round(aPts / 10 * 40 * 10) / 10;
      const rb = rubric(es.value);
      const Bp = Math.round(rb.total * 0.6 * 10) / 10;
      const tot = Math.round(A + Bp);
      const [g, gk, gc] = GRADE(tot);
      rb.errs.forEach(x => { S.errors[x.t] = (S.errors[x.t] || 0) + 1; });
      S.exams.push({ d: new Date().toISOString().slice(0, 16).replace('T', ' '), A, B: Bp, t: tot });
      if (S.exams.length > 8) S.exams.shift();
      save();
      const axN = Object.keys(rb.axes);
      $('#report', s).innerHTML = `<div class="report card">
        <div class="rp-head"><div><h2>📋 Resultado del examen</h2><p>${esc(S.name || '이름 없음')} · ${new Date().toLocaleString('ko-KR')}</p></div>
          <div class="stamp ${gc}"><b>${tot}</b><small>/100</small><span>${g}</span><em>${gk}</em></div></div>
        <div class="grid2">
          <div><h3>점수 구성</h3>
            <div class="sbar"><span>Parte A 문법</span><div class="bar"><i style="width:${A / 40 * 100}%"></i></div><b>${A} / 40</b></div>
            <div class="sbar"><span>Parte B 작문</span><div class="bar"><i style="width:${Bp / 60 * 100}%"></i></div><b>${Bp} / 60</b></div>
            <h3>작문 채점표 (Rúbrica)</h3>
            <table class="rub">${rb.out.map(r => `<tr class="${r.pts >= r.max ? 'y' : r.pts > 0 ? 'h' : 'n'}"><td>${r.pts >= r.max ? '✔' : r.pts > 0 ? '△' : '✘'}</td><td>${r.label}</td><td>${r.pts} / ${r.max}</td></tr>`).join('')}</table></div>
          <div class="center"><h3>작문 영역 레이더</h3>${radar(axN, axN.map(k => rb.axes[k][0] / rb.axes[k][1]))}
            <p class="small">${rb.words} palabras · 오류 ${rb.errs.length}개</p></div></div>
        <h3>✍️ 빨간 펜 첨삭</h3>${es.value.trim() ? rb.html : '<p class="warn">작문을 쓰지 않았어요.</p>'}
        <div class="item-row"><button class="btn" onclick="window.print()">🖨 결과지 인쇄 / PDF</button><a class="btn ghost" href="#/resultados">📊 전체 성적표 보기</a></div></div>`;
      $('#report', s).scrollIntoView({ behavior: 'smooth' });
    };
  };

  /* ---------- 성적표 ---------- */
  const secItems = id => Object.keys(REG).filter(k => REG[k].sec === id);
  const secCount = id => secItems(id).length;
  const secPct = id => { const it = secItems(id); if (!it.length) return 0; return it.reduce((a, k) => a + (S.items[k] ? S.items[k].last : 0), 0) / it.length; };
  const secDone = id => { const it = secItems(id); return it.length ? it.filter(k => S.items[k]).length / it.length : 0; };
  function renderResults() {
    const skills = Object.keys(D.skills);
    const sv = skills.map(k => { const it = Object.keys(REG).filter(x => REG[x].skill === k); return it.length ? it.reduce((a, x) => a + (S.items[x] ? S.items[x].last : 0), 0) / it.length : 0; });
    const all = Object.keys(REG), tot = all.reduce((a, k) => a + (S.items[k] ? S.items[k].last : 0), 0) / all.length;
    const done = all.filter(k => S.items[k]).length;
    const pct = Math.round(tot * 100);
    const [g, gk, gc] = GRADE(pct);
    const errMax = Math.max(1, ...Object.values(S.errors));
    const errs = Object.keys(ERR_LABEL).filter(k => S.errors[k]).sort((a, b) => S.errors[b] - S.errors[a]);
    sec('resultados', `<div class="ribbon-head"><span class="ribbon red">📊 Resultados</span><span class="act-bar"></span></div>
      <div class="report card"><div class="rp-head"><div><h2>Lección 09 성적표</h2><p>${esc(S.name || '이름 없음')} · 푼 문항 ${done} / ${all.length}</p></div>
        <div class="stamp ${gc}"><b>${pct}</b><small>%</small><span>${g}</span><em>${gk}</em></div></div>
      <div class="grid2"><div><h3>섹션별 점수</h3>${D.sections.filter(x => secCount(x.id)).map(x => { const p = Math.round(secPct(x.id) * 100), d = Math.round(secDone(x.id) * 100); return `<a class="sbar" href="#/${x.id}"><span>${x.label}</span><div class="bar"><i style="width:${p}%"></i><u style="width:${d}%"></u></div><b>${p}%</b></a>`; }).join('')}
        <p class="small">진한 막대 = 점수, 옅은 막대 = 푼 비율</p></div>
        <div class="center"><h3>영역별 실력 레이더</h3>${radar(skills.map(k => D.skills[k].split(' ')[0]), sv, 320)}
        <div class="sk">${skills.map((k, i) => `<span>${D.skills[k]} <b>${Math.round(sv[i] * 100)}%</b></span>`).join('')}</div></div></div>
      <h3>🔍 자주 하는 실수 (오답 유형)</h3>${errs.length ? errs.map(k => `<div class="ebar"><span class="etag e-${k}">${ERR_LABEL[k]}</span><div class="bar r"><i style="width:${S.errors[k] / errMax * 100}%"></i></div><b>${S.errors[k]}회</b><p>${ERR_TIP[k]}</p></div>`).join('') : '<p class="small">아직 기록된 실수가 없어요.</p>'}
      <h3>📝 모의시험 기록</h3>${S.exams.length ? `<div class="hist">${S.exams.map(e => `<div class="hc"><div class="hb" style="height:${e.t}%"><b>${e.t}</b></div><small>${e.d.slice(5)}</small></div>`).join('')}</div>` : '<p class="small">¡Compruébalo! 에서 모의시험을 치러 보세요.</p>'}
      <div class="item-row"><button class="btn" onclick="window.print()">🖨 성적표 인쇄 / PDF</button><button class="btn ghost" id="reset">기록 초기화</button></div></div>`);
    $('#reset').onclick = () => { if (confirm('모든 학습 기록을 지울까요?')) { try { localStorage.removeItem(KEY); } catch (e) { } location.hash = '#/inicio'; location.reload(); } };
  }

  /* ---------- 네비게이션 · 진도 ---------- */
  function ring(p) {
    const r = 52, c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 130 130" class="ring"><circle cx="65" cy="65" r="${r}" class="rb"/><circle cx="65" cy="65" r="${r}" class="rf" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/><text x="65" y="70" text-anchor="middle">${Math.round(p * 100)}%</text></svg>`;
  }
  function updateProgress() {
    const all = Object.keys(REG); if (!all.length) return;
    const done = all.filter(k => S.items[k]).length / all.length;
    const bar = $('#topbar i'); if (bar) bar.style.width = (done * 100) + '%';
    const lb = $('#toplbl'); if (lb) lb.textContent = `진도 ${Math.round(done * 100)}%`;
    const rg = $('#ring'); if (rg) rg.innerHTML = ring(done);
    $$('#nav a[data-id]').forEach(a => { const id = a.dataset.id, n = secCount(id); const d = $('.dot', a); if (!d) return; const p = n ? secDone(id) : 0; d.className = 'dot ' + (n === 0 ? '' : p >= 1 ? 'full' : p > 0 ? 'part' : ''); });
  }
  function buildNav() {
    const nav = $('#nav'); let grp = null, html = '';
    D.sections.forEach(x => {
      if (x.group !== grp) { grp = x.group; if (grp) html += `<div class="ng">${grp}</div>`; }
      const badge = x.kind === 'act' ? `<span class="nb">${x.n}</span>` : x.kind === 'dialogo' ? '<span class="nb d">D</span>' : '';
      html += `<a href="#/${x.id}" data-id="${x.id}">${badge}<span class="nl"><b>${x.label}</b><small>${x.kr}</small></span><span class="dot"></span></a>`;
    });
    nav.innerHTML = html;
  }
  function go(id) { location.hash = '#/' + id; }
  function route() {
    const id = (location.hash.match(/^#\/(\w+)/) || [])[1] || 'inicio';
    const x = D.sections.find(z => z.id === id) || D.sections[0];
    $$('main > section').forEach(s => s.hidden = s.id !== 'sec-' + x.id);
    $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.id === x.id));
    if (x.id === 'resultados') renderResults();
    const i = D.sections.indexOf(x), pv = D.sections[i - 1], nx = D.sections[i + 1];
    $('#pager').innerHTML = `${pv ? `<a class="btn ghost" href="#/${pv.id}">← ${pv.label}</a>` : '<span></span>'}${nx ? `<a class="btn" href="#/${nx.id}">${nx.label} →</a>` : ''}`;
    document.body.classList.remove('navopen');
    window.scrollTo(0, 0);
    updateProgress();
  }

  /* ---------- 특수문자 입력 버튼 ---------- */
  function buildKeys() {
    const LOW = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'];
    const bar = el(`<div id="keys" class="keys" aria-label="특수문자 입력" hidden>
      <span class="keys-l">특수문자</span>
      <div class="keys-row">${LOW.map(c => `<button type="button" class="key" data-c="${c}">${c}</button>`).join('')}
      <button type="button" class="key shift" title="대문자 전환 (Á É Í Ó Ú Ñ)">⇧</button></div>
      <span class="keys-h">악센트 문자를 눌러 넣으세요</span></div>`);
    document.body.appendChild(bar);
    let target = null, upper = false, hideT = null;
    const isField = n => n && n.matches && n.matches('main input[type="text"], main input:not([type]), main textarea');
    const paintKeys = () => { $$('.key[data-c]', bar).forEach(b => { const c = b.dataset.c; b.textContent = upper ? c.toUpperCase() : c; }); $('.shift', bar).classList.toggle('on', upper); };
    const place = () => {
      const vv = window.visualViewport;
      bar.style.bottom = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + 'px' : '0px';
    };
    const show = f => {
      clearTimeout(hideT); target = f; bar.hidden = false; document.body.classList.add('keys-on'); place();
      requestAnimationFrame(() => { const r = f.getBoundingClientRect(), top = bar.getBoundingClientRect().top; if (r.bottom > top - 8) window.scrollBy({ top: r.bottom - top + 24, behavior: 'smooth' }); });
    };
    document.addEventListener('focusin', e => { if (isField(e.target)) show(e.target); });
    document.addEventListener('focusout', e => { if (isField(e.target)) hideT = setTimeout(() => { if (!isField(document.activeElement)) { bar.hidden = true; document.body.classList.remove('keys-on'); } }, 150); });
    /* 커서 위치 기억 (포커스가 잠깐 빠져도 같은 자리에 넣기 위해) */
    let caret = { s: null, e: null };
    const remember = ev => { const t = ev.target; if (isField(t) && t === target) { caret = { s: t.selectionStart, e: t.selectionEnd }; } };
    ['keyup', 'mouseup', 'input', 'select', 'touchend'].forEach(k => document.addEventListener(k, remember, true));
    document.addEventListener('focusin', e => { if (isField(e.target)) caret = { s: e.target.selectionStart, e: e.target.selectionEnd }; });
    function insert(ch) {
      const t = target; if (!t || !document.body.contains(t)) return;
      const v = t.value;
      let s = t.selectionStart, en = t.selectionEnd;
      if (document.activeElement !== t || s == null) { s = caret.s ?? v.length; en = caret.e ?? s; }
      t.value = v.slice(0, s) + ch + v.slice(en);
      const p = s + ch.length;
      try { t.focus({ preventScroll: true }); } catch (_) { t.focus(); }
      try { t.setSelectionRange(p, p); } catch (_) { }
      caret = { s: p, e: p };
      t.dispatchEvent(new Event('input', { bubbles: true }));
    }
    function press(e, b) {
      if (b.classList.contains('shift')) { upper = !upper; paintKeys(); return; }
      insert((upper || e.shiftKey) ? b.dataset.c.toUpperCase() : b.dataset.c);
      if (upper) { upper = false; paintKeys(); }   // 대문자는 한 글자만
      b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 120);
    }
    /* 누르는 순간 바로 입력 + 기본동작 차단 → 입력칸 포커스·키보드가 유지됨 (iPad·휴대폰 포함) */
    let lastTouch = 0;
    bar.addEventListener('touchstart', e => { const b = e.target.closest('.key'); e.preventDefault(); lastTouch = Date.now(); if (b) press(e, b); }, { passive: false });
    bar.addEventListener('mousedown', e => { e.preventDefault(); if (Date.now() - lastTouch < 800 || e.button !== 0) return; const b = e.target.closest('.key'); if (b) press(e, b); });
    bar.addEventListener('click', e => { if (e.detail !== 0) return; const b = e.target.closest('.key'); if (b) press(e, b); });   // 키보드(Tab+Enter)로 누른 경우
    if (window.visualViewport) { visualViewport.addEventListener('resize', place); visualViewport.addEventListener('scroll', place); }
  }

  function init() {
    buildNav();
    buildKeys();
    const main = $('main');
    D.sections.forEach(x => { const s = document.createElement('section'); s.id = 'sec-' + x.id; s.hidden = true; main.insertBefore(s, $('#pager')); });
    D.sections.forEach(x => { if (B[x.id]) B[x.id](); });
    window.addEventListener('hashchange', route);
    $('#menu').onclick = () => document.body.classList.toggle('navopen');
    $('#sndBtn').onclick = openCheck;
    route();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
