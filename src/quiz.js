// QVAC Trivia Quiz — core logic.
// ragSearch() pulls other facts semantically related to the correct one
// to use as multiple-choice distractors (so wrong answers are at least
// topically plausible, not random noise). completion() only rephrases
// the correct fact into a question — it's restricted to the fact text
// it's given and never allowed to invent new claims. Which option index
// is correct is tracked deterministically, never decided by the model.

import { completion, ragIngest, ragSearch, ragDeleteWorkspace } from "@qvac/sdk";
import { FACTS, randomFact } from "./facts.js";

const WORKSPACE = "qvac-trivia-quiz";

export async function setupWorkspace() {
  await ragDeleteWorkspace({ workspace: WORKSPACE }).catch(() => {});
  await ragIngest({
    workspace: WORKSPACE,
    documents: FACTS.map((f) => f.fact),
  });
}

function looksUnusable(text) {
  if (!text || text.trim().length === 0) return true;
  if (text.length > 300) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able"];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function generateQuestion(modelId, usedIds) {
  const correct = randomFact(usedIds);

  const searchResults = await ragSearch({
    workspace: WORKSPACE,
    query: correct.fact,
    topK: 6,
  });

  const distractorFacts = FACTS.filter(
    (f) => f.id !== correct.id && searchResults.some((r) => r.text === f.fact)
  ).slice(0, 3);

  while (distractorFacts.length < 3) {
    const filler = FACTS[Math.floor(Math.random() * FACTS.length)];
    if (filler.id !== correct.id && !distractorFacts.some((d) => d.id === filler.id)) {
      distractorFacts.push(filler);
    }
  }

  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You turn a single true fact into a short trivia question. Only use " +
          "the fact given — never add new information. Reply with exactly:\n" +
          "QUESTION: <a question whose answer is the fact given>",
      },
      { role: "user", content: `Fact: ${correct.fact}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.6, maxTokens: 60 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;

  const qMatch = text.match(/QUESTION:\s*(.*)/i);
  const question =
    qMatch && !looksUnusable(qMatch[1])
      ? qMatch[1].trim()
      : `Which of these is true?`;

  const options = shuffle([
    { text: correct.fact, correct: true },
    ...distractorFacts.map((f) => ({ text: f.fact, correct: false })),
  ]);

  return {
    factId: correct.id,
    question,
    options: options.map((o) => o.text),
    correctIndex: options.findIndex((o) => o.correct),
  };
}
