// ─────────────────────────────────────────────────────────────
// app/(tabs)/index.tsx  →  Kitchen
// ─────────────────────────────────────────────────────────────
import FoodItemCard from "@/components/food-item-card";
import KitchenOverview from "@/components/kitchen-overview";
import { FOOD_ITEMS } from "@/data/food-items";
import React from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function KitchenScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
    >
      <KitchenOverview count={FOOD_ITEMS.length} />

      <View style={styles.list}>
        {FOOD_ITEMS.map((item) => (
          <FoodItemCard key={item.id} item={item} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: theme.spacing.xxl },
  list: {
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
}));
