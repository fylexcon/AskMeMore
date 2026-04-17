import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { AppShell, AppTextInput, FieldLabel, PrimaryButton, ScreenCard, SectionTitle } from "../../components/ui";
import { requestOtp } from "../../lib/api";
import { colors } from "../../lib/theme";

export default function EmailAuthScreen() {
  const [email, setEmail] = useState("");
  const [deviceName, setDeviceName] = useState("My phone");

  const requestOtpMutation = useMutation({
    mutationFn: () => requestOtp(email.trim(), deviceName.trim()),
    onSuccess: () => {
      router.push({
        pathname: "/auth/verify",
        params: {
          email: email.trim(),
          deviceName: deviceName.trim(),
        },
      });
    },
    onError: (error) => {
      Alert.alert("Could not send code", error.message);
    },
  });

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenCard>
          <SectionTitle title="Sign in with email" subtitle="We will send a six-digit code so you can continue on this device." />
        </ScreenCard>

        <ScreenCard>
          <View style={styles.fieldGroup}>
            <FieldLabel>Email</FieldLabel>
            <AppTextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
            />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel>Device Name</FieldLabel>
            <AppTextInput value={deviceName} onChangeText={setDeviceName} placeholder="My phone" />
          </View>

          <PrimaryButton
            label={requestOtpMutation.isPending ? "Sending..." : "Send code"}
            onPress={() => requestOtpMutation.mutate()}
            disabled={!email.includes("@") || deviceName.trim().length < 2 || requestOtpMutation.isPending}
          />
        </ScreenCard>

        <Text style={styles.helper}>Your question history stays on-device. The backend only handles auth, AI, invites, and aggregate sync.</Text>
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
    marginTop: 8,
  },
});
