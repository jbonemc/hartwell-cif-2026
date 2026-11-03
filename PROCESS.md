# From PDF report to interactive microsite: the process

This document records how the *Cardiovascular Innovation Forum 2026* sample report
(a 25-page PDF) was turned into an interactive microsite, so the same method can be
repeated for future reports. The governing rule throughout was: **nothing appears on
the site unless it can be traced to a specific page of the PDF.**

## 1. Read the whole report first

Before any design or extraction, the full PDF was read page by page (25 pages) to
understand its structure, its voice and, above all, its *evidentiary rules*:

- The report distinguishes what was **spoken**, what was **on a slide**, and what was
  **found in a public source** on review.
- **Footnotes exist for one purpose only: to record a discrepancy** between two of
  those sources. This single rule became the organising idea for the site's
  "Said versus shown" explorer.
- The report is explicitly a **sample**: every organisation, person, product and figure
  is fictional. The site therefore carries the same disclaimer on every screen, and
  nothing was added from outside the PDF.

## 2. Extract the brand from the file, not from memory

| Element | How it was obtained | Value |
|---|---|---|
| Typeface | `pdffonts` on the PDF | IBM Plex Sans (Regular, Medium, Semi-Bold, Bold), embedded |
| Primary colour | Pixel count of the cover page render | `#15263b` navy |
| Accent colour | Pixel count of the cover rule and finding numbers | `#d9463b` red |
| Neutrals | Pixel count of body pages | white, `#f3f4f5` table tint, `#66717f` / `#7e8793` greys |
| Layout motifs | Visual reading | short red rule under chapter titles, navy part-divider pages, large red finding numbers, two-column "label then body" structure |

IBM Plex Sans is available from Google Fonts, so the site uses the report's actual
typeface rather than an approximation.

## 3. Extract the text verbatim

`pdftotext` produced a plain-text copy of the report (plus a layout-preserving copy for
tables), split into one file per page. These page files are the **only** source the
extraction agents were allowed to read. Page numbers were carried on every record so
that every statement on the site can cite its PDF page.

## 4. Structured extraction with independent verification

The report was divided into nine sections (front matter, executive summary, programme,
lipid chapter, dates to watch, developments since the meeting, cardiomyopathy session,
method appendix, trials registry). For each section, a multi-agent workflow ran:

1. **Extract**: one agent converted the section into JSON following a prescribed shape,
   under strict rules (verbatim quotes, no rounding, no inference, source page on every
   record, the spoken / slide / public-source basis preserved wherever the report states it).
2. **Verify**: two *independent* checker agents, each with a different lens
   (numbers-and-dates; names-quotes-and-wording), compared the JSON back against the
   page text and were instructed to report every discrepancy and every omission, and to
   err on the side of reporting.
3. **Repair**: a third agent re-checked each reported discrepancy against the source text
   (the source always wins over the checker) and corrected the JSON.

The outcome of that pass is recorded in section 9 below.

## 5. Design the site around the report's own logic

Design decisions were derived from the report rather than imposed on it:

- **Basis chips** ("Spoken", "Slide", "Spoken and slide", "Public source") appear wherever
  the report itself states the basis of a figure. They use a colour-blind-safe palette
  validated with a Delta-E checker in both light and dark themes, and always carry a text
  label, never colour alone.
- **The lipid reductions are deliberately *not* ranked.** The report's own "Key point" says
  the headline reductions cannot be ranked against one another, because each was measured at
  a different time point in a different population. The chart therefore plots each result at
  its stated time point, so the reader sees *why* they are not comparable.
- **Dates to watch** keep the report's grouping (fourth quarter 2026, first half 2027, second
  half 2027, 2028 and later, stated without a firm date) and each entry keeps its stated basis.
- **The method appendix becomes a visual pipeline**, using only the figures the appendix gives
  (hours of recording, clips reviewed, talks, facts, checks, outcomes).
- Where the report says a figure was "shown on the slide and not spoken", the site says so
  in the same words.

## 6. Build

