# "Ask the report": connecting the answering service

The site ships with an "Ask the report" box on the home page and a full page at `ask.html`.
It is wired for an HTTP service and works without one.

## Switching it on

Edit `src/ask-config.js` (or the same lines in each built page) and set the endpoint:

```js
window.ASK_CONFIG = {
  endpoint: 'https://your-service.example/ask',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer …' },
  report_id: 'hartwell-cif-2026'
};
```

Then rebuild (`python3 src/build.py <data dir> <pdf text>`), or edit the built pages directly.
The service must allow cross-origin requests from the site's domain (CORS).

## Request

`POST` to the endpoint with a JSON body:

| Field | Type | Meaning |
|---|---|---|
| `question` | string | The visitor's question, as typed |
| `report_id` | string | Identifies which report is being asked about |
| `page` | string | The page the question was asked from, for example `lipids.html` |
| `history` | array | Up to the last six `{question, answer}` pairs from this visit, oldest first |

## Response

A JSON object:

| Field | Type | Meaning |
|---|---|---|
| `answer` | string | Plain text. Line breaks are kept; HTML is not rendered |
| `sources` | array | Each `{page: number, quote: string}`: the PDF page the answer rests on and the passage quoted from it |

The site maps each `page` number to the page of the site that holds it, so every source becomes a link.

## Behaviour without a service, and on failure

With no endpoint set, a question returns the passages in the report that contain its words, with
their PDF pages. If the service returns an error or cannot be reached, the same matching passages are
shown and the visitor is told the service could not be reached. Nothing is generated locally.

## A note on grounding

The service should answer from the report alone and return the pages it used. The site shows the
visitor a line to that effect, so the service's behaviour should match it.
