import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { JobCard } from "@/components/JobCard";
import { PressableCard } from "@/components/ui/PressableCard";
import Colors from "@/constants/colors";
import { fontSize, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { goBackOrReplace } from "@/lib/navigation";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const {
    getCustomerById,
    getPropertiesByCustomer,
    getJobsByCustomer,
    getPropertyById,
    deleteCustomer,
  } = useApp();

  const customer = getCustomerById(id);
  const properties = getPropertiesByCustomer(id);
  const jobs = getJobsByCustomer(id);

  if (!customer) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>Customer not found</Text>
      </View>
    );
  }

  const initials = customer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleCall = async () => {
    if (!customer.phone) return;
    const url = `tel:${customer.phone.replace(/\s+/g, "")}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleEmail = async () => {
    if (!customer.email) return;
    const url = `mailto:${customer.email}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Customer", "Are you sure? This will delete their properties and jobs too.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteCustomer(customer.id);
          goBackOrReplace("/(tabs)/customers");
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{customer.name}</Text>
        <Text style={[styles.address, { color: colors.textSecondary }]}>{customer.address}</Text>
      </View>

      {/* Contact buttons */}
        <View style={styles.contactRow}>
        {customer.phone ? (
          <Pressable onPress={handleCall} style={[styles.contactBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Feather name="phone" size={18} color={colors.accent} />
            <Text style={[styles.contactBtnLabel, { color: colors.text }]} numberOfLines={1}>{customer.phone}</Text>
          </Pressable>
        ) : null}
        {customer.email ? (
          <Pressable onPress={handleEmail} style={[styles.contactBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Feather name="mail" size={18} color={colors.info} />
            <Text style={[styles.contactBtnLabel, { color: colors.text }]} numberOfLines={1}>{customer.email}</Text>
          </Pressable>
        ) : null}
      </View>

      {customer.notes ? (
        <PressableCard style={styles.notesCard}>
          <View style={styles.notesRow}>
            <Feather name="file-text" size={14} color={colors.textTertiary} />
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{customer.notes}</Text>
          </View>
        </PressableCard>
      ) : null}

      {/* Properties */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PROPERTIES</Text>
          <Pressable
            onPress={() => router.push({ pathname: "/new-job", params: { customerId: customer.id } })}
            style={[styles.sectionAddBtn, { backgroundColor: colors.primary + "20" }]}
          >
            <Feather name="plus" size={16} color={colors.primary} />
          </Pressable>
        </View>
        {properties.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No properties recorded</Text>
        ) : (
          properties.map((property) => (
            <Pressable
              key={property.id}
              onPress={() => router.push({ pathname: "/property/[id]", params: { id: property.id } })}
              style={({ pressed }) => [
                styles.propertyCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.propertyIcon, { backgroundColor: colors.info + "20" }]}>
                <Feather name="home" size={16} color={colors.info} />
              </View>
              <View style={styles.propertyInfo}>
                <Text style={[styles.propertyAddress, { color: colors.text }]} numberOfLines={1}>{property.address}</Text>
                <Text style={[styles.propertyPostcode, { color: colors.textTertiary }]} numberOfLines={1}>
                  {property.postcode} · {property.propertyType === "landlord" ? "Landlord" : "Residential"}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.textTertiary} />
            </Pressable>
          ))
        )}
      </View>

      {/* Recent Jobs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>JOB HISTORY</Text>
          <Pressable
            onPress={() => router.push({ pathname: "/new-job", params: { customerId: customer.id } })}
            style={[styles.sectionAddBtn, { backgroundColor: colors.primary + "20" }]}
          >
            <Feather name="plus" size={16} color={colors.primary} />
          </Pressable>
        </View>
        {jobs.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No jobs recorded</Text>
        ) : (
          jobs.slice(0, 10).map((job) => (
            <JobCard
              key={job.id}
              job={job}
              propertyAddress={getPropertyById(job.propertyId)?.address}
              onPress={() => router.push({ pathname: "/job/[id]", params: { id: job.id } })}
            />
          ))
        )}
      </View>

      {/* Danger zone */}
      <Pressable
        onPress={handleDelete}
        style={[styles.deleteBtn, { borderColor: colors.danger + "40" }]}
      >
        <Feather name="trash-2" size={16} color={colors.danger} />
        <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete Customer</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 60, gap: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: fontSize.lg, fontFamily: "Inter_400Regular" },
  profileHeader: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  initials: { fontSize: 28, fontFamily: "Inter_700Bold" },
  name: { fontSize: fontSize.xxl, fontFamily: "Inter_700Bold", textAlign: "center" },
  address: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", textAlign: "center" },
  contactRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  contactBtnLabel: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium", flex: 1, minWidth: 0 },
  notesCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  notesRow: { flexDirection: "row", gap: spacing.sm },
  notesText: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", flex: 1, minWidth: 0 },
  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  sectionAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: spacing.lg,
  },
  propertyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  propertyIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  propertyInfo: { flex: 1, minWidth: 0 },
  propertyAddress: { fontSize: fontSize.md, fontFamily: "Inter_500Medium" },
  propertyPostcode: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular", marginTop: 2 },
  pressed: { opacity: 0.75 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  deleteBtnText: { fontSize: fontSize.md, fontFamily: "Inter_500Medium" },
});
