// ─────────────────────────────────────────────────────────────
// app/(main)/food-details.tsx
// ─────────────────────────────────────────────────────────────
import SaveButton from "@/components/save-button";
import Text from "@/components/text";
import type { CookingStep, FoodPhoto, Ingredient } from "@/data/food-items";
import { useFoodItems } from "@/store/food-items";
import {
  DEFAULT_LIGHT_COLORS,
  DEFAULT_PRIMARY_COLOR,
} from "@/theme/color-schemes";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback } from "react";
import { Alert, Image, Pressable, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function FoodDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useFoodItems((s) => s.items.find((x) => x.id === id));

  const removeItem = useFoodItems((s) => s.removeItem);

  const handleDelete = useCallback(() => {
    if (!item) return;
    Alert.alert(
      "Delete recipe?",
      `"${item.title}" will be permanently removed. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removeItem(item.id);
            router.back();
          },
        },
      ],
    );
  }, [item, removeItem, router]);

  if (!item) {
    return (
      <>
        <Stack.Screen options={{ title: "Not found" }} />
        <View style={styles.emptyContainer}>
          <Text variant="h2" color="onBackground">
            Recipe not found
          </Text>
          <Text variant="callout" color="mutedText">
            It may have been deleted.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: item.title,
          headerRight: () => (
            <View style={styles.headerActions}>
              <SaveButton recipeId={item.id} size={32} />
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(main)/food-item-form",
                    params: { id: item.id },
                  })
                }
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Edit recipe"
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
              >
                <Ionicons
                  name="pencil"
                  size={20}
                  color={DEFAULT_PRIMARY_COLOR}
                />
              </Pressable>
              <Pressable
                onPress={handleDelete}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Delete recipe"
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={DEFAULT_LIGHT_COLORS.danger}
                />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.hero}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text variant="h1" color="mutedText">
              🍽
            </Text>
          </View>
        )}

        <View style={styles.body}>
          {/* Header */}
          <View style={styles.headerBlock}>
            <Text variant="micro" color="primary" textTransform="uppercase">
              {item.source === "forked" ? "Forked" : "Created by you"}
            </Text>
            <Text variant="h1" color="onBackground">
              {item.title}
            </Text>
            <Text variant="callout" color="mutedText">
              {item.description}
            </Text>
          </View>

          {/* Meta */}
          <View style={styles.metaRow}>
            <MetaPill label="Serves" value={String(item.servings)} />
            <MetaPill label="Prep" value={`${item.prepTimeMinutes} min`} />
            <MetaPill
              label="Cook"
              value={
                item.cookTimeMinutes > 0 ? `${item.cookTimeMinutes} min` : "—"
              }
            />
          </View>

          {/* Ingredients table */}
          <Section title="Ingredients">
            <IngredientsTable ingredients={item.ingredients} />
          </Section>

          {/* Recipe thread */}
          <Section title="Recipe">
            <RecipeThread steps={item.steps} />
          </Section>

          {/* Final images */}
          {item.photos.length > 0 && (
            <Section title="Final plates">
              <Text variant="footnote" color="mutedText">
                {item.photos.length}{" "}
                {item.photos.length === 1 ? "photo" : "photos"} from your
                kitchen
              </Text>
              <PhotoGrid photos={item.photos} />
            </Section>
          )}
        </View>
      </ScrollView>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────────────────────
interface SectionProps {
  title: string;
  children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text variant="h3" color="onBackground">
      {title}
    </Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// META PILL
// ─────────────────────────────────────────────────────────────
const MetaPill: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.metaPill}>
    <Text variant="micro" color="mutedText" textTransform="uppercase">
      {label}
    </Text>
    <Text variant="subheadBold" color="onSurface">
      {value}
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────
// INGREDIENTS TABLE
// 3 columns: QTY (right) | UNIT (left) | INGREDIENT (flex)
// Header row uses panel background + micro uppercase labels.
// Body rows separated by hairline borders.
// ─────────────────────────────────────────────────────────────
interface IngredientsTableProps {
  ingredients: Ingredient[];
}
const IngredientsTable: React.FC<IngredientsTableProps> = ({ ingredients }) => (
  <View style={styles.table}>
    {/* Header */}
    <View style={[styles.tableRow, styles.tableHeader]}>
      <Text
        variant="micro"
        color="mutedText"
        textTransform="uppercase"
        textAlign="right"
        style={styles.colQty}
      >
        Qty
      </Text>
      <Text
        variant="micro"
        color="mutedText"
        textTransform="uppercase"
        style={styles.colUnit}
      >
        Unit
      </Text>
      <Text
        variant="micro"
        color="mutedText"
        textTransform="uppercase"
        style={styles.colName}
      >
        Ingredient
      </Text>
    </View>

    {/* Rows */}
    {ingredients.map((ing, i) => {
      const isLast = i === ingredients.length - 1;
      return (
        <View
          key={ing.id}
          style={[styles.tableRow, !isLast && styles.tableRowBorder]}
        >
          <Text
            variant="body"
            color="primary"
            textAlign="right"
            style={styles.colQty}
          >
            {ing.quantity ?? "—"}
          </Text>

          <Text variant="body" color="mutedText" style={styles.colUnit}>
            {ing.unit ?? "—"}
          </Text>

          <View style={styles.colName}>
            <Text variant="body" color="onSurface">
              {ing.name}
            </Text>
            {ing.preparation && (
              <Text variant="caption" color="mutedText">
                {ing.preparation}
              </Text>
            )}
            {ing.isOptional && (
              <Text variant="caption" color="primary">
                Optional
              </Text>
            )}
          </View>
        </View>
      );
    })}
  </View>
);

// ─────────────────────────────────────────────────────────────
// RECIPE THREAD
// Reddit-style: left rail holds the number badge, a vertical
// line stretches down through the row to reach the next badge.
// Instruction sits in a bordered card on the right.
// ─────────────────────────────────────────────────────────────
interface RecipeThreadProps {
  steps: CookingStep[];
}
const RecipeThread: React.FC<RecipeThreadProps> = ({ steps }) => (
  <View style={styles.thread}>
    {steps.map((step, i) => {
      const isLast = i === steps.length - 1;
      return (
        <View key={step.id} style={styles.threadRow}>
          {/* Rail: badge + connector line */}
          <View style={styles.threadRail}>
            <View style={styles.stepNumber}>
              <Text variant="subheadBold" color="onPrimary">
                {i + 1}
              </Text>
            </View>
            {!isLast && <View style={styles.threadLine} />}
          </View>

          {/* Instruction card */}
          <View style={styles.stepCard}>
            <Text variant="body" color="onSurface">
              {step.instruction}
            </Text>

            {(step.durationMinutes !== undefined ||
              step.targetTempC !== undefined) && (
              <View style={styles.stepMeta}>
                {step.durationMinutes !== undefined && (
                  <View style={styles.stepMetaChip}>
                    <Text variant="caption" color="mutedText">
                      ⏱ {step.durationMinutes} min
                    </Text>
                  </View>
                )}
                {step.targetTempC !== undefined && (
                  <View style={styles.stepMetaChip}>
                    <Text variant="caption" color="mutedText">
                      🌡 {step.targetTempC}°C
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      );
    })}
  </View>
);

// ─────────────────────────────────────────────────────────────
// PHOTO GRID (unchanged)
// ─────────────────────────────────────────────────────────────
interface PhotoGridProps {
  photos: FoodPhoto[];
}
const PhotoGrid: React.FC<PhotoGridProps> = ({ photos }) => (
  <View style={styles.grid}>
    {photos.map((photo) => (
      <Pressable
        key={photo.id}
        style={({ pressed }) => [
          styles.gridItem,
          pressed && styles.gridItemPressed,
        ]}
        accessibilityRole="imagebutton"
        accessibilityLabel={photo.caption ?? "Final plate photo"}
      >
        <Image
          source={{ uri: photo.uri }}
          style={styles.gridImage}
          resizeMode="cover"
        />
        {photo.caption && (
          <View style={styles.gridCaption}>
            <Text variant="caption" color="onSurface" maxLines={2}>
              {photo.caption}
            </Text>
          </View>
        )}
      </Pressable>
    ))}
  </View>
);

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const RAIL_WIDTH = 28;
const CONNECTOR_WIDTH = 2;

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: theme.spacing.giant },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonPressed: {
    opacity: theme.opacity.pressed,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },

  hero: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: theme.colors.panel,
  },
  heroPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  body: {
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.xl,
  },

  headerBlock: { gap: theme.spacing.xs },

  metaRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  metaPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.panel,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    gap: theme.spacing.xxs,
  },

  section: { gap: theme.spacing.md },
  sectionBody: { gap: theme.spacing.md },

  // ── INGREDIENTS TABLE ───────────────────────────────────
  table: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    overflow: "hidden",
  },
  tableHeader: {
    backgroundColor: theme.colors.panel,
    paddingVertical: theme.spacing.sm,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  tableRowBorder: {
    borderBottomWidth: theme.borderWidth.hairline,
    borderBottomColor: theme.colors.panelBorder,
  },
  colQty: {
    width: 44,
  },
  colUnit: {
    width: 52,
  },
  colName: {
    flex: 1,
    gap: theme.spacing.xxs,
  },

  // ── RECIPE THREAD ───────────────────────────────────────
  thread: {
    // intentionally no gap — rows must touch so the connector line is continuous
  },
  threadRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  threadRail: {
    width: RAIL_WIDTH,
    alignItems: "center",
  },
  threadLine: {
    width: CONNECTOR_WIDTH,
    flex: 1,
    backgroundColor: theme.colors.panelBorder,
    marginTop: theme.spacing.xxs,
  },
  stepNumber: {
    width: RAIL_WIDTH,
    height: RAIL_WIDTH,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCard: {
    flex: 1,
    marginLeft: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.panel,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    gap: theme.spacing.sm,
  },
  stepMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  stepMetaChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.colors.panelBorder,
  },

  // ── PHOTO GRID ──────────────────────────────────────────
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  gridItem: {
    width: "48.5%",
    borderRadius: theme.radii.md,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
  },
  gridItemPressed: { opacity: theme.opacity.pressed },
  gridImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: theme.colors.panel,
  },
  gridCaption: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
}));
