import { router } from "expo-router";

export function goBackOrReplace(fallbackPath: unknown = "/") {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallbackPath as any);
}
