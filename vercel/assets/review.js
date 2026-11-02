(function(){
'use strict';
/* Mock review facility: reviewer sign-in (email + code, not verified), admin sign-in (password), comments and
   proposed edits stored in this browser only, seeded with MOCK_SUGGESTIONS. No server. */
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function h(tag, attrs, ...kids){ const el = document.createElement(tag); if (attrs) for (const k in attrs){ const v = attrs[k]; if (v==null||v===false) continue; if (k==='class') el.className = v; else if (k==='html') el.innerHTML = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v===true?'':v); } for (const kid of kids.flat()) if (kid!=null && kid!==false) el.append(kid.nodeType ? kid : document.createTextNode(kid)); return el; }
const HERE = (function(p){ p = (p || 'index.html').replace(/[?#].*$/,''); return /\.html$/.test(p) ? p : p + '.html'; })(location.pathname.split('/').pop());
const ADMIN_PASSWORD = 'yourreport';
const store = { get(k, d){ try { const v = localStorage.getItem('hartwell.'+k); return v==null ? d : JSON.parse(v); } catch(e){ return d; } }, set(k, v){ try { localStorage.setItem('hartwell.'+k, JSON.stringify(v)); } catch(e){} } };
function allSuggestions(){ const seed = (window.MOCK_SUGGESTIONS||[]).map(s => ({...s})); const local = store.get('suggestions', []); const over = store.get('overrides', {}); const all = [...seed, ...local]; all.forEach(s => { if (over[s.id]) Object.assign(s, over[s.id]); }); return all.sort((a,b) => (b.created||'').localeCompare(a.created||'')); }
function saveNew(s){ const local = store.get('suggestions', []); local.push(s); store.set('suggestions', local); }
function decide(id, status, note){ const over = store.get('overrides', {}); over[id] = { status, decided: new Date().toISOString(), decided_by:'admin', decision_note: note||'' }; store.set('overrides', over); }
function session(){ return store.get('session', null); }
function setSession(s){ store.set('session', s); }
const fmt = d => { try { return new Date(d).toLocaleString('en-GB', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}); } catch(e){ return d; } };
function diffHtml(a, b){ // word-level: common prefix/suffix, mark the middle
  const A = a.split(/(\s+)/), B = b.split(/(\s+)/); let i=0; while (i<A.length && i<B.length && A[i]===B[i]) i++; let j=0; while (j<A.length-i && j<B.length-i && A[A.length-1-j]===B[B.length-1-j]) j++;
  return esc(A.slice(0,i).join('')) + '<del>'+esc(A.slice(i, A.length-j).join(''))+'</del> <ins>'+esc(B.slice(i, B.length-j).join(''))+'</ins>' + esc(A.slice(A.length-j).join('')); }

/* ---- apply approved edits and badges to the page ---- */
function anchorEl(anchor){ return document.querySelector('[data-anchor="'+CSS.escape(anchor)+'"]'); }
function applyApproved(){ allSuggestions().filter(s => s.status==='approved' && s.kind==='edit' && s.page===HERE).forEach(s => { const el = anchorEl(s.anchor); if (!el) return; const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node; while ((node = walker.nextNode())){ const i = node.data.indexOf(s.original); if (i<0) continue; const before = node.data.slice(0,i), after = node.data.slice(i+s.original.length); const span = h('span',{class:'rv-edit', title:'Edited after review. Click to see the original.', onclick:e=>{e.stopPropagation(); span.classList.toggle('show');}}, h('del',{}, s.original), s.proposed); node.replaceWith(before, span, after); break; } }); }
function badge(status){ return h('span',{class:'rv-badge '+status}, status==='review'?'For review':status==='approved'?'Edited':'Declined'); }
function applyBadges(){ document.querySelectorAll('.rv-badge').forEach(b => b.remove()); if (!document.body.classList.contains('reviewing')) return; const by = {}; allSuggestions().filter(s => s.page===HERE).forEach(s => { (by[s.anchor] = by[s.anchor]||[]).push(s); }); Object.keys(by).forEach(a => { const el = anchorEl(a); if (!el) return; const pending = by[a].filter(s => s.status==='review').length; const b = h('span',{class:'rv-badge '+(pending?'review':'approved')}, (pending? pending+' for review' : by[a].length+' reviewed')); el.append(b); }); }

/* ---- sign-in modal ---- */
let modal;
function openSignIn(){
  if (!modal){ modal = h('div',{class:'rv-modal', onclick:e=>{ if (e.target===modal) modal.classList.remove('on'); }}); document.body.append(modal); }
  modal.innerHTML=''; modal.classList.add('on');
  const dlg = h('div',{class:'rv-dialog', role:'dialog', 'aria-modal':'true'});
  const tabs = h('div',{class:'rv-tabs'}); const body = h('div',{});
  const tab = (name, fn) => { const b = h('button',{'aria-selected':'false', onclick:()=>{ tabs.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected','false')); b.setAttribute('aria-selected','true'); body.innerHTML=''; fn(body); }}, name); tabs.append(b); return b; };
  const reviewerTab = tab('Speaker or organiser', b => {
    const email = h('input',{type:'email', id:'rv-email', placeholder:'you@organisation.example', autocomplete:'email'}); const err = h('div',{class:'rv-err'});
    b.append(h('h3',{}, 'Sign in to review'), h('p',{}, 'Enter the email address the society holds for you. A one-time code is sent to that address.'), h('label',{for:'rv-email'}, 'Email address'), email, err,
      h('div',{class:'row'}, h('button',{class:'btn btn-red', onclick:()=>{ const v = email.value.trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){ err.textContent = 'Enter a full email address.'; return; } step2(v); }}, 'Send code')));
    function step2(v){ b.innerHTML=''; const code = h('input',{type:'text', inputmode:'numeric', maxlength:'6', class:'rv-code', id:'rv-code', placeholder:'••••••', autocomplete:'one-time-code'}); const err2 = h('div',{class:'rv-err'});
      b.append(h('h3',{}, 'Check your email'), h('p',{}, 'We sent a six-digit code to '+v+'. It is valid for ten minutes.'), h('label',{for:'rv-code'}, 'Code'), code, err2, h('div',{class:'row'}, h('button',{class:'btn btn-line', onclick:()=>{ reviewerTab.click(); }}, 'Back'), h('button',{class:'btn btn-red', onclick:()=>{ if (!/^\d{6}$/.test(code.value.trim())){ err2.textContent = 'Enter the six digits from the email.'; return; } setSession({role:'reviewer', email:v, since:new Date().toISOString()}); modal.classList.remove('on'); enterReview(); }}, 'Verify and sign in')));
      code.focus(); }
  });
  tab('Administrator', b => {
    const pw = h('input',{type:'password', id:'rv-pw', placeholder:'Password', autocomplete:'current-password'}); const err = h('div',{class:'rv-err'});
    b.append(h('h3',{}, 'Administrator sign-in'), h('p',{}, 'Administrators approve or decline the comments and edits that reviewers submit.'), h('label',{for:'rv-pw'}, 'Password'), pw, err, h('div',{class:'row'}, h('button',{class:'btn btn-red', onclick:()=>{ if (pw.value!==ADMIN_PASSWORD){ err.textContent = 'That password is not recognised.'; return; } setSession({role:'admin', email:'admin', since:new Date().toISOString()}); modal.classList.remove('on'); location.href = 'review.html'; }}, 'Sign in')));
    pw.addEventListener('keydown', e => { if (e.key==='Enter') b.querySelector('.btn-red').click(); });
  });
  dlg.append(tabs, body, h('p',{style:'font-size:.72rem;color:var(--muted);margin-top:14px'}, 'Sample site: sign-in is simulated. Any six-digit code is accepted and nothing is sent.'));
  modal.append(dlg); reviewerTab.click();
}

/* ---- reviewer mode on content pages ---- */
let panel, fab, bar;
function enterReview(){ const s = session(); if (!s) return; document.body.classList.add('reviewing'); fab.classList.add('on'); fab.lastChild.textContent = s.role==='admin' ? 'Admin · review queue' : 'Reviewing as '+s.email;
  if (!bar){ bar = h('div',{class:'rv-bar wrap'+(s.role==='admin'?' admin':'')}); document.body.prepend(bar); }
  bar.innerHTML = ''; bar.append((s.role==='admin' ? 'Signed in as administrator. ' : 'Signed in as '+s.email+'. Click any passage to comment on it or propose an edit. Submissions are marked for review until an administrator approves them. '), h('button',{onclick:()=>{ setSession(null); location.reload(); }}, 'Sign out'), (s.role==='admin'? h('button',{onclick:()=>location.href='review.html'}, 'Open the review queue') : null));
  const pres = h('div',{class:'rv-presence'}, h('i'), 'Also reviewing now: ', (window.MOCK_PRESENCE||[]).filter(e => e!==s.email).join(', ')); bar.append(pres);
  applyBadges();
  document.querySelectorAll('[data-anchor]').forEach(el => { el.addEventListener('click', onAnchorClick); });
}
function onAnchorClick(e){ if (e.target.closest('a, button, .fn-panel, .rv-edit')) return; e.preventDefault(); openPanel(this); }
function openPanel(el){
  const s = session(); if (!s) return; const anchor = el.dataset.anchor; const original = el.dataset.anchorText || el.textContent.replace(/\s+/g,' ').trim();
  if (!panel){ panel = h('div',{class:'rv-panel'}); document.body.append(panel); }
  panel.innerHTML=''; panel.classList.add('on');
  const close = h('button',{class:'btn btn-line', style:'float:right;padding:4px 10px', onclick:()=>panel.classList.remove('on')}, 'Close');
  const tabs = h('div',{class:'rv-tabs'}); const body = h('div',{}); panel.append(close, h('h4',{}, 'This passage'), h('div',{class:'orig'}, original.slice(0,600)), tabs, body);
  const mk = (name, fn) => { const b = h('button',{'aria-selected':'false', onclick:()=>{ tabs.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected','false')); b.setAttribute('aria-selected','true'); body.innerHTML=''; fn(); }}, name); tabs.append(b); return b; };
  const t1 = mk('Comment', () => { const ta = h('textarea',{placeholder:'Your comment for the editors', id:'rv-c'}); body.append(h('label',{style:'display:block;font-size:.78rem;font-weight:600;color:var(--muted);margin:10px 0 6px'}, 'Comment'), ta, h('div',{class:'row', style:'display:flex;justify-content:flex-end;margin-top:10px'}, h('button',{class:'btn btn-red', onclick:()=>{ if (!ta.value.trim()) return; saveNew({id:'u'+Date.now(), email:s.email, name:s.email, page:HERE, anchor, kind:'comment', text:ta.value.trim(), status:'review', created:new Date().toISOString()}); done(); }}, 'Submit for review'))); });
  mk('Propose an edit', () => { const ta = h('textarea',{id:'rv-e', style:'min-height:140px'}); ta.value = original; const why = h('textarea',{id:'rv-w', placeholder:'Why this change? (optional)', style:'min-height:56px;margin-top:8px'}); body.append(h('label',{style:'display:block;font-size:.78rem;font-weight:600;color:var(--muted);margin:10px 0 6px'}, 'Edit the text'), ta, why, h('div',{class:'row', style:'display:flex;justify-content:flex-end;margin-top:10px'}, h('button',{class:'btn btn-red', onclick:()=>{ const v = ta.value.trim(); if (!v || v===original) return; saveNew({id:'u'+Date.now(), email:s.email, name:s.email, page:HERE, anchor, kind:'edit', original, proposed:v, text:why.value.trim(), status:'review', created:new Date().toISOString()}); done(); }}, 'Submit for review'))); });
  const list = h('div',{class:'list'}); const mine = allSuggestions().filter(x => x.page===HERE && x.anchor===anchor);
  if (mine.length){ list.append(h('h4',{style:'margin-top:14px'}, 'Already submitted on this passage')); mine.forEach(x => list.append(item(x, false))); }
  panel.append(list);
  function done(){ body.innerHTML=''; body.append(h('p',{style:'font-size:.9rem;color:#246b3b;font-weight:600;margin-top:12px'}, 'Submitted. It is marked for review until an administrator approves it.')); applyBadges(); }
  t1.click();
}
function item(x, admin){ const el = h('div',{class:'rv-item'}, h('div',{class:'m'}, h('span',{}, h('b',{}, x.name||x.email), ' · ', x.email), h('span',{}, fmt(x.created))), h('div',{}, badge(x.status), ' ', h('span',{style:'font-size:.72rem;color:var(--muted)'}, x.kind==='edit'?'Proposed edit':'Comment', ' · ', x.page.replace('.html',''), ' · ', x.anchor)));
  if (x.kind==='edit') el.append(h('div',{class:'diff', html:diffHtml(x.original, x.proposed)}));
  if (x.text) el.append(h('div',{style:'margin-top:6px;color:var(--fg-2)'}, x.text));
  if (x.decision_note) el.append(h('div',{style:'margin-top:6px;font-size:.78rem;color:var(--muted)'}, 'Decision: '+x.decision_note));
  if (admin && x.status==='review'){ const note = h('input',{type:'text', placeholder:'Note to the reviewer (optional)', style:'width:100%;margin-top:8px;border:1px solid var(--line-2);border-radius:4px;padding:6px 8px;font:inherit;font-size:.82rem;color:var(--fg);background:var(--bg)'}); el.append(note, h('div',{class:'acts'}, h('button',{class:'ok', onclick:()=>{ decide(x.id,'approved',note.value); renderQueue(); }}, x.kind==='edit'?'Approve edit':'Acknowledge'), h('button',{class:'no', onclick:()=>{ decide(x.id,'rejected',note.value); renderQueue(); }}, 'Decline'))); }
  return el; }

/* ---- admin queue page ---- */
let queueFilter = 'review';
function renderQueue(){ const host = $('#rv-queue'); if (!host) return; const s = session(); if (!s || s.role!=='admin'){ host.innerHTML=''; host.append(h('p',{class:'lead'}, 'The review queue is for administrators.'), h('p',{style:'margin-top:12px'}, h('button',{class:'btn btn-red', onclick:openSignIn}, 'Administrator sign-in'))); return; }
  const all = allSuggestions(); host.innerHTML='';
  const stats = h('div',{class:'rv-stats'}); [['review','Waiting for review'],['approved','Approved'],['rejected','Declined']].forEach(([k,l]) => stats.append(h('div',{}, h('div',{class:'v num'}, String(all.filter(x => x.status===k).length)), h('div',{class:'l'}, l)))); stats.append(h('div',{}, h('div',{class:'v num'}, String(new Set(all.map(x => x.email)).size)), h('div',{class:'l'}, 'Reviewers'))); host.append(stats);
  const f = h('div',{class:'filters'}, h('span',{class:'lbl'}, 'Show')); [['review','Waiting'],['approved','Approved'],['rejected','Declined'],['all','All']].forEach(([k,l]) => f.append(h('button',{class:'pill','aria-pressed':String(queueFilter===k), onclick:()=>{ queueFilter=k; renderQueue(); }}, l))); host.append(f);
  const list = h('div',{class:'list', style:'display:flex;flex-direction:column;gap:10px'}); const rows = all.filter(x => queueFilter==='all' || x.status===queueFilter); if (!rows.length) list.append(h('p',{style:'color:var(--muted)'}, 'Nothing here.')); rows.forEach(x => list.append(item(x, true))); host.append(list);
  host.append(h('p',{class:'hint', style:'padding:16px 0 0'}, 'Approved edits appear on the report pages with a green underline; click one to see the original wording. Decisions are stored in this browser only on the sample site.'));
}

/* ---- boot ---- */
fab = h('button',{class:'rv-fab', onclick:()=>{ const s = session(); if (!s) openSignIn(); else if (s.role==='admin') location.href='review.html'; else if (panel && panel.classList.contains('on')) panel.classList.remove('on'); else openSignIn(); }}, h('span',{html:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2l3 3-8 8H3v-3z"/></svg>'}), h('span',{}, 'Review this report'));
if (!$('#rv-queue')) document.body.append(fab);
document.querySelectorAll('[data-review-open]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openSignIn(); }));
applyApproved();
if (session()) enterReview();
if ($('#rv-queue')){ renderQueue(); document.querySelectorAll('[data-review-signout]').forEach(b => b.onclick = () => { setSession(null); renderQueue(); }); }
})();
