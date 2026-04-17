import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { deckManifest } from "@ask-me-more/content";

import { AppShell, PrimaryButton, SectionTitle } from "../../components/ui";
import { colors } from "../../lib/theme";

function toParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function SessionCompleteScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const categoryId = toParam(params.categoryId);
  const category = deckManifest.categories.find((entry) => entry.id === categoryId);

  return (
    <AppShell>
      <View style={styles.container}>
        <Text style={styles.heart}>Connection</Text>
        <SectionTitle
          title="Deck complete"
          subtitle={
            category
              ? `You explored every seeded card in ${category.label}. The conversations you made space for today matter.`
              : "You explored the full deck."
          }
        />
        <PrimaryButton label="Back to decks" onPress={() => router.replace("/home")} />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },
  heart: {
    color: colors.plum,
    fontSize: 28,
    fontWeight: "800",
  },
});
