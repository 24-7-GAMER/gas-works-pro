import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JobCard } from "@/components/JobCard";
import Colors from "@/constants/colors";
import { fontSize, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { isJobPaid, isJobUnpaid } from "@/lib/job-finance";
import type { JobType } from "@/types";

const FILTER_TYPES: { label: string; value: JobType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "CP12", value: "cp12" },
  { label: "Service", value: "boiler_service" },
  { label: "Repair", value: "repair" },
  { label: "Invoice", value: "invoice" },
];

const STATUS_FILTERS = [
  { label: "All Statuses", value: "all" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Paid", value: "paid" },
] as const;

export default function JobsScreen() {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { jobs, getCustomerById, getPropertyById } = useApp();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<JobType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>("all");

  const topInset = Platform.OS === "web" ? 59 : insets.top;

  const filtered = useMemo(() => {
    let result = jobs;

    if (filterType !== "all") result = result.filter((j) => j.jobType === filterType);
    if (statusFilter === "unpaid") result = result.filter((j) => isJobUnpaid(j));
    if (statusFilter === "paid") result = result.filter((j) => isJobPaid(j));

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.jobNumber.toLowerCase().includes(q) ||
          getCustomerById(j.customerId)?.name.toLowerCase().includes(q) ||
          getPropertyById(j.propertyId)?.address.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => b.date.localeCompare(a.date));
  }, [jobs, filterType, statusFilter, search, getCustomerById, getPropertyById]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: topInset + 8 }]}> 
        <Text style={[styles.title, { color: colors.text }]}>Jobs</Text>
        <Pressable onPress={() => router.push("/new-job")} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Feather name="plus" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}> 
        <Feather name="search" size={16} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search jobs..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x-circle" size={16} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filtersScroll}>
        {FILTER_TYPES.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFilterType(f.value)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filterType === f.value ? colors.primary : colors.backgroundSecondary,
                borderColor: filterType === f.value ? colors.primary : colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.filterLabel, { color: filterType === f.value ? "#fff" : colors.textSecondary }]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filtersScroll}>
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setStatusFilter(f.value)}
            style={[
              styles.filterChip,
              {
                backgroundColor: statusFilter === f.value ? colors.accent : colors.backgroundSecondary,
                borderColor: statusFilter === f.value ? colors.accent : colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.filterLabel, { color: statusFilter === f.value ? "#fff" : colors.textSecondary }]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={[styles.count, { color: colors.textTertiary }]}> 
        {filtered.length} {filtered.length === 1 ? "job" : "jobs"}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(j) => j.id}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            customerName={getCustomerById(item.customerId)?.name}
            propertyAddress={getPropertyById(item.propertyId)?.address}
            onPress={() => router.push({ pathname: "/job/[id]", params: { id: item.id } })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Feather name="clipboard" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}> 
              {search || filterType !== "all" || statusFilter !== "all" ? "No results" : "No jobs yet"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}> 
              {search || filterType !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filter"
                : "Tap + to create your first job"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: "Inter_400Regular",
  },
  filtersScroll: { flexGrow: 0 },
  filters: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    flexShrink: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_500Medium",
    includeFontPadding: false,
  },
  count: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: { paddingBottom: 120 },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: spacing.md,
    paddingHorizontal: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
