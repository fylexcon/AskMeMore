import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";

import { fetchEntitlement, fetchRelationship } from "../lib/api";
import { initializeLocalDatabase, loadLocalSnapshot } from "../lib/local-db";
import { clearPersistedSession, loadPersistedSession, persistEntitlement, persistRelationship } from "../lib/storage";
import { flushPendingProgress } from "../lib/sync";
import { colors } from "../lib/theme";
import { useAppStore } from "../store/use-app-store";

const queryClient = new QueryClient();

export default function RootLayout() {
  const hydrated = useAppStore((state) => state.hydrated);
  const setHydrated = useAppStore((state) => state.setHydrated);
  const setSession = useAppStore((state) => state.setSession);
  const setRelationship = useAppStore((state) => state.setRelationship);
  const setEntitlement = useAppStore((state) => state.setEntitlement);
  const setLocalSummary = useAppStore((state) => state.setLocalSummary);
  const setRecentByCategory = useAppStore((state) => state.setRecentByCategory);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      await initializeLocalDatabase();

      const persisted = await loadPersistedSession();
      const snapshot = await loadLocalSnapshot();
      if (!active) {
        return;
      }

      setSession(persisted.session);
      setRelationship(persisted.relationship ?? null);
      setEntitlement(persisted.entitlement ?? null);
      setLocalSummary(snapshot.summary);
      setRecentByCategory(snapshot.recentByCategory);

      if (persisted.session) {
        try {
          await flushPendingProgress(persisted.session.tokens.accessToken);
          const [relationship, entitlement] = await Promise.all([
            fetchRelationship(persisted.session.tokens.accessToken),
            fetchEntitlement(persisted.session.tokens.accessToken),
          ]);

          if (!active) {
            return;
          }

          setRelationship(relationship);
          setEntitlement(entitlement);
          await Promise.all([
            persistRelationship(relationship),
            persistEntitlement(entitlement),
          ]);
        } catch (_error) {
          await clearPersistedSession();
          setSession(null);
          setRelationship(null);
          setEntitlement(null);
        }
      }

      if (active) {
        setHydrated(true);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [setEntitlement, setHydrated, setLocalSummary, setRecentByCategory, setRelationship, setSession]);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.plumDeep,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <ActivityIndicator color="#FFFFFF" />
        <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Preparing your connection space...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
