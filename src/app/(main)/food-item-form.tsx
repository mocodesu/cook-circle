// ─────────────────────────────────────────────────────────────
// app/(main)/food-item-form.tsx
// ─────────────────────────────────────────────────────────────
import PhotoPickerGrid from "@/components/photo-picker-grid";
import Text from "@/components/text";
import { useFood } from "@/hooks/use-foods";
import { useImagePicker } from "@/hooks/use-image-picker";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { FoodRepo } from "@/repositories/food-repo";
import type { FoodItem, FoodPhoto } from "@/types";
import { createId } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const MAX_INGREDIENTS = 20;
const MAX_STEPS = 20;
const MAX_PHOTOS = 4;

// ─────────────────────────────────────────────────────────────
// OUTER — route-level component. Resolves the existing item, then
// mounts the form once with `key` so initial state seeds correctly.
// ─────────────────────────────────────────────────────────────
export default function FoodItemFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { item, isLoading } = useFood(id);
  const isEdit = Boolean(id);

  // Edit mode with a fetch still in flight — render nothing until ready
  if (isEdit && isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Loading…" }} />
        <View style={{ flex: 1 }} />
      </>
    );
  }

  return <FoodItemForm key={item?.id ?? "new"} existing={item} />;
}

// ─────────────────────────────────────────────────────────────
// INNER — the actual form. Guaranteed to have the item (or none
// for create mode) on first render, so useState seeds correctly.
// ─────────────────────────────────────────────────────────────
interface FoodItemFormProps {
  existing?: FoodItem;
}

