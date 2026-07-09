import { useState } from "react";
import { StyleSheet, Text, TextInput, View, Pressable, Alert, Platform } from "react-native";
import { router } from "expo-router";

import { AppShell, PrimaryButton, SectionTitle } from "../../components/ui";
import { login, register } from "../../lib/api";
import { persistSession } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { useAppStore } from "../../store/use-app-store";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const setSession = useAppStore((state) => state.setSession);

  const handleSubmit = async () => {
    if (!email || !password || (mode === "register" && !username)) {
      Alert.alert("Missing Fields", "Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      const deviceName = Platform.OS === "ios" ? "iOS App" : Platform.OS === "android" ? "Android App" : "Unknown Device";
      let session;

      if (mode === "register") {
        session = await register(email, username, password, deviceName);
      } else {
        session = await login(email, password, deviceName);
      }

      await persistSession(session);
      setSession(session);
      router.replace("/home");
    } catch (err: any) {
      Alert.alert("Error", err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <View style={styles.screen}>
        <SectionTitle
          title={mode === "login" ? "Welcome back" : "Create account"}
          subtitle={
            mode === "login"
              ? "Sign in to continue your journey."
              : "Sign up to start deepening your connections."
          }
        />

        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            editable={!loading}
          />

          {mode === "register" && (
            <>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="your_username"
                placeholderTextColor={colors.muted}
                editable={!loading}
              />
            </>
          )}

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            editable={!loading}
          />
        </View>

        <PrimaryButton
          label={loading ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
          onPress={() => void handleSubmit()}
          disabled={loading}
        />

        <Pressable
          onPress={() => setMode(mode === "login" ? "register" : "login")}
          disabled={loading}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Log in"}
          </Text>
        </Pressable>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 60,
    gap: 32,
    paddingHorizontal: 20,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textDim,
    marginBottom: -8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  toggleButton: {
    marginTop: 16,
    padding: 12,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.gold,
    textAlign: "center",
  },
});
