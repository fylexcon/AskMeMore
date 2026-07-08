import { Alert } from "react";

const defaultHandler = global.ErrorUtils?.getGlobalHandler?.();
if (global.ErrorUtils) {
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    Alert.alert(
      "Fatal JS Error",
      `Error: ${error.message}\n\nStack: ${error.stack}`,
      [{ text: "OK" }]
    );
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

import "expo-router/entry";
