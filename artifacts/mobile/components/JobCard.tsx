import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import Colors from "@/constants/colors";
import { fontSize, radius, spacing } from "@/constants/theme";
import { getJobAmountDue, isJobUnpaid } from "@/lib/job-finance";
import {
  JOB_TYPE_COLORS,
  JOB_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  type Job,
} from "@/types";

interface JobCardProps {
  job: Job;
  customerName?: string;
  propertyAddress?: string;
  onPress: () => void;
}

const jobIcons: Record<string, string> = {
  cp12: "shield",
  boiler_service: "tool",
  repair: "alert-circle",
  installation: "package",
  warning_notice: "alert-triangle",
  quote: "file-text",
  invoice: "credit-card",
};

export function JobCard({ job, customerName, propertyAddress, onPress }: JobCardProps) {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const typeColor = JOB_TYPE_COLORS[job.jobType];
  const statusColor = STATUS_COLORS[job.status];
  const totalAmount = getJobAmountDue(job);
  const unpaid = isJobUnpaid(job);

  const formattedDate = new Date(job.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.typeIcon, { backgroundColor: typeColor + "20" }]}>
          <Feather name={jobIcons[job.jobType] as any} size={18} color={typeColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.jobType, { color: colors.text }]}>{JOB_TYPE_LABELS[job.jobType]}</Text>
          <Text style={[styles.jobNumber, { color: colors.textTertiary }]}>{job.jobNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[job.status]}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.separator }]} />

      <View style={styles.details}>
        {customerName && (
          <View style={styles.detailRow}>
            <Feather name="user" size={13} color={colors.textTertiary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
              {customerName}
            </Text>
          </View>
        )}
        {propertyAddress && (
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={13} color={colors.textTertiary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
              {propertyAddress}
            </Text>
          </View>
        )}
        <View style={styles.footer}>
          <View style={styles.detailRow}>
            <Feather name="calendar" size={13} color={colors.textTertiary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{formattedDate}</Text>
          </View>
          {totalAmount > 0 && (
            <View style={styles.amountWrap}>
              <Text style={[styles.amountLabel, { color: unpaid ? colors.warning : colors.accent }]}>
                {unpaid ? "Due" : "Paid"}
              </Text>
              <Text style={[styles.amount, { color: colors.text }]}>£{totalAmount.toFixed(2)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  jobType: {
    fontSize: fontSize.md,
    fontFamily: "Inter_600SemiBold",
  },
  jobNumber: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.md,
  },
  details: {
    padding: spacing.md,
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  amountWrap: { alignItems: "flex-end" },
  amountLabel: { fontSize: fontSize.xs, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  amount: {
    fontSize: fontSize.md,
    fontFamily: "Inter_700Bold",
  },
});
