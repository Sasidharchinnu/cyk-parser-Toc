/* ==========================================================
   CYK Parser Lab — script.js  (clean rewrite)
   Theory of Computation · Unit 3 · CFG/CFL
   ========================================================== */

'use strict';

/* ── GLOBAL STATE ──────────────────────────────────────────── */
var G = null;          // grammar object
var CYK_TABLE   = [];  // table[len-1][col] = Set of non-terminals
var CYK_STEPS   = [];  // animation steps
var STEP_IDX    = 0;
var CUR_STRING  = '';
var ACTIVE_PRESET = null;

/* ── PRESET GRAMMARS ───────────────────────────────────────── */
var PRESETS = [
  {
    id: 'classic',
    name: 'Classic CYK Example',
    tag: 'textbook',
    desc: 'Hopcroft & Ullman textbook grammar — try "baaba"',
    start: 'S',
    prods: ['S → A B','S → B C','A → B A','A → a','B → C C','B → b','C → A B','C → a'],
    samples: ['a','b','ba','baaba','aab','baa','ab']
  },
  {
    id: 'anbn',
    name: 'aⁿbⁿ  (n ≥ 1)',
    tag: 'canonical',
    desc: 'Classic non-regular context-free language',
    start: 'S',
    prods: ['S → A B','S → A X','X → S B','A → a','B → b'],
    samples: ['ab','aabb','aaabbb','a','b','aab','abb']
  },
  {
    id: 'palindrome',
    name: 'Even Palindromes',
    tag: 'palindrome',
    desc: 'L = { wwᴿ | w ∈ {a,b}* }',
    start: 'S',
    prods: ['S → A A','S → B B','S → A X','S → B Y','X → S A','Y → S B','A → a','B → b'],
    samples: ['aa','bb','abba','baab','abab','aabbaa']
  },
  {
    id: 'balanced',
    name: 'Equal a\'s and b\'s',
    tag: 'counting',
    desc: 'Strings where #a = #b',
    start: 'S',
    prods: ['S → A B','S → B A','S → A C','S → B D','A → a','B → b','C → S B','D → S A'],
    samples: ['ab','ba','aabb','abab','baba','a','b']
  },
  {
    id: 'abc',
    name: 'Multi-alphabet {a,b,c}',
    tag: 'multi',
    desc: 'Grammar over three terminals',
    start: 'S',
    prods: ['S → A B','S → B C','A → A B','A → a','B → B C','B → b','C → c'],
    samples: ['ab','bc','abc','aab','abb','a','b','c']
  }
];

/* ── QUESTION BANK ─────────────────────────────────────────── */
var QUESTIONS = [
  {id:'q01', num:'Q 01', presetId:'classic',   str:'baaba',  accept:true,
   title:'Does "baaba" belong to the grammar?',
   question:'Given the classic Hopcroft &amp; Ullman CNF grammar G, determine whether <strong>"baaba"</strong> is in L(G). This is the canonical CYK textbook example.',
   hint:'T[5][1] must contain S. Fill diagonals (terminals) first, then combine upward.',
   unit:'Unit 3 · CFG Membership'},
  {id:'q02', num:'Q 02', presetId:'anbn',      str:'aabb',   accept:true,
   title:'Is "aabb" in the aⁿbⁿ language?',
   question:'The grammar generates L = {aⁿbⁿ | n ≥ 1}. Is <strong>"aabb"</strong> (n=2) accepted? This language is non-regular — cannot be recognized by any DFA.',
   hint:'Equal a\'s then b\'s. Expect S in T[4][1].',
   unit:'Unit 3 · Non-Regular CFL'},
  {id:'q03', num:'Q 03', presetId:'anbn',      str:'aab',    accept:false,
   title:'Is "aab" rejected by the aⁿbⁿ grammar?',
   question:'Test a boundary case: <strong>"aab"</strong> has 2 a\'s but only 1 b. Should the aⁿbⁿ grammar reject it?',
   hint:'Unequal counts → S should NOT appear in T[3][1].',
   unit:'Unit 3 · Rejection Case'},
  {id:'q04', num:'Q 04', presetId:'anbn',      str:'aaabbb', accept:true,
   title:'Is "aaabbb" in aⁿbⁿ? (n = 3)',
   question:'Extend to n=3. Does <strong>"aaabbb"</strong> get accepted? The CYK table is 6×6 — observe the fill pattern carefully.',
   hint:'Three a\'s followed by three b\'s. 6×6 DP table.',
   unit:'Unit 3 · Longer String'},
  {id:'q05', num:'Q 05', presetId:'palindrome', str:'abba',  accept:true,
   title:'Is "abba" a valid even palindrome?',
   question:'The palindrome grammar generates {wwᴿ}. Is <strong>"abba"</strong> accepted? (= "ab" + reverse of "ab")',
   hint:'"ab" reversed is "ba" so "abba" = "ab"+"ba" = wwᴿ. Should accept.',
   unit:'Unit 3 · Palindrome CFL'},
  {id:'q06', num:'Q 06', presetId:'palindrome', str:'abab',  accept:false,
   title:'Is "abab" a palindrome? (Tricky!)',
   question:'Is <strong>"abab"</strong> of the form wwᴿ? The second half must be the exact reverse of the first half.',
   hint:'"abab" reversed is "baba" ≠ "abab". NOT of the form wwᴿ. Should reject.',
   unit:'Unit 3 · Rejection Case'},
  {id:'q07', num:'Q 07', presetId:'balanced',  str:'ab',    accept:true,
   title:'Does "ab" have equal a\'s and b\'s?',
   question:'The balanced grammar accepts strings where #a = #b. Does <strong>"ab"</strong> (1 a, 1 b) qualify?',
   hint:'One a and one b — equal counts. Expect acceptance.',
   unit:'Unit 3 · Counting Grammar'},
  {id:'q08', num:'Q 08', presetId:'balanced',  str:'aabb',  accept:true,
   title:'Is "aabb" in the equal-count grammar?',
   question:'Does <strong>"aabb"</strong> satisfy #a = #b? (2 a\'s, 2 b\'s). Note: structure matters, not just count.',
   hint:'Two a\'s and two b\'s. Check if S appears in T[4][1].',
   unit:'Unit 3 · Counting Grammar'},
  {id:'q09', num:'Q 09', presetId:'classic',   str:'ba',    accept:false,
   title:'Is "ba" in the classic grammar?',
   question:'Back to the Hopcroft grammar. Is <strong>"ba"</strong> (length 2) in L(G)? A single CYK step checks T[2][1].',
   hint:'Check T[2][1] — does it contain S? Look at the binary rules for B and A.',
   unit:'Unit 3 · Short String Test'},
  {id:'q10', num:'Q 10', presetId:'palindrome', str:'aabbaa', accept:true,
   title:'Is "aabbaa" a valid even palindrome?',
   question:'Test a length-6 palindrome: <strong>"aabbaa"</strong>. Is it of the form wwᴿ where w = "aab"?',
   hint:'"aab" reversed is "baa" so "aab"+"baa" = "aabbaa" = wwᴿ. Should accept.',
   unit:'Unit 3 · Longer Palindrome'}
];

