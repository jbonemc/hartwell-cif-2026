# One-off edit of the sample PDF method appendix (pages 22-23), November 2026.
# Usage: python3 tools/edit-method-pdf.py ORIGINAL.pdf OUTPUT.pdf FONT_DIR
# FONT_DIR holds IBMPlexSans-Regular.ttf and IBMPlexSans-SemiBold.ttf (converted from the @ibm/plex-sans npm package).
# Needs PyMuPDF. Page 22: rewraps the sentence on who reviews the clips. Page 23: re-sets the section text
# 43 pt lower, line by line at its original positions, and draws the optional add-on note under the heading.
import sys, pymupdf as fitz
SRC, OUT, FD = sys.argv[1], sys.argv[2], sys.argv[3]
REG, SEMI = FD+'/IBMPlexSans-Regular.ttf', FD+'/IBMPlexSans-SemiBold.ttf'
fr, fs = fitz.Font(fontfile=REG), fitz.Font(fontfile=SEMI)
INK = (0x0e/255, 0x19/255, 0x26/255); NAVY = (0x15/255, 0x26/255, 0x3b/255); RED = (0xd9/255, 0x46/255, 0x3b/255); GREY = (0xf3/255, 0xf4/255, 0xf5/255)
X0, WIDTH, SIZE, LEAD = 147.4016, 385.0, 9.0, 13.5
orig = fitz.open(SRC); doc = fitz.open(SRC)

def wrap(runs, width, size):
    """runs: list of (text, font). Returns lines as lists of (word, font, x)."""
    words = [(w, f) for t, f in runs for w in t.split()]
    lines, cur, x = [], [], 0.0
    for w, f in words:
        sp = fr.text_length(' ', fontsize=size) if cur else 0
        wl = f.text_length(w, fontsize=size)
        if cur and x + sp + wl > width: lines.append(cur); cur, x, sp = [], 0.0, 0
        cur.append((w, f, x + sp)); x += sp + wl
    if cur: lines.append(cur)
    return lines

def draw(page, lines, x0, base, size, lead, color):
    for i, ln in enumerate(lines):
        for w, f, x in ln:
            page.insert_text((x0 + x, base + i*lead), w, fontsize=size, fontname='plexsb' if f is fs else 'plexr', fontfile=SEMI if f is fs else REG, color=color)
    return len(lines)

def line_of(page, needle):
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            if needle in ''.join(s['text'] for s in l['spans']): return l
    raise SystemExit('not found: '+needle)

# ---- page 22: who reviews the clips ----
p = doc[21]
first = line_of(p, 'extracted as short clips and reviewed by a member of the project team')
last = line_of(p, 'were reviewed.')
nxt = line_of(p, 'Extraction of facts')
base = first['spans'][0]['origin'][1]
p.add_redact_annot(fitz.Rect(140, first['bbox'][1]-0.5, 545, last['bbox'][3]+0.5)); p.apply_redactions(images=0, graphics=0)
new = 'extracted as short clips and sent to the session chair or speaker, who listens to each and confirms the reading. The outcome of every such review is recorded. In this sample, 67 clips were reviewed.'
lines = wrap([(new, fr)], WIDTH, SIZE)
n = draw(p, lines, X0, base, SIZE, LEAD, INK)
assert base + (n-1)*LEAD + 3 < nxt['bbox'][1], 'p22 text would run into the next heading'
print('p22: replaced 3 lines with', n)

# ---- page 23: optional add-on note under the verification heading ----
p = doc[22]
head = line_of(p, 'Verification against public sources')
para = line_of(p, 'After drafting, every statement that can be tested')
end_line = line_of(p, 'most important, which is a matter of editorial judgement.')
top = para['bbox'][1]                       # where the section text starts
band = fitz.Rect(0, top - 1, p.rect.width, end_line['bbox'][3] + 2)
NSIZE, NLEAD, PADX, PADY = 8.4, 12.4, 9.0, 6.0
note = wrap([('Optional add-on.', fs), ('This sample includes it to show what it adds; the standard report records what was said and shown, and its method appendix states plainly whether this check was done.', fr)], WIDTH - 2*PADX - 3, NSIZE)
box_h = PADY*2 + (len(note)-1)*NLEAD + NSIZE*1.15
delta = box_h + 9.0
assert band.y1 + delta < 790, 'shifted text would reach the footer'
# every original line in the band, re-set one line at a time at its own origin, moved down by delta
spans = []
for b in p.get_text('dict')['blocks']:
    for l in b.get('lines', []):
        for sp in l['spans']:
            if band.y0 <= sp['origin'][1] <= band.y1 and sp['text'].strip():
                spans.append(sp)
fonts_used = {sp['font'] for sp in spans}
assert fonts_used <= {'IBM-Plex-Sans', 'IBM-Plex-Sans-Semi-Bold'}, fonts_used
p.add_redact_annot(band); p.apply_redactions(images=0, graphics=0)
for sp in spans:
    semi = 'Semi-Bold' in sp['font']; c = sp['color']
    p.insert_text((sp['origin'][0], sp['origin'][1] + delta), sp['text'], fontsize=sp['size'], fontname='plexsb' if semi else 'plexr', fontfile=SEMI if semi else REG,
                  color=((c >> 16 & 255)/255, (c >> 8 & 255)/255, (c & 255)/255))
print('p23: re-set', len(spans), 'spans')
box = fitz.Rect(X0, top, X0 + WIDTH, top + box_h)
p.draw_rect(box, color=None, fill=GREY, overlay=True)
p.draw_rect(fitz.Rect(box.x0, box.y0, box.x0 + 2.4, box.y1), color=None, fill=RED, overlay=True)
draw(p, note, X0 + PADX + 3, top + PADY + NSIZE*0.95, NSIZE, NLEAD, NAVY)
print('p23: note of', len(note), 'lines; section moved down by %.1f pt' % delta)

doc.set_metadata(orig.metadata)
doc.subset_fonts()
doc.save(OUT, garbage=4, deflate=True)
