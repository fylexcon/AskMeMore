module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "react" }]],
    plugins: ["expo-router/babel", "react-native-reanimated/plugin"],
  };
};
