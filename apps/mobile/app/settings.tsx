import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppShell, PrimaryButton, ScreenCard, SectionTitle } from "../components/ui";
import { deleteAccount, logout } from "../lib/api";
import { clearPersistedSession } from "../lib/storage";
import { flushPendingProgress } from "../lib/sync";
import { colors } from "../lib/theme";
import { useAppStore } from "../store/use-app-store";

export default function SettingsScreen() {
  const session = useAppStore((state) => state.session);
  const relationship = useAppStore((state) => state.relationship);
  const entitlement = useAppStore((state) => state.entitlement);
  const setSession = useAppStore((state) => state.setSession);
  const setRelationship = useAppStore((state) => state.setRelationship);
  const setEntitlement = useAppStore((state) => state.setEntitlement);

  const handleSignOut = async () => {
    if (!session) {
      router.replace("/welcome");
      return;
    }

    try {
      await logout(session.tokens.refreshToken);
    } catch (_error) {
      // Ignore sign-out failures during local cleanup.
    }

    await clearPersistedSession();
    setSession(null);
    setRelationship(null);
    setEntitlement(null);
    router.replace("/welcome");
  };

  const handleDeleteAccount = () => {
    if (!session) {
      return;
    }

    Alert.alert("Delete account", "This removes your server-side account. Local history on this device will remain until the app data is cleared.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteAccount(session.tokens.accessToken).catch(() => undefined);
          await clearPersistedSession();
          setSession(null);
          setRelationship(null);
          setEntitlement(null);
          router.replace("/welcome");
        },
      },
    ]);
  };

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.container}>
        <Text onPress={() => router.back()} style={styles.back}>
          Back
        </Text>

        <ScreenCard>
          <SectionTitle title="Settings" subtitle="Manage auth, pairing, sync, and premium state for this device." />
        </ScreenCard>

        <ScreenCard>
          <Text style={styles.itemTitle}>{session?.user.email ?? "Not signed in"}</Text>
          <Text style={styles.itemCopy}>
            {relationship ? `Relationship: ${relationship.displayName}` : "No relationship paired yet."}
          </Text>
          <Text style={styles.itemCopy}>
            {entitlement?.premiumUnlocked ? "Premium: active" : "Premium: locked"}
          </Text>
        </ScreenCard>

        <PrimaryButton
          label="Sync pending progress"
          onPress={() =>
            session
              ? flushPendingProgress(session.tokens.accessToken)
                  .then(() => Alert.alert("Sync complete", "Pending progress rollups have been sent."))
                  .catch((error) => Alert.alert("Sync failed", error.message))
              : Alert.alert("Sign in required", "Sign in first to sync your progress.")
          }
          tone="secondary"
        />

        <PrimaryButton label="Sign out" onPress={() => void handleSignOut()} tone="ghost" />
        <PrimaryButton label="Delete account" onPress={handleDeleteAccount} tone="ghost" />
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
  itemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  itemCopy: {
    color: colors.muted,
    marginBottom: 6,
    lineHeight: 20,
  },
});
