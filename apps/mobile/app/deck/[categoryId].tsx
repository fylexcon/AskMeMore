import type { DimensionValue } from "react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { deckManifest, seededDeckMap } from "@ask-me-more/content";

import { AppShell, PrimaryButton, ScreenCard, SectionTitle } from "../../components/ui";
import { colors } from "../../lib/theme";
import { useAppStore } from "../../store/use-app-store";

function toParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function DeckDetailScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const categoryId = toParam(params.categoryId);
  const summary = useAppStore((state) => state.localSummary);
  const entitlement = useAppStore((state) => state.entitlement);

  const category = deckManifest.categories.find((entry) => entry.id === categoryId);
  if (!category) {
    return <Redirect href="/home" />;
  }

  const premiumUnlocked = entitlement?.premiumUnlocked ?? false;
  if (category.accessLevel === "premium" && !premiumUnlocked) {
    return <Redirect href="/premium" />;
  }

  const progress = summary.perCategory[category.id] ?? {
    answeredCount: 0,
    totalQuestions: category.totalQuestions,
    completed: false,
  };
  const progressWidth = `${Math.min((progress.answeredCount / category.totalQuestions) * 100, 100)}%` as DimensionValue;
  const previewQuestions = seededDeckMap[category.id].slice(0, 3);

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Feather name="arrow-left" size={18} color={colors.muted} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <ScreenCard backgroundColor={category.backgroundColor} accentColor={category.accentColor}>
          <SectionTitle title={category.label} subtitle={category.description} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Progress</Text>
            <Text style={styles.metricValue}>
              {progress.answeredCount}/{category.totalQuestions}
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: progressWidth,
                  backgroundColor: category.accentColor,
                },
              ]}
            />
          </View>
        </ScreenCard>

        <ScreenCard>
          <Text style={styles.sectionTitle}>This deck includes prompts like:</Text>
          {previewQuestions.map((question) => (
            <Text key={question} style={styles.previewQuestion}>
              {question}
            </Text>
          ))}
        </ScreenCard>

        <PrimaryButton
          label="Start session"
          onPress={() =>
            router.push({
              pathname: "/session/[categoryId]",
              params: { categoryId: category.id },
            })
          }
        />
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
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    color: colors.muted,
    fontWeight: "700",
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 8,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  track: {
    height: 5,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: 5,
    borderRadius: 999,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  previewQuestion: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
});
