import { z } from "zod";

export const categoryIds = [
  "discovery",
  "dreams",
  "playful",
  "deeper",
  "values",
  "intimacy",
] as const;

export const depthLevels = ["light", "moderate", "deep"] as const;
export const questionSources = ["seeded", "ai"] as const;
export const deckAccessLevels = ["free", "premium"] as const;

export const CategoryIdSchema = z.enum(categoryIds);
export const DepthLevelSchema = z.enum(depthLevels);
export const QuestionSourceSchema = z.enum(questionSources);
export const DeckAccessLevelSchema = z.enum(deckAccessLevels);

export const CategorySummarySchema = z.object({
  id: CategoryIdSchema,
  label: z.string(),
  description: z.string(),
  iconKey: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  accessLevel: DeckAccessLevelSchema,
  totalQuestions: z.number().int().positive(),
});

export const QuoteSchema = z.object({
  text: z.string(),
  author: z.string(),
});

export const DeckManifestSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  categories: z.array(CategorySummarySchema),
  quotes: z.array(QuoteSchema),
});

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  relationshipId: z.string().nullable(),
  createdAt: z.string(),
});

export const EntitlementStatusSchema = z.object({
  relationshipId: z.string().nullable(),
  premiumUnlocked: z.boolean(),
  source: z.enum(["none", "unlock_code", "admin"]),
  expiresAt: z.string().nullable(),
});

export const ProgressRollupInputSchema = z.object({
  key: z.string().min(8),
  categoryId: CategoryIdSchema,
  source: QuestionSourceSchema,
  answeredCount: z.number().int().min(0),
  completedDeck: z.boolean(),
  happenedOn: z.string(),
});

export const ProgressSummarySchema = z.object({
  streakDays: z.number().int().min(0),
  totalAnswered: z.number().int().min(0),
  decksStarted: z.number().int().min(0),
  perCategory: z.record(
    CategoryIdSchema,
    z.object({
      answeredCount: z.number().int().min(0),
      totalQuestions: z.number().int().positive(),
      completed: z.boolean(),
    }),
  ),
  syncedAt: z.string().nullable(),
});

export const AIQuestionRequestSchema = z.object({
  categoryId: CategoryIdSchema,
  depth: DepthLevelSchema,
  recentQuestions: z.array(z.string().min(8)).max(5),
});

export const AIQuestionResponseSchema = z.object({
  question: z.string().min(12),
  source: z.literal("ai"),
  model: z.string(),
  generatedAt: z.string(),
});

export const RequestOtpSchema = z.object({
  email: z.string().email(),
  deviceName: z.string().min(2).max(80),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  deviceName: z.string().min(2).max(80),
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresInSeconds: z.number().int().positive(),
});

export const AuthSessionSchema = z.object({
  user: UserProfileSchema,
  tokens: AuthTokensSchema,
});

export const CreateRelationshipSchema = z.object({
  displayName: z.string().min(2).max(80),
});

export const JoinRelationshipSchema = z.object({
  inviteCode: z.string().min(6).max(32),
});

export const RelationshipSummarySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  inviteCode: z.string(),
  memberCount: z.number().int().min(1).max(2),
  createdAt: z.string(),
});

export const RedeemUnlockCodeSchema = z.object({
  code: z.string().min(6).max(64),
});

export const SyncProgressSchema = z.object({
  rollups: z.array(ProgressRollupInputSchema).max(200),
});

export const SyncProgressResultSchema = z.object({
  acceptedKeys: z.array(z.string()),
  syncedAt: z.string(),
});

export const AnalyticsEventSchema = z.object({
  eventName: z.string().min(2).max(80),
  platform: z.enum(["ios", "android"]),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export const ReportQuestionSchema = z.object({
  categoryId: CategoryIdSchema,
  source: QuestionSourceSchema,
  question: z.string().min(8),
  reason: z.enum(["unsafe", "duplicate", "off_topic", "other"]),
});

export const AdminCreateUnlockCodesSchema = z.object({
  quantity: z.number().int().min(1).max(500),
  durationDays: z.number().int().min(1).max(365),
  note: z.string().max(200).optional(),
});

export const AdminCreateUnlockCodesResponseSchema = z.object({
  codes: z.array(z.string()),
});

export const UpdateContentManifestSchema = z.object({
  version: z.string(),
  minimumSupportedAppVersion: z.string(),
});

export const FeatureFlagSchema = z.object({
  key: z.string().min(2).max(80),
  enabled: z.boolean(),
  description: z.string().max(200).optional(),
});

export type CategoryId = z.infer<typeof CategoryIdSchema>;
export type DepthLevel = z.infer<typeof DepthLevelSchema>;
export type QuestionSource = z.infer<typeof QuestionSourceSchema>;
export type DeckManifest = z.infer<typeof DeckManifestSchema>;
export type EntitlementStatus = z.infer<typeof EntitlementStatusSchema>;
export type ProgressRollupInput = z.infer<typeof ProgressRollupInputSchema>;
export type ProgressSummary = z.infer<typeof ProgressSummarySchema>;
export type AIQuestionRequest = z.infer<typeof AIQuestionRequestSchema>;
export type AIQuestionResponse = z.infer<typeof AIQuestionResponseSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type RelationshipSummary = z.infer<typeof RelationshipSummarySchema>;
