import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { AppShell, AppTextInput, FieldLabel, PrimaryButton, ScreenCard, SectionTitle } from "../../components/ui";
import { fetchEntitlement, fetchRelationship, verifyOtp } from "../../lib/api";
import { persistEntitlement, persistRelationship, persistSession } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { useAppStore } from "../../store/use-app-store";

function toParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ email?: string; deviceName?: string }>();
  const email = toParam(params.email);
  const deviceName = toParam(params.deviceName) || "My phone";
  const [code, setCode] = useState("");

  const setSession = useAppStore((state) => state.setSession);
  const setRelationship = useAppStore((state) => state.setRelationship);
  const setEntitlement = useAppStore((state) => state.setEntitlement);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const session = await verifyOtp(email, code.trim(), deviceName);
      const [relationship, entitlement] = await Promise.all([
        fetchRelationship(session.tokens.accessToken),
        fetchEntitlement(session.tokens.accessToken),
      ]);
      return { session, relationship, entitlement };
    },
    onSuccess: async ({ session, relationship, entitlement }) => {
      setSession(session);
      setRelationship(relationship);
      setEntitlement(entitlement);
      await Promise.all([
        persistSession(session),
        persistRelationship(relationship),
        persistEntitlement(entitlement),
      ]);
      router.replace(relationship ? "/home" : "/pair");
    },
    onError: (error) => {
      Alert.alert("Code did not work", error.message);
    },
  });

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenCard>
          <SectionTitle title="Enter your code" subtitle={`We sent a 6-digit code to ${email}.`} />
        </ScreenCard>

        <ScreenCard>
          <View style={styles.fieldGroup}>
            <FieldLabel>Verification Code</FieldLabel>
            <AppTextInput
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              placeholder="123456"
            />
          </View>

          <PrimaryButton
            label={verifyMutation.isPending ? "Checking..." : "Verify and continue"}
            onPress={() => verifyMutation.mutate()}
            disabled={code.trim().length !== 6 || verifyMutation.isPending}
          />
        </ScreenCard>

        <Text style={styles.helper}>After sign-in, you can create your relationship space or join your partner with an invite code.</Text>
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
  helper: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
