import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { AppShell, AppTextInput, FieldLabel, PrimaryButton, ScreenCard, SectionTitle } from "../components/ui";
import { postAnalytics, redeemUnlockCode } from "../lib/api";
import { persistEntitlement } from "../lib/storage";
import { colors } from "../lib/theme";
import { useAppStore } from "../store/use-app-store";

export default function PremiumScreen() {
  const session = useAppStore((state) => state.session);
  const relationship = useAppStore((state) => state.relationship);
  const entitlement = useAppStore((state) => state.entitlement);
  const setEntitlement = useAppStore((state) => state.setEntitlement);
  const [code, setCode] = useState("");

  const redeemMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error("Please sign in before redeeming a code.");
      }
      return redeemUnlockCode(session.tokens.accessToken, code.trim());
    },
    onSuccess: async (nextEntitlement) => {
      setEntitlement(nextEntitlement);
      await persistEntitlement(nextEntitlement);
      router.replace("/home");
    },
    onError: (error) => {
      Alert.alert("Could not redeem code", error.message);
    },
  });

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenCard>
          <SectionTitle title="Unlock premium" subtitle="Redeem a beta access code to unlock all six decks, AI-crafted questions, and deeper insights." />
        </ScreenCard>

        <ScreenCard>
          <Text style={styles.featureLine}>All 6 conversation decks</Text>
          <Text style={styles.featureLine}>Premium-only AI prompts</Text>
          <Text style={styles.featureLine}>Shared relationship entitlement</Text>
          <Text style={styles.featureLine}>Aggregate insights and privacy-first sync</Text>
        </ScreenCard>

        <ScreenCard>
          <View style={styles.fieldGroup}>
            <FieldLabel>Access code</FieldLabel>
            <AppTextInput value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="AMM-XXXXXX" />
          </View>
          <PrimaryButton
            label={redeemMutation.isPending ? "Redeeming..." : "Redeem access code"}
            onPress={() => redeemMutation.mutate()}
            disabled={code.trim().length < 6 || redeemMutation.isPending}
          />
          {entitlement?.premiumUnlocked ? <Text style={styles.successCopy}>Premium is already active for this relationship.</Text> : null}
        </ScreenCard>

        <ScreenCard>
          <Text style={styles.relationshipTitle}>Relationship status</Text>
          <Text style={styles.relationshipCopy}>
            {relationship
              ? `Redeemed access will apply to ${relationship.displayName} and can be shared with your paired partner.`
              : "You can redeem now. If you are not paired yet, the backend will create your relationship space automatically."}
          </Text>
          {!relationship ? <PrimaryButton label="Set up pairing" onPress={() => router.push("/pair")} tone="secondary" /> : null}
        </ScreenCard>

        <PrimaryButton
          label="Request beta access"
          onPress={() =>
            postAnalytics("premium_waitlist_requested", {
              screen: "premium",
              hasRelationship: Boolean(relationship),
            }).then(() => Alert.alert("Request noted", "We logged your beta access request."))
          }
          tone="ghost"
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
  featureLine: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  fieldGroup: {
    gap: 8,
    marginBottom: 16,
  },
  successCopy: {
    color: colors.success,
    marginTop: 12,
    fontWeight: "700",
  },
  relationshipTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  relationshipCopy: {
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 12,
  },
});
