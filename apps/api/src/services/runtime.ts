import { createHash, randomBytes } from "node:crypto";

import type { AIQuestionRequest } from "@ask-me-more/contracts";
import { deckManifest } from "@ask-me-more/content";

import { env, type AppEnv } from "../config.js";
import { MemoryStore } from "../repositories/memory.js";
import type { SessionRecord } from "../types.js";

export type EmailProvider = {
  sendOtp(email: string, code: string): Promise<void>;
};

export type AIProvider = {
  generateQuestion(input: {
    categoryLabel: string;
    categoryDescription: string;
    depth: AIQuestionRequest["depth"];
    recentQuestions: string[];
    model: string;
  }): Promise<string>;
};

export interface IStore {
  createUser(email: string, username: string, passwordHash: string): Promise<any>;
  getUserAuth(email: string): Promise<{ id: string; passwordHash: string | null } | null>;
  findUserByEmail(email: string): Promise<any>;
  findUserById(userId: string): Promise<any>;
  markUserDeleted(userId: string): Promise<void>;
  saveSession(session: SessionRecord): Promise<void>;
  getSessionByAccessToken(token: string): Promise<SessionRecord | null>;
  getSessionByRefreshToken(token: string): Promise<SessionRecord | null>;
  revokeSession(refreshToken: string): Promise<void>;
  createRelationship(userId: string, displayName: string): Promise<any>;
  joinRelationship(userId: string, inviteCode: string): Promise<any>;
  getRelationshipForUser(userId: string): Promise<any>;
  getRelationshipIdForUser(userId: string): Promise<string | null>;
  saveUnlockCode(code: any): Promise<void>;
  redeemUnlockCode(code: string, userId: string, relationshipId: string): Promise<any>;
  setAdminEntitlement(relationshipId: string): Promise<any>;
  getEntitlement(relationshipId: string | null): Promise<any>;
  upsertProgress(userId: string, rollups: any[]): Promise<string>;
  getProgressSummary(userId: string): Promise<any>;
  appendAIRequest(record: any): Promise<void>;
  appendAnalytics(record: any): Promise<void>;
  appendReportedQuestion(record: any): Promise<void>;
  setContentManifest(update: any): Promise<void>;
  setFeatureFlag(flag: any): Promise<void>;
  contentManifest?: any;
}

export type AppRuntime = {
  env: AppEnv;
  store: IStore;
  emailProvider: EmailProvider;
  aiProvider: AIProvider;
  generateOtpCode(): string;
  issueSession(userId: string, deviceName: string): Promise<SessionRecord>;
  refreshSession(refreshToken: string): Promise<SessionRecord | null>;
  validateAccessToken(accessToken: string): Promise<SessionRecord | null>;
  revokeRefreshToken(refreshToken: string): Promise<void>;
  buildAiPrompt(body: AIQuestionRequest): string;
  screenQuestion(question: string, recentQuestions: string[]): { ok: boolean; reason?: string };
  hashValue(value: string): string;
  checkAiRateLimit(userId: string): boolean;
};

function randomToken() {
  return randomBytes(24).toString("hex");
}

function generateOtpCode() {
  if (!env.RESEND_API_KEY) {
    return "123456";
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

function makeConsoleEmailProvider(): EmailProvider {
  return {
    async sendOtp(email, code) {
      console.log(`[otp] ${email} -> ${code}`);
    },
  };
}

function makeResendEmailProvider(currentEnv: AppEnv): EmailProvider {
  if (!currentEnv.RESEND_API_KEY || !currentEnv.RESEND_FROM_EMAIL) {
    return makeConsoleEmailProvider();
  }

  return {
    async sendOtp(email, code) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentEnv.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: currentEnv.RESEND_FROM_EMAIL,
          to: [email],
          subject: "Your Ask Me More login code",
          html: `<p>Your Ask Me More verification code is <strong>${code}</strong>.</p>`,
        }),
      });
    },
  };
}

function buildTone(depth: AIQuestionRequest["depth"]) {
  if (depth === "light") {
    return "gentle and light, warm, approachable, and easy to answer";
  }

  if (depth === "moderate") {
    return "moderately personal, reflective, and emotionally open";
  }

  return "deeply personal, vulnerable, emotionally courageous, and intimate but still safe";
}

