// ─────────────────────────────────────────────────────────────
// app/(main)/(tabs)/index.tsx
// ─────────────────────────────────────────────────────────────
import Fab from "@/components/fab";
import FoodItemCard from "@/components/food-item-card";
import KitchenOverview from "@/components/kitchen-overview";
import { useFoods } from "@/hooks/use-foods";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

export default function KitchenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { items } = useFoods();

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
      >
        <KitchenOverview count={items.length} />

        <View style={styles.list}>
          {items.map((item) => (
            <FoodItemCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>

      <View
        style={[styles.fabContainer, { bottom: insets.bottom + 60 }]}
        pointerEvents="box-none"
      >
        <Fab
          onPress={() => router.push("/(main)/food-item-form")}
          accessibilityLabel="Create a new food item"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: rt.insets.top,
  },
  screen: { flex: 1 },
  content: { paddingBottom: theme.spacing.giant },
  list: {
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  fabContainer: {
    position: "absolute",
    right: theme.layout.screenPaddingH,
    alignItems: "flex-end",
  },
}));
