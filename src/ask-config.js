/* Ask-the-report service. Set `endpoint` to the answering API when it is ready.
   Request:  POST endpoint, JSON {question, report_id, page, history:[{question, answer}]}
   Response: JSON {answer: string, sources: [{page: number, quote: string}]}
   Until an endpoint is set, the page shows the passages in the report that match the question. */
window.ASK_CONFIG = { endpoint: '', headers: { 'Content-Type': 'application/json' }, report_id: 'hartwell-cif-2026' };