A single self-contained HTML page (no build step, no server) with the verified JSON embedded
as data and all interactivity written in plain JavaScript. The PDF itself ships alongside the
page for download.

## 7. Fact-check the finished site against the PDF

After the build, a second multi-agent pass compared the *rendered site text* against the
PDF page text (see section 9), looking for any figure, name, date or quotation that
differed from the source, and any statement on the site that had no basis in the report.

## 8. Visual and functional QA

The page was rendered at desktop and phone widths in light and dark themes with a headless
browser, and every interactive control was exercised.

## 9. Verification log

### Pass 1: structured extraction, verified against the page text

| Section | Checker findings (two independent checkers) | Outcome after re-checking against the source |
|---|---|---|
| Front matter | 2 (a paragraph break) | 1 fix: paragraph break corrected |
| Executive summary | 4 discrepancies, 6 omissions | Omissions added (four figures from the introduction, two speakers, four figures inside findings); two checker claims rejected because the source says "company video", not spoken or slide; "noninferior" kept as the page prints it |
| Programme | 4 | Panel members whose affiliation is not re-printed on the panel line now carry no affiliation on that line |
| Lipid chapter | 16 discrepancies, 3 omissions | Two words re-hyphenated where the PDF breaks them across a line ("open-label", "twice-yearly"); 17 slide and public-source figures from the footnotes added as their own records; a checker's request to mark five figures as "spoken" was rejected because the source does not say so |
| Dates to watch | 0 | No change |
| Developments since the meeting | 4 | A paraphrased "spoken at the meeting" field removed because the page does not say how it was reported; one inferred date removed |
| Cardiomyopathy session | 4 | "dose-limiting" re-hyphenated; an endpoint the source never states verbatim removed |
| Method appendix | 1 omission | A threshold figure added |
| Trials registry | 1 | Field renamed because the source does not carry bold formatting; all 33 rows confirmed |

Total: 35 agents, 176 tool calls, about 16 minutes. Every rejected checker claim was rejected because
the *source* did not support the checker, which is the correct direction of error.

A point worth keeping for future reports: when a checker and an extractor disagree, the repair agent
must re-read the page itself. In this pass that caught three cases where the checker was wrong.

### Pass 2: rendered site against the PDF

The finished page was rendered in a headless browser with every collapsed panel opened, its text
was saved section by section, and twelve checker agents compared each section against the PDF
pages. Every flag was then re-judged by a separate agent reading the PDF itself.

| Result | Count |
|---|---|
| Flags raised | 16 |
| Confirmed as real after re-reading the PDF | 4 |
| Rejected (faithful short labels, or checker misread) | 12 |

The four confirmed problems, and what was done:

1. **A missing affiliation.** The keynote speaker's line read "No organisation printed" because the
   report gives a description ("senior scientific officer at the European medicines regulator,
   speaking in a personal capacity") rather than an organisation name. The site now prints that
   description verbatim.
2. **Invented head counts.** Each session card showed "N named", a figure the site computed and
   the report does not give, and which double-counted speakers who also sat on the panel. Removed.
3. **Drafting commentary leaking into a label.** Two figure cards carried the extractor's working
   notes ("as implied by context", "named BIRCHWOOD elsewhere on the page") as if they were labels.
   The labels were reduced to what the report states.
4. **A figure attributed to the wrong speaker.** "Only 2 of the 9 patients in LANTERNWAY completed
   it" is a panel statement in the Discussion, not part of Felix Brandt's talk. Moved.

A third pass re-checked the three corrected sections (recorded below).

Lesson for future reports: short labels that *describe* a figure are the main place where an
inference can creep in. Keep them to the report's own words, and have the final check read the
rendered page rather than the data files, because that is what the reader sees.

### Pass 3: re-check of corrected sections

The three corrected sections were checked again with fresh agents (12 flags, 3 confirmed, 9 rejected).
The three confirmed items were all small and were applied:

1. The programme prints one speaker's affiliation with a collaboration credit, "CardioMetrix (in
   collaboration with Larkspur Labs)". The site now prints the full credit.
