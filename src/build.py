#!/usr/bin/env python3
"""Assemble the multi-page microsite. Usage: build.py DATA_DIR PDF_TEXT"""
import json, re, sys, pathlib
SRC = pathlib.Path(__file__).parent; OUT = SRC.parent
DATA = pathlib.Path(sys.argv[1]); PDFTXT = pathlib.Path(sys.argv[2])
norm = lambda s: re.sub(r'\s+', ' ', s); flat = norm(PDFTXT.read_text())
cur = (SRC/'curated.js').read_text() + '\n' + (SRC/'ask-config.js').read_text() + '\n' + (SRC/'quotes.js').read_text() + '\n' + (SRC/'mock-suggestions.js').read_text()
bad = [s.replace("\\'", "'") for c in re.findall(r"check:\[(.*?)\]", cur, re.S) for s in re.findall(r"'((?:[^'\\]|\\.)*)'", c) if norm(s.replace("\\'", "'")) not in flat]
if bad: print('BUILD REFUSED: curated strings not found in the PDF text:', *bad, sep='\n  - '); sys.exit(1)
keys = ['meta','findings','programme','lipid','dates','developments','cardio','method','trials']
data = {k: json.loads((DATA/f'{k}.json').read_text()) for k in keys}
credits = json.loads((OUT/'img'/'credits.json').read_text())
photos = {k: {'src': f'img/{k}.jpg', 'alt': v['alt'], 'photographer': v['photographer'], 'profile': v['profile']+'?utm_source=hartwell_report_microsite&utm_medium=referral', 'page': v['page']+'?utm_source=hartwell_report_microsite&utm_medium=referral'} for k, v in credits.items()}
payload = json.dumps(data, ensure_ascii=False).replace('</', '<\\/'); pj = json.dumps(photos, ensure_ascii=False).replace('</', '<\\/')
head = (SRC/'head.html').read_text(); app = (SRC/'app.js').read_text()
R = data['meta']['report']
PAGES = [  # file, nav label, title, in main nav
  ('index.html', 'Overview', R['title'], True),
  ('findings.html', 'Findings', 'Twelve principal findings', True),
  ('programme.html', 'Programme', 'Programme and contributors', True),
  ('lipids.html', 'Lipid-lowering', data['lipid']['chapter_title'], True),
  ('dates.html', 'Dates to watch', 'Dates to watch', True),
  ('developments.html', 'Since the meeting', 'Developments since the meeting', True),
  ('cardiomyopathies.html', 'Cardiomyopathies', data['cardio']['chapter_title'], True),
  ('trials.html', 'Trials', 'Trials referred to at the meeting', True),
  ('ask.html', 'Ask', 'Ask the report', True),
  ('about.html', 'About', 'About this report', True),
  ('method.html', 'Method', 'Method and verification', False),
  ('review.html', 'Review', 'Review queue', False),
]
DL = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v8m0 0l3-3m-3 3L5 7M3 12v1.5h10V12"/></svg>'
SEARCH = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>'
def nav(cls): return ''.join(f'<a href="{f}">{l}</a>' for f,l,t,m in PAGES if m)
def toc(): return ''.join(f'<li><a href="{f}">{l}</a></li>' for f,l,t,m in PAGES if m)
header = f'''<header class="site-head wrap"><div class="inner">
  <a class="brand" href="index.html">{R['society']}<small>{R['title']}</small></a>
  <nav class="nav" aria-label="Sections">{nav('nav')}</nav>
  <div class="acts"><button class="btn btn-ghost" data-search-open aria-label="Search the report">{SEARCH}<span class="sr">Search</span></button><a class="btn btn-red" href="report.pdf" target="_blank" rel="noopener" data-dl>{DL}PDF</a><button class="btn btn-ghost menu-btn" id="menu-open">Menu</button></div>
</div></header>
<div class="menu" id="menu" aria-label="Sections"><button class="close" id="menu-close">Close</button><ul class="toc">{toc()}</ul></div>'''
footer = f'''<footer class="band wrap"><div class="inner">
  <div class="cols">
    <div><b>{R['society_full_name']}</b>{R['title']}<br>{R['subtitle']}<br>{R['publication_month']}</div>
    <div><b>The report</b><a href="report.pdf" target="_blank" rel="noopener" data-dl>Download the full report (PDF, 25 pages)</a></div>
    <div><b>About this site</b>Every passage, figure and footnote on this site is taken from the report. Page references point to the PDF.<br><a href="about.html">About this report</a> · <a href="method.html">How it was prepared</a><br><a href="#" data-tour-open>Take a guided tour</a><br><a href="#" data-review-open>Speakers and organisers: sign in to review</a> · <a href="review.html">Administrator</a></div>
  </div>
  <p style="font-size:.78rem;color:var(--band-muted);margin-top:28px;border-top:1px solid var(--band-line);padding-top:16px">{R['footer_disclaimer']}</p>
</div></footer>
<div class="overlay" id="overlay" role="dialog" aria-modal="true" aria-label="Search the report"><div class="dialog">
  <label class="search">{SEARCH}<input id="q" type="search" placeholder="Search a name, company, trial, figure or phrase" aria-label="Search"></label>
  <div class="results" id="results"></div><div class="hint">Searches every passage, table row and footnote in the report. Press Escape to close.</div>
</div></div>'''
scripts = '<script>window.DATA=' + payload + ';window.PHOTOS=' + pj + '</script>\n<script>' + cur + '</script>\n<script>' + app + '</script>\n<script>' + (SRC/'review.js').read_text() + '</script>\n' + '<script>' + (SRC/'tour.js').read_text() + '</script>\n'
def pager(i):
    main = [p for p in PAGES if p[3]]; j = main.index(PAGES[i]) if PAGES[i][3] else None
    if j is None: return '' if f=='review.html' else '<div class="inner wrap"><div class="pager"><a href="about.html"><small>Back to</small>About this report</a></div></div>'
    prev = main[j-1] if j>0 else None; nxt = main[j+1] if j<len(main)-1 else None
    return '<div class="inner wrap"><div class="pager">' + (f'<a href="{prev[0]}"><small>Previous</small>{prev[2]}</a>' if prev else '<span></span>') + (f'<a class="next" href="{nxt[0]}"><small>Next</small>{nxt[2]}</a>' if nxt else '') + '</div></div>'
