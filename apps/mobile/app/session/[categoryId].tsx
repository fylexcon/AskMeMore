import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { MotiView } from "moti";
import { Feather } from "@expo/vector-icons";

import type { CategoryId } from "@ask-me-more/contracts";
import { deckManifest, seededDeckMap } from "@ask-me-more/content";

import { generateAiQuestion } from "../../lib/api";
import { loadLocalSnapshot, recordAnsweredQuestion } from "../../lib/local-db";
import { flushPendingProgress } from "../../lib/sync";
import { colors } from "../../lib/theme";
import { useAppStore } from "../../store/use-app-store";

function toParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function SessionScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const categoryId = toParam(params.categoryId) as CategoryId;
  const session = useAppStore((state) => state.session);
  const entitlement = useAppStore((state) => state.entitlement);
  const depth = useAppStore((state) => state.depth);
  const setDepth = useAppStore((state) => state.setDepth);
  const recentByCategory = useAppStore((state) => state.recentByCategory);
  const setLocalSummary = useAppStore((state) => state.setLocalSummary);
  const setRecentByCategory = useAppStore((state) => state.setRecentByCategory);

  const category = deckManifest.categories.find((entry) => entry.id === categoryId);
  const baseQuestions = useMemo(() => seededDeckMap[categoryId] ?? [], [categoryId]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (!category || !session) {
    return <Redirect href="/home" />;
  }

  const currentQuestion = aiQuestion ?? baseQuestions[index];
  const progress = ((index + 1) / baseQuestions.length) * 100;
  const isLastSeededCard = index === baseQuestions.length - 1;
  const premiumUnlocked = entitlement?.premiumUnlocked ?? false;

  const refreshLocalState = async () => {
    const snapshot = await loadLocalSnapshot();
    setLocalSummary(snapshot.summary);
    setRecentByCategory(snapshot.recentByCategory);
  };

  const handleAdvance = async () => {
    const source = aiQuestion ? "ai" : "seeded";

    if (revealed || aiQuestion) {
      await recordAnsweredQuestion({
        categoryId,
        source,
        question: currentQuestion,
        completedDeck: !aiQuestion && isLastSeededCard,
      });
      await refreshLocalState();
      await flushPendingProgress(session.tokens.accessToken).catch(() => undefined);
    }

    if (aiQuestion) {
      setAiQuestion(null);
      setAiError(null);
      setRevealed(false);
      router.replace({
        pathname: "/deck/[categoryId]",
        params: { categoryId },
      });
      return;
    }

    if (index < baseQuestions.length - 1) {
      setIndex((current) => current + 1);
      setRevealed(false);
      setAiError(null);
      return;
    }

    router.replace({
      pathname: "/session/complete",
      params: { categoryId },
    });
  };

  const handleAiGenerate = async () => {
    if (!premiumUnlocked) {
      router.push("/premium");
      return;
    }

    try {
      setAiLoading(true);
      setAiError(null);
      const response = await generateAiQuestion(session.tokens.accessToken, {
        categoryId,
        depth,
        recentQuestions: recentByCategory[categoryId] ?? [],
      });
      setAiQuestion(response.question);
      setRevealed(false);
    } catch (error) {
      setAiError((error as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack}>
          <Feather name="arrow-left" size={18} color={colors.muted} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{category.label}</Text>
          <View style={styles.headerTrack}>
            <View style={[styles.headerFill, { width: `${progress}%`, backgroundColor: category.accentColor }]} />
          </View>
        </View>
        <Text style={styles.headerCount}>
          {index + 1}/{baseQuestions.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 320 }}
        >
          <Pressable
            onPress={() => setRevealed((current) => !current)}
            style={[
              styles.card,
              revealed
                ? styles.cardBack
                : {
                    backgroundColor: category.accentColor,
                    borderColor: category.accentColor,
                  },
            ]}
          >
            {!revealed ? (
              <View style={styles.cardFront}>
                <Feather name={aiQuestion ? "star" : "message-circle"} size={42} color="#FFFFFF" />
                <Text style={styles.cardFrontTitle}>{aiQuestion ? "AI question ready" : "Tap to reveal your question"}</Text>
                <Text style={styles.cardFrontCopy}>{category.description}</Text>
              </View>
            ) : (
              <View style={styles.cardBackContent}>
                <Text style={styles.cardQuote}>{currentQuestion}</Text>
                {aiQuestion ? <Text style={styles.aiBadge}>AI-crafted for this session</Text> : null}
              </View>
            )}
          </Pressable>
        </MotiView>

        <View style={styles.depthCard}>
          <View style={styles.depthHeader}>
            <Text style={styles.depthLabel}>DEPTH</Text>
            <Text style={styles.depthValue}>{depth}</Text>
          </View>
          <View style={styles.depthRow}>
            {(["light", "moderate", "deep"] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => setDepth(option)}
                style={[
                  styles.depthPill,
                  {
                    backgroundColor: depth === option ? category.accentColor : "#F0EAE4",
                  },
                ]}
              >
                <Text style={[styles.depthPillText, depth === option && { color: "#FFFFFF" }]}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {aiError ? <Text style={styles.errorText}>{aiError}</Text> : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable onPress={() => void handleAdvance()} style={[styles.nextButton, { backgroundColor: revealed ? category.accentColor : "#F0EAE4" }]}>
          <Text style={[styles.nextButtonText, { color: revealed ? "#FFFFFF" : colors.muted }]}>
            {revealed ? (isLastSeededCard && !aiQuestion ? "Finish" : "Next card") : "Skip"}
          </Text>
        </Pressable>

        <Pressable onPress={() => void handleAiGenerate()} style={styles.aiButton} disabled={aiLoading}>
          <Feather name={aiLoading ? "loader" : "star"} size={18} color={colors.gold} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBack: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F5EEE8",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  headerTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#F0EAE4",
    overflow: "hidden",
  },
  headerFill: {
    height: 4,
    borderRadius: 999,
  },
  headerCount: {
    color: colors.muted,
    fontWeight: "700",
  },
  container: {
    padding: 20,
    gap: 16,
  },
  card: {
    minHeight: 360,
    borderRadius: 24,
    borderWidth: 2,
    padding: 28,
    justifyContent: "center",
  },
  cardFront: {
    alignItems: "center",
    gap: 18,
  },
  cardFrontTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  cardFrontCopy: {
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    lineHeight: 20,
  },
  cardBack: {
    backgroundColor: colors.paper,
    borderColor: colors.border,
  },
  cardBackContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  cardQuote: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 34,
    fontStyle: "italic",
    textAlign: "center",
    fontFamily: "Georgia",
  },
  aiBadge: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "800",
  },
  depthCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  depthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  depthLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  depthValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  depthRow: {
    flexDirection: "row",
    gap: 8,
  },
  depthPill: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  depthPillText: {
    color: colors.muted,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  errorText: {
    color: colors.danger,
    textAlign: "center",
  },
  bottomBar: {
    padding: 20,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: "800",
  },
  aiButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(201,168,76,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.35)",
  },
});
