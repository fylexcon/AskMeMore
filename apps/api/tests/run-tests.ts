import assert from "node:assert/strict";

import { buildApp } from "../src/app.js";
import { MemoryStore } from "../src/repositories/memory.js";

async function testAuthRelationshipAndRedemption() {
  const store = new MemoryStore();
  const app = buildApp({
    store,
    emailProvider: {
      async sendOtp() {},
    },
  });

  const register = await app.inject({
    method: "POST",
    url: "/v1/auth/register",
    payload: { email: "alex@example.com", username: "alex", password: "password123", deviceName: "iPhone 16" },
  });

  assert.equal(register.statusCode, 200);

  const verify = await app.inject({
    method: "POST",
    url: "/v1/auth/login",
    payload: { email: "alex@example.com", password: "password123", deviceName: "iPhone 16" },
  });

  if(verify.statusCode !== 200) console.log(verify.json()); assert.equal(verify.statusCode, 200);
  const session = verify.json();

  const relationship = await app.inject({
    method: "POST",
    url: "/v1/relationships/create",
    headers: { authorization: `Bearer ${session.tokens.accessToken}` },
    payload: { displayName: "Alex and Sam" },
  });

  assert.equal(relationship.statusCode, 200);

  const admin = await app.inject({
    method: "POST",
    url: "/v1/admin/unlock-codes",
    headers: { "x-admin-token": "change-me" },
    payload: { quantity: 1, durationDays: 30, note: "beta" },
  });

  const code = admin.json().codes[0];
  const redeem = await app.inject({
    method: "POST",
    url: "/v1/entitlements/redeem",
    headers: { authorization: `Bearer ${session.tokens.accessToken}` },
    payload: { code },
  });

  assert.equal(redeem.statusCode, 200);
  assert.equal(redeem.json().premiumUnlocked, true);
  await app.close();
}

async function testAiPremiumGate() {
  const store = new MemoryStore();
  const app = buildApp({
    store,
    emailProvider: {
      async sendOtp() {},
    },
    aiProvider: {
      async generateQuestion() {
        return "What is something you have learned about yourself through loving me that surprised you?";
      },
    },
  });

  const verify = await app.inject({
    method: "POST",
    url: "/v1/auth/register",
    payload: { email: "morgan@example.com", username: "morgan", password: "password123", deviceName: "Pixel" },
  });

  const accessToken = verify.json().tokens.accessToken;
  const denied = await app.inject({
    method: "POST",
    url: "/v1/ai/questions",
    headers: { authorization: `Bearer ${accessToken}` },
    payload: {
      categoryId: "discovery",
      depth: "moderate",
      recentQuestions: ["What belief about yourself has changed the most in the last year?"],
    },
  });

  assert.equal(denied.statusCode, 403);

  await app.inject({
    method: "POST",
    url: "/v1/admin/unlock-codes",
    headers: { "x-admin-token": "change-me" },
    payload: { quantity: 1, durationDays: 14 },
  });

  const code = Array.from(store.unlockCodes.keys())[0];
  const redeemed = await app.inject({
    method: "POST",
    url: "/v1/entitlements/redeem",
    headers: { authorization: `Bearer ${accessToken}` },
    payload: { code },
  });

  assert.equal(redeemed.statusCode, 200);

  const allowed = await app.inject({
    method: "POST",
    url: "/v1/ai/questions",
    headers: { authorization: `Bearer ${accessToken}` },
    payload: {
      categoryId: "discovery",
      depth: "moderate",
      recentQuestions: ["What belief about yourself has changed the most in the last year?"],
    },
  });

  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.json().source, "ai");
  await app.close();
}

async function testProgressSync() {
  const store = new MemoryStore();
  const app = buildApp({
    store,
    emailProvider: {
      async sendOtp() {},
    },
  });

  const verify = await app.inject({
    method: "POST",
    url: "/v1/auth/register",
    payload: { email: "jamie@example.com", username: "jamie", password: "password123", deviceName: "Android" },
  });

  const accessToken = verify.json().tokens.accessToken;
  const today = new Date().toISOString().slice(0, 10);

  const sync = await app.inject({
    method: "POST",
    url: "/v1/progress/sync",
    headers: { authorization: `Bearer ${accessToken}` },
    payload: {
      rollups: [
        {
          key: "today-discovery-seeded",
          categoryId: "discovery",
          source: "seeded",
          answeredCount: 3,
          completedDeck: false,
          happenedOn: today,
        },
      ],
    },
  });

  assert.equal(sync.statusCode, 200);

  const summary = await app.inject({
    method: "GET",
    url: "/v1/progress/summary",
    headers: { authorization: `Bearer ${accessToken}` },
  });

  assert.equal(summary.statusCode, 200);
  assert.equal(summary.json().totalAnswered, 3);
  assert.equal(summary.json().streakDays, 1);
  await app.close();
}

async function main() {
  await testAuthRelationshipAndRedemption();
  await testAiPremiumGate();
  await testProgressSync();
  console.log("API verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
