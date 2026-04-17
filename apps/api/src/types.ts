import type { CategoryId, DepthLevel, ProgressRollupInput, QuestionSource } from "@ask-me-more/contracts";

export type UserRecord = {
  id: string;
  email: string;
  createdAt: string;
  deletedAt: string | null;
};

export type OtpRecord = {
  email: string;
  code: string;
  deviceName: string;
  expiresAt: string;
};

export type SessionRecord = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  deviceName: string;
  createdAt: string;
  expiresAt: string;
  refreshExpiresAt: string;
  revokedAt: string | null;
};

export type RelationshipRecord = {
  id: string;
  displayName: string;
  inviteCode: string;
  createdAt: string;
};

export type EntitlementRecord = {
  relationshipId: string;
  source: "unlock_code" | "admin";
  grantedAt: string;
  expiresAt: string | null;
};

export type UnlockCodeRecord = {
  code: string;
  durationDays: number;
  note?: string;
  createdAt: string;
  redeemedAt: string | null;
  redeemedByUserId: string | null;
  redeemedRelationshipId: string | null;
};

export type StoredRollup = ProgressRollupInput & {
  userId: string;
  syncedAt: string;
};

export type AIRequestRecord = {
  userId: string;
  relationshipId: string | null;
  categoryId: CategoryId;
  depth: DepthLevel;
  model: string;
  questionHash: string;
  status: "success" | "rejected";
  createdAt: string;
  latencyMs: number;
};

export type AnalyticsEventRecord = {
  eventName: string;
  platform: "ios" | "android";
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
  userId: string | null;
};

export type FeatureFlagRecord = {
  key: string;
  enabled: boolean;
  description?: string;
};

export type ReportedQuestionRecord = {
  categoryId: CategoryId;
  source: QuestionSource;
  question: string;
  reason: "unsafe" | "duplicate" | "off_topic" | "other";
  createdAt: string;
  userId: string;
};

export type ContentManifestRecord = {
  version: string;
  minimumSupportedAppVersion: string;
};

export type Viewer = {
  userId: string;
};
