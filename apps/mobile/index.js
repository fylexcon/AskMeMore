import { Alert } from "react";
import ErrorUtils from "ErrorUtils";

const defaultHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  Alert.alert(
    "Fatal JS Error",
    `Error: ${error.message}\n\nStack: ${error.stack}`,
    [{ text: "OK" }]
  );
  if (defaultHandler) {
    defaultHandler(error, isFatal);
  }
});

import "expo-router/entry";
