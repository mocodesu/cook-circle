import Text from "@/components/text";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text color="activeSurface" semibold variant="display" textAlign="center">
        HELLO TEMPLATE PROJECT
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
  },
}));
