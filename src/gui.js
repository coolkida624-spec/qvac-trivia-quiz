#!/usr/bin/env node
// QVAC Trivia Quiz — GUI mode. The correct-answer index is kept
// server-side only and never sent to the client until after it answers.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadModel, unloadModel, LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";
import { setupWorkspace, generateQuestion } from "./quiz.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? Number(process.env.PORT) : 29297;
const PUBLIC_DIR = path.join(__dirname, "..", "public");

function serveStatic(res) {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, "index.html"));
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

async function main() {
  console.log("▸ Loading language model + ingesting fact catalog...");
  const modelId = await loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 });
  await setupWorkspace();
  console.log("▸ Ready.");

  let current = null;
  const usedIds = [];
  let score = { correct: 0, total: 0 };

  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/") return serveStatic(res);

    if (req.method === "POST" && req.url === "/api/new-question") {
      try {
        current = await generateQuestion(modelId, usedIds);
        usedIds.push(current.factId);
        if (usedIds.length > 12) usedIds.shift();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          question: current.question,
          options: current.options,
          score,
        }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    if (req.method === "POST" && req.url === "/api/answer") {
      const { index } = await readBody(req);
      if (!current) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No active question" }));
        return;
      }
      const isCorrect = index === current.correctIndex;
      score.total++;
      if (isCorrect) score.correct++;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        correct: isCorrect,
        correctIndex: current.correctIndex,
        score,
      }));
      current = null;
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  server.listen(PORT, () => {
    console.log(`▸ QVAC Trivia Quiz GUI ready at http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    console.log("\n▸ Shutting down...");
    server.close();
    await unloadModel({ modelId });
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("✖", error);
  process.exit(1);
});