function FoodItemForm({ existing }: FoodItemFormProps) {
  const router = useRouter();
  const { pick } = useImagePicker();
  const { theme } = useUnistyles();
  const db = useSQLiteContext();

  const isEdit = Boolean(existing);

  // ── Form state — seeded from existing when editing ─────
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [servings, setServings] = useState(String(existing?.servings ?? 2));
  const [prep, setPrep] = useState(String(existing?.prepTimeMinutes ?? 0));
  const [cook, setCook] = useState(String(existing?.cookTimeMinutes ?? 0));

  const [photos, setPhotos] = useState<FoodPhoto[]>(existing?.photos ?? []);

  const [ingredients, setIngredients] = useState(
    existing?.ingredients.map((i) => ({
      id: i.id,
      qty: i.quantity !== undefined ? String(i.quantity) : "",
      unit: i.unit ?? "",
      name: i.name,
      prep: i.preparation ?? "",
    })) ?? [],
  );

  const [steps, setSteps] = useState(
    existing?.steps.map((s) => ({
      id: s.id,
      instruction: s.instruction,
      duration:
        s.durationMinutes !== undefined ? String(s.durationMinutes) : "",
    })) ?? [],
  );

  // ── Dirty state ────────────────────────────────────────
  const snapshot = useMemo(
    () =>
      JSON.stringify({
        title,
        description,
        servings,
        prep,
        cook,
        photos: photos.map((p) => p.uri),
        ingredients: ingredients.map((i) => [i.qty, i.unit, i.name, i.prep]),
        steps: steps.map((s) => [s.instruction, s.duration]),
      }),
    [title, description, servings, prep, cook, photos, ingredients, steps],
  );

  const initialSnapshotRef = useRef(snapshot);
  const isDirty = snapshot !== initialSnapshotRef.current;

  const bypassRef = useRef(false);
  useUnsavedChangesGuard({ isDirty, bypassRef });

  // ── Photo handlers ─────────────────────────────────────
  const handleAddPhotos = async () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const picked = await pick(remaining);
    if (picked.length > 0) {
      const now = Date.now();
      setPhotos((prev) => [
        ...prev,
        ...picked.map((p, i) => ({
          id: p.id,
          uri: p.uri,
          takenAt: now + i,
        })),
      ]);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // ── Ingredient helpers ─────────────────────────────────
  const addIngredient = () => {
    if (ingredients.length >= MAX_INGREDIENTS) return;
    setIngredients((prev) => [
      ...prev,
      { id: createId(), qty: "", unit: "", name: "", prep: "" },
    ]);
  };

  const updateIngredient = (rowId: string, key: string, value: string) =>
    setIngredients((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)),
    );

  const removeIngredient = (rowId: string) =>
    setIngredients((prev) => prev.filter((row) => row.id !== rowId));

  // ── Step helpers ────────────────────────────────────────
  const addStep = () => {
    if (steps.length >= MAX_STEPS) return;
    setSteps((prev) => [
      ...prev,
      { id: createId(), instruction: "", duration: "" },
    ]);
  };

  const updateStep = (rowId: string, key: string, value: string) =>
    setSteps((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)),
    );

  const removeStep = (rowId: string) =>
    setSteps((prev) => prev.filter((row) => row.id !== rowId));

  // ── Save ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Give your recipe a name.");
      return;
    }

    const item: FoodItem = {
      id: existing?.id ?? createId(),
      title: title.trim(),
      description: description.trim(),
      source: existing?.source ?? "created",
      servings: parseInt(servings, 10) || 1,
      prepTimeMinutes: parseInt(prep, 10) || 0,
      cookTimeMinutes: parseInt(cook, 10) || 0,
      imageUri: photos[0]?.uri,
      photos,
      ingredients: ingredients
        .filter((i) => i.name.trim().length > 0)
        .map((i) => ({
          id: i.id,
          quantity: i.qty ? parseFloat(i.qty) : undefined,
          unit: i.unit.trim() || undefined,
          name: i.name.trim(),
          preparation: i.prep.trim() || undefined,
        })),
      steps: steps
        .filter((s) => s.instruction.trim().length > 0)
        .map((s) => ({
          id: s.id,
          instruction: s.instruction.trim(),
          durationMinutes: s.duration ? parseInt(s.duration, 10) : undefined,
        })),
    };

    if (isEdit && existing) {
      await FoodRepo.update(db, existing.id, item);
    } else {
      await FoodRepo.insert(db, item);
    }

    bypassRef.current = true;
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEdit ? "Edit recipe" : "New recipe",
          gestureEnabled: !isDirty,
          headerBackTitle: isDirty ? "Unsaved" : "Cancel",
        }}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Basics */}
        <Section title="Basics">
          <Field
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Chicken Adobo"
          />
          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Short summary of the dish"
            multiline
          />
          <View style={styles.rowThree}>
            <Field
              label="Serves"
              value={servings}
              onChangeText={setServings}
              keyboardType="number-pad"
              style={styles.rowThreeItem}
            />
            <Field
              label="Prep (min)"
              value={prep}
              onChangeText={setPrep}
              keyboardType="number-pad"
              style={styles.rowThreeItem}
            />
            <Field
              label="Cook (min)"
              value={cook}
              onChangeText={setCook}
              keyboardType="number-pad"
              style={styles.rowThreeItem}
            />
          </View>
        </Section>

        {/* Photos */}
        <Section
          title={`Photos (${photos.length}/${MAX_PHOTOS})`}
          action={
            <AddButton
              label="Add"
              onPress={handleAddPhotos}
              disabled={photos.length >= MAX_PHOTOS}
            />
          }
        >
          <Text variant="footnote" color="mutedText">
            Optional. Add up to {MAX_PHOTOS} photos of the finished dish.
          </Text>
          <PhotoPickerGrid
            photos={photos.map((p) => ({ id: p.id, uri: p.uri }))}
            max={MAX_PHOTOS}
            onAdd={handleAddPhotos}
            onRemove={handleRemovePhoto}
          />
        </Section>

        {/* Ingredients */}
        <Section
          title={`Ingredients (${ingredients.length}/${MAX_INGREDIENTS})`}
          action={
            <AddButton
              label="Add"
              onPress={addIngredient}
              disabled={ingredients.length >= MAX_INGREDIENTS}
            />
          }
        >
          {ingredients.length === 0 ? (
            <Text variant="footnote" color="mutedText">
              No ingredients yet. Tap Add to start.
            </Text>
          ) : (
            <>
              <View style={styles.stack}>
                {ingredients.map((row) => (
                  <View key={row.id} style={styles.ingredientCard}>
                    <View style={styles.ingredientRowTop}>
                      <Field
                        label="Qty"
                        value={row.qty}
                        onChangeText={(v) => updateIngredient(row.id, "qty", v)}
                        keyboardType="decimal-pad"
                        style={styles.qtyField}
                      />
                      <Field
                        label="Unit"
                        value={row.unit}
                        onChangeText={(v) =>
                          updateIngredient(row.id, "unit", v)
                        }
                        style={styles.unitField}
                      />
                      <RemoveButton onPress={() => removeIngredient(row.id)} />
                    </View>
                    <Field
                      label="Ingredient"
                      value={row.name}
                      onChangeText={(v) => updateIngredient(row.id, "name", v)}
                      placeholder="e.g. chicken thighs"
                    />
                    <Field
                      label="Preparation (optional)"
                      value={row.prep}
                      onChangeText={(v) => updateIngredient(row.id, "prep", v)}
                      placeholder="e.g. diced, sifted"
                    />
                  </View>
                ))}
              </View>
              {ingredients.length >= MAX_INGREDIENTS && (
                <Text variant="caption" color="mutedText">
                  Maximum of {MAX_INGREDIENTS} ingredients reached.
                </Text>
              )}
            </>
          )}
        </Section>

        {/* Steps */}
        <Section
          title={`Recipe steps (${steps.length}/${MAX_STEPS})`}
          action={
            <AddButton
              label="Add"
              onPress={addStep}
              disabled={steps.length >= MAX_STEPS}
            />
          }
        >
          {steps.length === 0 ? (
            <Text variant="footnote" color="mutedText">
              No steps yet. Tap Add to start.
            </Text>
          ) : (
            <>
              <View style={styles.stack}>
                {steps.map((row, i) => (
                  <View key={row.id} style={styles.stepCard}>
                    <View style={styles.stepHeader}>
                      <View style={styles.stepNumber}>
                        <Text variant="subheadBold" color="onPrimary">
                          {i + 1}
                        </Text>
                      </View>
                      <RemoveButton onPress={() => removeStep(row.id)} />
                    </View>
                    <Field
                      label="Instruction"
                      value={row.instruction}
                      onChangeText={(v) => updateStep(row.id, "instruction", v)}
                      placeholder="Describe this step"
                      multiline
                    />
                    <Field
                      label="Duration (min, optional)"
                      value={row.duration}
                      onChangeText={(v) => updateStep(row.id, "duration", v)}
                      keyboardType="number-pad"
                    />
                  </View>
                ))}
              </View>
              {steps.length >= MAX_STEPS && (
                <Text variant="caption" color="mutedText">
                  Maximum of {MAX_STEPS} steps reached.
                </Text>
              )}
            </>
          )}
        </Section>

        {/* Save */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.savePressed,
          ]}
          accessibilityRole="button"
        >
          <Text variant="title" color="onPrimary">
            {isEdit ? "Save changes" : "Save recipe"}
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ title, action, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text variant="h3" color="onBackground">
        {title}
      </Text>
      {action}
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
  style?: any;
}
const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  style,
}) => {
  const { theme } = useUnistyles();
  return (
    <View style={[styles.field, style]}>
      <Text variant="micro" color="mutedText" textTransform="uppercase">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedText}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
};

