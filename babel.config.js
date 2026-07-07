module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "react", router: true }]],
    plugins: ["react-native-reanimated/plugin"],
  };
};
