// ─────────────────────────────────────────────────────────────
// components/kitchen-overview.tsx
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import React, { FC } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const STATIC_FOOD_COUNT = 24;

interface KitchenOverviewProps {
  count?: number;
}

const KitchenOverview: FC<KitchenOverviewProps> = ({
  count = STATIC_FOOD_COUNT,
}) => {
  return (
    <View style={styles.container}>
      <Text variant="micro" color="mutedText" textTransform="uppercase">
        Your Kitchen
      </Text>
      <Text variant="h2" color="onBackground">
        {count} food {count === 1 ? "item" : "items"}
      </Text>
      <Text variant="footnote" color="mutedText">
        Forked and created by you
      </Text>
    </View>
  );
};

export default KitchenOverview;

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xxs,
    borderBottomWidth: theme.borderWidth.hairline,
    borderBottomColor: theme.colors.panelBorder,
  },
}));
