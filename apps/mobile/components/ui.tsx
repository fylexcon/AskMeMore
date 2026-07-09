import type { ComponentProps, ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, fonts, radii, shadows } from "../lib/theme";

export function AppShell(props: {
  children: ReactNode;
  hero?: boolean;
}) {
  return (
    <View style={styles.container}>
      {props.hero ? (
        <LinearGradient colors={[colors.plum, colors.plumDark, colors.plumDeep]} style={styles.hero}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          {props.children}
        </LinearGradient>
      ) : (
        props.children
      )}
    </View>
  );
}

export function ScreenCard(props: {
  children: ReactNode;
  accentColor?: string;
  backgroundColor?: string;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300 }}
      style={[
        styles.card,
        {
          borderColor: props.accentColor ? `${props.accentColor}40` : colors.glassBorder,
          backgroundColor: props.backgroundColor ?? colors.surface,
        },
      ]}
    >
      {props.children}
    </MotiView>
  );
}

export function PrimaryButton(props: {
  label: string;
  onPress(): void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "ghost";
}) {
  const tone = props.tone ?? "primary";
  return (
    <Pressable
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "primary" && styles.primaryButton,
        tone === "secondary" && styles.secondaryButton,
        tone === "ghost" && styles.ghostButton,
        props.disabled && styles.disabledButton,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          tone === "secondary" && { color: colors.gold },
          tone === "ghost" && { color: colors.muted },
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

export function SectionTitle(props: { title: string; subtitle?: string; light?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.title, props.light && { color: "#FFFFFF" }]}>{props.title}</Text>
      {props.subtitle ? (
        <Text style={[styles.subtitle, props.light && { color: "rgba(255,255,255,0.7)" }]}>{props.subtitle}</Text>
      ) : null}
    </View>
  );
}

export function StatPill(props: { value: string; label: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{props.value}</Text>
      <Text style={styles.statLabel}>{props.label}</Text>
    </View>
  );
}

export function FieldLabel(props: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{props.children}</Text>;
}

export function AppTextInput(props: ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 56,
  },
  heroOrbLarge: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.05)",
    right: -70,
    top: -60,
  },
  heroOrbSmall: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.05)",
    left: -25,
    bottom: 32,
  },
  card: {
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1,
    ...shadows.soft,
  },
  button: {
    height: 56,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: colors.plum,
    ...shadows.glow,
  },
  secondaryButton: {
    backgroundColor: "rgba(229,192,123,0.12)",
    borderWidth: 1,
    borderColor: "rgba(229,192,123,0.35)",
  },
  ghostButton: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledButton: {
    opacity: 0.55,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    fontFamily: fonts.display,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 15,
    lineHeight: 22,
  },
  statPill: {
    backgroundColor: colors.glass,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minWidth: 110,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  fieldLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  input: {
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
});
