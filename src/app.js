(function(){
'use strict';
const D = window.DATA, PHOTOS = window.PHOTOS || {};
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function h(tag, attrs, ...kids){
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs){ const v = attrs[k]; if (v==null||v===false) continue;
    if (k==='class') el.className = v; else if (k==='html') el.innerHTML = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v===true?'':v); }
  for (const kid of kids.flat()) if (kid!=null && kid!==false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
}
const SVG_CHEV = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l5 5 5-5"/></svg>';
const SVG_SORT = '<svg viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 5H1z"/></svg>';
const ptext = p => typeof p==='string' ? p : (p.text_verbatim ?? p.verbatim ?? p.text ?? '');
function strip(txt, nums){ let s = String(txt||''); (nums||[]).forEach(n => { s = s.replace(new RegExp('([.,;:!?"”\\)])\\s*,?\\s*'+n+'\\s+(?=[A-Z"“(])','g'), '$1 ').replace(new RegExp('\\s'+n+'$'), ''); }); return s.replace(/\s+,/g, ',').replace(/\s{2,}/g,' ').trim(); }

/* ---------- footnotes ---------- */
const FN = { findings: D.findings.footnotes, programme: D.programme.footnotes, lipid: D.lipid.footnotes, dates: D.dates.footnotes, cardio: D.cardio.footnotes };
const CHAPTER_NAME = { findings:'Executive summary', programme:'Programme and contributors', lipid:'Lipid-lowering and atherosclerosis', dates:'Dates to watch', cardio:'Inherited and rare cardiomyopathies' };
const CHAPTER_PAGE = { findings:'findings.html', programme:'programme.html', lipid:'lipids.html', dates:'dates.html', cardio:'cardiomyopathies.html' };
function getFn(ch, n){ return (FN[ch]||[]).find(f => f.number===n); }
function fnButtons(ch, nums, host){
  const wrap = h('span', {class:'fns'});
  (nums||[]).forEach(n => {
    const f = getFn(ch, n); if (!f) return;
    const panel = h('div', {class:'fn-panel', hidden:true}, h('span',{class:'fn-n'}, 'Note '+n), h('div',{class:'t'}, f.text_verbatim, ' ', h('span',{class:'cite'}, String(f.source_page))));
    const btn = h('button', {class:'fn-btn', 'aria-expanded':'false', 'aria-label':'Footnote '+n, title:f.text_verbatim, onclick:()=>{ const open = btn.getAttribute('aria-expanded')==='true'; btn.setAttribute('aria-expanded', String(!open)); panel.hidden = open; }}, String(n));
    wrap.append(btn); host.append(panel);
  });
  return wrap;
}
function fnFoot(ch, container){
  if (!container) return; const list = FN[ch]||[]; if (!list.length) return;
  container.append(h('h3',{}, 'Footnotes, as printed in the report'));
  const ol = h('ol',{}); list.forEach(f => ol.append(h('li',{}, f.text_verbatim, ' ', h('span',{class:'cite'}, String(f.source_page))))); container.append(ol);
}

/* ---------- search index (built from data, independent of the page) ---------- */
const INDEX = [];
function idx(page, where, text, pg){ if (text) INDEX.push({page, where:String(where||''), text:String(text), pg}); }
(function buildIndex(){
  idx('about.html','About this report', D.meta.about.intro_verbatim, 3);
  D.meta.about.sections.forEach(s => idx('about.html', s.heading, s.text_verbatim, s.source_page));
  idx('findings.html','Executive summary', D.findings.intro_lead_verbatim+' '+D.findings.intro_body_verbatim, 5);
  D.findings.findings.forEach(f => idx('findings.html#finding-'+f.number, 'Finding '+f.number, f.headline_verbatim+' '+f.body_verbatim, f.source_page));
  idx('programme.html','Programme', D.programme.intro_verbatim+' '+D.programme.organising_committee_verbatim, 9);
  D.programme.sessions.forEach(s => idx('programme.html', s.time+' '+s.title, [...(s.moderators||[]), ...(s.speakers||[]).map(x => x.name+(x.organisation?' ('+x.organisation+')':''))].join('; '), s.source_page));
  idx('lipids.html', D.lipid.chapter_title, D.lipid.lead_verbatim, 12); idx('lipids.html','Key point', D.lipid.key_point_verbatim, 13);
  D.lipid.sections.forEach(sec => (sec.paragraphs||[]).forEach(p => idx('lipids.html', sec.heading, ptext(p), p.source_page||sec.source_page)));
  idx('lipids.html','Matters not addressed', D.lipid.matters_not_addressed_verbatim, 14);
  D.lipid.programmes_table.forEach(r => idx('lipids.html','Programmes referenced: '+r.company, r.programme+'. '+r.stage_as_presented+'. '+r.principal_point, r.source_page));
  idx('dates.html','Dates to watch', D.dates.intro_verbatim, 15);
  D.dates.groups.forEach(g => g.entries.forEach(e => idx('dates.html', g.heading+': '+e.company, e.when_as_stated+' — '+e.event, e.source_page)));
  idx('developments.html','Developments since the meeting', D.developments.intro_verbatim, 17);
  D.developments.sections.forEach(sec => sec.items.forEach(it => idx('developments.html', it.label, it.text_verbatim, it.source_page||17)));
  idx('cardiomyopathies.html', D.cardio.chapter_title, D.cardio.lead_verbatim, 19);
  D.cardio.presentations.forEach(p => idx('cardiomyopathies.html', p.speaker+', '+p.company, p.paragraph_verbatim, p.source_page||19));
  (D.cardio.discussion.paragraphs||[]).forEach(p => idx('cardiomyopathies.html','Discussion', ptext(p), 20));
  idx('cardiomyopathies.html','Guest speaker: '+D.cardio.guest_speaker.name, D.cardio.guest_speaker.paragraph_verbatim, 21);
  idx('method.html','Method and verification', D.method.intro_verbatim, 22);
  D.method.sections.forEach(sec => (sec.paragraphs||[]).forEach(p => idx('method.html', sec.heading, ptext(p), sec.source_page||22)));
  Object.keys(FN).forEach(ch => (FN[ch]||[]).forEach(f => idx(CHAPTER_PAGE[ch], 'Footnote '+f.number+', '+CHAPTER_NAME[ch], f.text_verbatim, f.source_page)));
  idx('trials.html','Trials referred to at the meeting', D.trials.intro_verbatim, 24);
  D.trials.trials.forEach(r => idx('trials.html', r.study, r.sponsor+' · '+r.registry_identifier+' · '+r.phase+' · '+r.status, r.source_page||24));
  (D.trials.not_matched||[]).forEach(n => idx('trials.html', n.lead_phrase ?? n.label_bold, n.text_verbatim, 25));
})();

/* ---------- chrome: nav state, menu, credits, search ---------- */
const HERE = (function(p){ p = (p || 'index.html').replace(/[?#].*$/,''); return /\.html$/.test(p) ? p : p + '.html'; })(location.pathname.split('/').pop());
document.querySelectorAll('.nav a, .menu a').forEach(a => { if ((a.getAttribute('href')||'').split('#')[0] === HERE) a.setAttribute('aria-current','page'); });
{ const m = $('#menu'); if (m){ $('#menu-open').onclick = () => m.classList.add('on'); $('#menu-close').onclick = () => m.classList.remove('on'); } }
document.querySelectorAll('[data-credit]').forEach(el => { const p = PHOTOS[el.dataset.credit]; if (!p) return; el.innerHTML = 'Photo: <a href="'+esc(p.profile)+'" target="_blank" rel="noopener">'+esc(p.photographer)+'</a> on <a href="'+esc(p.page)+'" target="_blank" rel="noopener">Unsplash</a>'; });
{
  const ov = $('#overlay'), q = $('#q'), res = $('#results');
  if (ov){
    const open = () => { ov.classList.add('on'); q.focus(); q.select(); }; const close = () => ov.classList.remove('on');
    document.querySelectorAll('[data-search-open]').forEach(b => b.onclick = open);
    ov.addEventListener('click', e => { if (e.target===ov) close(); });
    document.addEventListener('keydown', e => { if (e.key==='Escape') close(); if ((e.metaKey||e.ctrlKey) && e.key==='k'){ e.preventDefault(); open(); } });
    function hl(text, t){ const i = text.toLowerCase().indexOf(t); const start = Math.max(0, i-80); const snip = (start>0?'…':'')+text.slice(start, i+t.length+120)+(i+t.length+120<text.length?'…':''); return esc(snip).replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'), m => '<mark>'+m+'</mark>'); }
    q.addEventListener('input', () => { const t = q.value.trim().toLowerCase(); res.innerHTML=''; if (t.length<2) return; let n=0;
      for (const e of INDEX){ if (!e.text.toLowerCase().includes(t)) continue; n++; if (n>40) break;
        res.append(h('a',{class:'res', href:e.page}, h('div',{class:'where'}, e.where, h('span',{class:'cite'}, String(e.pg))), h('div',{html:hl(e.text, t)}))); }
      if (!n) res.append(h('div',{class:'hint'}, 'Nothing in the report matches "'+esc(q.value)+'".')); });
  }
}
const R = D.meta.report;

/* ---------- Quote slider ---------- */
const SESSION_TITLE = {}; D.programme.sessions.forEach(s => SESSION_TITLE[s.time] = s.title);
function slider(items, opts={}){
  const el = h('div',{class:'qslider'+(opts.compact?' compact':''), role:'region', 'aria-roledescription':'carousel', 'aria-label':opts.label||'Speaker quotations'});
  const track = h('div',{class:'track'});
  items.forEach(q => track.append(h('div',{class:'slide', role:'group'}, q.session && !opts.compact ? h('div',{class:'sess-tag'}, q.session+' · '+(SESSION_TITLE[q.session]||'')) : null, h('p',{class:'q'}, '“'+q.text+'”'), h('div',{class:'who'}, h('b',{}, q.name), q.role? ' · '+q.role : ''))));
  const dots = h('div',{class:'dots'}); let i = 0, timer = null; const n = items.length;
  const go = k => { i = (k+n)%n; track.style.transform = 'translateX(-'+(i*100)+'%)'; dots.querySelectorAll('button').forEach((d,j) => d.setAttribute('aria-current', String(j===i))); if (el.querySelector('.count')) el.querySelector('.count').textContent = (i+1)+' / '+n; };
  items.forEach((_,j) => dots.append(h('button',{'aria-label':'Quotation '+(j+1), onclick:()=>{ go(j); stop(); }})));
  const prev = h('button',{'aria-label':'Previous quotation', html:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3L5 8l5 5"/></svg>', onclick:()=>{ go(i-1); stop(); }});
  const next = h('button',{'aria-label':'Next quotation', html:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>', onclick:()=>{ go(i+1); stop(); }});
  const stop = () => { if (timer){ clearInterval(timer); timer = null; } };
  const counter = h('span',{class:'count', style:'margin-left:6px;font-family:var(--mono);font-size:.72rem;color:var(--band-muted)'}); const useDots = n <= 10; const go2 = go; const goWrap = k => { go2(k); counter.textContent = (i+1)+' / '+n; };
  el.append(h('div',{class:'viewport', style:'overflow:hidden'}, track), h('div',{class:'ctl'}, prev, next, useDots ? dots : counter)); goWrap(0);
  if (n>1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){ timer = setInterval(() => go(i+1), opts.interval||7000); el.addEventListener('mouseenter', stop); el.addEventListener('focusin', stop); }
  return el;
}
const Q = window.QUOTES || {};

/* ---------- Ask the report ---------- */
document.querySelectorAll('.ask[data-ask]').forEach(box => {
  const CFG = window.ASK_CONFIG || {}; const compact = box.dataset.ask === 'compact'; const history = [];
  const PDF_TO_PAGE = p => p<=4 ? 'about.html' : p<=8 ? 'findings.html' : p<=10 ? 'programme.html' : p<=14 ? 'lipids.html' : p<=16 ? 'dates.html' : p===17 ? 'developments.html' : p<=21 ? 'cardiomyopathies.html' : p<=23 ? 'method.html' : 'trials.html';
  const ta = h('textarea',{id:'ask-q-'+(compact?'c':'f'), rows:'1', placeholder:'Ask a question about the report', 'aria-label':'Your question'});
  const btn = h('button',{class:'go', type:'submit', html:'Ask <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h11M9 4l4 4-4 4"/></svg>'});
  const form = h('form',{}, ta, btn);
  const sugg = h('div',{class:'sugg'}, h('h4',{}, 'Suggested questions'));
  const ol = h('ol',{}); ['What did the panel say about monitoring with longer dosing intervals?','Which readouts are expected in 2027?','Which product is CE-marked?','Who gave the keynote, and in what capacity?','How many patients were dosed in CALLISTO-HCM?','What did the one patient who spoke say about his treatment?'].slice(0, compact?4:6).forEach(q => ol.append(h('li',{}, h('button',{type:'button', onclick:()=>{ ta.value=q; submit(); }}, q)))); sugg.append(ol);
  const status = h('div',{class:'ask-status'+(CFG.endpoint?' live':'')}, CFG.endpoint ? 'Connected to the answering service.' : 'The answering service is not yet connected. Until it is, a question returns the passages of the report that relate to it, with their pages.');
  const thread = h('div',{class:'thread'});
  if (compact) box.append(h('div',{class:'lede'}, 'Ask the report')); box.append(form, sugg, status, thread);
  ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; });
  function terms(q){ const stop = new Set(['what','which','who','when','where','how','did','does','the','and','for','with','about','that','this','were','was','are','there','their','they','from','into','have','has','had','say','said','many','much','any','report','meeting']); return q.toLowerCase().replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).filter(w => w.length>2 && !stop.has(w)); }
  function localMatches(q){ const ts = terms(q); if (!ts.length) return []; return INDEX.map(e => { const low = e.text.toLowerCase(); const score = ts.reduce((s,t) => s + (low.includes(t)?1:0), 0) + ts.reduce((s,t) => s + (e.where.toLowerCase().includes(t)?1:0), 0); return {e, score}; }).filter(x => x.score>0).sort((a,b) => b.score-a.score).slice(0, compact?3:6); }
  function snippet(text, ts){ let i = -1; for (const t of ts){ i = text.toLowerCase().indexOf(t); if (i>=0) break; } const start = Math.max(0, i-90); let s = (start>0?'…':'')+text.slice(start, start+260)+(start+260<text.length?'…':''); s = esc(s); ts.forEach(t => { s = s.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'), m => '<mark>'+m+'</mark>'); }); return s; }
  function renderSources(container, sources, ts){ if (!sources.length) return; const g = h('div',{class:'srcs'}); sources.forEach(s => g.append(h('a',{class:'src', href:s.href}, h('b',{}, 'p. '+s.page), h('span',{}, h('span',{class:'w'}, s.where), h('span',{class:'t', html:s.html}))))); container.append(g); }
  async function submit(){
    const q = ta.value.trim(); if (!q) return; ta.value='';
    const qa = h('div',{class:'qa'}, h('div',{class:'q'}, q)); const a = h('div',{class:'a'}); qa.append(a); thread.prepend(qa);
    const ts = terms(q); const local = localMatches(q).map(({e}) => ({where:e.where, page:e.pg, href:e.page, html:snippet(e.text, ts)}));
    if (!CFG.endpoint){
      a.textContent = local.length ? 'The passages of the report that bear on this question:' : 'No passage in the report contains those words. Try the name of a company, product, trial or speaker.';
      renderSources(qa, local, ts); if (!compact && local.length) qa.append(h('p',{class:'more'}, h('a',{href:'#', onclick:e=>{e.preventDefault(); document.querySelector('[data-search-open]').click(); const s = document.getElementById('q'); s.value = ts.join(' '); s.dispatchEvent(new Event('input'));}}, 'Open these in search'))); return;
    }
    status.classList.add('busy'); status.textContent = 'Asking…'; a.textContent = '…';
    try {
      const r = await fetch(CFG.endpoint, { method:'POST', headers: CFG.headers||{'Content-Type':'application/json'}, body: JSON.stringify({ question:q, report_id:CFG.report_id, page:HERE, history: history.slice(-6) }) });
      if (!r.ok) throw new Error('The answering service replied with status '+r.status+'.');
      const j = await r.json(); const answer = String(j.answer||'').trim();
      a.textContent = answer || 'The service returned no answer.'; history.push({question:q, answer});
      const srcs = Array.isArray(j.sources) ? j.sources.filter(s => s && s.page).map(s => ({where:'Report', page:+s.page, href:PDF_TO_PAGE(+s.page), html:esc(s.quote||'')})) : [];
      renderSources(qa, srcs.length ? srcs : local, ts);
    } catch (err) { a.classList.add('err'); a.textContent = 'The answering service could not be reached ('+(err && err.message ? err.message : 'network error')+'). Matching passages from the report are shown instead.'; renderSources(qa, local, ts); }
    finally { status.classList.remove('busy'); status.textContent = 'Connected to the answering service.'; }
  }
  form.addEventListener('submit', e => { e.preventDefault(); submit(); });
  ta.addEventListener('keydown', e => { if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); submit(); } });
});

/* ---------- Home ---------- */
if ($('#home-lead')){
  $('#h-when').textContent = R.event_date_line; $('#h-title').textContent = R.title; $('#h-sub').textContent = R.subtitle;
  const allQ = Object.keys(Q).flatMap(k => Q[k].map(q => ({...q, session:k}))); if ($('#home-quotes')) $('#home-quotes').append(slider(allQ, {label:'Quotations from the sessions', interval:8000}));
  $('#home-lead').textContent = D.findings.intro_lead_verbatim; $('#home-body').textContent = D.findings.intro_body_verbatim;
  $('#h-meta').append(h('div',{}, h('b',{},'Published by'), R.society_full_name), h('div',{}, h('b',{},'Publication'), R.publication_month), h('div',{}, h('b',{},'Venue'), R.venue+', '+R.city), h('div',{}, h('b',{},'Status'), R.sample_badge_text));
  const CARDS = [
    ['findings.html','Executive summary','Twelve principal findings','What the meeting established, finding by finding, with the figures behind each.','heart-drawing'],
    ['programme.html','Programme','Sessions and contributors','The afternoon session by session, the organising committee, and everyone named on the programme.','audience-screen'],
    ['lipids.html','Thematic analysis', D.lipid.chapter_title,'Five companies, three approaches to the same target, and what the clinicians made of them.','blood-vials'],
    ['dates.html','Thematic analysis','Dates to watch','Readouts, filings and starts the companies said to expect, from late 2026 to 2029.','ecg-monitor'],
    ['developments.html','Thematic analysis','Developments since the meeting','Results and regulatory positions announced after Lisbon that bear on what was said.','dna-vials'],
    ['cardiomyopathies.html','Record of sessions', D.cardio.chapter_title,'Gene therapies, a transthyretin silencer and an oral drug, and a patient treated three years ago.','heart-model'],
    ['trials.html','Appendix','Trials referred to at the meeting','The studies speakers named, matched to a trial registry, with phase and status.','lab-robot'],
    ['ask.html','Ask','Ask the report','Ask a question in plain words and get an answer with the passages and pages it comes from.','vitals-monitor'],
    ['about.html','About','About this report','What the report covers, how its statements are to be read, and the photographs on this site.','stethoscope'],
  ];
  CARDS.forEach(([href,k,title,text,photo]) => { const p = PHOTOS[photo]||{}; $('#home-cards').append(h('a',{class:'card', href}, h('div',{class:'ph'}, h('img',{src:p.src, alt:p.alt||'', loading:'lazy'})), h('div',{class:'cb'}, h('div',{class:'k'}, k), h('h3',{}, title), h('p',{}, text), h('div',{class:'go'}, 'Open →')))); });
  D.findings.findings.forEach(f => $('#home-findings').append(h('li',{}, h('a',{href:'findings.html#finding-'+f.number}, f.headline_verbatim))));
  const next = (D.developments.sections.flatMap(s => s.items).find(i => /next meeting|next Forum/i.test(i.label+' '+i.text_verbatim)) || {}).text_verbatim; if (next) $('#home-next').textContent = next;
}

/* ---------- About ---------- */
if ($('#about-lead')){
  $('#about-lead').textContent = D.meta.about.intro_verbatim;
  D.meta.about.sections.forEach((s, si) => { const box = h('div',{class:'prose'}, h('h3',{style:'margin-top:0'}, s.heading)); String(s.text_verbatim).split('\n').forEach((p, pi) => box.append(h('p',{'data-anchor':'about:'+si+':'+pi}, p))); box.append(h('span',{class:'cite'}, String(s.source_page))); $('#about-sections').append(box); });
  const src = D.method.sections.find(s => /Sources/i.test(s.heading)); const tr = D.method.sections.find(s => /Transcription/i.test(s.heading));
  $('#about-method').textContent = D.method.intro_verbatim + ' ' + (src ? ptext(src.paragraphs[0]) : '');
  const pc = $('#photo-credits'); Object.values(PHOTOS).forEach(p => pc.append(h('span',{}, p.alt+'. Photo by ', h('a',{href:p.profile, target:'_blank', rel:'noopener'}, p.photographer), ' on ', h('a',{href:p.page, target:'_blank', rel:'noopener'}, 'Unsplash'), '. '), h('br')));
}

/* ---------- Findings ---------- */
if ($('#findings-list')){
  $('#findings-lead').textContent = D.findings.intro_lead_verbatim; $('#findings-body').textContent = D.findings.intro_body_verbatim;
  const personSessions = {}; D.programme.people.forEach(p => { personSessions[p.name] = (p.roles||[]).map(r => r.session_time).filter(Boolean); });
  const findingEls = [];
  D.findings.findings.forEach(f => {
    const times = new Set(); (f.speakers||[]).forEach(sp => (personSessions[sp.name]||[]).forEach(t => times.add(t)));
    const el = h('article',{class:'finding', 'data-sessions':[...times].join('|'), id:'finding-'+f.number});
    const body = h('div',{}); const text = h('p',{class:'body', 'data-anchor':'findings:finding-'+f.number, 'data-anchor-text':f.body_verbatim}, f.body_verbatim, ' '); text.append(fnButtons('findings', f.footnote_numbers, body));
    const who = h('div',{class:'who'}); (f.speakers||[]).forEach(sp => who.append(h('span',{class:'tag'}, h('b',{}, sp.name), sp.organisation?', '+sp.organisation:''))); who.append(h('span',{class:'cite', style:'align-self:center'}, String(f.source_page)));
    body.prepend(h('h3',{}, f.headline_verbatim), text); body.append(who);
    const figs = (f.figures||[]).filter(x => x.value_as_printed);
    if (figs.length){ const more = h('div',{class:'more', hidden:true}); const grid = h('div',{class:'figs'}); figs.forEach(x => grid.append(h('div',{class:'fig'}, h('div',{class:'v num'}, x.value_as_printed), h('div',{class:'m'}, x.what_it_measures), x.trial_or_product?h('div',{class:'b'}, h('span',{class:'t'}, x.trial_or_product)):null))); more.append(grid);
      const btn = h('button',{class:'expand','aria-expanded':'false', html:'Figures in this finding ('+figs.length+') '+SVG_CHEV, onclick:()=>{ const o = btn.getAttribute('aria-expanded')==='true'; btn.setAttribute('aria-expanded',String(!o)); more.hidden = o; }}); body.append(btn, more); }
    el.append(h('div',{class:'n num'}, String(f.number)), body); $('#findings-list').append(el); findingEls.push(el);
  });
  const ff = $('#findings-filters'); let active = 'all'; const pills = [];
  function apply(){ findingEls.forEach(el => { const show = active==='all' || el.dataset.sessions.split('|').includes(active); el.classList.toggle('hidden', !show); }); pills.forEach(p => p.setAttribute('aria-pressed', String(p.dataset.v===active))); }
  const mk = (v, label) => { const p = h('button',{class:'pill','data-v':v,'aria-pressed':'false', onclick:()=>{active=v;apply();}}, label); pills.push(p); ff.append(p); };
  mk('all','All twelve'); D.programme.sessions.filter(s => findingEls.some(el => el.dataset.sessions.split('|').includes(s.time))).forEach(s => mk(s.time, s.time+' '+s.title)); apply();
  fnFoot('findings', $('#findings-fns'));
  if (location.hash) { const t = document.querySelector(location.hash); if (t) setTimeout(() => t.scrollIntoView({block:'start'}), 50); }
}

/* ---------- Programme ---------- */
if ($('#timeline')){
  $('#programme-lead').textContent = D.programme.intro_verbatim; $('#programme-lead').dataset.anchor = 'programme:intro';
  D.programme.organising_committee.forEach(m => $('#committee').append(h('div',{class:'person'}, h('b',{}, (m.title_as_printed?m.title_as_printed+' ':'')+m.name), h('span',{class:'org'}, m.role))));
  D.programme.sessions.forEach(s => {
    const card = h('div',{class:'card-s'}); const detail = h('div',{class:'detail', hidden:true});
    const speakers = (s.speakers||[]).filter(x => x.role!=='panel'), panel = (s.speakers||[]).filter(x => x.role==='panel');
    const col = (title, items, roleLabel) => { if (!items.length) return; const box = h('div',{}, h('h4',{}, title)); const ul = h('ul',{}); items.forEach(x => ul.append(h('li',{}, h('span',{}, typeof x==='string'?x:x.name), (x.organisation?h('span',{class:'org'}, x.organisation):null), (roleLabel && x.role && x.role!=='speaker' && x.role!=='panel') ? h('span',{class:'role'}, x.role) : null))); box.append(ul); detail.append(box); };
    col('Moderators', s.moderators||[]); col('Speakers', speakers, true); col('Panel', panel);
    if (s.footnote_numbers && s.footnote_numbers.length){ const fb = h('div',{style:'grid-column:1/-1'}, h('h4',{}, 'Note'), 'See the footnote on this session ', fnButtons('programme', s.footnote_numbers, detail)); detail.append(fb); }
    const head = h('button',{class:'head','aria-expanded':'false', onclick:()=>{ const o = head.getAttribute('aria-expanded')==='true'; head.setAttribute('aria-expanded',String(!o)); detail.hidden = o; }}, h('div',{}, h('h3',{}, s.title), h('div',{class:'meta'}, (s.moderators&&s.moderators.length? 'Moderated by '+s.moderators.join(' and '):'As printed in the programme'))), h('span',{html:SVG_CHEV}));
    card.append(head, detail); const qs = Q[s.time]; if (qs && qs.length) card.append(h('div',{style:'padding:0 12px 12px'}, slider(qs, {compact:true, label:'Quotations from '+s.title}))); $('#timeline').append(h('div',{class:'sess'}, h('span',{class:'time'}, s.time), card));
  });
  const people = D.programme.people.slice().sort((a,b) => a.name.localeCompare(b.name)); const host = $('#people'), q = $('#people-q'), cnt = $('#people-count');
  function render(){ const t = q.value.trim().toLowerCase(); host.innerHTML=''; let n=0; people.forEach(p => { const hay = (p.name+' '+(p.organisation||'')).toLowerCase(); if (t && !hay.includes(t)) return; n++; const roles = (p.roles||[]).map(r => (r.session_time? r.session_time+' ':'')+r.role); host.append(h('div',{class:'person'}, h('b',{}, p.name), p.organisation?h('span',{class:'org'}, p.organisation):null, h('div',{class:'r'}, roles.map(r => h('span',{}, r))))); }); cnt.textContent = n+' of '+people.length+' people'; }
  q.addEventListener('input', render); render();
  fnFoot('programme', $('#programme-fns'));
}

/* ---------- Lipids ---------- */
if ($('#lipid-chart')){
  const L = D.lipid; if (Q['13:32']) $('#lipids-quotes').append(slider(Q['13:32'], {label:'Quotations from the lipid session'})); $('#lipids-title').textContent = L.chapter_title; document.title = L.chapter_title + ' · ' + R.title; $('#lipids-lead').textContent = L.lead_verbatim;
  $('#lipid-keypoint').innerHTML = esc(L.key_point_verbatim).replace(/^Key point\./, '<b>Key point.</b>') + ' <span class="cite">'+L.key_point_source_page+'</span>';
  L.sections.forEach((sec, si) => { const box = $('#lipid-prose'); box.append(h('h3',{}, sec.heading)); (sec.paragraphs||[]).forEach((p, pi) => { const txt = strip(ptext(p), p.footnote_numbers); const para = h('p',{'data-anchor':'lipids:'+si+':'+pi, 'data-anchor-text':txt}, txt, ' '); const holder = h('div',{}); para.append(fnButtons('lipid', p.footnote_numbers, holder)); para.append(' ', h('span',{class:'cite'}, String(p.source_page||sec.source_page))); box.append(para, holder); }); });
  $('#lipid-not').textContent = L.matters_not_addressed_verbatim;
  const t = $('#lipid-table'); t.append(h('thead',{}, h('tr',{}, ['Company','Programme','Stage as presented','Principal point'].map(c => h('th',{}, c))))); const tb = h('tbody',{}); L.programmes_table.forEach(r => tb.append(h('tr',{}, h('td',{}, h('b',{}, r.company)), h('td',{}, r.programme), h('td',{}, r.stage_as_presented), h('td',{}, r.principal_point)))); t.append(tb);
  fnFoot('lipid', $('#lipid-fns'));
  const S = window.LIPID_SERIES; const host = $('#lipid-chart');
  host.append(h('h3',{}, 'Headline reductions, placed at the time point each was measured'), h('p',{class:'sub'}, 'Filled marks are the figures as the report\'s main text gives them. Hollow marks are the figures the footnotes record from the companies\' own slides. Each study measured against placebo in a different population, which is why the report says they cannot be ranked.'));
  const W=720, H=340, m={t:20,r:30,b:58,l:52}; const x0=m.l, x1=W-m.r, y0=H-m.b, y1=m.t; const xs = v => x0 + (v/52)*(x1-x0); const ys = v => y0 - (v/100)*(y0-y1);
  let s = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Dot chart of headline reductions by time point">';
  [0,25,50,75,100].forEach(v => { s += '<line class="grid" x1="'+x0+'" x2="'+x1+'" y1="'+ys(v)+'" y2="'+ys(v)+'"/><text class="t" x="'+(x0-8)+'" y="'+(ys(v)+4)+'" text-anchor="end">'+v+'%</text>'; });
  [12,24,36,48].forEach(v => { s += '<line class="grid" x1="'+xs(v)+'" x2="'+xs(v)+'" y1="'+y0+'" y2="'+(y0+5)+'"/><text class="t" x="'+xs(v)+'" y="'+(y0+18)+'" text-anchor="middle">week '+v+'</text>'; });
  s += '<line class="grid" x1="'+xs(52)+'" x2="'+xs(52)+'" y1="'+y0+'" y2="'+(y0+5)+'"/><text class="t" x="'+xs(52)+'" y="'+(y0+32)+'" text-anchor="end">12 months</text>';
  s += '<line class="ax" x1="'+x0+'" x2="'+x1+'" y1="'+y0+'" y2="'+y0+'"/><text class="t" x="'+x0+'" y="'+(y0+36)+'">Time point at which the reduction was measured, as stated in the report</text>';
  S.forEach((d,i) => { const cx = xs(d.weeks), cy = ys(d.value), col = d.measure==='Lipoprotein(a)'?'var(--red)':'var(--seq-2)';
    if (d.slide_value!=null){ const sy = ys(d.slide_value); s += '<line x1="'+cx+'" x2="'+cx+'" y1="'+cy+'" y2="'+sy+'" stroke="'+col+'" stroke-width="2"/><circle cx="'+cx+'" cy="'+sy+'" r="6" fill="var(--bg)" stroke="'+col+'" stroke-width="2"/>'; }
    s += '<g class="mark" tabindex="0" data-i="'+i+'"><circle cx="'+cx+'" cy="'+cy+'" r="7" fill="'+col+'" stroke="var(--bg)" stroke-width="2"/><circle cx="'+cx+'" cy="'+cy+'" r="16" fill="transparent"/></g>';
    const lx = cx + (d.label_dx||14), ly = cy + (d.label_dy||4); s += '<text class="lbl" x="'+lx+'" y="'+ly+'" text-anchor="'+(d.label_anchor||'start')+'">'+esc(d.product)+' '+d.value+'%</text><text class="t" x="'+lx+'" y="'+(ly+14)+'" text-anchor="'+(d.label_anchor||'start')+'">'+esc(d.company)+' · '+esc(d.measure)+'</text>'; });
  s += '</svg>'; const svgWrap = h('div',{html:s}); host.append(svgWrap);
  host.append(h('div',{class:'chart-foot'}, h('span',{}, h('i',{style:'display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--red);margin-right:6px'}), 'Lipoprotein(a)'), h('span',{}, h('i',{style:'display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--seq-2);margin-right:6px'}), 'LDL cholesterol'), h('span',{}, 'Hollow mark: figure on the company\'s slide, from the footnotes'), h('span',{class:'cite'}, '12–14')));
  const tip = h('div',{class:'tip'}); host.append(tip);
  svgWrap.querySelectorAll('.mark').forEach(g => { const d = S[+g.dataset.i]; const show = () => { tip.innerHTML = '<b>'+esc(d.company)+', '+esc(d.product)+'</b>'+esc(d.detail); tip.classList.add('on'); const r = g.getBoundingClientRect(), hr = host.getBoundingClientRect(); tip.style.left = Math.min(r.left-hr.left+14, hr.width-270)+'px'; tip.style.top = (r.top-hr.top-10)+'px'; }; g.addEventListener('mouseenter', show); g.addEventListener('focus', show); g.addEventListener('mouseleave', () => tip.classList.remove('on')); g.addEventListener('blur', () => tip.classList.remove('on')); });
}

/* ---------- Dates ---------- */
if ($('#dates-list')){
  const DT = D.dates; $('#dates-lead').textContent = DT.intro_verbatim;
  const host = $('#dates-list'); const rows = []; let company='all';
  const allEntries = DT.groups.flatMap(g => g.entries); const companies = [...new Set(allEntries.map(e => e.company))].sort();
  DT.groups.forEach(g => { const grp = h('div',{class:'dgroup'}); const cnt = h('span',{class:'cnt num'}); grp.append(h('h3',{}, g.heading, cnt)); const rws = h('div',{class:'rows'});
    g.entries.forEach(e => { const holder = h('div',{}); const row = h('div',{class:'drow','data-company':e.company}, h('div',{}, h('div',{class:'w'}, e.when_as_stated)), h('div',{}, h('div',{}, e.event, ' ', fnButtons('dates', e.footnote_numbers, holder)), h('div',{class:'c'}, e.company), holder), h('div',{class:'c', style:'margin-top:0'}, e.basis, ' ', h('span',{class:'cite'}, String(e.source_page)))); rws.append(row); rows.push({row, grp, cnt}); });
    grp.append(rws); host.append(grp); });
  function apply(){ const perGroup = new Map(); rows.forEach(({row,grp,cnt}) => { const show = company==='all'||row.dataset.company===company; row.classList.toggle('hidden', !show); const c = (perGroup.get(grp)||0)+(show?1:0); perGroup.set(grp,c); cnt.textContent = c+' of '+grp.querySelectorAll('.drow').length; grp.style.display = c? '':'none'; }); }
  $('#dates-company').append(h('select',{class:'pill', id:'dates-company-select', 'aria-label':'Filter by company', onchange:e=>{company=e.target.value;apply();}}, h('option',{value:'all'}, 'All companies'), ...companies.map(c => h('option',{value:c}, c))), h('span',{class:'count'}, 'The "Basis" column is the report\'s own: whether the date was spoken, on a slide, or both.'));
  apply(); fnFoot('dates', $('#dates-fns'));

  /* ---- calendar: one .ics file with a reminder a week before each date ----
     Where the report gives only a month, quarter, half or year, the entry goes on the first day of that period
     ("End of" a year goes on 1 December). "Next year" is read against the report's own year, 2026.
     Every entry keeps the wording as stated, and says how its calendar day was chosen. */
  const REPORT_YEAR = 2026, MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const MON = MONTHS.map(m => m[0].toUpperCase()+m.slice(1,3));
  function calDate(when){
    const w = String(when||'').replace(/["\u201c\u201d]/g,'').trim(), lw = w.toLowerCase(); let m;
    if ((m = lw.match(/^(\d{1,2})(?:\s+and\s+(\d{1,2}))?\s+([a-z]+)\s+(\d{4})/)) && MONTHS.includes(m[3])) return { y:+m[4], mo:MONTHS.indexOf(m[3]), d:+m[1], days: m[2] ? (+m[2] - +m[1] + 1) : 1, exact:true };
    if ((m = lw.match(/^([a-z]+)\s+(\d{4})$/)) && MONTHS.includes(m[1])) return { y:+m[2], mo:MONTHS.indexOf(m[1]), d:1, days:1, rule:'the first day of that month' };
    if ((m = lw.match(/^end of (\d{4})$/))) return { y:+m[1], mo:11, d:1, days:1, rule:'1 December, the start of the year\u2019s final month' };
    if ((m = lw.match(/^([1-4])q\s*(\d{4})$/))) return { y:+m[2], mo:(+m[1]-1)*3, d:1, days:1, rule:'the first day of that quarter' };
    if ((m = lw.match(/^([12])h\s*(\d{4})$/))) return { y:+m[2], mo:m[1]==='1'?0:6, d:1, days:1, rule:'the first day of that half-year' };
    if ((m = lw.match(/^(\d{4})$/))) return { y:+m[1], mo:0, d:1, days:1, rule:'the first day of that year' };
    if (/next year/.test(lw)) return { y:REPORT_YEAR+1, mo:0, d:1, days:1, rule:'1 January '+(REPORT_YEAR+1)+' (the report is dated November '+REPORT_YEAR+')' };
    return null;
  }
  const pad = n => String(n).padStart(2,'0');
  const ymd = (y,mo,d) => { const t = new Date(Date.UTC(y,mo,d)); return t.getUTCFullYear()+pad(t.getUTCMonth()+1)+pad(t.getUTCDate()); };
  const pretty = c => c.d+(c.days>1?'\u2013'+(c.d+c.days-1):'')+' '+MON[c.mo]+' '+c.y;
  const icsText = s => String(s).replace(/\\/g,'\\\\').replace(/;/g,'\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
  const fold = line => { const out = []; let cur = '', bytes = 0; for (const ch of line){ const b = new TextEncoder().encode(ch).length; if (bytes + b > 73){ out.push(cur); cur = ' '; bytes = 1; } cur += ch; bytes += b; } out.push(cur); return out.join('\r\n'); };
  const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
  const today = new Date(); const todayKey = today.getFullYear()+pad(today.getMonth()+1)+pad(today.getDate());
  function vevent(e){
    const c = e._cal, start = ymd(c.y,c.mo,c.d), end = ymd(c.y,c.mo,c.d+c.days);
    const title = e.event + ' \u2013 ' + e.company + (c.exact ? '' : ' (expected ' + String(e.when_as_stated).replace(/["\u201c\u201d]/g,'') + ')');
    const desc = [ 'Dates to watch, ' + D.meta.report.title + '.',
      'Stated at the meeting as: ' + String(e.when_as_stated).replace(/["\u201c\u201d]/g,'') + '.',
      c.exact ? 'This is the date given in the report.' : 'The report gives no exact day, so this entry is placed on ' + c.rule + '.',
      'Source: report page ' + e.source_page + '.',
      'Sample data: all organisations, products and events are fictional.' ].join('\n');
    const uid = (e.company+'-'+e.event+'-'+start).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,90) + '@hartwell-cif-2026';
    return ['BEGIN:VEVENT','UID:'+uid,'DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+start,'DTEND;VALUE=DATE:'+end,'SUMMARY:'+icsText(title),'DESCRIPTION:'+icsText(desc),
      'URL:'+location.href.split('#')[0],'TRANSP:TRANSPARENT','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsText('In one week: '+title),'TRIGGER:-P7D','END:VALARM','END:VEVENT'];
  }
  function download(list, name){
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Hartwell Society//Dates to watch//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+icsText(D.meta.report.title+': dates to watch'), ...list.flatMap(vevent), 'END:VCALENDAR'];
    const blob = new Blob([lines.map(fold).join('\r\n')+'\r\n'], { type:'text/calendar;charset=utf-8' });
    const a = h('a',{ href:URL.createObjectURL(blob), download:name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  const picks = new Set(); const eligible = [];
  allEntries.forEach((e, i) => { e._cal = calDate(e.when_as_stated); e._past = e._cal ? ymd(e._cal.y,e._cal.mo,e._cal.d+e._cal.days-1) < todayKey : false; });
  rows.forEach(({row}, i) => { const e = allEntries[i]; const cell = row.firstElementChild; const box = h('div',{class:'cal-cell'});
    if (e._cal && !e._past){ eligible.push({e, row});
      const cb = h('input',{type:'checkbox', 'aria-label':'Add '+e.event+' to the calendar file', onchange:()=>{ cb.checked ? picks.add(e) : picks.delete(e); sync(); }}); e._cb = cb;
      box.append(h('label',{class:'cal-pick'}, cb, h('span',{}, e._cal.exact ? pretty(e._cal) : 'From '+pretty(e._cal))), h('button',{class:'cal-one', title:'Download a calendar entry for this date', onclick:()=>download([e], (e.company+'-'+e.event).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60)+'.ics')}, '+ Add'));
    } else box.append(h('span',{class:'cal-none'}, e._past ? 'Date has passed' : 'No date to add'));
    cell.append(box); });
  const dl = h('button',{class:'btn btn-red', disabled:true, onclick:()=>download([...picks], 'hartwell-dates-to-watch.ics')}, 'Download calendar file');
  const all = h('button',{class:'btn btn-line', onclick:()=>{ const vis = eligible.filter(x => !x.row.classList.contains('hidden')); const every = vis.every(x => picks.has(x.e)); vis.forEach(x => { x.e._cb.checked = !every; every ? picks.delete(x.e) : picks.add(x.e); }); sync(); }}, 'Select all upcoming');
  function sync(){ dl.disabled = !picks.size; dl.textContent = picks.size ? 'Download calendar file ('+picks.size+(picks.size===1?' date':' dates')+')' : 'Download calendar file'; const vis = eligible.filter(x => !x.row.classList.contains('hidden')); all.textContent = vis.length && vis.every(x => picks.has(x.e)) ? 'Clear selection' : 'Select all upcoming'; }
  const calBox = h('div',{class:'cal-box', id:'cal-box'},
    h('div',{}, h('div',{class:'k'}, 'Add to your calendar'), h('div',{class:'cal-txt'}, 'Tick the dates you want to follow, then download one calendar file. It works with Outlook, Apple Calendar and Google Calendar, and each entry comes with a reminder one week before.'),
      h('div',{class:'cal-note'}, 'Where the report gives only a month, quarter or year, the entry goes on the first day of that period and keeps the wording as stated. \u201cNext year\u201d is read as '+(REPORT_YEAR+1)+'.')),
    h('div',{class:'cal-acts'}, all, dl));
  $('#dates-company').after(calBox);
  $('#dates-company-select').addEventListener('change', sync);
  sync();
}

/* ---------- Developments ---------- */
if ($('#developments-list')){
  const DV = D.developments; $('#developments-lead').textContent = DV.intro_verbatim; if (window.DEV_ADDON_NOTE) $('#developments-lead').before(h('p',{class:'addon-note'}, window.DEV_ADDON_NOTE));
  DV.sections.forEach(sec => { const box = h('div',{}, h('h3',{style:'font-size:1rem;margin-bottom:12px'}, sec.heading)); const grid = h('div',{class:'grid-2'}); sec.items.forEach((it, ii) => grid.append(h('div',{class:'dev'}, h('div',{class:'k'}, [it.company, it.date_mentioned].filter(Boolean).join(' · ')), h('h4',{}, it.label), h('p',{'data-anchor':'developments:'+String(it.label||it.company||ii).replace(/\W+/g,'-').toLowerCase(), 'data-anchor-text':it.text_verbatim}, it.text_verbatim, ' ', h('span',{class:'cite'}, String(it.source_page||17)))))); box.append(grid); $('#developments-list').append(box); });
}

/* ---------- Cardio ---------- */
if ($('#cardio-pres')){
  const C = D.cardio; if (Q['14:28']) $('#cardio-quotes').append(slider(Q['14:28'], {label:'Quotations from the cardiomyopathy session'})); $('#cardio-title').textContent = C.chapter_title; document.title = C.chapter_title + ' · ' + R.title; $('#cardio-lead').textContent = C.lead_verbatim;
  C.presentations.forEach((p, pi) => { const card = h('div',{class:'pcard'}); card.append(h('div',{class:'top'}, h('h3',{}, p.speaker), h('span',{class:'org'}, p.company)));
    if (p.product) card.append(h('p',{class:'prod'}, h('b',{}, p.product), p.product_description_verbatim? ' — '+p.product_description_verbatim : ''));
    const trials = (p.trials||[]).filter(t => t.name); if (trials.length){ const tm = h('div',{class:'trials-mini'}); trials.forEach(t => tm.append(h('div',{class:'tm'}, h('b',{}, t.name), h('span',{}, [t.phase, t.n_patients!=null? (/^\d[\d,]*$/.test(String(t.n_patients)) ? t.n_patients+' patients' : String(t.n_patients)) : null].filter(Boolean).join(' · '))))); card.append(tm); }
    const holder = h('div',{}); const ptxt = strip(p.paragraph_verbatim, p.footnote_numbers); const text = h('p',{class:'text', 'data-anchor':'cardio:'+pi, 'data-anchor-text':ptxt}, ptxt, ' '); text.append(fnButtons('cardio', p.footnote_numbers, holder), ' ', h('span',{class:'cite'}, String(p.source_page||19))); card.append(text, holder); $('#cardio-pres').append(card); });
  const holder = h('div',{}); (C.discussion.paragraphs||[]).forEach((p,i) => { const nums = (p && p.footnote_numbers) || (i===(C.discussion.paragraphs.length-1) ? C.discussion.footnote_numbers : []); const dtxt = strip(ptext(p), nums); const para = h('p',{'data-anchor':'cardio:discussion:'+i, 'data-anchor-text':dtxt}, dtxt, ' '); para.append(fnButtons('cardio', nums, holder)); $('#cardio-disc').append(para); }); $('#cardio-disc').append(holder);
  const g = C.guest_speaker; $('#cardio-guest-h').textContent = 'Guest speaker: '+g.name; const q = (g.quotes||[])[0]; if (q) $('#cardio-quote').append('“'+q.replace(/^"|"$/g,'')+'”', h('cite',{}, g.name+(g.age?', '+g.age:'')+(g.country?', '+g.country:'')+', speaking by video link'));
  const gh = h('div',{}); const gtxt = strip(g.paragraph_verbatim, g.footnote_numbers); const gp = h('p',{'data-anchor':'cardio:guest', 'data-anchor-text':gtxt}, gtxt, ' '); gp.append(fnButtons('cardio', g.footnote_numbers, gh), ' ', h('span',{class:'cite'}, '21')); $('#cardio-guest').append(gp, gh);
  fnFoot('cardio', $('#cardio-fns'));
  const S = window.CARDIO_SERIES; const host = $('#cardio-chart');
  host.append(h('h3',{}, 'How many patients stood behind each result'), h('p',{class:'sub'}, 'Patient numbers as given in the chapter for each study. The report describes the session\'s evidence as early: the largest gene therapy cohort was 12 patients.'));
  const max = Math.max(...S.map(d => d.n)); const bars = h('div',{class:'bars'}); S.forEach(d => bars.append(h('div',{class:'bar'+(d.highlight?' hl':''), title:d.detail}, h('div',{class:'k'}, h('b',{}, d.study), h('span',{}, d.company+' · '+d.phase)), h('div',{class:'track'}, h('div',{class:'fill', style:'width:'+(d.n/max*100).toFixed(1)+'%'})), h('div',{class:'v num'}, d.n_as_printed))));
  host.append(bars, h('div',{class:'chart-foot'}, h('span',{}, h('i',{style:'display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--red);margin-right:6px'}), 'Gene therapy'), h('span',{}, h('i',{style:'display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--seq-2);margin-right:6px'}), 'Other'), h('span',{class:'cite'}, '19–20')));
}

/* ---------- Trials ---------- */
if ($('#trials-table')){
  const T = D.trials; $('#trials-lead').textContent = T.intro_verbatim;
  const cols = [['study','Study'],['sponsor','Sponsor on the registry'],['registry_identifier','Registry identifier'],['phase','Phase'],['status','Status']];
  const table = $('#trials-table'); const q = $('#trials-q'); const cnt = $('#trials-count'); let sortKey=null, dir='asc', status='all';
  const thead = h('thead',{}); const tr = h('tr',{}); cols.forEach(([k,l]) => { const b = h('button',{html:esc(l)+' '+SVG_SORT, onclick:()=>{ if (sortKey===k) dir = dir==='asc'?'desc':'asc'; else {sortKey=k; dir='asc';} render(); }}); tr.append(h('th',{}, b)); }); thead.append(tr); table.append(thead);
  const tbody = h('tbody',{}); table.append(tbody); const statuses = [...new Set(T.trials.map(t => t.status))];
  function render(){ const t = q.value.trim().toLowerCase(); let rows = T.trials.filter(r => (status==='all'||r.status===status) && (!t || (r.study+' '+r.sponsor+' '+r.registry_identifier+' '+r.phase).toLowerCase().includes(t)));
    if (sortKey) rows = rows.slice().sort((a,b) => String(a[sortKey]).localeCompare(String(b[sortKey]), undefined, {numeric:true}) * (dir==='asc'?1:-1));
    tbody.innerHTML=''; rows.forEach(r => tbody.append(h('tr',{}, h('td',{}, h('b',{}, r.study)), h('td',{}, r.sponsor), h('td',{class:'mono'}, r.registry_identifier), h('td',{}, r.phase), h('td',{}, h('span',{class:'status','data-s':r.status}, r.status)))));
    cnt.textContent = rows.length+' of '+T.trials.length+' studies'; thead.querySelectorAll('button').forEach((b,i) => { if (cols[i][0]===sortKey) b.setAttribute('data-dir', dir); else b.removeAttribute('data-dir'); }); }
  function press(el){ document.querySelectorAll('#trials-status .pill').forEach(p => p.setAttribute('aria-pressed', String(p===el))); }
  $('#trials-status').append(h('button',{class:'pill','aria-pressed':'true', onclick:e=>{status='all';press(e.target);render();}}, 'All'), ...statuses.map(s => h('button',{class:'pill','aria-pressed':'false', onclick:e=>{status=s;press(e.target);render();}}, s)));
  q.addEventListener('input', render); render();
  (T.not_matched||[]).forEach(n => $('#trials-unmatched').append(h('div',{class:'dev'}, h('h4',{}, n.lead_phrase ?? n.label_bold), h('p',{}, n.text_verbatim))));
}

/* ---------- Method ---------- */
if ($('#pipe')){
  const M = D.method; $('#method-lead').textContent = M.intro_verbatim;
  M.sections.forEach((sec, i) => { const box = i < Math.ceil(M.sections.length/2) ? $('#method-prose-a') : $('#method-prose-b'); box.append(h('h3',{}, sec.heading)); if (/public sources/i.test(sec.heading) && window.ADDON_NOTE) box.append(h('p',{class:'addon-note'}, window.ADDON_NOTE)); (sec.paragraphs||[]).forEach(p => box.append(h('p',{}, ptext(p)))); box.append(h('span',{class:'cite'}, String(sec.source_page||22))); });
  window.PIPELINE.forEach(st => $('#pipe').append(h('div',{class:'step'+(st.addon?' addon':'')}, st.addon && window.ADDON_NOTE ? h('p',{class:'addon-note'}, window.ADDON_NOTE) : null, h('h4',{}, st.title), h('p',{}, st.text), st.value? h('div',{class:'v num'}, st.value, h('small',{}, st.value_label)) : null)));
  const V = window.VERIFICATION; const host = $('#verif-chart');
  host.append(h('h3',{}, 'What the '+V.checks+' checks against public sources found'), h('p',{class:'sub'}, V.sub));
  const seg = h('div',{class:'seg'}); const leg = h('div',{class:'seg-legend'}); V.parts.forEach(p => { seg.append(h('div',{style:'flex:'+p.n+';background:'+p.color, title:p.label+': '+p.n}, h('span',{}, p.n))); leg.append(h('span',{}, h('i',{style:'background:'+p.color}), p.label+' ('+p.n+')')); });
  host.append(seg, leg, h('p',{class:'sub', style:'margin-top:12px'}, V.foot), h('div',{class:'chart-foot'}, h('span',{class:'cite'}, '23')));
  const all = []; Object.keys(FN).forEach(ch => (FN[ch]||[]).forEach(f => all.push({ch, f})));
  $('#disc-lead').textContent = 'The report uses footnotes for one purpose: to record a discrepancy. The '+all.length+' footnotes in this sample are gathered here with the statement each is attached to.';
  const host2 = $('#disc-list'); let ch='all';
  const cards = all.map(({ch,f}) => { const anchored = typeof f.anchored_to==='string'? f.anchored_to : f.anchored_to? Object.values(f.anchored_to).filter(Boolean).join(' · ') : ''; const el = h('div',{class:'dcard','data-ch':ch}, h('div',{class:'ctx'}, h('span',{}, CHAPTER_NAME[ch]+' · footnote '+f.number), h('span',{class:'cite'}, String(f.source_page))), anchored? h('div',{class:'stmt'}, h('b',{}, 'Attached to: '), anchored):null, h('div',{class:'note'}, f.text_verbatim)); host2.append(el); return el; });
  function apply(){ cards.forEach(el => el.classList.toggle('hidden', !(ch==='all'||el.dataset.ch===ch))); document.querySelectorAll('#disc-filters .pill').forEach(p => p.setAttribute('aria-pressed', String(p.dataset.v===ch))); }
  $('#disc-filters').append(h('button',{class:'pill','data-v':'all', onclick:()=>{ch='all';apply();}}, 'All '+all.length), ...Object.keys(FN).filter(k => (FN[k]||[]).length).map(k => h('button',{class:'pill','data-v':k, onclick:()=>{ch=k;apply();}}, CHAPTER_NAME[k]+' ('+FN[k].length+')'))); apply();
}
})();
