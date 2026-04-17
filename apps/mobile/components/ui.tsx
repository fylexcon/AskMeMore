import type { ComponentProps, ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, fonts, radii } from "../lib/theme";

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
          borderColor: props.accentColor ? `${props.accentColor}33` : colors.border,
          backgroundColor: props.backgroundColor ?? "#FFFFFF",
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
      style={[
        styles.button,
        tone === "primary" && styles.primaryButton,
        tone === "secondary" && styles.secondaryButton,
        tone === "ghost" && styles.ghostButton,
        props.disabled && styles.disabledButton,
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
    <View style={{ gap: 4 }}>
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
    backgroundColor: colors.cream,
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
  },
  button: {
    height: 54,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primaryButton: {
    backgroundColor: colors.plum,
  },
  secondaryButton: {
    backgroundColor: "rgba(201,168,76,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.35)",
  },
  ghostButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledButton: {
    opacity: 0.55,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
    fontFamily: fonts.display,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  statPill: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 110,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  input: {
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 15,
  },
});
