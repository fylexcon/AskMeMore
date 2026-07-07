import { Platform } from "react-native";
import type {
  AIQuestionRequest,
  AIQuestionResponse,
  AuthSession,
  EntitlementStatus,
  ProgressSummary,
  RelationshipSummary,
} from "@ask-me-more/contracts";
import {
  AIQuestionResponseSchema,
  AuthSessionSchema,
  DeckManifestSchema,
  EntitlementStatusSchema,
  ProgressSummarySchema,
  RelationshipSummarySchema,
} from "@ask-me-more/contracts";

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, options?: RequestInit, accessToken?: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function requestOtp(email: string, deviceName: string) {
  return request<{ sent: boolean; expiresInSeconds: number }>("/v1/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ email, deviceName }),
  });
}

export async function verifyOtp(email: string, code: string, deviceName: string) {
  const payload = await request<AuthSession>("/v1/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, code, deviceName }),
  });
  return AuthSessionSchema.parse(payload);
}

export async function refreshSession(refreshToken: string) {
  return request<{ accessToken: string; refreshToken: string; expiresInSeconds: number }>(
    "/v1/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    },
  );
}

export async function logout(refreshToken: string) {
  await request<void>("/v1/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function fetchRelationship(accessToken: string) {
  const payload = await request<RelationshipSummary | null>(
    "/v1/relationships/me",
    undefined,
    accessToken,
  );
  return payload ? RelationshipSummarySchema.parse(payload) : null;
}

export async function createRelationship(accessToken: string, displayName: string) {
  const payload = await request<RelationshipSummary>(
    "/v1/relationships/create",
    {
      method: "POST",
      body: JSON.stringify({ displayName }),
    },
    accessToken,
  );
  return RelationshipSummarySchema.parse(payload);
}

export async function joinRelationship(accessToken: string, inviteCode: string) {
  const payload = await request<RelationshipSummary>(
    "/v1/relationships/join",
    {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    },
    accessToken,
  );
  return RelationshipSummarySchema.parse(payload);
}

export async function fetchEntitlement(accessToken: string) {
  const payload = await request<EntitlementStatus>("/v1/entitlements/me", undefined, accessToken);
  return EntitlementStatusSchema.parse(payload);
}

export async function redeemUnlockCode(accessToken: string, code: string) {
  const payload = await request<EntitlementStatus>(
    "/v1/entitlements/redeem",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    },
    accessToken,
  );
  return EntitlementStatusSchema.parse(payload);
}

export async function fetchManifest() {
  const payload = await request("/v1/content/manifest");
  return DeckManifestSchema.parse(payload);
}

export async function syncProgress(accessToken: string, rollups: Array<{
  key: string;
  categoryId: string;
  source: string;
  answeredCount: number;
  completedDeck: boolean;
  happenedOn: string;
}>) {
  return request<{ acceptedKeys: string[]; syncedAt: string }>(
    "/v1/progress/sync",
    {
      method: "POST",
      body: JSON.stringify({ rollups }),
    },
    accessToken,
  );
}

export async function fetchProgressSummary(accessToken: string) {
  const payload = await request<ProgressSummary>("/v1/progress/summary", undefined, accessToken);
  return ProgressSummarySchema.parse(payload);
}

export async function generateAiQuestion(accessToken: string, input: AIQuestionRequest) {
  const payload = await request<AIQuestionResponse>(
    "/v1/ai/questions",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    accessToken,
  );
  return AIQuestionResponseSchema.parse(payload);
}

export async function postAnalytics(eventName: string, metadata: Record<string, string | number | boolean>) {
  await request(
    "/v1/analytics/events",
    {
      method: "POST",
      body: JSON.stringify({
        eventName,
        platform: Platform.OS,
        metadata,
      }),
    },
  );
}

export async function deleteAccount(accessToken: string) {
  await request<void>("/v1/me", { method: "DELETE" }, accessToken);
}
