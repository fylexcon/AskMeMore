import type { DimensionValue } from "react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { deckManifest } from "@ask-me-more/content";

import { AppShell, ScreenCard, SectionTitle } from "../components/ui";
import { colors } from "../lib/theme";
import { useAppStore } from "../store/use-app-store";

export default function InsightsScreen() {
  const summary = useAppStore((state) => state.localSummary);

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.container}>
        <Text onPress={() => router.back()} style={styles.back}>
          Back
        </Text>

        <ScreenCard>
          <SectionTitle title="Your Journey Together" subtitle="Aggregate-only progress based on the questions explored on this device." />
        </ScreenCard>

        <View style={styles.grid}>
          {[
            { label: "Questions Explored", value: summary.totalAnswered },
            { label: "Day Streak", value: summary.streakDays },
            { label: "Decks Started", value: summary.decksStarted },
            { label: "Cards Available", value: deckManifest.categories.reduce((sum, category) => sum + category.totalQuestions, 0) },
          ].map((item) => (
            <ScreenCard key={item.label}>
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text style={styles.metricLabel}>{item.label}</Text>
            </ScreenCard>
          ))}
        </View>

        <Text style={styles.progressHeading}>Progress by deck</Text>
        {deckManifest.categories.map((category) => {
          const progress = summary.perCategory[category.id] ?? {
            answeredCount: 0,
            totalQuestions: category.totalQuestions,
            completed: false,
          };
          const percentage = `${Math.min((progress.answeredCount / category.totalQuestions) * 100, 100)}%` as DimensionValue;
          return (
            <ScreenCard key={category.id}>
              <View style={styles.progressRow}>
                <Text style={styles.progressTitle}>{category.label}</Text>
                <Text style={styles.progressCount}>
                  {progress.answeredCount}/{category.totalQuestions}
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: percentage, backgroundColor: category.accentColor }]} />
              </View>
            </ScreenCard>
          );
        })}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 56,
    gap: 16,
  },
  back: {
    color: colors.muted,
    fontWeight: "700",
  },
  grid: {
    gap: 12,
  },
  metricValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  metricLabel: {
    color: colors.muted,
    marginTop: 6,
  },
  progressHeading: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressTitle: {
    color: colors.text,
    fontWeight: "800",
  },
  progressCount: {
    color: colors.muted,
    fontWeight: "700",
  },
  track: {
    height: 5,
    backgroundColor: "#F0EAE4",
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: 5,
    borderRadius: 999,
  },
});
