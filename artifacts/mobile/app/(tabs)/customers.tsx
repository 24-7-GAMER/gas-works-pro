import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomerCard } from "@/components/CustomerCard";
import Colors from "@/constants/colors";
import { fontSize, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function CustomersScreen() {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { customers, getJobsByCustomer, getPropertiesByCustomer } = useApp();
  const [search, setSearch] = useState("");

  const topInset = Platform.OS === "web" ? 59 : insets.top;

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => a.name.localeCompare(b.name)),
    [filtered]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Customers</Text>
        <Pressable
          onPress={() => router.push("/new-customer")}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
        <Feather name="search" size={16} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search customers..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x-circle" size={16} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            jobCount={getJobsByCustomer(item.id).length}
            propertyCount={getPropertiesByCustomer(item.id).length}
            onPress={() => router.push({ pathname: "/customer/[id]", params: { id: item.id } })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {search ? "No results found" : "No customers yet"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {search ? "Try a different search" : "Tap + to add your first customer"}
            </Text>
          </View>
        )}
        scrollEnabled={!!sorted.length}
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
    marginBottom: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: fontSize.md,
    fontFamily: "Inter_400Regular",
  },
  list: {
    paddingBottom: 120,
    paddingTop: spacing.sm,
  },
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
