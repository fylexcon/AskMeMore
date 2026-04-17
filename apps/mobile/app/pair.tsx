import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";

import { AppShell, AppTextInput, FieldLabel, PrimaryButton, ScreenCard, SectionTitle } from "../components/ui";
import { createRelationship, fetchEntitlement, joinRelationship } from "../lib/api";
import { persistEntitlement, persistRelationship } from "../lib/storage";
import { colors } from "../lib/theme";
import { useAppStore } from "../store/use-app-store";

export default function PairScreen() {
  const session = useAppStore((state) => state.session);
  const relationship = useAppStore((state) => state.relationship);
  const setRelationship = useAppStore((state) => state.setRelationship);
  const setEntitlement = useAppStore((state) => state.setEntitlement);

  const [displayName, setDisplayName] = useState("Our Connection");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!session) {
    return <Redirect href="/welcome" />;
  }

  const handleCreate = async () => {
    try {
      setLoading(true);
      const nextRelationship = await createRelationship(session.tokens.accessToken, displayName.trim());
      const entitlement = await fetchEntitlement(session.tokens.accessToken);
      setRelationship(nextRelationship);
      setEntitlement(entitlement);
      await Promise.all([
        persistRelationship(nextRelationship),
        persistEntitlement(entitlement),
      ]);
      router.replace("/home");
    } catch (error) {
      Alert.alert("Could not create relationship", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      setLoading(true);
      const nextRelationship = await joinRelationship(session.tokens.accessToken, inviteCode.trim());
      const entitlement = await fetchEntitlement(session.tokens.accessToken);
      setRelationship(nextRelationship);
      setEntitlement(entitlement);
      await Promise.all([
        persistRelationship(nextRelationship),
        persistEntitlement(entitlement),
      ]);
      router.replace("/home");
    } catch (error) {
      Alert.alert("Could not join relationship", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenCard>
          <SectionTitle title="Pair your relationship" subtitle="Create a shared space now or join your partner with their invite code." />
        </ScreenCard>

        {relationship ? (
          <ScreenCard backgroundColor="#FFFFFF">
            <Text style={styles.currentTitle}>{relationship.displayName}</Text>
            <Text style={styles.currentCopy}>Invite code: {relationship.inviteCode}</Text>
            <PrimaryButton label="Continue to decks" onPress={() => router.replace("/home")} />
          </ScreenCard>
        ) : null}

        <ScreenCard>
          <View style={styles.fieldGroup}>
            <FieldLabel>Create a relationship name</FieldLabel>
            <AppTextInput value={displayName} onChangeText={setDisplayName} placeholder="Our Connection" />
          </View>
          <PrimaryButton
            label={loading ? "Working..." : "Create my relationship"}
            onPress={handleCreate}
            disabled={displayName.trim().length < 2 || loading}
          />
        </ScreenCard>

        <ScreenCard>
          <View style={styles.fieldGroup}>
            <FieldLabel>Join with invite code</FieldLabel>
            <AppTextInput
              autoCapitalize="characters"
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="AMM-XXXXXX"
            />
          </View>
          <PrimaryButton
            label={loading ? "Working..." : "Join partner"}
            onPress={handleJoin}
            disabled={inviteCode.trim().length < 6 || loading}
            tone="secondary"
          />
        </ScreenCard>
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
  fieldGroup: {
    gap: 8,
    marginBottom: 16,
  },
  currentTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  currentCopy: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 16,
  },
});
