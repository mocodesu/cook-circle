// app/(tabs)/_layout.tsx
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useUnistyles } from "react-native-unistyles";

const TabLayout = () => {
  const { theme } = useUnistyles();

  return (
    <NativeTabs
      // Per-state icon colors
      iconColor={{
        default: theme.colors.mutedText,
        selected: theme.colors.onPrimary, // white icon when active
      }}
      // Per-state label styles
      labelStyle={{
        default: { color: theme.colors.mutedText },
        selected: { color: theme.colors.primary },
      }}
      // Android/Web indicator — primary when active
      indicatorColor={theme.colors.primary}
      // Tab bar background
      backgroundColor={theme.colors.surface}
      rippleColor={theme.colors.primaryIllumination}
      backBehavior="history"
      badgeBackgroundColor={theme.colors.primary}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Kitchen</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cooktop.fill" md="kitchen" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Pantry</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cabinet.fill" md="inventory_2" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="saved">
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bookmark.fill" md="bookmark" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gear" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default TabLayout;
