import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "react-native";
import Colors from "@/constants/colors";
import { fontSize, radius, spacing } from "@/constants/theme";
import type { Customer } from "@/types";

interface CustomerCardProps {
  customer: Customer;
  jobCount?: number;
  propertyCount?: number;
  onPress: () => void;
}

export function CustomerCard({ customer, jobCount = 0, propertyCount = 0, onPress }: CustomerCardProps) {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];

  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
        <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {customer.name}
        </Text>
        {customer.phone ? (
          <View style={styles.detailRow}>
            <Feather name="phone" size={12} color={colors.textTertiary} />
            <Text style={[styles.detail, { color: colors.textSecondary }]}>{customer.phone}</Text>
          </View>
        ) : null}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Feather name="home" size={12} color={colors.textTertiary} />
            <Text style={[styles.statText, { color: colors.textTertiary }]}>{propertyCount} {propertyCount === 1 ? "property" : "properties"}</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="clipboard" size={12} color={colors.textTertiary} />
            <Text style={[styles.statText, { color: colors.textTertiary }]}>{jobCount} {jobCount === 1 ? "job" : "jobs"}</Text>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: fontSize.lg,
    fontFamily: "Inter_700Bold",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: fontSize.md,
    fontFamily: "Inter_600SemiBold",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detail: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  stats: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: 2,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
});