2. The lipid chart's legend said filled marks were "normally what the speaker said". The report does
   not say that, and for one product the main-text figure is the slide figure. The phrase was removed.
3. One figure, "up to 6" doses, was labelled "Spoken". The report says the speaker said "up to 20"
   and that review of the recording settled it as a slip for "up to 6". The card now carries a
   "Settled on review of the recording" label and quotes the footnote.

The remaining nine flags were judged not to be errors on re-reading the PDF: in each case the site
text was a faithful short label of what the report prints.

## 10. Second iteration: editorial feedback and what changed

The first version was a single long page that led with the report's verification apparatus. The
reader's feedback was that readers of a conference report care about the conference and the data, not
about how the report was checked; that the site should be split into pages rather than one scroll; and
that it needed photographs. The second version made these changes:

- **Separate pages.** One page per chapter, with a shared header, a contents menu on phones, and
  previous and next links at the foot of each page. The site search still covers every passage and
  footnote in the report and now links to the right page and, for findings, the right item.
- **Verification demoted.** The colour-coded "spoken / slide / public source" labels were removed from
  the figure cards, dates and session records. What remains on the reading pages is a small red
  footnote marker on the statement itself, which opens the report's footnote when tapped, and the
  chapter's footnotes in small type at the foot of the page, as the printed report has them. The method
  appendix and the gathered footnotes moved to a page of their own, reached from a one-paragraph note
  on the About page and a link in the footer.
- **Photographs.** Eleven photographs were chosen through the Unsplash connector and downloaded at
  web size (about 2.6 MB in total). The first selection (a conference hall, a pipette, a planner) was
  rejected as generic. The second selection ties each page to its subject: Lisbon's river, tram and tile
  workshop for the meeting and the report; public-domain anatomical heart drawings from Leiden
  University for the findings and lipid chapters; a heart model for the cardiomyopathy session; a
  library card catalogue for the trials registry; a mixing desk for the method page, which is about
  recordings; and Gothenburg's port for the next meeting. Each carries the photographer's credit and a
  link back to Unsplash, and all credits are listed on the About page.

A practical note for future reports: the cloud session could not reach the image host until it was
added to the environment's allowed network domains. The connector returns links, not files, so that
step is needed before photographs can be embedded.

### Third iteration: images that match the tone, and an "Ask the report" element

The second photo set was judged off-key: landmarks and a foggy river read as travel or mood pieces
rather than medicine. The third set is medical throughout (an operating theatre, a conference
audience, blood vials, an ECG monitor, DNA sample vials, a laboratory robot, a stethoscope, a
vital-signs monitor, the anatomical heart drawing and heart model), with Gothenburg's port kept
only for the next-meeting band.

To make eleven photographs from nine photographers read as one set, every image is processed the
same way by a small script (`src/duotone.py`): converted to black and white, contrast-normalised,
then mapped onto the report's palette so that shadows take the brand navy, highlights a pale warm
grey, and the mid-tones carry a faint red gel. The originals are kept in `img/raw/`, so the treatment
can be changed and re-run in seconds.

The "Ask the report" element appears as a compact box on the home page and as a full page. It is
built to be connected to an answering service: the endpoint and headers live in one small
configuration file (`src/ask-config.js`) and the request and response shapes are set out in
`docs/ASK-API.md`. Until an endpoint is set, a question returns the passages in the report that
match its words, each with its PDF page and a link to the right page of the site, so the element is
useful on day one and nothing is invented while the service is absent. When the service is
connected, its answer is shown with the pages it cites; if it fails, the page falls back to the same
matching passages and says so.

### Fourth iteration: speaker quotations and a mock review facility

**Quotations.** Each of the ten sessions now has a slider of short quotations attributed to its
speakers: on the programme page under every session, at the top of the two session chapters, and
as one combined slider on the home page. The report is fictional, and these quotations were written
for the site rather than extracted from the PDF. They were written to agree with what the report
records each speaker as saying, and they live in their own file (`src/quotes.js`), apart from the
verified report data, so the two are never confused.

