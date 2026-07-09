import type { DimensionValue } from "react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppShell, ScreenCard, SectionTitle, StatPill } from "../components/ui";
import { deckManifest } from "@ask-me-more/content";
import { colors, fonts, radii, shadows } from "../lib/theme";
import { useAppStore } from "../store/use-app-store";
import { LinearGradient } from "expo-linear-gradient";

const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
const quote = deckManifest.quotes[dayOfYear % deckManifest.quotes.length];

export default function HomeScreen() {
  const session = useAppStore((state) => state.session);
  const relationship = useAppStore((state) => state.relationship);
  const entitlement = useAppStore((state) => state.entitlement);
  const summary = useAppStore((state) => state.localSummary);

  if (!session) {
    return <Redirect href="/welcome" />;
  }

  const premiumUnlocked = entitlement?.premiumUnlocked ?? false;

  return (
    <AppShell hero>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroTopRow}>
          <View style={{ gap: 6 }}>
            <Text style={styles.eyebrow}>COUPLES CONNECTION APP</Text>
            <SectionTitle
              title="Ask Me More"
              subtitle={relationship ? relationship.displayName : "Deepen your connection, one question at a time."}
              light
            />
          </View>
          <Pressable onPress={() => router.push("/settings")} style={styles.iconButton}>
            <Feather name="settings" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatPill value={String(summary.streakDays)} label="day streak" />
          <StatPill value={String(summary.totalAnswered)} label="explored" />
          <Pressable onPress={() => router.push("/insights")} style={styles.insightsPill}>
            <Feather name="bar-chart-2" size={18} color="#FFFFFF" />
            <Text style={styles.insightsLabel}>Insights</Text>
          </Pressable>
        </View>

        {!relationship ? (
          <ScreenCard backgroundColor="rgba(255,255,255,0.12)">
            <Text style={styles.bannerTitle}>Pair with your partner</Text>
            <Text style={styles.bannerCopy}>Create a relationship space or join with an invite code so premium access can be shared.</Text>
            <Pressable onPress={() => router.push("/pair")}>
              <Text style={styles.bannerLink}>Open pairing</Text>
            </Pressable>
          </ScreenCard>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose a Deck</Text>
          <Text style={styles.sectionBadge}>{premiumUnlocked ? "all decks" : "3 free decks"}</Text>
        </View>

        <View style={styles.deckGrid}>
          {deckManifest.categories.map((category) => {
            const progress = summary.perCategory[category.id] ?? {
              answeredCount: 0,
              totalQuestions: category.totalQuestions,
              completed: false,
            };
            const locked = category.accessLevel === "premium" && !premiumUnlocked;
            const progressWidth = `${Math.min((progress.answeredCount / category.totalQuestions) * 100, 100)}%` as DimensionValue;

            return (
              <Pressable
                key={category.id}
                onPress={() =>
                  locked
                    ? router.push("/premium")
                    : router.push({
                        pathname: "/deck/[categoryId]",
                        params: { categoryId: category.id },
                      })
                }
              >
                {({ pressed }) => (
                  <View style={[styles.deckCardWrapper, pressed && { opacity: 0.8 }]}>
                    <LinearGradient
                      colors={
                        locked
                          ? [colors.surfaceHighlight, colors.surface]
                          : [`${category.accentColor}33`, colors.surface]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.deckCard,
                        {
                          borderColor: locked ? colors.glassBorder : `${category.accentColor}50`,
                        },
                      ]}
                    >
                      <View style={styles.deckTitleRow}>
                        <Feather name={category.iconKey as any} size={20} color={locked ? colors.muted : category.accentColor} />
                        {locked ? <Text style={styles.lockedTag}>Premium</Text> : null}
                      </View>
                      <Text style={[styles.deckTitle, locked && { color: colors.textDim }]}>{category.label}</Text>
                      <Text style={[styles.deckDescription, locked && { color: colors.muted }]}>{category.description}</Text>
                      {locked ? (
                        <Text style={styles.lockedCopy}>Unlock AI, insights, and emotionally deeper decks.</Text>
                      ) : (
                        <>
                          <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: progressWidth, backgroundColor: category.accentColor }]} />
                          </View>
                          <Text style={styles.progressCopy}>
                            {progress.answeredCount}/{category.totalQuestions} explored
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <ScreenCard backgroundColor={colors.surfaceHighlight}>
          <Text style={styles.quoteEyebrow}>DAILY REFLECTION</Text>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          <Text style={styles.quoteAuthor}>- {quote.author}</Text>
        </ScreenCard>

        {!premiumUnlocked ? (
          <Pressable onPress={() => router.push("/premium")} style={({ pressed }) => [styles.unlockButton, pressed && { opacity: 0.8 }]}>
            <LinearGradient
              colors={[colors.gold, "#B89645"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.unlockGradient}
            >
              <Text style={styles.unlockButtonText}>Unlock premium with an access code</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <ScreenCard backgroundColor="rgba(229,192,123,0.12)" accentColor={colors.gold}>
            <Text style={styles.memberTitle}>Premium unlocked</Text>
            <Text style={styles.memberCopy}>AI prompts and all decks are available for your relationship.</Text>
          </ScreenCard>
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  unlockGradient: {
    paddingHorizontal: 20,
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    paddingBottom: 36,
    gap: 18,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  insightsPill: {
    minWidth: 110,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  insightsLabel: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  bannerCopy: {
    color: colors.textDim,
    lineHeight: 22,
    marginBottom: 12,
  },
  bannerLink: {
    color: colors.gold,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionBadge: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: "800",
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deckGrid: {
    gap: 16,
  },
  deckCardWrapper: {
    borderRadius: radii.lg,
    ...shadows.soft,
  },
  deckCard: {
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
  },
  deckTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  lockedTag: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  deckTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  deckDescription: {
    color: colors.textDim,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
  },
  lockedCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  progressTrack: {
    height: 5,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: 5,
    borderRadius: 999,
  },
  progressCopy: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  quoteEyebrow: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  quoteText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
    fontStyle: "italic",
  },
  quoteAuthor: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
    textAlign: "right",
  },
  unlockButton: {
    backgroundColor: colors.plum,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  unlockButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  memberTitle: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  memberCopy: {
    color: colors.text,
    lineHeight: 20,
  },
});