interface AddButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}
const AddButton: React.FC<AddButtonProps> = ({ label, onPress, disabled }) => {
  const { theme } = useUnistyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.addButton,
        pressed && !disabled && styles.addPressed,
        disabled && styles.addDisabled,
      ]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <Ionicons
        name="add"
        size={16}
        color={disabled ? theme.colors.mutedText : theme.colors.primary}
      />
      <Text variant="subheadBold" color={disabled ? "mutedText" : "primary"}>
        {label}
      </Text>
    </Pressable>
  );
};

interface RemoveButtonProps {
  onPress: () => void;
}
const RemoveButton: React.FC<RemoveButtonProps> = ({ onPress }) => {
  const { theme } = useUnistyles();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={styles.removeButton}
      accessibilityRole="button"
      accessibilityLabel="Remove"
    >
      <Ionicons name="close" size={18} color={theme.colors.danger} />
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.giant,
    gap: theme.spacing.xl,
  },
  section: { gap: theme.spacing.md },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionBody: { gap: theme.spacing.md },
  stack: { gap: theme.spacing.md },
  field: { gap: theme.spacing.xxs },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.onSurface,
    minHeight: 44,
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: theme.spacing.sm,
    textAlignVertical: "top",
  },
  rowThree: { flexDirection: "row", gap: theme.spacing.sm },
  rowThreeItem: { flex: 1 },
  ingredientCard: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.panel,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    gap: theme.spacing.sm,
  },
  ingredientRowTop: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "flex-end",
  },
  qtyField: { width: 64 },
  unitField: { width: 84 },
  stepCard: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.panel,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    gap: theme.spacing.sm,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  addPressed: { opacity: theme.opacity.pressed },
  addDisabled: { opacity: theme.opacity.disabled },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    ...theme.elevation.sm,
  },
  savePressed: { opacity: theme.opacity.pressed },
}));
