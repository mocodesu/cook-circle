import { HapticType, withHaptic } from "@/utils/haptics";
import { Pressable, PressableProps } from "react-native";

type HapticPressableProps = PressableProps & {
  haptic?: HapticType;
};

export function HapticPressable({
  haptic = "selection",
  onPress,
  ...props
}: HapticPressableProps) {
  return <Pressable {...props} onPress={withHaptic(onPress, haptic)} />;
}
