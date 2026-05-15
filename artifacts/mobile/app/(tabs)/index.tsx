import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JobCard } from "@/components/JobCard";
import Colors from "@/constants/colors";
import { fontSize, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { getJobRevenue } from "@/lib/job-finance";
import {
  JOB_TYPE_COLORS,
  JOB_TYPE_LABELS,
  STATUS_LABELS,
  type JobType,
} from "@/types";

const QUICK_ACTIONS: { type: JobType; icon: string }[] = [
  { type: "cp12", icon: "shield" },
  { type: "boiler_service", icon: "tool" },
  { type: "repair", icon: "alert-circle" },
  { type: "invoice", icon: "credit-card" },
];

export default function DashboardScreen() {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { jobs, customers, engineer, getCustomerById, getPropertyById } = useApp();

  const topInset = Platform.OS === "web" ? 59 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayJobs = jobs.filter((j) => j.date === today);
    const pendingInvoices = jobs.filter(
      (j) => j.status === "invoiced" || (j.status === "completed" && j.invoiceItems?.length)
    );
    const completedThisMonth = jobs.filter((j) => {
      const d = new Date(j.date);
      const now = new Date();
      return j.status === "completed" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const revenue = jobs
      .reduce((sum, j) => sum + getJobRevenue(j), 0);
    return { todayJobs, pendingInvoices, completedThisMonth, revenue };
  }, [jobs]);

  const recentJobs = useMemo(() =>
    [...jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [jobs]
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 4, paddingBottom: bottomInset + 120 },
      ]}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good morning</Text>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{engineer.name}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          style={[styles.avatarBtn, { backgroundColor: colors.backgroundSecondary }]}
        >
          <Feather name="settings" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard label="Today's Jobs" value={String(stats.todayJobs.length)} color={colors.primary} icon="calendar" colors={colors} />
        <StatCard label="Pending Invoices" value={String(stats.pendingInvoices.length)} color={colors.warning} icon="file-text" colors={colors} />
        <StatCard label="This Month" value={String(stats.completedThisMonth.length)} color={colors.accent} icon="check-circle" colors={colors} />
      </View>

      {/* Revenue */}
      <View style={[styles.revenueCard, { backgroundColor: colors.primary }]}>
        <View style={styles.revenueText}>
          <Text style={styles.revenueLabel}>Revenue (invoiced + paid)</Text>
          <Text style={styles.revenueAmount} numberOfLines={1}>£{stats.revenue.toFixed(2)}</Text>
        </View>
        <View style={styles.revenueIcon}>
          <Feather name="trending-up" size={32} color="rgba(255,255,255,0.6)" />
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NEW JOB</Text>
      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.type}
            onPress={() => router.push({ pathname: "/new-job", params: { jobType: action.type } })}
            style={({ pressed }) => [
              styles.quickAction,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: JOB_TYPE_COLORS[action.type] + "20" }]}>
              <Feather name={action.icon as any} size={22} color={JOB_TYPE_COLORS[action.type]} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]} numberOfLines={2}>
              {JOB_TYPE_LABELS[action.type]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Recent Jobs */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT JOBS</Text>
      {recentJobs.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Feather name="clipboard" size={32} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No jobs yet</Text>
        </View>
      ) : (
        recentJobs.map((job) => {
          const customer = getCustomerById(job.customerId);
          const property = getPropertyById(job.propertyId);
          return (
            <JobCard
              key={job.id}
              job={job}
              customerName={customer?.name}
              propertyAddress={property?.address}
              onPress={() => router.push({ pathname: "/job/[id]", params: { id: job.id } })}
            />
          );
        })
      )}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
  colors,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
  colors: typeof Colors.dark;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Feather name={icon as any} size={16} color={color} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textTertiary }]} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 0 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  headerText: { flex: 1, minWidth: 0 },
  greeting: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  name: {
    fontSize: fontSize.xxl,
    fontFamily: "Inter_700Bold",
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 13,
  },
  revenueCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  revenueText: { flex: 1, minWidth: 0 },
  revenueLabel: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  revenueAmount: {
    fontSize: fontSize.xxxl,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  revenueIcon: { opacity: 0.6 },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  quickAction: {
    width: "47%",
    minWidth: 0,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
  },
  pressed: { opacity: 0.7 },
  emptyState: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xxxl,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontFamily: "Inter_400Regular",
  },
});