**Review facility.** Speakers and organisers can sign in, click any passage, and either leave a
comment or propose a replacement wording. Each submission is tied to the email address it came from
and marked "for review" until an administrator approves or declines it on the review queue page.
Approved edits appear in the report text with a green underline, and a click shows the original
wording. Seven seeded submissions (five waiting, one approved, one declined) show the facility in
use. On the sample site all of this is simulated: the email code is not sent and any six digits are
accepted, the administrator password is `yourreport`, and submissions are stored in the visitor's
browser only. The page says so in small print beneath the sign-in form. Moving to a real service
(email one-time codes, shared storage, simultaneous reviewers) is a matter of replacing that storage
layer; the earlier recommendation of Supabase and Vercel for that stands.

## 11. What to keep and what to change next time

**Keep**
- Read the whole PDF before extracting anything; the report's own evidentiary rules shaped the site.
- Derive brand colour and type from the file itself.
- Page references on every record, carried through to the rendered page.
- Two independent checkers per section with different lenses, and a repair step that re-reads the
  source rather than trusting the checker.
- A build step that refuses to build if any hand-curated chart string is absent from the PDF text.
- A final fact-check of the *rendered* page, with every flag re-judged against the PDF.

**Change**
- Tell extraction agents up front that labels and "measure" fields must use the report's own words
  and carry no working notes; the working notes belong in a separate field. This would have removed
  the pass-2 label problems before they reached the page.
- Decide the chart series and stat tiles *before* extraction, so the extraction schema captures
  exactly the fields the charts need (time point, population, comparator) and no hand-curation is
  required.
- Avoid any site-computed figures (counts, totals, averages) unless the report gives them.

## 12. Iteration 5: the "Ask" element restyled, and a hosting build

**Feedback.** The question box was the one part of the site that "gives away that this was built
with AI": a rounded input, a send button and a row of pill-shaped suggested prompts is the
universal chatbot pattern.

**Change.** The element was redrawn as an enquiry page in the report's own idiom rather than a
chat widget: a navy block with a red rule, a borderless question line set in the report's serifless
type, suggested questions presented as a numbered two-column list in the manner of a contents page,
and answers laid out as a "Q" margin mark with the passage and its page reference ("p. 12") in the
mono face used elsewhere for figures. No bubbles, no avatars, no send icon. The behaviour (local
passage match now, API later; see `docs/ASK-API.md`) is unchanged.

**Hosting build.** `src/build.py` now also writes `vercel/`: the same twelve pages with the
stylesheet and scripts as external files under `assets/`, the data split into five files of about
40 KB, photographs served straight from Unsplash with the duotone applied by the image CDN
(`duotone=15263b,ece8e2`), a `vercel.json` with clean URLs and cache headers, and the PDF. It is a
plain static site and will host anywhere.

**Publishing.** The Vercel connector available in this session is not permitted to create a
project (the API answered 403 "You don't have permission to create a project"), and the session
cannot copy a 400 KB folder into a deployment request without transcribing it. The reliable route
is the Vercel command line from any machine that has the folder:

    npx vercel deploy vercel --prod

(or create an empty project in the Vercel dashboard and drag the `vercel/` folder onto it). Nothing
in the site depends on the host.

## 12a. Iteration 6: faster photographs and guided tours

**Photographs.** The hosted site had been asking Unsplash's image service to resize and duotone each
photograph on the fly, about 2.3 MB across the set. The hosting build now makes its own WebP copies
from the duotoned originals: a 1600-pixel version for desktop and an 800-pixel version that phones
receive through a media query. The whole set is about 640 KB at full size. Each page preloads its
main photograph, and `vercel.json` lets browsers cache the images for 30 days. The home page now
loads about 160 KB of photographs on a desktop and 87 KB on a phone.

**Guided tours.** `src/tour.js` adds two walkthroughs, offered in a small card on a first visit and
from a "Tour" button in the header and a footer link:
- *Tour the site* (16 steps across seven pages): what the site does with the report, branding being
  interchangeable, quotes, Ask, findings and footnotes, the programme and people search, checked
  charts, dates, trials, search, and how the transcripts are produced.