out_dir = OUT/'site'; out_dir.mkdir(exist_ok=True); art_dir = OUT/'artifact'; art_dir.mkdir(exist_ok=True)
for i,(f,l,t,m) in enumerate(PAGES):
    body = (SRC/'pages'/f).read_text()
    title_tag = f'<title>{t if f!="index.html" else R["title"]}</title>' if f=='index.html' else f'<title>{t} · {R["title"]}</title>'
    page_head = head.replace('<title>Cardiovascular Innovation Forum 2026</title>', title_tag)
    content = header + '\n' + body + '\n' + pager(i) + '\n' + footer + '\n' + scripts
    standalone = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + page_head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','') + '\n</head>\n<body>\n' + content.replace('href="report.pdf" target="_blank" rel="noopener" data-dl', 'href="report.pdf" download="Cardiovascular-Innovation-Forum-2026-Report.pdf" target="_blank" rel="noopener"') + '</body>\n</html>\n'
    (out_dir/f).write_text(standalone)
    # artifact: the index page is wrapped by the platform; the other pages are full documents
    (art_dir/f).write_text(page_head + '\n' + content if f=='index.html' else standalone)

# ---- hosting build (Vercel): shared external assets, images served by Unsplash with an imgix duotone ----
import re as _re
host_dir = OUT/'vercel'; (host_dir/'assets').mkdir(parents=True, exist_ok=True)
# photographs: compact WebP copies served from the site itself (full width, and a half-width version for phones)
from PIL import Image as _Image
(host_dir/'img').mkdir(parents=True, exist_ok=True)
for _k in credits:
    _im = _Image.open(pathlib.Path(__file__).resolve().parent.parent/'img'/f'{_k}.jpg').convert('RGB')
    for _w, _sfx, _q in ((1600, '', 66), (800, '-sm', 64)):
        _im.resize((_w, round(_im.height*_w/_im.width)), _Image.LANCZOS).save(host_dir/'img'/f'{_k}{_sfx}.webp', 'WEBP', quality=_q, method=6)
