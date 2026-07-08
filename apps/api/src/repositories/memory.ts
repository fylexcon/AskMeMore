import { randomBytes, randomUUID } from "node:crypto";

import type { EntitlementStatus, ProgressRollupInput, ProgressSummary } from "@ask-me-more/contracts";
import { deckManifest } from "@ask-me-more/content";

import type {
  AIRequestRecord,
  AnalyticsEventRecord,
  ContentManifestRecord,
  EntitlementRecord,
  FeatureFlagRecord,
  OtpRecord,
  RelationshipRecord,
  ReportedQuestionRecord,
  SessionRecord,
  StoredRollup,
  UnlockCodeRecord,
  UserRecord,
} from "../types.js";

export class MemoryStore {
  readonly users = new Map<string, UserRecord>();
  readonly usersByEmail = new Map<string, string>();
  readonly otps = new Map<string, OtpRecord>();
  readonly sessionsByAccess = new Map<string, SessionRecord>();
  readonly sessionsByRefresh = new Map<string, SessionRecord>();
  readonly relationships = new Map<string, RelationshipRecord>();
  readonly relationshipMembers = new Map<string, Set<string>>();
  readonly relationshipByUser = new Map<string, string>();
  readonly entitlements = new Map<string, EntitlementRecord>();
  readonly unlockCodes = new Map<string, UnlockCodeRecord>();
  readonly progress = new Map<string, StoredRollup>();
  readonly aiRequests: AIRequestRecord[] = [];
  readonly analyticsEvents: AnalyticsEventRecord[] = [];
  readonly reportedQuestions: ReportedQuestionRecord[] = [];
  readonly featureFlags = new Map<string, FeatureFlagRecord>();
  contentManifest: ContentManifestRecord = {
    version: deckManifest.version,
    minimumSupportedAppVersion: "1.0.0",
  };

  private createInviteCode() {
    return randomBytes(4).toString("hex");
  }

  async findUserByEmail(email: string) {
    const userId = this.usersByEmail.get(email.toLowerCase());
    return userId ? this.users.get(userId) ?? null : null;
  }

  async findUserById(userId: string) {
    const user = this.users.get(userId);
    return user && !user.deletedAt ? user : null;
  }

