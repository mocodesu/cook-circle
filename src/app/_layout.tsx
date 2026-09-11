import { useRetentionReminders } from "@/hooks/use-retention-reminders";
import { handleExpoUpdateMetadata } from "@/utils/expo-update-metadata";
import { initializeUpdateChannel } from "@/utils/retention-reminder";
import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import * as Notifications from "expo-notifications";
import { Stack, useNavigationContainerRef } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native-unistyles";
import { sentryConfig } from "../../sentry.config";

import { SystemBars } from "react-native-edge-to-edge";

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});
// initialize sentry
Sentry.init(sentryConfig);
// Handle OTA update metadata (for tracking builds/updates)
handleExpoUpdateMetadata();
// Configure foreground notification handler
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

  const navigationRef = useNavigationContainerRef();

  // Hook Sentry into navigation container
  useEffect(() => {
    if (navigationRef?.current) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(main)/(tabs)" />
      </Stack>
      <SystemBars style={"light"} />
    </GestureHandlerRootView>
  );
};

export default Sentry.wrap(RootLayout);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
