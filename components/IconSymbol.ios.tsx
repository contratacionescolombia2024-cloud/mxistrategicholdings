
import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle } from "react-native";

export function IconSymbol({
  name,
  ios_icon_name,
  android_material_icon_name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  name?: SymbolViewProps["name"];
  ios_icon_name?: SymbolViewProps["name"];
  android_material_icon_name?: string;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Support both prop patterns - prefer ios_icon_name on iOS
  const iconName = ios_icon_name || name;

  if (!iconName) {
    console.warn('IconSymbol: No icon name provided');
    return null;
  }

  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={iconName}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
