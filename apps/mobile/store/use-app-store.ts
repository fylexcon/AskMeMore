import { create } from "zustand";

import type {
  AuthSession,
  DepthLevel,
  EntitlementStatus,
  ProgressSummary,
  RelationshipSummary,
} from "@ask-me-more/contracts";
import { deckManifest } from "@ask-me-more/content";

type AppStore = {
  hydrated: boolean;
  session: AuthSession | null;
  relationship: RelationshipSummary | null;
  entitlement: EntitlementStatus | null;
  depth: DepthLevel;
  localSummary: ProgressSummary;
  recentByCategory: Record<string, string[]>;
  setHydrated(value: boolean): void;
  setSession(value: AuthSession | null): void;
  setRelationship(value: RelationshipSummary | null): void;
  setEntitlement(value: EntitlementStatus | null): void;
  setDepth(value: DepthLevel): void;
  setLocalSummary(value: ProgressSummary): void;
  setRecentByCategory(value: Record<string, string[]>): void;
};

function emptySummary(): ProgressSummary {
  return {
    streakDays: 0,
    totalAnswered: 0,
    decksStarted: 0,
    syncedAt: null,
    perCategory: Object.fromEntries(
      deckManifest.categories.map((category) => [
        category.id,
        {
          answeredCount: 0,
          totalQuestions: category.totalQuestions,
          completed: false,
        },
      ]),
    ) as ProgressSummary["perCategory"],
  };
}

const emptyRecent = Object.fromEntries(
  deckManifest.categories.map((category) => [category.id, []]),
) as Record<string, string[]>;

export const useAppStore = create<AppStore>((set) => ({
  hydrated: false,
  session: null,
  relationship: null,
  entitlement: null,
  depth: "moderate",
  localSummary: emptySummary(),
  recentByCategory: emptyRecent,
  setHydrated: (value) => set({ hydrated: value }),
  setSession: (value) => set({ session: value }),
  setRelationship: (value) => set({ relationship: value }),
  setEntitlement: (value) => set({ entitlement: value }),
  setDepth: (value) => set({ depth: value }),
  setLocalSummary: (value) => set({ localSummary: value }),
  setRecentByCategory: (value) => set({ recentByCategory: value }),
}));
