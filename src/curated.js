/* Curated series for the charts. Every string in `check` must appear verbatim in the PDF text;
   build.py refuses to build if any does not. Figures are taken from the pages cited. */
window.LIPID_SERIES = [
  { company:'Marlowe Pharma', product:'Pendrelvarin', measure:'LDL cholesterol', value:61, weeks:12, slide_value:58.7, label_dx:14, label_dy:-10,
    detail:': 61% reduction in LDL cholesterol at week 12 in the phase 2b LANTANA study of 410 patients. Footnote: Marlowe\'s slide gives 58.7%; the speaker rounded upwards.',
    check:['61% reduction in LDL cholesterol at week 12','LANTANA study of 410 patients','Marlowe\'s slide gives 58.7%'] },
  { company:'Solenne Biologics', product:'Tirocimab', measure:'LDL cholesterol', value:49, weeks:24, slide_value:48.6, label_dx:14, label_dy:16,
    detail:': 49% reduction in LDL cholesterol at week 24 in 48 patients with homozygous familial hypercholesterolaemia. Footnote: the slide gives 48.6%.',
    check:['49%','reduction in LDL cholesterol at week 24 in 48 patients with homozygous familial','The slide gives 48.6%'] },
  { company:'Vantrel Bio', product:'Lirovasiran', measure:'Lipoprotein(a)', value:94, weeks:48, slide_value:null, label_dx:-14, label_dy:4, label_anchor:'end',
    detail:': 94% mean reduction in lipoprotein(a) at week 48 in the phase 2 BIRCHWOOD study of 240 patients. Footnote: the speaker said "over 90%"; the slide gives 94%.',
    check:['mean reduction of 94% at week 48 in the phase 2 BIRCHWOOD','study of 240 patients','The speaker said "over 90%" for the phase 2 reduction; the slide gives 94%'] },
  { company:'Arden Therapeutics', product:'Ancelsiran', measure:'LDL cholesterol', value:52, weeks:52, slide_value:51.6, label_dx:-14, label_dy:-10, label_anchor:'end',
    detail:': a single dose held LDL cholesterol 52% lower at 12 months in the phase 2 WINTERGREEN study of 112 patients. Footnote: Arden\'s slide gives 51.6%.',
    check:['held LDL cholesterol 52%','lower at 12 months','WINTERGREEN study of 112','Arden\'s slide gives 51.6%'] },
];
window.CARDIO_SERIES = [
  { study:'EBW-100 (Danon disease)', company:'Ebbwater Genetics', phase:'Phase 1/2', n:7, n_as_printed:'7', highlight:true, detail:'Seven patients have been treated.', check:['Seven patients have been treated'] },
  { study:'LANTERNWAY', company:'Oriel Cardiogenetics', phase:'Phase 1/2 as described; registry lists phase 1', n:9, n_as_printed:'9', highlight:true, detail:'Phase 1/2 LANTERNWAY study of 9 patients.', check:['LANTERNWAY study of 9','patients'] },
  { study:'CALLISTO-HCM', company:'Calderon Therapeutics', phase:'Phase 1/2', n:12, n_as_printed:'12', highlight:true, detail:'12 patients have been dosed in three cohorts.', check:['CALLISTO-HCM study 12 patients','have been dosed in three cohorts'] },
  { study:'ORCHARD-HCM', company:'Kessler Pharma', phase:'Phase 3 · slide gives 208', n:212, n_as_printed:'212', highlight:false, detail:'Phase 3 ORCHARD-HCM study of 212 patients; the slide gives 208.', check:['ORCHARD-HCM','study of 212 patients','The slide gives 208 patients'] },
  { study:'LODESTAR-2', company:'Fenwick Bio', phase:'Phase 3', n:640, n_as_printed:'640', highlight:false, detail:'Phase 3 LODESTAR-2 study of 640 patients.', check:['LODESTAR-2','study of 640 patients'] },
];
window.PIPELINE = [
  { title:'Sources', text:'Video recording of each session, with the published programme used to confirm names and affiliations.', value:'4½ h', value_label:'approximately four and a half hours of recording', check:['approximately four and a half hours'] },
  { title:'Transcription and review', text:'Speech recognition, then each transcript compared with the video; uncertain passages checked by human reviewers, as short clips sent to the session chairs or speakers.', value:'67', value_label:'clips reviewed', check:['67 clips'] },
  { title:'Extraction of facts', text:'Each talk read in isolation; every fact recorded with speaker, time in the recording and exact words. Two automated checks.', value:'1,641', value_label:'facts from 40 talks and discussions', check:['1,641 facts','forty in this sample'] },
  { title:'Analysis and drafting', text:'Session records and thematic analyses written from the base of facts, not the transcripts, under an automated line-by-line check.', value:null, check:['written from the base of facts and not from'] },
  { title:'Verification against public sources', addon:true, text:'Every statement that can be tested against a public primary source is tested, on a stated date.', value:'231', value_label:'checks covering 361 statements', check:['231 checks were made, covering 361 individual statements'] },
  { title:'Limitations', text:'Verification establishes agreement with what has been published, not that the published information is itself correct.', value:null, check:['it does not establish'] },
];
window.ADDON_NOTE = 'Optional add-on. This sample includes it to show what it adds; the standard report records what was said and shown, and its method appendix states plainly whether this check was done.';
window.DEV_ADDON_NOTE = 'Part of the optional verification add-on.';
window.VERIFICATION = {
  checks:231,
  sub:'Of the 231 checks made against public primary sources, covering 361 individual statements, the appendix gives this breakdown.',
  parts:[
    { label:'Confirmed', n:108, color:'var(--seq-1)' },
    { label:'Confirmed in part', n:74, color:'var(--seq-2)' },
    { label:'Differed from the public source', n:11, color:'var(--red)' },
    { label:'Could not be found in any public source', n:38, color:'var(--seq-4)' },
  ],
  foot:'A further 149 statements were opinions, forecasts or unpublished data, for which no public source can exist.',
  check:['108 were confirmed','74 were confirmed in part','11 differed from the public source','38 could not be found in any public source','A further 149 statements were opinions, forecasts or unpublished'],
};
