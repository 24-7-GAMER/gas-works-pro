import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { useColorScheme } from "react-native";
import Colors from "@/constants/colors";
import { radius, spacing } from "@/constants/theme";

interface PressableCardProps {
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
}

export function PressableCard({ onPress, children, style, disabled }: PressableCardProps) {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];

  if (!onPress) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }, style]}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        pressed && styles.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
