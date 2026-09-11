// ─────────────────────────────────────────────────────────────
// hooks/use-image-picker.ts (Expo SDK 54+)
// ─────────────────────────────────────────────────────────────
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useCallback } from "react";
import { Alert } from "react-native";

// The new API uses a Directory class to represent the folder.
// We reference it using Paths.document as the base.
const PHOTOS_DIR = new Directory(Paths.document, "food-photos");

const ensureDir = () => {
  if (!PHOTOS_DIR.exists) {
    PHOTOS_DIR.create({ intermediates: true });
  }
};

/**
 * Copies a picked asset from its transient cache/asset path into
 * the app's persistent document directory using the new File API.
 */
const persistImage = (uri: string): string => {
  ensureDir();

  const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Create a File instance for the source and the destination
  const sourceFile = new File(uri);
  const destFile = new File(PHOTOS_DIR, filename);

  // The new API has a synchronous .copy() method (no more await)
  sourceFile.copy(destFile);

  return destFile.uri;
};

export interface PickedImage {
  id: string;
  uri: string;
}

export const useImagePicker = () => {
  const pick = useCallback(
    async (remaining: number): Promise<PickedImage[]> => {
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
        quality: 0.85,
        exif: false,
      });

      if (result.canceled) return [];

      const persisted: PickedImage[] = [];
      for (const asset of result.assets) {
        try {
          // persistImage is now synchronous
          const uri = persistImage(asset.uri);
          persisted.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            uri,
          });
        } catch {
          // skip failed copies silently
        }
      }
      return persisted;
    },
    [],
  );

  const takePhoto = useCallback(async (): Promise<PickedImage | null> => {
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
      quality: 0.85,
      exif: false,
    });

    if (result.canceled || result.assets.length === 0) return null;

    try {
      const uri = persistImage(result.assets[0].uri);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        uri,
      };
    } catch {
      return null;
    }
  }, []);

  return { pick, takePhoto };
};
