import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "react-native";
import Colors from "@/constants/colors";
import { fontSize, spacing } from "@/constants/theme";

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title.toUpperCase()}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
});
