import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { JobCard } from "@/components/JobCard";
import Colors from "@/constants/colors";
import { fontSize, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const { getPropertyById, getCustomerById, getJobsByProperty } = useApp();

  const property = getPropertyById(id);
  const customer = property ? getCustomerById(property.customerId) : undefined;
  const jobs = getJobsByProperty(id);

  if (!property) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>Property not found</Text>
      </View>
    );
  }

  const lastService = jobs.find((j) => j.jobType === "boiler_service" || j.jobType === "cp12");
  const lastCp12 = jobs.find((j) => j.jobType === "cp12");

  const openPhone = async (phone?: string) => {
    if (!phone) return;
    const url = `tel:${phone.replace(/\s+/g, "")}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const openEmail = async (email?: string) => {
    if (!email) return;
    const url = `mailto:${email}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.headerIcon, { backgroundColor: colors.info + "20" }]}>
          <Feather name="home" size={28} color={colors.info} />
        </View>
        <Text style={[styles.address, { color: colors.text }]} numberOfLines={2}>{property.address}</Text>
        <Text style={[styles.postcode, { color: colors.textSecondary }]} numberOfLines={1}>{property.postcode}</Text>
        <View style={[styles.typeBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.typeBadgeText, { color: colors.primary }]} numberOfLines={1}>
            {property.propertyType === "landlord" ? "Landlord Property" : property.propertyType === "commercial" ? "Commercial" : "Residential"}
          </Text>
        </View>
      </View>

      {/* Customer info */}
      {customer && (
        <Pressable
          onPress={() => router.push({ pathname: "/customer/[id]", params: { id: customer.id } })}
          style={({ pressed }) => [
            styles.customerRow,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            pressed && styles.pressed,
          ]}
        >
          <Feather name="user" size={18} color={colors.primary} />
          <View style={styles.customerInfo}>
            <Text style={[styles.customerLabel, { color: colors.textTertiary }]}>Customer</Text>
            <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>{customer.name}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.textTertiary} />
        </Pressable>
      )}

      {/* Landlord info */}
      {property.propertyType === "landlord" && property.landlordName && (
        <View style={[styles.landlordCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardLabel, { color: colors.textTertiary }]}>LANDLORD DETAILS</Text>
          <Text style={[styles.landlordName, { color: colors.text }]} numberOfLines={1}>{property.landlordName}</Text>
          {property.landlordPhone && (
            <Pressable onPress={() => openPhone(property.landlordPhone)} style={styles.detailRow}>
              <Feather name="phone" size={13} color={colors.textTertiary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>{property.landlordPhone}</Text>
            </Pressable>
          )}
          {property.landlordEmail && (
            <Pressable onPress={() => openEmail(property.landlordEmail)} style={styles.detailRow}>
              <Feather name="mail" size={13} color={colors.textTertiary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>{property.landlordEmail}</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Cert status */}
      <View style={styles.certRow}>
        <View style={[styles.certCard, { backgroundColor: lastCp12 ? colors.accent + "15" : colors.danger + "15", borderColor: lastCp12 ? colors.accent : colors.danger }]}>
          <Feather name="shield" size={20} color={lastCp12 ? colors.accent : colors.danger} />
          <View style={styles.certText}>
            <Text style={[styles.certTitle, { color: lastCp12 ? colors.accent : colors.danger }]} numberOfLines={1}>CP12</Text>
            <Text style={[styles.certDate, { color: colors.textSecondary }]} numberOfLines={1}>
              {lastCp12 ? new Date(lastCp12.date).toLocaleDateString("en-GB") : "No record"}
            </Text>
          </View>
        </View>
        <View style={[styles.certCard, { backgroundColor: lastService ? colors.info + "15" : colors.warning + "15", borderColor: lastService ? colors.info : colors.warning }]}>
          <Feather name="tool" size={20} color={lastService ? colors.info : colors.warning} />
          <View style={styles.certText}>
            <Text style={[styles.certTitle, { color: lastService ? colors.info : colors.warning }]} numberOfLines={1}>Service</Text>
            <Text style={[styles.certDate, { color: colors.textSecondary }]} numberOfLines={1}>
              {lastService ? new Date(lastService.date).toLocaleDateString("en-GB") : "No record"}
            </Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      {property.notes && (
        <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardLabel, { color: colors.textTertiary }]}>NOTES</Text>
          <Text style={[styles.notesText, { color: colors.text }]}>{property.notes}</Text>
        </View>
      )}

      {/* Job history */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>JOB HISTORY</Text>
          <Pressable
            onPress={() => router.push({ pathname: "/new-job", params: { propertyId: property.id, customerId: property.customerId } })}
            style={[styles.newJobBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={14} color="#fff" />
            <Text style={styles.newJobBtnText}>New Job</Text>
          </Pressable>
        </View>
        {jobs.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No jobs recorded</Text>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => router.push({ pathname: "/job/[id]", params: { id: job.id } })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 60, gap: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: fontSize.lg, fontFamily: "Inter_400Regular" },
  headerCard: {
    margin: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  address: { fontSize: fontSize.xl, fontFamily: "Inter_700Bold", textAlign: "center" },
  postcode: { fontSize: fontSize.md, fontFamily: "Inter_400Regular" },
  typeBadge: {
    maxWidth: "100%",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  typeBadgeText: { fontSize: fontSize.xs, fontFamily: "Inter_600SemiBold" },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  customerInfo: { flex: 1, minWidth: 0 },
  customerLabel: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular" },
  customerName: { fontSize: fontSize.md, fontFamily: "Inter_600SemiBold" },
  pressed: { opacity: 0.75 },
  landlordCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardLabel: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  landlordName: { fontSize: fontSize.md, fontFamily: "Inter_600SemiBold" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minWidth: 0 },
  detailText: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", flex: 1, minWidth: 0 },
  certRow: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  certCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
  },
  certText: { flex: 1, minWidth: 0 },
  certTitle: { fontSize: fontSize.sm, fontFamily: "Inter_700Bold" },
  certDate: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular" },
  notesCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  notesText: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular" },
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
  newJobBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  newJobBtnText: { fontSize: fontSize.xs, fontFamily: "Inter_600SemiBold", color: "#fff" },
  emptyText: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", paddingHorizontal: spacing.lg },
});
