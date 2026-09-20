import assert from "node:assert/strict";
import test from "node:test";
import { buildHandoff } from "../src/marketplace.js";

test("validated order becomes a buyer update and handoff", async () => {
  const fake = {
    embeddings: { create: async () => ({ data: [{ embedding: [0.1, 0.2, 0.3] }] }) },
    chat: { completions: { create: async () => ({ choices: [{ message: { content: "UPDATE: Dispatch is confirmed.\nHANDOFF: Pack order-42 for Tuesday pickup." } }], usage: { total_tokens: 19 } }) } }
  } as any;
  const result = await buildHandoff({ orderId: "order-42", seller: { id: "s", title: "Desk", description: "Oak" }, buyer: { name: "Mina", update: "When?" } }, fake);
  assert.equal(result.orderId, "order-42");
  assert.equal(result.buyerUpdate, "Dispatch is confirmed.");
  assert.match(result.handoff, /Tuesday/);
  assert.equal(result.usage.total_tokens, 19);
});