cdn = {k: f'img/{k}.webp' for k in credits}
photos_cdn = {k: {**photos[k], 'src': f'img/{k}-sm.webp'} for k in photos}
css = _re.search(r'<style>(.*?)</style>', head, _re.S).group(1)
head_ext = _re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="assets/site.css">', head, flags=_re.S)
(host_dir/'assets'/'site.css').write_text(css)
def _strip(o):
    if isinstance(o, dict): return {k: _strip(v) for k, v in o.items() if k not in ('notes','source_pages','table_columns_as_printed','column_headings_verbatim','page_footer_verbatim','footnotes_note','spoken_slide_verification_distinctions','basis_legend','table_columns_verbatim','trial_count_by_page','matters_not_addressed_notes','organising_committee_verbatim') or k=='organising_committee_verbatim'}
    if isinstance(o, list): return [_strip(x) for x in o]
    return o
payload_small = json.dumps(_strip(data), ensure_ascii=False, separators=(',',':')).replace('</', '<\\/')
small = _strip(data)
# data is split into chunks of about 40 KB so each file can be uploaded to the host separately
_lines = ['window.DATA={};\n'] + ['window.DATA.'+k+'='+json.dumps(small[k], ensure_ascii=False, separators=(',',':')).replace('</','<\\/')+';\n' for k in keys] + ['window.PHOTOS=' + json.dumps(photos_cdn, ensure_ascii=False) + ';\n'] + [cur]
_chunks, _buf = [], ''
for _l in _lines:
    if _buf and len(_buf) + len(_l) > 40000: _chunks.append(_buf); _buf = ''
    _buf += _l
_chunks.append(_buf)
for _n, _c in enumerate(_chunks, 1): (host_dir/'assets'/f'data-{_n}.js').write_text(_c)
for _old in host_dir.glob('assets/data.js'): _old.unlink()
data_tags = ''.join(f'<script src="assets/data-{_n}.js"></script>\n' for _n in range(1, len(_chunks)+1))
(host_dir/'assets'/'app.js').write_text(app); (host_dir/'assets'/'review.js').write_text((SRC/'review.js').read_text()); (host_dir/'assets'/'tour.js').write_text((SRC/'tour.js').read_text())
scripts_ext = data_tags + '<script src="assets/app.js"></script>\n<script src="assets/review.js"></script>\n' + '<script src="assets/tour.js"></script>\n'
for i,(f,l,t,m) in enumerate(PAGES):
    body = (SRC/'pages'/f).read_text()
    used = [k for k in cdn if f'url(img/{k}.jpg)' in body]
    for k in used: body = body.replace(f'url(img/{k}.jpg)', f'url({cdn[k]})')
    img_head = ''.join(f'<link rel="preload" as="image" href="img/{k}.webp" media="(min-width:761px)">\n<link rel="preload" as="image" href="img/{k}-sm.webp" media="(max-width:760px)">\n' for k in used[:1])
    if used: img_head += '<style>@media (max-width:760px){' + ''.join(f'[style*="img/{k}.webp"]{{background-image:url(img/{k}-sm.webp)!important}}' for k in used) + '}</style>\n'
    title_tag = f'<title>{R["title"]}</title>' if f=='index.html' else f'<title>{t} · {R["title"]}</title>'
    page_head = head_ext.replace('<title>Cardiovascular Innovation Forum 2026</title>', title_tag).replace('<link rel="stylesheet" href="assets/site.css">', img_head + '<link rel="stylesheet" href="assets/site.css">').replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
    content = header + '\n' + body + '\n' + pager(i) + '\n' + footer + '\n' + scripts_ext
    page = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + page_head + '\n</head>\n<body>\n' + content.replace('href="report.pdf" target="_blank" rel="noopener" data-dl', 'href="report.pdf" download="Cardiovascular-Innovation-Forum-2026-Report.pdf" target="_blank" rel="noopener"') + '</body>\n</html>\n'
    (host_dir/f).write_text(page)
import shutil; shutil.copy(OUT/'report.pdf', host_dir/'report.pdf')
(host_dir/'vercel.json').write_text(json.dumps({"cleanUrls": True, "headers":[{"source":"/assets/(.*)","headers":[{"key":"Cache-Control","value":"public, max-age=3600"}]},{"source":"/img/(.*)","headers":[{"key":"Cache-Control","value":"public, max-age=2592000"}]}]}, indent=1))
print('built', len(PAGES), 'pages into', out_dir, ',', art_dir, 'and', host_dir)
