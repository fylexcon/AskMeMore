import { Redirect } from "expo-router";

import { useAppStore } from "../store/use-app-store";

export default function IndexRoute() {
  const session = useAppStore((state) => state.session);
  return <Redirect href={session ? "/home" : "/welcome"} />;
}
