// ─────────────────────────────────────────────────────────────
// app/_layout.tsx
// ─────────────────────────────────────────────────────────────
import SyncProvider from "@/components/sync-provider";
import { initializeDatabase } from "@/db/client";
import { useRetentionReminders } from "@/hooks/use-retention-reminders";
import { handleExpoUpdateMetadata } from "@/utils/expo-update-metadata";
import { initializeUpdateChannel } from "@/utils/retention-reminder";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import * as Sentry from "@sentry/react-native";
import { ConvexReactClient } from "convex/react";
import { isRunningInExpoGo } from "expo";
import * as Notifications from "expo-notifications";
import { Stack, useNavigationContainerRef } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { SQLiteProvider } from "expo-sqlite";
import { useEffect } from "react";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { sentryConfig } from "../../sentry.config";

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});
Sentry.init(sentryConfig);
handleExpoUpdateMetadata();
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

// Secure storage adapter for Convex Auth tokens
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const unstable_settings = {
  initialRouteName: "(main)/(tabs)",
};

const RootLayout = () => {
  useRetentionReminders();
  initializeUpdateChannel();

  const { theme } = useUnistyles();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (navigationRef?.current) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <ConvexAuthProvider client={convex} storage={secureStorage}>
        <SQLiteProvider
          databaseName="cook-circle.db"
          onInit={initializeDatabase}
        >
          <SyncProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(main)/(tabs)" />
              <Stack.Screen
                name="(main)/food-details"
                options={{
                  headerShown: true,
                  headerBackTitle: "Kitchen",
                  headerTintColor: theme.colors.primary,
                  headerStyle: { backgroundColor: theme.colors.background },
                  headerTitleStyle: { color: theme.colors.onBackground },
                }}
              />
              <Stack.Screen
                name="(main)/food-item-form"
                options={{
                  headerShown: true,
                  presentation: "modal",
                  headerBackTitle: "Cancel",
                  headerTintColor: theme.colors.primary,
                  headerStyle: { backgroundColor: theme.colors.background },
                  headerTitleStyle: { color: theme.colors.onBackground },
                }}
              />
            </Stack>
          </SyncProvider>

          <SystemBars style="auto" />
        </SQLiteProvider>
      </ConvexAuthProvider>
    </GestureHandlerRootView>
  );
};

export default Sentry.wrap(RootLayout);

const styles = StyleSheet.create({
  container: { flex: 1 },
});
