
import { Stack } from "expo-router";

import GlobalProvider from "@/lib/globalprovider";

export default function RootLayout() {

  return (
    <GlobalProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </GlobalProvider>
  );
}