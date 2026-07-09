export const colors = {
  background: "#0A0A0F", // Deep obsidian black/blue
  surface: "#14141E", // Slightly lighter for cards
  surfaceHighlight: "#1F1F2E",
  plum: "#B96D9B", // Brighter, more vibrant plum for dark mode
  plumDark: "#8B2252",
  plumDeep: "#3A0E22",
  gold: "#E5C07B", // Brighter gold
  cream: "#FDF6F0",
  paper: "#FFFFFF",
  text: "#FFFFFF", // White text for dark mode
  textDim: "#E0E0E0",
  muted: "#8C8C9A", // Slate gray for muted text
  border: "#2A2A3C", // Dark subtle borders
  danger: "#FF6B6B",
  success: "#4ECCA3",
  glass: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.1)",
};

export const radii = {
  xl: 32,
  lg: 24,
  md: 16,
  sm: 12,
  pill: 9999,
};

export const fonts = {
  display: "Georgia",
  body: "System",
};

export const shadows = {
  glow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
};
