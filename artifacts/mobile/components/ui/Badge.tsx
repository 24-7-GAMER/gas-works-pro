import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "react-native";
import Colors from "@/constants/colors";
import { fontSize, radius, spacing } from "@/constants/theme";

interface BadgeProps {
  label: string;
  color?: string;
  size?: "sm" | "md";
}

export function Badge({ label, color, size = "md" }: BadgeProps) {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const bg = color ? color + "22" : colors.primary + "22";
  const text = color ?? colors.primary;

  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === "sm" && styles.sm]}>
      <Text style={[styles.text, { color: text }, size === "sm" && styles.textSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_600SemiBold",
  },
  textSm: {
    fontSize: 11,
  },
});
