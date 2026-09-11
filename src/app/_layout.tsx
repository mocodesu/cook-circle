// ─────────────────────────────────────────────────────────────
// app/_layout.tsx
// ─────────────────────────────────────────────────────────────
import { useRetentionReminders } from "@/hooks/use-retention-reminders";
import { handleExpoUpdateMetadata } from "@/utils/expo-update-metadata";
import { initializeUpdateChannel } from "@/utils/retention-reminder";
import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import * as Notifications from "expo-notifications";
import { Stack, useNavigationContainerRef } from "expo-router";
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
      </Stack>
      <SystemBars style="auto" />
    </GestureHandlerRootView>
  );
};

export default Sentry.wrap(RootLayout);

const styles = StyleSheet.create({
  container: { flex: 1 },
});