- *See the review process* (9 steps): sign-in, review mode, proposing an edit, the administrator
  queue, approval, and approved edits shown with the original wording kept.
Both say plainly that the data is sample data. The review tour signs the visitor in as a demo
reviewer and then as administrator, and restores whatever sign-in they had when it ends.

**Clean web addresses.** Vercel serves pages without ".html". Three scripts worked out the current
page from the address and so failed to highlight the navigation and to show approved edits there.
All three now normalise the page name.

**Calendar on "Dates to watch".** Each date that can be placed on a calendar has a tick box and a
one-click "+ Add". A panel above the list downloads a single calendar file (.ics) for everything
ticked. It opens in Outlook, Apple Calendar and Google Calendar, and every entry carries a reminder
one week before. Only three entries in the report give an exact day, and two of those have passed.
The rest are given as a month, quarter, half-year or year, so the rule, agreed with the client for
the demo, is: the first day of the stated period; "End of" a year on 1 December; "next year" and
"early next year" as 1 January 2027, since the report is dated November 2026. Entries with no date
("not stated", "already enrolled") and dates already passed are not offered. Each calendar entry
keeps the wording as stated, explains how its day was chosen, cites the report page, and says the
data is sample data.

The PDF text used by the build's chart check is now kept in the repository as `src/report-text.txt`,
so the build runs from the repository alone: `python3 src/build.py data src/report-text.txt`.

## 12b. Iteration 7: wording matched to the service as sold

The service was revised: checking statements against public sources (trial registries, regulators,
company announcements) is now an optional add-on, and transcript ambiguities are checked by sending
short clips to the client's session chairs or speakers rather than by our own team. The demo had
presented both the old way.

- **Tour.** The welcome now says the microsite is built alongside a report of proceedings, and that
  this sample includes the optional public-source verification. "Verified report" became "report".
  The method step says clips go to the session chair or speaker, and that the automated check
  confirms every figure in the analysis appears in the facts it cites. The final step names the
  editorial contact and says speakers and sponsors can be sent their sections.
- **Method page.** The transcription card and paragraph now say clips are sent to the session chair
  or speaker. The verification card and section carry a note at the top marking them as an optional
  add-on included in this sample to show what it adds. The report's verification text is unchanged.
- **Developments since the meeting.** A line at the top marks the chapter as part of the add-on.

**Sample PDF.** The method appendix was then brought into line. On page 22 the transcription
paragraph now says the clips are sent to the session chair or speaker, who confirms the reading. On
page 23 the "Verification against public sources" section opens with the same add-on note as the
site. The edit was made with `tools/edit-method-pdf.py` (PyMuPDF), using the IBM Plex Sans fonts the
report already uses, whose measurements match the embedded ones to within half a point a line. The
paragraph on page 22 keeps its line count. On page 23 the section text is re-set 43 points lower at
its original line breaks, so selecting, copying and searching still work in reading order. The other
23 pages are pixel-identical to before. `src/report-text.txt` was regenerated from the new PDF and
the build's figure checks still pass.

## 13. Deliverables

| File | What it is |
|---|---|
| `site/` | The microsite: ten HTML pages, works from a folder or any static host (with `img/` and `report.pdf` beside it) |
| `img/` | The eleven duotoned photographs, `credits.json`, and the untreated originals in `raw/` |
| `docs/ASK-API.md` | The request and response contract for the answering service behind "Ask the report" |
| `report.pdf` | The original report, linked for download from every page |
| `artifact/` | The same pages in the form published to claude.ai |
| `vercel/` | The hosting build: external assets, CDN photographs, `vercel.json`; deploy with `npx vercel deploy vercel --prod` |
| `src/` | Styles (`head.html`), one template per page (`pages/`), the page script (`app.js`), chart series with source checks (`curated.js`) and the assembler (`build.py`) |
| `data/` | The verified JSON extracted from the report |
| `PROCESS.md` | This document |
