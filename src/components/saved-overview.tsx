// ─────────────────────────────────────────────────────────────
// components/saved-overview.tsx
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import React, { FC } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface SavedOverviewProps {
  count?: number;
}

const SavedOverview: FC<SavedOverviewProps> = ({ count = 0 }) => {
  return (
    <View style={styles.container}>
      <Text variant="micro" color="mutedText" textTransform="uppercase">
        Your collection
      </Text>
      <Text variant="h2" color="onBackground">
        {count} saved {count === 1 ? "recipe" : "recipes"}
      </Text>
      <Text variant="footnote" color="mutedText">
        Recipes you want to cook again
      </Text>
    </View>
  );
};

export default SavedOverview;

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
