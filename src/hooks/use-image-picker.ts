// ─────────────────────────────────────────────────────────────
// hooks/use-image-picker.ts
// ─────────────────────────────────────────────────────────────
import type { PickedPhoto } from "@/types";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useCallback } from "react";
import { Alert } from "react-native";

const PHOTOS_DIR = new Directory(Paths.document, "food-photos");

const ensureDir = () => {
  if (!PHOTOS_DIR.exists) {
    PHOTOS_DIR.create({ intermediates: true });
  }
};

/**
 * Copies a picked asset into the app's document directory using the
 * new synchronous File API. No compression — just a durable copy.
 */
const persistImage = (sourceUri: string): string => {
  ensureDir();

  const sourceFile = new File(sourceUri);
  if (!sourceFile.exists) {
    throw new Error(`Source file does not exist: ${sourceUri}`);
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const destFile = new File(PHOTOS_DIR, filename);

  sourceFile.copy(destFile);

  console.log("[image-picker] copied →", destFile.uri);
  return destFile.uri;
};

export const useImagePicker = () => {
  const pick = useCallback(
    async (remaining: number): Promise<PickedPhoto[]> => {
      if (remaining <= 0) return [];

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Photos permission needed",
          "Allow photo access in Settings to attach pictures to your recipe.",
        );
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 1,
        exif: false,
      });

      if (result.canceled) return [];

      const persisted: PickedPhoto[] = [];
      for (const asset of result.assets) {
        try {
          const localUri = persistImage(asset.uri);
          persisted.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            uri: localUri,
          });
        } catch (err) {
          console.error("[image-picker] persistImage failed:", err);
        }
      }
      return persisted;
    },
    [],
  );

  const takePhoto = useCallback(async (): Promise<PickedPhoto | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera permission needed",
        "Allow camera access in Settings to take a photo.",
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      exif: false,
    });

    if (result.canceled || result.assets.length === 0) return null;

    try {
      const localUri = persistImage(result.assets[0].uri);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        uri: localUri,
      };
    } catch (err) {
      console.error("[image-picker] persistImage failed:", err);
      return null;
    }
  }, []);

  return { pick, takePhoto };
};