/* ── GRAMMAR PARSER ────────────────────────────────────────── */
function parseGrammar(startSym, lines) {
  var binRules = [];
  var termRules = [];
  var NTs = new Set();
  var Ts  = new Set();

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var m = line.match(/^([A-Za-z0-9'_]+)\s*(?:→|->)\s*(.+)$/);
    if (!m) throw new Error('Invalid production: "' + line + '"');
    var lhs = m[1].trim();
    var rhs = m[2].trim();
    NTs.add(lhs);
    var parts = rhs.split(/\s+/);

    if (parts.length === 2) {
      // Spaced binary: S → A B
      binRules.push({ lhs: lhs, b: parts[0], c: parts[1] });
      NTs.add(parts[0]);
      NTs.add(parts[1]);
    } else if (parts.length === 1 && parts[0].length === 1) {
      // Single terminal: A → a
      termRules.push({ lhs: lhs, t: parts[0] });
      Ts.add(parts[0]);
    } else if (parts.length === 1 && parts[0].length === 2) {
      // Unspaced binary with single-char non-terminals: S → AA or S → AB
      var b0 = parts[0][0], b1 = parts[0][1];
      binRules.push({ lhs: lhs, b: b0, c: b1 });
      NTs.add(b0);
      NTs.add(b1);
    } else if (parts.length === 1 && parts[0].length > 2) {
      // Unspaced binary with multi-char non-terminals e.g. S → SA — split in half
      // Try to interpret as two equal-length or named non-terminals
      // Fallback: split at midpoint
      var half = Math.floor(parts[0].length / 2);
      var b0 = parts[0].substring(0, half), b1 = parts[0].substring(half);
      binRules.push({ lhs: lhs, b: b0, c: b1 });
      NTs.add(b0);
      NTs.add(b1);
    } else {
      throw new Error('Not CNF: "' + line + '" — use A → BC or A → a');
    }

  }

  return {
    start: startSym,
    NTs: Array.from(NTs).sort(),
    Ts: Array.from(Ts).sort(),
    bin: binRules,
    term: termRules
  };
}

/* ── CYK CORE + STEP RECORDING ────────────────────────────── */
function runCYKCore(grammar, str) {
  var n = str.length;
  var steps = [];
  // table[l][i] where l = length-1 (0 = len1), i = start col
  var table = [];
  for (var l = 0; l < n; l++) {
    table.push([]);
    for (var i = 0; i < n; i++) {
      table[l].push(new Set());
    }
  }

  steps.push({ type:'init', msg:'Starting CYK on "' + str + '" (n=' + n + ')', cls:'', active:null, table: copyTable(table) });

  // Phase 1: terminals
  steps.push({ type:'phase', msg:'Phase 1 — fill diagonal with terminal productions', cls:'', active:null, table: copyTable(table) });
  for (var i = 0; i < n; i++) {
    var ch = str[i];
    var found = [];
    for (var r = 0; r < grammar.term.length; r++) {
      if (grammar.term[r].t === ch) {
        table[0][i].add(grammar.term[r].lhs);
        found.push(grammar.term[r].lhs);
      }
    }
    steps.push({
      type: 'term',
      msg: 'T[1][' + (i+1) + ']: char \'' + ch + '\' → {' + (found.join(',') || '∅') + '}',
      cls: found.length ? 'lv-found' : '',
      active: { l:0, i:i },
      table: copyTable(table)
    });
  }

  // Phase 2: binary rules
  steps.push({ type:'phase', msg:'Phase 2 — fill upper triangle with binary rules', cls:'', active:null, table: copyTable(table) });
  for (var len = 2; len <= n; len++) {
    for (var i = 0; i <= n - len; i++) {
      var added = [];
      for (var k = 1; k < len; k++) {
        var left  = table[k-1][i];
        var right = table[len-k-1][i+k];
        for (var r = 0; r < grammar.bin.length; r++) {
          var rule = grammar.bin[r];
          if (left.has(rule.b) && right.has(rule.c) && !table[len-1][i].has(rule.lhs)) {
            table[len-1][i].add(rule.lhs);
            added.push(rule.lhs + '→' + rule.b + rule.c + '(k=' + k + ')');
          }
        }
      }
      var cur = Array.from(table[len-1][i]);
      steps.push({
        type: 'bin',
        msg: 'T[' + len + '][' + (i+1) + ']: {' + (cur.join(',') || '∅') + '}' + (added.length ? ' ← ' + added.join(', ') : ''),
        cls: added.length ? 'lv-found' : '',
        active: { l:len-1, i:i },
        table: copyTable(table)
      });
    }
  }

  var accepted = table[n-1][0].has(grammar.start);
  steps.push({
    type: 'done',
    msg: 'Done! T[' + n + '][1] = {' + Array.from(table[n-1][0]).join(',') + '} → ' + (accepted ? '✓ ACCEPTED' : '✗ REJECTED'),
    cls: accepted ? 'lv-done' : 'lv-reject',
    active: { l:n-1, i:0 },
    table: copyTable(table),
    accepted: accepted
  });

  return { table:table, steps:steps, accepted:accepted };
}

function copyTable(t) {
  return t.map(function(row){ return row.map(function(cell){ return new Set(cell); }); });
}

/* ── APPLY GRAMMAR ─────────────────────────────────────────── */
function applyGrammar() {
  var startSym = (document.getElementById('inp-start').value || 'S').trim();
  var raw = document.getElementById('inp-prods').value;
  var lines = raw.split('\n');
  try {
    G = parseGrammar(startSym, lines);
  } catch(e) {
    alert('Error: ' + e.message);
    return;
  }
  renderGrammarDisplay();
  updateStats();
  renderSampleChips(null);
  resetCYKState();
  document.getElementById('grammar-desc').textContent =
    G.NTs.length + ' non-terminals, ' + G.Ts.length + ' terminals, ' + (G.bin.length + G.term.length) + ' productions';
}

function clearAll() {
  G = null;
  document.getElementById('inp-start').value = 'S';
  document.getElementById('inp-prods').value = '';
  document.getElementById('grammar-display').innerHTML = '<div class="empty-state"><div class="es-icon">G</div><p>No grammar loaded yet</p></div>';
  document.getElementById('grammar-desc').textContent = 'Load a preset or enter productions above';
  document.getElementById('quick-result').style.display = 'none';
  document.getElementById('sample-chips').innerHTML = '';
  document.getElementById('quick-result').style.display = 'none';
  resetCYKState();
  updateStats();
}

/* ── LOAD PRESET ───────────────────────────────────────────── */
function loadPreset(id) {
  var p = null;
  for (var i = 0; i < PRESETS.length; i++) { if (PRESETS[i].id === id) { p = PRESETS[i]; break; } }
  if (!p) return;
  ACTIVE_PRESET = id;
  document.querySelectorAll('.preset-item').forEach(function(b){ b.classList.remove('active'); });
  var btn = document.querySelector('.preset-item[data-id="' + id + '"]');
  if (btn) btn.classList.add('active');
  document.getElementById('inp-start').value = p.start;
  document.getElementById('inp-prods').value = p.prods.join('\n');
  try { G = parseGrammar(p.start, p.prods); } catch(e) { return; }
  if (p.samples && p.samples.length) {
    var s = p.samples.find(function(x){ return x.length >= 3; }) || p.samples[0];
    document.getElementById('inp-string').value = s;
  }
  renderGrammarDisplay();
  updateStats();
  renderSampleChips(p.samples);
  resetCYKState();
  document.getElementById('grammar-desc').textContent = p.desc;
}

/* ── GRAMMAR DISPLAY ───────────────────────────────────────── */
function renderGrammarDisplay() {
  if (!G) return;
  var html = '<div class="start-row"><span style="color:var(--t-low);font-size:.8rem">Start:</span><span class="start-badge">' + G.start + '</span><span style="color:var(--t-low);font-size:.72rem;margin-left:auto">NTs: ' + G.NTs.join(', ') + ' &nbsp;|&nbsp; Ts: ' + G.Ts.join(', ') + '</span></div>';
  html += '<div class="gram-sect-title">Binary Rules (A → BC)</div><div class="gram-pills">';
  if (G.bin.length === 0) html += '<span class="muted">None</span>';
  G.bin.forEach(function(r){ html += '<span class="gram-pill"><span class="gl">' + r.lhs + '</span><span class="ga">→</span><span class="gb">' + r.b + ' ' + r.c + '</span></span>'; });
  html += '</div>';
  html += '<div class="gram-sect-title">Terminal Rules (A → a)</div><div class="gram-pills">';
  if (G.term.length === 0) html += '<span class="muted">None</span>';
  G.term.forEach(function(r){ html += '<span class="gram-pill"><span class="gl">' + r.lhs + '</span><span class="ga">→</span><span class="gt">' + r.t + '</span></span>'; });
  html += '</div>';
  document.getElementById('grammar-display').innerHTML = html;
}

/* ── STATS ─────────────────────────────────────────────────── */
function updateStats() {
  document.getElementById('stat-rules').textContent = G ? (G.bin.length + G.term.length) : 0;
  document.getElementById('stat-nts').textContent   = G ? G.NTs.length : 0;
  document.getElementById('stat-len').textContent   = CUR_STRING.length;
  var n = CUR_STRING.length;
  document.getElementById('stat-cells').textContent = n > 0 ? Math.round(n*(n+1)/2) : 0;
}

/* ── SAMPLE CHIPS ──────────────────────────────────────────── */
function renderSampleChips(samples) {
  if (!samples && G) {
    samples = G.Ts.concat(G.Ts.length >= 2 ? [G.Ts.join(''), G.Ts[0]+G.Ts[0]] : []);
  }
  var el = document.getElementById('sample-chips');
  if (!samples || !samples.length) { el.innerHTML = ''; return; }
  el.innerHTML = samples.slice(0, 8).map(function(s){
    return '<span class="schip" onclick="setStr(\'' + s + '\')">' + (s === '' ? 'ε' : s) + '</span>';
  }).join('');
}

function setStr(s) {
  document.getElementById('inp-string').value = s === 'ε' ? '' : s;
}

/* ── RUN CYK (main entry) ──────────────────────────────────── */
function runCYK() {
  if (!G) { alert('Load a grammar first.'); return; }
  var raw = document.getElementById('inp-string').value.trim();
  CUR_STRING = raw === 'ε' ? '' : raw;
  if (CUR_STRING.length === 0) {
    var qr = document.getElementById('quick-result');
    qr.style.display = 'block';
    qr.className = 'qr-box rej';
    qr.textContent = '✗ Empty string — ε handling requires separate check';
    return;
  }
  updateStats();

  var res = runCYKCore(G, CUR_STRING);
  CYK_TABLE = res.table;
  CYK_STEPS = res.steps;
  STEP_IDX  = 0;

  // quick result on grammar tab
  var qr = document.getElementById('quick-result');
  qr.style.display = 'block';
  qr.className = 'qr-box ' + (res.accepted ? 'acc' : 'rej');
  qr.textContent = res.accepted ? '✓ ACCEPTED — "' + CUR_STRING + '" ∈ L(G)' : '✗ REJECTED — "' + CUR_STRING + '" ∉ L(G)';

  // set up CYK tab
  document.getElementById('cyk-str-disp').value = CUR_STRING;
  document.getElementById('btn-next').disabled   = false;
  document.getElementById('btn-runall').disabled = false;
  document.getElementById('btn-prev').disabled   = true;
  document.getElementById('prog-wrap').style.display = 'flex';
  document.getElementById('result-badge').style.display = 'none';
  renderDPTable(null, null);
  document.getElementById('step-log').innerHTML = '<div class="muted">Click <strong>Next →</strong> to begin stepping</div>';
  document.getElementById('cur-step-head').textContent = 'Ready — ' + CYK_STEPS.length + ' steps total';
  updateProgress();

  // parse tree
  if (res.accepted) {
    var tree = buildTree(G, CYK_TABLE, CUR_STRING);
    if (tree) { renderParseTree(tree); renderDerivation(tree); }
  } else {
    document.getElementById('tree-svg').innerHTML = '';
    document.getElementById('tree-info').innerHTML = '<div class="empty-state"><div class="es-icon">✕</div><p>String rejected — no parse tree</p></div>';
    document.getElementById('derivation').innerHTML = '<div class="empty-state"><div class="es-icon">↳</div><p>No derivation</p></div>';
    document.getElementById('tree-title').textContent = '"' + CUR_STRING + '" is rejected';
  }

  showTab('cyk');
}

/* ── DP TABLE RENDER ───────────────────────────────────────── */
function renderDPTable(tbl, activeCell) {
  var n = CUR_STRING.length;
  var cont = document.getElementById('dp-table');
  if (!n) { cont.innerHTML = '<div class="muted-text" style="padding:2rem;text-align:center">No string loaded</div>'; return; }

  var startSym = G ? G.start : 'S';
  var html = '';

  // string row
  html += '<div class="dp-string-row">';
  for (var i = 0; i < n; i++) {
    html += '<div class="dp-sc">' + CUR_STRING[i] + '</div>';
  }
  html += '</div>';

  // col index row
  html += '<div class="dp-idx-row">';
  for (var i = 0; i < n; i++) {
    html += '<div class="dp-ic">col ' + (i+1) + '</div>';
  }
  html += '</div>';

  // data rows: len 1..n
  for (var len = 1; len <= n; len++) {
    html += '<div class="dp-row"><div class="dp-rl">len ' + len + '</div>';
    for (var i = 0; i < n; i++) {
      if (i > n - len) {
        // out of bounds
        html += '<div class="dp-cell is-oob"></div>';
        continue;
      }
      var isActive = activeCell && activeCell.l === len-1 && activeCell.i === i;
      var nonts = tbl ? Array.from(tbl[len-1][i]) : [];
      var hasStart = nonts.indexOf(startSym) !== -1;
      var cls = 'dp-cell';
      if (isActive) cls += ' is-active';
      else if (len === 1) cls += ' is-diag';
      else if (hasStart) cls += ' has-start';
      else if (nonts.length) cls += ' has-data';

      var inner = '';
      if (nonts.length) {
        inner = nonts.map(function(nt){
          return '<span class="nt-tag' + (nt === startSym ? ' is-start' : '') + '">' + nt + '</span>';
        }).join('');
      } else {
        inner = '<span class="null-mark">' + (tbl ? '∅' : '–') + '</span>';
      }
      var substr = CUR_STRING.substring(i, i + len);
      var diag = len === 1 ? '<div class="char-lbl">\'' + CUR_STRING[i] + '\'</div>' : '';
      html += '<div class="' + cls + '" title="T[' + len + '][' + (i+1) + ']: \'' + substr + '\'">'
            + '<div style="display:flex;flex-wrap:wrap;gap:2px;justify-content:center">' + inner + '</div>'
            + diag + '</div>';
    }
    html += '</div>';
  }

  cont.innerHTML = html;
}

/* ── STEP CONTROLS ─────────────────────────────────────────── */
function stepNext() {
  if (STEP_IDX >= CYK_STEPS.length) return;
  applyStep(STEP_IDX);
  STEP_IDX++;
  updateProgress();
  document.getElementById('btn-prev').disabled   = STEP_IDX <= 1;
  document.getElementById('btn-next').disabled   = STEP_IDX >= CYK_STEPS.length;
  document.getElementById('btn-runall').disabled = STEP_IDX >= CYK_STEPS.length;
}

function stepPrev() {
  if (STEP_IDX <= 0) return;
  STEP_IDX--;
  if (STEP_IDX > 0) applyStep(STEP_IDX - 1);
  else {
    renderDPTable(null, null);
    document.getElementById('step-log').innerHTML = '<div class="muted">Click <strong>Next →</strong> to begin</div>';
    document.getElementById('cur-step-head').textContent = 'Reset to beginning';
  }
  updateProgress();
  document.getElementById('btn-prev').disabled   = STEP_IDX <= 0;
  document.getElementById('btn-next').disabled   = false;
  document.getElementById('btn-runall').disabled = false;
}

function stepRunAll() {
  STEP_IDX = CYK_STEPS.length;
  applyStep(CYK_STEPS.length - 1);
  updateProgress();
  document.getElementById('btn-prev').disabled   = false;
  document.getElementById('btn-next').disabled   = true;
  document.getElementById('btn-runall').disabled = true;
}

function stepReset() {
  STEP_IDX = 0;
  renderDPTable(null, null);
  document.getElementById('step-log').innerHTML = '<div class="muted-text">Waiting…</div>';
  document.getElementById('cur-step-head').textContent = 'No steps yet';
  document.getElementById('btn-prev').disabled   = true;
  document.getElementById('btn-next').disabled   = CYK_STEPS.length === 0;
  document.getElementById('btn-runall').disabled = CYK_STEPS.length === 0;
  document.getElementById('result-badge').style.display = 'none';
  updateProgress();
}

function resetCYKState() {
  CYK_TABLE = []; CYK_STEPS = []; STEP_IDX = 0; CUR_STRING = '';
  document.getElementById('cyk-str-disp').value = '';
  document.getElementById('btn-next').disabled   = true;
  document.getElementById('btn-runall').disabled = true;
  document.getElementById('btn-prev').disabled   = true;
  document.getElementById('prog-wrap').style.display = 'none';
  document.getElementById('result-badge').style.display = 'none';
  document.getElementById('dp-table').innerHTML = '<div class="empty-state"><div class="es-icon">≡</div><p>Run CYK from Grammar tab</p></div>';
  document.getElementById('step-log').innerHTML = '<div class="muted">Waiting…</div>';
  document.getElementById('cur-step-head').textContent = 'No steps yet';
  document.getElementById('quick-result').style.display = 'none';
}

function applyStep(idx) {
  var s = CYK_STEPS[idx];
  if (!s) return;
  renderDPTable(s.table, s.active);
  // log: show all steps up to now except phase headers
  var visible = CYK_STEPS.slice(0, idx + 1).filter(function(x){ return x.type !== 'phase' && x.type !== 'init'; });
  document.getElementById('step-log').innerHTML = visible.map(function(x){
    return '<div class="slog-line ' + x.cls + '">' + x.msg + '</div>';
  }).join('');
  document.getElementById('step-log').scrollTop = 999999;
  document.getElementById('cur-step-head').textContent = s.msg;
  if (s.type === 'done') {
    var rb = document.getElementById('result-badge');
    rb.style.display = 'block';
    rb.className = 'res-badge ' + (s.accepted ? 'acc' : 'rej');
    rb.textContent = s.accepted ? '✓ "' + CUR_STRING + '" ∈ L(G)' : '✗ "' + CUR_STRING + '" ∉ L(G)';
  }
}

function updateProgress() {
  var total = CYK_STEPS.length;
  var pct = total ? (STEP_IDX / total) * 100 : 0;
  document.getElementById('prog-bar').style.width = pct + '%';
  document.getElementById('prog-label').textContent = STEP_IDX + ' / ' + total;
}

/* ── PARSE TREE ────────────────────────────────────────────── */
function buildTree(grammar, table, str) {
  var n = str.length;
  if (!table[n-1][0].has(grammar.start)) return null;

  function node(sym, len, start) {
    var nd = { sym:sym, len:len, start:start, children:[] };
    if (len === 1) {
      nd.children = [{ sym:"'" + str[start] + "'", len:0, start:start, children:[], leaf:true }];
      return nd;
    }
    for (var r = 0; r < grammar.bin.length; r++) {
      var rule = grammar.bin[r];
      if (rule.lhs !== sym) continue;
      for (var k = 1; k < len; k++) {
        if (table[k-1][start].has(rule.b) && table[len-k-1][start+k].has(rule.c)) {
          nd.children = [ node(rule.b, k, start), node(rule.c, len-k, start+k) ];
          return nd;
        }
      }
    }
    return nd;
  }

  return node(grammar.start, n, 0);
}

function renderParseTree(root) {
  var el = document.getElementById('tree-svg');
  var W  = el.clientWidth  || 600;
  var H  = el.clientHeight || 400;

  function toD3(nd) {
    return { name: nd.sym, leaf: nd.leaf || false, children: nd.children.length ? nd.children.map(toD3) : undefined };
  }

  var svg = d3.select('#tree-svg');
  svg.selectAll('*').remove();

  var root3 = d3.hierarchy(toD3(root));
  var treeLayout = d3.tree().size([W - 60, H - 80]);
  treeLayout(root3);

  var g = svg.append('g').attr('transform','translate(30,40)');

  g.selectAll('.tlink')
    .data(root3.links())
    .join('path')
    .attr('fill','none')
    .attr('stroke','rgba(16,185,129,.4)')
    .attr('stroke-width',1.5)
    .attr('d', d3.linkVertical().x(function(d){ return d.x; }).y(function(d){ return d.y; }));

  var nodes = g.selectAll('.tnode')
    .data(root3.descendants())
    .join('g')
    .attr('transform', function(d){ return 'translate(' + d.x + ',' + d.y + ')'; });

  nodes.append('circle')
    .attr('r', function(d){ return d.data.leaf ? 13 : 17; })
    .attr('fill', function(d){
      if (d.data.leaf) return 'rgba(245,158,11,.18)';
      return d.data.name === G.start ? 'rgba(16,185,129,.25)' : 'rgba(16,185,129,.12)';
    })
    .attr('stroke', function(d){ return d.data.leaf ? 'rgba(245,158,11,.6)' : 'rgba(16,185,129,.6)'; })
    .attr('stroke-width',1.5);

  nodes.append('text')
    .attr('text-anchor','middle').attr('dominant-baseline','central')
    .attr('font-family',"'JetBrains Mono', monospace")
    .attr('font-size', function(d){ return d.data.leaf ? '9px' : '11px'; })
    .attr('font-weight','700')
    .attr('fill', function(d){ return d.data.leaf ? '#fcd34d' : '#34d399'; })
    .text(function(d){ return d.data.name; });

  document.getElementById('tree-title').textContent = 'Parse tree for "' + CUR_STRING + '"';
  var depth = root3.height;
  var leaves = root3.leaves().length;
  document.getElementById('tree-info').innerHTML =
    '<div class="tree-info-row"><span class="ti-lbl">String</span><span class="ti-val">"' + CUR_STRING + '"</span></div>' +
    '<div class="tree-info-row"><span class="ti-lbl">Start Symbol</span><span class="ti-val">' + G.start + '</span></div>' +
    '<div class="tree-info-row"><span class="ti-lbl">Tree Depth</span><span class="ti-val">' + depth + '</span></div>' +
    '<div class="tree-info-row"><span class="ti-lbl">Leaf Nodes</span><span class="ti-val">' + leaves + '</span></div>' +
    '<div class="tree-info-row"><span class="ti-lbl">Result</span><span class="ti-val" style="color:var(--acc-green)">✓ Accepted</span></div>';
}

function renderDerivation(root) {
  var steps = [];
  function walk(nd) {
    if (nd.leaf) return;
    steps.push({ from: nd.sym, to: nd.children.map(function(c){ return c.sym; }).join(' ') });
    nd.children.forEach(walk);
  }
  walk(root);
  var div = document.getElementById('derivation');
  if (!steps.length) { div.innerHTML = '<div class="empty-state small"><p>No derivation</p></div>'; return; }
  div.innerHTML = '<div style="display:flex;flex-direction:column;gap:.3rem">' +
    steps.slice(0,20).map(function(s,i){
      return '<div class="deriv-step"><span class="deriv-num">' + (i+1) + '.</span>' + s.from + ' → ' + s.to + '</div>';
    }).join('') + '</div>';
}

/* ── BATCH TESTER ──────────────────────────────────────────── */
function runBatch() {
  if (!G) { alert('Load a grammar first.'); return; }
  var lines = document.getElementById('batch-inp').value.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
  if (!lines.length) { alert('Enter at least one string.'); return; }

  var results = lines.map(function(raw) {
    var str = raw === 'ε' ? '' : raw;
    if (!str.length) return { raw:raw, str:str, accepted:false, note:'ε not handled' };
    var r = runCYKCore(G, str);
    return { raw:raw, str:str, accepted:r.accepted, len:str.length };
  });

  var acc = results.filter(function(r){ return r.accepted; });
  var rej = results.filter(function(r){ return !r.accepted; });

  var sum = document.getElementById('batch-summary');
  sum.className = 'batch-sum show';
  sum.innerHTML = '<span class="bac">✓ ' + acc.length + ' accepted</span> &nbsp;|&nbsp; <span class="brj">✗ ' + rej.length + ' rejected</span> &nbsp;|&nbsp; Total: ' + results.length;

  var tbl = document.getElementById('batch-table');
  tbl.innerHTML = '<thead><tr><th>#</th><th>String</th><th>Length</th><th>Result</th></tr></thead><tbody>' +
    results.map(function(r,i){
      return '<tr><td>' + (i+1) + '</td><td>' + r.raw + '</td><td>' + (r.len !== undefined ? r.len : '—') + '</td>' +
             '<td class="' + (r.accepted ? 'tda' : 'tdj') + '">' + (r.accepted ? '✓ Accepted' : '✗ Rejected') + '</td></tr>';
    }).join('') + '</tbody>';
  document.getElementById('batch-out').style.display = 'block';

  // analysis
  document.getElementById('lang-analysis').innerHTML =
    '<div style="margin-bottom:.75rem"><div class="gram-sect-title">Accepted ∈ L(G)</div><div class="lang-chips">' +
    (acc.length ? acc.map(function(r){ return '<span class="lchip a">' + r.raw + '</span>'; }).join('') : '<span class="muted">None</span>') +
    '</div></div><div><div class="gram-sect-title">Rejected ∉ L(G)</div><div class="lang-chips">' +
    (rej.length ? rej.map(function(r){ return '<span class="lchip r">' + r.raw + '</span>'; }).join('') : '<span class="muted">None</span>') +
    '</div></div>';
}

function loadSamples() {
  var pre = null;
  for (var i = 0; i < PRESETS.length; i++) { if (PRESETS[i].id === ACTIVE_PRESET) { pre = PRESETS[i]; break; } }
  var base = pre ? pre.samples : [];
  if (G) {
    var more = G.Ts.concat(G.Ts.length >= 2 ? [G.Ts.join(''), G.Ts[0]+G.Ts[0]] : []);
    base = base.concat(more);
  }
  var uniq = [];
  base.forEach(function(x){ if (uniq.indexOf(x) === -1) uniq.push(x); });
  document.getElementById('batch-inp').value = uniq.slice(0,10).join('\n');
}

/* ── QUESTION BANK ─────────────────────────────────────────── */
function initQuestionBank() {
  var grid = document.getElementById('qbank-grid');
  grid.innerHTML = QUESTIONS.map(function(q) {
    var pre = null;
    for (var i = 0; i < PRESETS.length; i++) { if (PRESETS[i].id === q.presetId) { pre = PRESETS[i]; break; } }
    var prods = pre ? pre.prods.slice(0,5) : [];
    var prodsHTML = prods.map(function(p) {
      var m = p.match(/^(.+?)\s*(?:→|->)\s*(.+)$/);
      if (!m) return '';
      var lhs = m[1].trim(), rhs = m[2].trim();
      var parts = rhs.split(/\s+/);
      var cls = parts.length === 2 ? 'qb' : 'qt';
      return '<div class="qc-prod"><span class="ql">' + lhs + '</span> → <span class="' + cls + '">' + rhs + '</span></div>';
    }).join('');
      '<span class="q-badge ' + (q.accept ? 'acc' : 'rej') + '">' + (q.accept ? '✓ Accept' : '✗ Reject') + '</span></div>' +
      '<div class="q-question">' + q.question + '</div>' +
      '<div class="q-chips"><span class="q-chip str">w = "' + q.str + '"</span>' +
      (pre ? '<span class="q-chip gram">' + pre.name + '</span>' : '') +
      '<span class="q-chip unit">' + q.unit + '</span></div>' +
      '<div class="q-prods"><div class="q-prods-title">Grammar G · Start: ' + (pre ? pre.start : 'S') + '</div>' + prodsHTML + more + '</div>' +
      '<div class="q-hint">💡 ' + q.hint + '</div>' +
      '<div class="q-status" id="qstat-' + q.id + '"></div>' +
      '<div class="q-actions">' +
      '<button class="q-run" onclick="runQuestion(\'' + q.id + '\')">▶ Load &amp; Run</button>' +
      '<button class="q-step" onclick="stepQuestion(\'' + q.id + '\')">Step-by-Step</button>' +
      '</div></div>';
  }).join('');
}

function runQuestion(qid) {
  var q = null;
  for (var i = 0; i < QUESTIONS.length; i++) { if (QUESTIONS[i].id === qid) { q = QUESTIONS[i]; break; } }
  if (!q) return;
  loadPreset(q.presetId);
  document.getElementById('inp-string').value = q.str;
  CUR_STRING = q.str;
  runCYK();

  // show result status on card
  var last = CYK_STEPS[CYK_STEPS.length - 1];
  var got  = last && last.accepted;
  var stat = document.getElementById('qstat-' + qid);
  if (stat) {
    stat.className = 'qc-status show ' + (got === q.accept ? 'ok' : 'bad');
    stat.textContent = got === q.accept
      ? (got ? '✓ Correctly ACCEPTED — matches expected!' : '✓ Correctly REJECTED — matches expected!')
      : '⚠ Unexpected result';
  }
}

function stepQuestion(qid) {
  var q = null;
  for (var i = 0; i < QUESTIONS.length; i++) { if (QUESTIONS[i].id === qid) { q = QUESTIONS[i]; break; } }
  if (!q) return;
  loadPreset(q.presetId);
  document.getElementById('inp-string').value = q.str;
  CUR_STRING = q.str;
  if (!G) return;

  var res = runCYKCore(G, CUR_STRING);
  CYK_TABLE = res.table; CYK_STEPS = res.steps; STEP_IDX = 0;

  document.getElementById('cyk-str-disp').value = CUR_STRING;
  document.getElementById('btn-next').disabled   = false;
  document.getElementById('btn-runall').disabled = false;
  document.getElementById('btn-prev').disabled   = true;
  document.getElementById('prog-wrap').style.display = 'flex';
  document.getElementById('result-badge').style.display = 'none';
  renderDPTable(null, null);
  document.getElementById('step-log').innerHTML = '<div class="muted">Click <strong>Next →</strong> to step through</div>';
  document.getElementById('cur-step-head').textContent = 'Ready — ' + CYK_STEPS.length + ' steps. Use Next →';
  updateStats();
  updateProgress();
  showTab('cyk');
}

/* ── TAB SWITCHING ─────────────────────────────────────────── */
function showTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
  var tb = document.getElementById('tab-' + tab);
  var pb = document.getElementById('panel-' + tab);
  if (tb) tb.classList.add('active');
  if (pb) pb.classList.add('active');
}

/* ── INIT ──────────────────────────────────────────────────── */
function initPresets() {
  var el = document.getElementById('preset-list');
  el.innerHTML = PRESETS.map(function(p){
    return '<button class="preset-item" data-id="' + p.id + '" onclick="loadPreset(\'' + p.id + '\')">' +
           '<span>' + p.name + '</span><span class="preset-tag">' + p.tag + '</span></button>';
  }).join('');
}

document.addEventListener('DOMContentLoaded', function() {
  initPresets();
  initQuestionBank();
  loadPreset('classic');
  document.getElementById('inp-string').addEventListener('keydown', function(e){
    if (e.key === 'Enter') runCYK();
  });
});
