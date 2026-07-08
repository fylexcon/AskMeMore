import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { randomBytes, randomUUID } from "node:crypto";
import { deckManifest } from "@ask-me-more/content";
import { env } from "../config.js";
import type { EntitlementStatus, ProgressRollupInput, ProgressSummary, CategoryId, DepthLevel, QuestionSource } from "@ask-me-more/contracts";

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
import type { IStore } from "../services/runtime.js";

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

export class PrismaStore implements IStore {
  contentManifest?: ContentManifestRecord;

  async createUser(email: string, username: string, passwordHash: string): Promise<UserRecord> {
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        passwordHash,
      },
    });
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
      deletedAt: user.deletedAt?.toISOString() ?? null,
    };
  }

  async getUserAuth(email: string): Promise<{ id: string; passwordHash: string | null } | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || user.deletedAt) return null;
    return {
      id: user.id,
      passwordHash: user.passwordHash,
    };
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || user.deletedAt) return null;
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
      deletedAt: null,
    };
  }

  async findUserById(userId: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) return null;
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
      deletedAt: null,
    };
  }

  async markUserDeleted(userId: string): Promise<void> {
    await prisma.user.updateMany({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }

  readonly sessionsByAccess = new Map<string, SessionRecord>();

  async saveSession(session: SessionRecord): Promise<void> {
    this.sessionsByAccess.set(session.accessToken, session);
    await prisma.refreshToken.create({
      data: {
        userId: session.userId,
        tokenHash: session.refreshToken,
        deviceName: session.deviceName,
        expiresAt: new Date(session.refreshExpiresAt),
      },
    });
  }

  async getSessionByAccessToken(token: string): Promise<SessionRecord | null> {
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

  async getSessionByRefreshToken(token: string): Promise<SessionRecord | null> {
    const session = await prisma.refreshToken.findUnique({
      where: { tokenHash: token },
    });
    if (!session || session.revokedAt) return null;

    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.refreshToken.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      return null;
    }

    return {
      accessToken: "", // We can't recover this
      refreshToken: session.tokenHash,
      userId: session.userId,
      deviceName: session.deviceName,
      createdAt: session.createdAt.toISOString(),
      expiresAt: "", // Can't recover short-lived access token expiry
      refreshExpiresAt: session.expiresAt.toISOString(),
      revokedAt: null,
    };
  }

  async revokeSession(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  async createRelationship(userId: string, displayName: string): Promise<RelationshipRecord | null> {
    const existing = await prisma.relationshipMember.findUnique({ where: { userId } });
    if (existing) {
      const rel = await prisma.relationship.findUnique({ where: { id: existing.relationshipId } });
      if (!rel) return null;
      return {
        id: rel.id,
        displayName: rel.displayName,
        inviteCode: rel.inviteCode,
        createdAt: rel.createdAt.toISOString(),
      };
    }

    const relationship = await prisma.relationship.create({
      data: {
        displayName,
        inviteCode: randomBytes(4).toString("hex"),
        members: {
          create: { userId },
        },
      },
    });

    return {
      id: relationship.id,
      displayName: relationship.displayName,
      inviteCode: relationship.inviteCode,
      createdAt: relationship.createdAt.toISOString(),
    };
  }

  async joinRelationship(userId: string, inviteCode: string): Promise<{ error: "already_joined" | "not_found" | "full" } | { relationship: RelationshipRecord }> {
    const existing = await prisma.relationshipMember.findUnique({ where: { userId } });
    if (existing) return { error: "already_joined" };

    const relationship = await prisma.relationship.findUnique({ where: { inviteCode } });
    if (!relationship) return { error: "not_found" };

    const count = await prisma.relationshipMember.count({ where: { relationshipId: relationship.id } });
    if (count >= 2) return { error: "full" };

    await prisma.relationshipMember.create({
      data: { relationshipId: relationship.id, userId },
    });

    return {
      relationship: {
        id: relationship.id,
        displayName: relationship.displayName,
        inviteCode: relationship.inviteCode,
        createdAt: relationship.createdAt.toISOString(),
      }
    };
  }

  async getRelationshipForUser(userId: string): Promise<(RelationshipRecord & { memberCount: number }) | null> {
    const member = await prisma.relationshipMember.findUnique({ where: { userId } });
    if (!member) return null;

    const relationship = await prisma.relationship.findUnique({ where: { id: member.relationshipId } });
    if (!relationship) return null;

    const count = await prisma.relationshipMember.count({ where: { relationshipId: relationship.id } });

    return {
      id: relationship.id,
      displayName: relationship.displayName,
      inviteCode: relationship.inviteCode,
      createdAt: relationship.createdAt.toISOString(),
      memberCount: count,
    };
  }

  async getRelationshipIdForUser(userId: string): Promise<string | null> {
    const member = await prisma.relationshipMember.findUnique({ where: { userId } });
    return member?.relationshipId ?? null;
  }

  async saveUnlockCode(code: UnlockCodeRecord): Promise<void> {
    await prisma.unlockCode.create({
      data: {
        code: code.code,
        durationDays: code.durationDays,
        note: code.note,
        redeemedAt: code.redeemedAt ? new Date(code.redeemedAt) : null,
        redeemedByUserId: code.redeemedByUserId,
        redeemedRelationshipId: code.redeemedRelationshipId,
      },
    });
  }

  async redeemUnlockCode(code: string, userId: string, relationshipId: string): Promise<{ error: "not_found" | "already_redeemed" } | { expiresAt: string }> {
    const record = await prisma.unlockCode.findUnique({ where: { code } });
    if (!record) return { error: "not_found" };
    if (record.redeemedAt) return { error: "already_redeemed" };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + record.durationDays);

    await prisma.$transaction([
      prisma.unlockCode.update({
        where: { code },
        data: {
          redeemedAt: new Date(),
          redeemedByUserId: userId,
          redeemedRelationshipId: relationshipId,
        },
      }),
      prisma.entitlement.create({
        data: {
          relationshipId,
          source: "unlock_code",
          expiresAt,
        },
      }),
    ]);

    return { expiresAt: expiresAt.toISOString() };
  }

  async setAdminEntitlement(relationshipId: string): Promise<void> {
    await prisma.entitlement.create({
      data: {
        relationshipId,
        source: "admin",
      },
    });
  }

  async getEntitlement(relationshipId: string | null): Promise<EntitlementStatus> {
    if (!relationshipId) {
      return { relationshipId: null, premiumUnlocked: false, source: "none", expiresAt: null };
    }

    const entitlements = await prisma.entitlement.findMany({
      where: { relationshipId },
      orderBy: { grantedAt: "desc" },
    });

    const active = entitlements.find(e => e.expiresAt === null || e.expiresAt.getTime() > Date.now());

    if (!active) {
      return { relationshipId, premiumUnlocked: false, source: "none", expiresAt: null };
    }

    return {
      relationshipId,
      premiumUnlocked: !!active,
      source: active ? (active.source as "unlock_code" | "admin") : "none",
      expiresAt: active ? active.expiresAt?.toISOString() ?? null : null,
    };
  }

  async upsertProgress(userId: string, rollups: ProgressRollupInput[]): Promise<string> {
    const syncedAt = new Date();
    for (const rollup of rollups) {
      await prisma.progressRollup.upsert({
        where: { userId_key: { userId, key: rollup.key } },
        update: {
          answeredCount: rollup.answeredCount,
          completedDeck: rollup.completedDeck,
          syncedAt,
        },
        create: {
          userId,
          key: rollup.key,
          categoryId: rollup.categoryId,
          source: rollup.source,
          answeredCount: rollup.answeredCount,
          completedDeck: rollup.completedDeck,
          happenedOn: new Date(rollup.happenedOn),
          syncedAt,
        },
      });
    }
    return syncedAt.toISOString();
  }

  async getProgressSummary(userId: string): Promise<ProgressSummary> {
    const entries = await prisma.progressRollup.findMany({ where: { userId } });
    const perCategory = Object.fromEntries(
      deckManifest.categories.map((category) => [
        category.id,
        { answeredCount: 0, totalQuestions: category.totalQuestions, completed: false },
      ]),
    ) as ProgressSummary["perCategory"];

    const dayCounts = new Map<string, number>();
    for (const entry of entries) {
      const categoryProgress = perCategory[entry.categoryId as keyof typeof perCategory];
      if (!categoryProgress) continue;

      categoryProgress.answeredCount += entry.answeredCount;
      categoryProgress.completed = categoryProgress.completed || entry.completedDeck;
      
      const dayStr = entry.happenedOn.toISOString().slice(0, 10);
      dayCounts.set(dayStr, (dayCounts.get(dayStr) ?? 0) + entry.answeredCount);
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
      syncedAt: entries.length > 0 ? entries[entries.length - 1]!.syncedAt.toISOString() : null,
    };
  }

  async appendAIRequest(record: AIRequestRecord): Promise<void> {
    await prisma.aIRequest.create({
      data: {
        userId: record.userId,
        relationshipId: record.relationshipId,
        categoryId: record.categoryId,
        depth: record.depth,
        model: record.model,
        outputHash: record.questionHash,
        status: record.status,
        latencyMs: record.latencyMs,
      },
    });
  }

  async appendAnalytics(record: AnalyticsEventRecord): Promise<void> {
    await prisma.analyticsEvent.create({
      data: {
        userId: record.userId,
        eventName: record.eventName,
        platform: record.platform,
        payload: record.metadata,
      },
    });
  }

  async appendReportedQuestion(record: ReportedQuestionRecord): Promise<void> {
    await prisma.reportedQuestion.create({
      data: {
        userId: record.userId,
        categoryId: record.categoryId,
        source: record.source,
        question: record.question,
        reason: record.reason,
      },
    });
  }

  async setContentManifest(update: ContentManifestRecord): Promise<void> {
    this.contentManifest = update;
    await prisma.contentManifest.create({
      data: {
        version: update.version,
        minimumSupportedAppVersion: update.minimumSupportedAppVersion,
      },
    });
  }

  async setFeatureFlag(flag: FeatureFlagRecord): Promise<void> {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { enabled: flag.enabled, description: flag.description },
      create: { key: flag.key, enabled: flag.enabled, description: flag.description },
    });
  }
}
