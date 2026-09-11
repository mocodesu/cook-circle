import Text from "@/components/text";
import { APP_NAME } from "@/constants";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text color="activeSurface" semibold variant="title" textAlign="center">
        Hello "{APP_NAME}" project! This is the main entry point of the app. You
        can edit this file to start building your app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.paddingHorizontal,
  },
}));
