(function(){
'use strict';
/* Guided tours for first-time visitors: a tour of the site, and a tour of the review-and-approve process.
   Steps can span pages; progress is kept in localStorage so the tour resumes after each page load.
   Everything degrades quietly if storage is unavailable (the tour then simply stays on one page). */
const norm = p => { p = (p || '').replace(/[?#].*$/,'').replace(/\.html$/,''); return p === '' ? 'index' : p; };
const HERE = norm(location.pathname.split('/').pop());
const onPage = p => norm(p) === HERE;
const href = p => p;
const ls = { get(k, d){ try { const v = localStorage.getItem('hartwell.'+k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } },
             set(k, v){ try { if (v === undefined) localStorage.removeItem('hartwell.'+k); else localStorage.setItem('hartwell.'+k, JSON.stringify(v)); } catch(e){} } };
const h = (tag, attrs, ...kids) => { const el = document.createElement(tag); for (const k in (attrs||{})){ const v = attrs[k]; if (v == null || v === false) continue; if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (k === 'html') el.innerHTML = v; else el.setAttribute(k, v); } kids.flat().forEach(c => c != null && el.append(c.nodeType ? c : document.createTextNode(c))); return el; };
const click = sel => { const el = document.querySelector(sel); if (el) el.click(); };

/* ---------- the two tours ---------- */
const SITE = [
  { page:'index.html', title:'Welcome', body:[
      'This is a demonstration of a report microsite, built from a single 25-page PDF: the report of proceedings of a meeting that never took place.',
      'The society, speakers, companies, products and figures are all sample data. The format is exactly what we would build from your own congress recordings.',
      'The tour takes about two minutes.'] },
  { page:'index.html', sel:'.phero .inner', title:'One report, taken apart', body:[
      'Every passage, figure and footnote on this site comes from the report, and each one carries the PDF page it came from.',
      'Nothing is written for the site that the report does not say.'] },
  { page:'index.html', sel:'.site-head .brand', title:'Your identity, not ours', body:[
      'The typeface, colours, logo and photography are all interchangeable.',
      'This sample takes its navy, red and IBM Plex type from the sample report. Yours would carry your society’s own branding, with photographs from your congress or your own library.'] },
  { page:'index.html', sel:'.site-head .acts .btn-red', title:'The full report, always to hand', body:[
      'The original PDF can be downloaded from every page, for readers who want the whole document.'] },
  { page:'index.html', sel:'#home-quotes', title:'A voice from every session', body:[
      'Each session has a short slider of speaker quotations, so the site reads like the meeting rather than a summary of it.'] },
  { page:'index.html', sel:'.ask[data-ask]', title:'Ask the report', body:[
      'Readers can put a question to the record. Answers are drawn only from the report’s own text, and each comes with its page reference.',
      'In production this connects to an AI model that can answer only from the verified record.'] },
  { page:'findings.html', sel:'#findings-filters', title:'Twelve principal findings', body:[
      'The headline findings, filterable by session, with the speaker and page on every one.',
      'Open “Figures in this finding” on any card to see each number alongside what it measures.'] },
  { page:'findings.html', sel:'.finding .fn-btn', title:'Footnotes that matter', body:[
      'A small marker means the record holds a discrepancy: a speaker said one figure while the slide showed another, or two speakers disagreed.',
      'Click it to see the other version. These are the places a speaker is most likely to want to check.'] },
  { page:'programme.html', sel:'#timeline', title:'The whole meeting at a glance', body:[
      'Every session in order, with its moderators, speakers and panel.'] },
  { page:'programme.html', sel:'#people-q', title:'Find anyone', body:[
      'Type a name or a company to see every role that person played across the meeting.'] },
  { page:'lipids.html', sel:'#lipid-chart', title:'Charts built from the record', body:[
      'Every value on a chart is checked against the report text when the site is built.',
      'If a number cannot be found word for word in the PDF, the site refuses to build.'] },
  { page:'dates.html', sel:'#dates-list', title:'Dates to watch', body:[
      'Every date a speaker gave for a result, a filing or a launch, gathered into one calendar and filterable by company.',
      'Each is given exactly as it was stated, from “late next year” to a named quarter.'] },
  { page:'trials.html', sel:'#trials-table', title:'Every trial mentioned', body:[
      'A searchable register of the trials referred to at the meeting, with the sponsor and where each was discussed.'] },
  { page:'trials.html', sel:'.site-head [data-search-open]', title:'Search everything', body:[
      'Search covers every passage, table row and footnote, and each result links straight to its place on the site.'] },
  { page:'method.html', sel:'#method-lead', title:'How the record is made', body:[
      'This is the painstaking part. Each recording is transcribed and then checked against the video.',
      'Speakers are identified from the on-screen captions, and the text of every slide is read from the footage, so names and figures are checked against what was shown.',
      'Wherever the audio is unclear, a person listens to the clip and decides. Each talk is then read on its own, so one speaker’s words cannot drift into another’s.',
      'Every statement is traced to a speaker, a time in the recording and the exact words, and an automated check confirms that every figure matches.'] },
  { page:'method.html', sel:'.rv-fab', title:'Checked by the people who spoke', body:[
      'Before anything is published, speakers and organisers can review their own sections, comment, and propose edits for an administrator to approve.',
      'Everything you have seen is sample data, and the look is fully interchangeable.'],
    buttons:[['See the review process', () => start('review')], ['Finish', () => end()]] }
];

const REVIEW = [
  { page:'findings.html', session:null, sel:'.rv-fab', title:'Review before publication', body:[
      'Speakers and organisers check their own sections before the report is published. They start here, with “Review this report”.'] },
  { page:'findings.html', session:null, before:() => click('.rv-fab'), sel:'.rv-modal.on .rv-dialog', title:'Sign in with an email address', body:[
      'Reviewers enter their email address and a one-time code sent to it. There are no passwords to remember, and every comment is tied to that address.',
      'On this sample the code is simulated.'] },
  { page:'findings.html', session:'reviewer', sel:'.rv-bar', title:'Review mode', body:[
      'The bar shows who is signed in and who else is reviewing at the same moment. Several people can review at once.'] },
  { page:'findings.html', session:'reviewer', sel:'[data-anchor="findings:finding-5"]', title:'Choose any passage', body:[
      'Every passage on the site can be selected. Click one to comment on it, or to propose new wording.'] },
  { page:'findings.html', session:'reviewer', before:() => { click('[data-anchor="findings:finding-5"]'); setTimeout(() => { const t = document.querySelectorAll('.rv-panel .rv-tabs button'); if (t[1]) t[1].click(); }, 60); },
    sel:'.rv-panel.on', title:'Propose an edit', body:[
      'Reviewers edit the text directly and give a reason. The submission is marked “For review”.',
      'Nothing on the site changes until an administrator approves it.'] },
  { page:'review.html', session:'admin', sel:'.rv-stats', title:'The administrator’s queue', body:[
      'Everything waiting, approved and declined, from every reviewer, in one place.',
      'On this sample the administrator password is “yourreport”.'] },
  { page:'review.html', session:'admin', before:() => { const d = document.querySelector('#rv-queue .rv-item .diff'); const it = d ? d.closest('.rv-item') : document.querySelector('#rv-queue .rv-item'); if (it) it.classList.add('tour-pick'); }, sel:'.tour-pick', title:'Approve or decline', body:[
      'Each submission shows who sent it and which passage it concerns. A proposed edit shows the exact change, word by word.',
      'One click approves or declines it, and each decision is time-stamped.'] },
  { page:'findings.html', session:'restore', sel:'.rv-edit', title:'Approved edits go live', body:[
      'An approved edit appears with a fine green underline. Clicking it shows the original wording, so the record of what was said on the day is never lost.'] },
  { page:'findings.html', session:'restore', title:'Try it yourself', body:[
      'Click “Review this report”. Any email address and any six digits will sign you in as a speaker, and the administrator password is “yourreport”.',
      'Your comments are stored only in this browser, and all the data on this site is sample data.'],
    buttons:[['Tour the site', () => start('site')], ['Finish', () => end()]] }
];
const TOURS = { site: SITE, review: REVIEW };
const NAMES = { site: 'Site tour', review: 'Review process' };

/* ---------- engine ---------- */
let mask, hole, card, cur = null, target = null, raf = 0;
function sessionFor(want){
  if (want === undefined) return;
  let s;
  if (want === 'restore') s = ls.get('tourPrevSession', null);
  else if (want === 'reviewer') s = { role:'reviewer', email:'r.adeyemi@vantrelbio.example', since:new Date().toISOString() };
  else if (want === 'admin') s = { role:'admin', email:'admin', since:new Date().toISOString() };
  else s = null;
  const now = ls.get('session', null);
  const same = (now && s) ? (now.role === s.role && now.email === s.email) : (!now && !s);
  if (!same){ if (s) ls.set('session', s); else ls.set('session', undefined); return true; }
  return false;
}
function start(id){
  ls.set('tourSeen', true);
  if (!cur) ls.set('tourPrevSession', ls.get('session', null));
  go(id, 0);
}
function go(id, i){
  const steps = TOURS[id]; if (!steps || i < 0 || i >= steps.length) return end();
  const s = steps[i]; ls.set('tour', { id, i });
  const changed = sessionFor(s.session);
  if (!onPage(s.page) || changed){ location.href = href(s.page); return; }
  cur = { id, i }; show(s);
}
function end(){
  const prev = ls.get('tourPrevSession', null); ls.set('tour', undefined); ls.set('tourPrevSession', undefined);
  const now = ls.get('session', null);
  const changed = JSON.stringify(now) !== JSON.stringify(prev);
  if (changed){ if (prev) ls.set('session', prev); else ls.set('session', undefined); }
  cur = null; teardown();
  if (changed) location.reload();
}
function teardown(){ cancelAnimationFrame(raf); [mask, hole, card].forEach(e => e && e.remove()); mask = hole = card = null; target = null; document.removeEventListener('keydown', onKey); }
function onKey(e){ if (!cur) return; if (e.key === 'Escape') end(); else if (e.key === 'ArrowRight') go(cur.id, cur.i+1); else if (e.key === 'ArrowLeft' && cur.i > 0) go(cur.id, cur.i-1); }
function waitFor(sel, ms){ return new Promise(res => { const t0 = performance.now(); (function poll(){ const el = sel && document.querySelector(sel); if (el && el.getBoundingClientRect().height > 0) return res(el); if (!sel || performance.now() - t0 > ms) return res(null); setTimeout(poll, 80); })(); }); }
async function show(s){
  teardown();
  mask = h('div', { class:'tour-mask' }); hole = h('div', { class:'tour-hole' }); document.body.append(mask, hole);
  document.addEventListener('keydown', onKey);
  if (s.before) { try { s.before(); } catch(e){} }
  const el = await waitFor(s.sel, 2600);
  if (!cur) return;
  target = el;
  if (el){ el.scrollIntoView({ block: el.getBoundingClientRect().height > innerHeight*0.6 ? 'start' : 'center', behavior: 'smooth' }); await new Promise(r => setTimeout(r, 420)); }
  const steps = TOURS[cur.id];
  const btns = h('div', { class:'tour-btns' });
  if (s.buttons) s.buttons.forEach(([label, fn], k) => btns.append(h('button', { class: 'btn '+(k === 0 ? 'btn-red' : 'btn-line'), onclick: fn }, label)));
  else {
    if (cur.i > 0) btns.append(h('button', { class:'btn btn-line', onclick:() => go(cur.id, cur.i-1) }, 'Back'));
    btns.append(h('button', { class:'btn btn-red', onclick:() => go(cur.id, cur.i+1) }, cur.i === steps.length-1 ? 'Finish' : 'Next'));
  }
  card = h('div', { class:'tour-card'+(el ? '' : ' centred'), role:'dialog', 'aria-live':'polite', 'aria-label': NAMES[cur.id] },
    h('div', { class:'tour-top' }, h('span', { class:'tour-k' }, NAMES[cur.id]+' · '+(cur.i+1)+' of '+steps.length), h('button', { class:'tour-x', 'aria-label':'End the tour', onclick:() => end() }, '×')),
    h('h3', {}, s.title), ...s.body.map(p => h('p', {}, p)), btns);
  document.body.append(card);
  hole.classList.toggle('none', !el);
  place(); card.querySelector('.tour-btns .btn-red')?.focus({ preventScroll:true });
  const loop = () => { place(); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop);
}
function place(){
  if (!card) return;
  const pad = 8, vw = innerWidth, vh = innerHeight, mobile = vw < 720;
  if (!target){ hole.style.cssText = ''; return; }
  const r = target.getBoundingClientRect();
  const top = Math.max(r.top - pad, 4), bottom = Math.min(r.bottom + pad, vh - 4);
  hole.style.cssText = 'top:'+top+'px;left:'+Math.max(r.left-pad, 4)+'px;width:'+(Math.min(r.right+pad, vw-4) - Math.max(r.left-pad, 4))+'px;height:'+Math.max(bottom - top, 0)+'px';
  if (mobile){ card.style.cssText = ''; return; }
  const cw = card.offsetWidth, ch = card.offsetHeight, gap = 14;
  let y = (vh - bottom > ch + gap + 8) ? bottom + gap : (top > ch + gap + 8 ? top - gap - ch : Math.max(12, vh - ch - 12));
  let x = Math.min(Math.max(r.left, 12), vw - cw - 12);
  card.style.cssText = 'top:'+Math.round(y)+'px;left:'+Math.round(x)+'px';
}

/* ---------- entry points ---------- */
function launcherButton(){
  const acts = document.querySelector('.site-head .acts'); if (!acts || acts.querySelector('.tour-open')) return;
  const b = h('button', { class:'btn btn-ghost tour-open', 'aria-label':'Guided tour', onclick:() => welcome(true),
    html:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M10.6 5.4L9 9 5.4 10.6 7 7z"/></svg><span class="tl">Tour</span>' });
  acts.prepend(b);
  document.querySelectorAll('[data-tour-open]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); welcome(true); }));
}
function welcome(force){
  if (document.querySelector('.tour-welcome')) return;
  ls.set('tourSeen', true);
  const w = h('div', { class:'tour-welcome', role:'dialog', 'aria-label':'Guided tours' },
    h('div', { class:'tour-top' }, h('span', { class:'tour-k' }, 'Sample report · guided tours'), h('button', { class:'tour-x', 'aria-label':'Close', onclick:() => w.remove() }, '×')),
    h('h3', {}, force ? 'Take a guided tour' : 'New here?'),
    h('p', {}, 'This microsite was built from a single sample report. All of its data is invented, and its fonts, colours, logo and photographs are interchangeable.'),
    h('div', { class:'tour-choices' },
      h('button', { class:'tour-choice', onclick:() => { w.remove(); start('site'); } }, h('b', {}, 'Tour the site'), h('span', {}, 'What the site does with the report, and how the record is made. About two minutes.')),
      h('button', { class:'tour-choice', onclick:() => { w.remove(); start('review'); } }, h('b', {}, 'See the review process'), h('span', {}, 'How speakers propose edits and an administrator approves them. About one minute.'))),
    h('button', { class:'tour-later', onclick:() => w.remove() }, force ? 'Close' : 'Not now'));
  document.body.append(w);
}

function boot(){
  launcherButton();
  const t = ls.get('tour', null);
  if (t && TOURS[t.id]){ const s = TOURS[t.id][t.i]; if (s && onPage(s.page)) { cur = { id:t.id, i:t.i }; setTimeout(() => show(s), 250); return; } }
  if (!ls.get('tourSeen', false) && !document.querySelector('#rv-queue')) setTimeout(() => welcome(false), 1100);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