  async createUser(email: string, username: string, passwordHash: string) {
    const existing = await this.findUserByEmail(email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const user: UserRecord = {
      id: randomUUID(),
      email: email.toLowerCase(),
      username,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);
    (user as any).passwordHash = passwordHash;
    return user;
  }

  async getUserAuth(email: string) {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    return { id: user.id, passwordHash: (user as any).passwordHash ?? null };
  }

  async markUserDeleted(userId: string) {
    const user = this.users.get(userId);
    if (!user) {
      return;
    }

    user.deletedAt = new Date().toISOString();
  }

  async saveSession(session: SessionRecord) {
    this.sessionsByAccess.set(session.accessToken, session);
    this.sessionsByRefresh.set(session.refreshToken, session);
  }

  async getSessionByAccessToken(token: string) {
    const session = this.sessionsByAccess.get(token) ?? null;
    if (!session || session.revokedAt) {
      return null;
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      session.revokedAt = new Date().toISOString();
      return null;
    }

    return session;
  }

  async getSessionByRefreshToken(token: string) {
    const session = this.sessionsByRefresh.get(token) ?? null;
    if (!session || session.revokedAt) {
      return null;
    }

    if (new Date(session.refreshExpiresAt).getTime() < Date.now()) {
      session.revokedAt = new Date().toISOString();
      return null;
    }

    return session;
  }

  async revokeSession(refreshToken: string) {
    const session = this.sessionsByRefresh.get(refreshToken);
    if (session) {
      session.revokedAt = new Date().toISOString();
    }
  }

  async createRelationship(userId: string, displayName: string) {
    if (this.relationshipByUser.has(userId)) {
      const relationshipId = this.relationshipByUser.get(userId)!;
      return this.relationships.get(relationshipId) ?? null;
    }

    const relationship: RelationshipRecord = {
      id: randomUUID(),
      displayName,
      inviteCode: this.createInviteCode(),
      createdAt: new Date().toISOString(),
    };

    this.relationships.set(relationship.id, relationship);
    this.relationshipMembers.set(relationship.id, new Set([userId]));
    this.relationshipByUser.set(userId, relationship.id);
    return relationship;
  }

  async joinRelationship(userId: string, inviteCode: string) {
    if (this.relationshipByUser.has(userId)) {
      return { error: "already_joined" as const };
    }

    const relationship = Array.from(this.relationships.values()).find(
      (candidate) => candidate.inviteCode === inviteCode,
    );

    if (!relationship) {
      return { error: "not_found" as const };
    }

    const members = this.relationshipMembers.get(relationship.id) ?? new Set<string>();
    if (members.size >= 2) {
      return { error: "full" as const };
    }

    members.add(userId);
    this.relationshipMembers.set(relationship.id, members);
    this.relationshipByUser.set(userId, relationship.id);
    return { relationship };
  }

  async getRelationshipForUser(userId: string) {
    const relationshipId = this.relationshipByUser.get(userId);
    if (!relationshipId) {
      return null;
    }

    const relationship = this.relationships.get(relationshipId);
    if (!relationship) {
      return null;
    }

    const members = this.relationshipMembers.get(relationshipId) ?? new Set<string>();
    return {
      ...relationship,
      memberCount: members.size,
    };
  }

  async getRelationshipIdForUser(userId: string) {
    return this.relationshipByUser.get(userId) ?? null;
  }

  async saveUnlockCode(code: UnlockCodeRecord) {
    this.unlockCodes.set(code.code, code);
  }

  async redeemUnlockCode(code: string, userId: string, relationshipId: string) {
    const record = this.unlockCodes.get(code);
    if (!record) {
      return { error: "not_found" as const };
    }

    if (record.redeemedAt) {
      return { error: "already_redeemed" as const };
    }

    record.redeemedAt = new Date().toISOString();
    record.redeemedByUserId = userId;
    record.redeemedRelationshipId = relationshipId;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + record.durationDays);

    this.entitlements.set(relationshipId, {
      relationshipId,
      source: "unlock_code",
      grantedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    return { expiresAt: expiresAt.toISOString() };
  }

  async setAdminEntitlement(relationshipId: string) {
    this.entitlements.set(relationshipId, {
      relationshipId,
      source: "admin",
      grantedAt: new Date().toISOString(),
      expiresAt: null,
    });
  }

  async getEntitlement(relationshipId: string | null): Promise<EntitlementStatus> {
    if (!relationshipId) {
      return {
        relationshipId: null,
        premiumUnlocked: false,
        source: "none",
        expiresAt: null,
      };
    }

    const entitlement = this.entitlements.get(relationshipId);
    if (!entitlement) {
      return {
        relationshipId,
        premiumUnlocked: false,
        source: "none",
        expiresAt: null,
      };
    }

    const active =
      entitlement.expiresAt === null || new Date(entitlement.expiresAt).getTime() > Date.now();

    return {
      relationshipId,
      premiumUnlocked: active,
      source: active ? entitlement.source : "none",
      expiresAt: active ? entitlement.expiresAt : null,
    };
  }

  async upsertProgress(userId: string, rollups: ProgressRollupInput[]) {
    const syncedAt = new Date().toISOString();
    for (const rollup of rollups) {
      this.progress.set(`${userId}:${rollup.key}`, {
        ...rollup,
        userId,
        syncedAt,
      });
    }
    return syncedAt;
  }

  async getProgressSummary(userId: string): Promise<ProgressSummary> {
    const entries = Array.from(this.progress.values()).filter((entry) => entry.userId === userId);
    const perCategory = Object.fromEntries(
      deckManifest.categories.map((category) => [
        category.id,
        {
          answeredCount: 0,
          totalQuestions: category.totalQuestions,
          completed: false,
        },
      ]),
    ) as ProgressSummary["perCategory"];

    const dayCounts = new Map<string, number>();

    for (const entry of entries) {
      const categoryProgress = perCategory[entry.categoryId];
      if (!categoryProgress) {
        continue;
      }

      categoryProgress.answeredCount += entry.answeredCount;
      categoryProgress.completed = categoryProgress.completed || entry.completedDeck;
      dayCounts.set(
        entry.happenedOn,
        (dayCounts.get(entry.happenedOn) ?? 0) + entry.answeredCount,
      );
    }

    let streakDays = 0;
    const pointer = new Date();

    while (dayCounts.has(pointer.toISOString().slice(0, 10))) {
      streakDays += 1;
      pointer.setUTCDate(pointer.getUTCDate() - 1);
    }

    return {
      streakDays,
      totalAnswered: entries.reduce((sum, entry) => sum + entry.answeredCount, 0),
      decksStarted: Object.values(perCategory).filter((entry) => entry.answeredCount > 0).length,
      perCategory,
      syncedAt: entries.length > 0 ? entries[entries.length - 1]!.syncedAt : null,
    };
  }

  async appendAIRequest(record: AIRequestRecord) {
    this.aiRequests.push(record);
  }

  async appendAnalytics(record: AnalyticsEventRecord) {
    this.analyticsEvents.push(record);
  }

  async appendReportedQuestion(record: ReportedQuestionRecord) {
    this.reportedQuestions.push(record);
  }

  async setContentManifest(update: ContentManifestRecord) {
    this.contentManifest = update;
  }

  async setFeatureFlag(flag: FeatureFlagRecord) {
    this.featureFlags.set(flag.key, flag);
  }
}
