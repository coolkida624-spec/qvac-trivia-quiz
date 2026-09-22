# QVAC Trivia Quiz

A multiple-choice trivia quiz built from an original fact catalog
([src/facts.js](src/facts.js)). RAG search pulls other, topically
related facts to use as wrong-answer options, an on-device LLM phrases
the correct fact into a question, and checking your answer is plain
deterministic code — entirely on your machine with
[Tether's QVAC SDK](https://github.com/tetherto/qvac). No cloud call,
no API key, no bill.

It calls the QVAC SDK's `loadModel()`, `unloadModel()`, `completion()`,
`ragIngest()`, `ragSearch()`, and `ragDeleteWorkspace()` functions
directly. The model is restricted to rephrasing the one fact it's
given into a question — it never sees or invents the multiple-choice
options, and it never decides which answer is correct.

## What it does

```bash
npm run gui
```

Click "New Question." The app picks a random fact, uses `ragSearch()`
against the full fact catalog to find related facts from *other*
entries to use as distractors, asks the LLM to turn the correct fact
into a question, and shows four shuffled options. The correct-answer
index is kept server-side and only revealed after you pick.

## SDK version

Built against `@qvac/sdk` **v0.19.1** (see [package.json](package.json)).

## Requirements

- Node.js `>= 22.17`
- A machine that meets [QVAC's system requirements](https://docs.qvac.tether.io/system-requirements)
- ~1.1 GB free disk space for the LLM + embedding model weights on first run

## Install

```bash
npm install
```

## GUI mode

```bash
npm run gui
```

Loads the model, ingests the fact catalog into a fresh RAG workspace
(deleting any leftover workspace from a previous run first), then
starts a local server (`http://localhost:29297` by default, override
with `PORT=8080 npm run gui`).

## How it uses QVAC

```js
import { loadModel, completion, ragIngest, ragSearch, ragDeleteWorkspace, LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";

const modelId = await loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 });

await ragDeleteWorkspace({ workspace: "qvac-trivia-quiz" }).catch(() => {});
await ragIngest({ workspace: "qvac-trivia-quiz", documents: FACTS.map((f) => f.fact) });

// find topically related facts to use as wrong answers
const related = await ragSearch({ workspace: "qvac-trivia-quiz", query: correctFact, topK: 6 });

// LLM only rephrases the correct fact into a question
const run = completion({ modelId, history: [...], stream: true });
```

See [src/quiz.js](src/quiz.js) for the full implementation.

## Why I built this

Most trivia generators either hardcode wrong answers or let the model
invent them (risking nonsense or repeats). Using `ragSearch()` against
the same fact catalog for distractors makes the wrong answers
plausible — genuinely related facts, not random noise — while keeping
the model's role narrow: phrase a question from a fact it's handed,
nothing more. It's a different composition of the same
"generate-then-ground" pattern used in this series's other RAG apps,
but applied to game design (distractor quality) instead of factual
accuracy alone.

## Notes on this build

This app was built and scaffolded in this session but not run
end-to-end yet — no "verified output" section is included here on
purpose, to avoid claiming a test that didn't happen. The design
mirrors patterns (RAG workspace reset before ingest, grounded
completion, light output guards) already verified working in this
series's other apps.

## License

[MIT](LICENSE)
