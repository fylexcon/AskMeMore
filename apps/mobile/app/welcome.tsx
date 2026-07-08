import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppShell, PrimaryButton, SectionTitle, StatPill } from "../components/ui";

export default function WelcomeScreen() {
  return (
    <AppShell hero>
      <View style={styles.screen}>
        <Text style={styles.eyebrow}>COUPLES CONNECTION APP</Text>
        <SectionTitle
          title="Ask Me More"
          subtitle="Deepen your connection, one question at a time."
          light
        />

        <View style={styles.statRow}>
          <StatPill value="6" label="curated decks" />
          <StatPill value="AI" label="premium prompts" />
        </View>

        <View style={styles.featureBlock}>
          <Text style={styles.featureTitle}>Built for conversations that actually go somewhere</Text>
          <Text style={styles.featureCopy}>
            Explore playful prompts, future dreams, core values, and deeper connection questions with privacy-first local history.
          </Text>
        </View>

        <PrimaryButton label="Continue with email" onPress={() => router.push("/auth" as any)} />
        <Pressable onPress={() => router.push("/auth" as any)}>
          <Text style={styles.secondaryLink}>Sign in to start your first session</Text>
        </Pressable>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    gap: 28,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.3,
  },
  statRow: {
    flexDirection: "row",
    gap: 12,
  },
  featureBlock: {
    gap: 8,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  featureTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  featureCopy: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 21,
  },
  secondaryLink: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});