function makeAnthropicAIProvider(currentEnv: AppEnv): AIProvider {
  const anthropicKey = currentEnv.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return {
      async generateQuestion(input) {
        return `What is something you have been wanting to share with me lately about ${input.categoryLabel.toLowerCase()}, but have not quite found the right moment to say?`;
      },
    };
  }

  return {
    async generateQuestion(input) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: input.model,
          max_tokens: 180,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: [
                    "You are crafting intimate conversation prompts for couples.",
                    `Category: ${input.categoryLabel}.`,
                    `Description: ${input.categoryDescription}.`,
                    `Emotional target: ${buildTone(input.depth)}.`,
                    `Recent questions to avoid repeating: ${input.recentQuestions.join(" | ") || "none"}.`,
                    "Return exactly one open-ended question.",
                    "Do not use cliches, therapy jargon, sexual coercion, shame, or yes/no phrasing.",
                    "Do not add quotation marks, numbering, or preamble.",
                  ].join(" "),
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic request failed with ${response.status}`);
      }

      const payload = (await response.json()) as {
        content?: Array<{ text?: string }>;
      };

      return payload.content?.[0]?.text?.trim() ?? "";
    },
  };
}

export function createRuntime(overrides?: Partial<Pick<AppRuntime, "store" | "emailProvider" | "aiProvider">>) {
  const store = overrides?.store ?? new MemoryStore();
  const emailProvider = overrides?.emailProvider ?? makeResendEmailProvider(env);
  const aiProvider = overrides?.aiProvider ?? makeAnthropicAIProvider(env);
  const aiWindow = new Map<string, number[]>();

  const runtime: AppRuntime = {
    env,
    store,
    emailProvider,
    aiProvider,
    generateOtpCode,
    async issueSession(userId, deviceName) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + env.ACCESS_TOKEN_TTL_SECONDS * 1000);
      const refreshExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const session: SessionRecord = {
        accessToken: randomToken(),
        refreshToken: randomToken(),
        userId,
        deviceName,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        refreshExpiresAt: refreshExpiresAt.toISOString(),
        revokedAt: null,
      };
      await store.saveSession(session);
      return session;
    },
    async refreshSession(refreshToken) {
      const existing = await store.getSessionByRefreshToken(refreshToken);
      if (!existing) {
        return null;
      }
      await store.revokeSession(refreshToken);
      return runtime.issueSession(existing.userId, existing.deviceName);
    },
    async validateAccessToken(accessToken) {
      return store.getSessionByAccessToken(accessToken);
    },
    async revokeRefreshToken(refreshToken) {
      await store.revokeSession(refreshToken);
    },
    buildAiPrompt(body) {
      const category = deckManifest.categories.find((entry) => entry.id === body.categoryId);
      return [
        `Category: ${category?.label ?? body.categoryId}`,
        `Depth: ${body.depth}`,
        `Recent questions: ${body.recentQuestions.join(" | ")}`,
      ].join("\n");
    },
    screenQuestion(question, recentQuestions) {
      const normalized = question.replace(/^["']+|["']+$/g, "").trim();
      if (normalized.length < 12 || normalized.endsWith("?") === false) {
        return { ok: false, reason: "Question format was invalid." };
      }

      const blockedPatterns = [
        /self-harm/i,
        /abuse/i,
        /worthless/i,
        /hurt yourself/i,
      ];

      if (blockedPatterns.some((pattern) => pattern.test(normalized))) {
        return { ok: false, reason: "Question did not pass safety filters." };
      }

      const duplicate = recentQuestions.some(
        (entry) => entry.trim().toLowerCase() === normalized.trim().toLowerCase(),
      );

      if (duplicate) {
        return { ok: false, reason: "Question repeated recent content." };
      }

      return { ok: true };
    },
    hashValue(value) {
      return createHash("sha256").update(value).digest("hex");
    },
    checkAiRateLimit(userId) {
      const now = Date.now();
      const existing = aiWindow.get(userId) ?? [];
      const recent = existing.filter((timestamp) => now - timestamp < 60 * 60 * 1000);
      if (recent.length >= env.AI_RATE_LIMIT_PER_HOUR) {
        aiWindow.set(userId, recent);
        return false;
      }
      recent.push(now);
      aiWindow.set(userId, recent);
      return true;
    },
  };

  return {
    runtime,
  };
}
