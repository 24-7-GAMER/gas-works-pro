import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { COMPANY_BRAND } from "@/constants/company-brand";
import { fontSize, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

interface MenuItemProps {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  color?: string;
  colors: typeof Colors.dark;
}

function MenuItem({ icon, label, sublabel, onPress, color, colors }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        { borderBottomColor: colors.separator },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: (color ?? colors.primary) + "20" }]}>
        <Feather name={icon as any} size={18} color={color ?? colors.primary} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
        {sublabel && <Text style={[styles.menuSublabel, { color: colors.textTertiary }]}>{sublabel}</Text>}
      </View>
      <Feather name="chevron-right" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

export default function MoreScreen() {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { engineer, jobs, customers } = useApp();

  const topInset = Platform.OS === "web" ? 59 : insets.top;

  const totalRevenue = jobs.reduce((sum, j) => {
    return sum + (j.invoiceItems?.reduce((s, i) => s + i.quantity * i.unitPrice * (1 + i.vatRate / 100), 0) ?? 0);
  }, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.profileAvatar, { backgroundColor: "#FFF7ED", borderColor: colors.primary + "30" }]}>
          <Image source={COMPANY_BRAND.logoSource} style={styles.profileLogo} resizeMode="contain" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>{engineer.name}</Text>
          <Text style={[styles.profileCompany, { color: colors.textSecondary }]}>{engineer.companyName}</Text>
          <Text style={[styles.profileGasSafe, { color: colors.textTertiary }]}>Gas Safe: {engineer.gasSafeNumber}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          style={[styles.editBtn, { backgroundColor: colors.backgroundSecondary }]}
        >
          <Feather name="edit-2" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBlock, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{customers.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Customers</Text>
        </View>
        <View style={[styles.statBlock, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{jobs.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Jobs</Text>
        </View>
        <View style={[styles.statBlock, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>£{totalRevenue.toFixed(0)}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Revenue</Text>
        </View>
      </View>

      {/* Menu sections */}
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>ENGINEER</Text>
      <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <MenuItem icon="settings" label="Engineer Settings" sublabel="Name, Gas Safe number, company" onPress={() => router.push("/settings")} colors={colors} />
        <MenuItem icon="file-text" label="Certificate Templates" sublabel="CP12, Service, Invoice" onPress={() => {}} colors={colors} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>QUICK ACTIONS</Text>
      <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <MenuItem
          icon="shield"
          label="New CP12"
          sublabel="Landlord Gas Safety Record"
          onPress={() => router.push({ pathname: "/new-job", params: { jobType: "cp12" } })}
          color={colors.accent}
          colors={colors}
        />
        <MenuItem
          icon="tool"
          label="New Boiler Service"
          onPress={() => router.push({ pathname: "/new-job", params: { jobType: "boiler_service" } })}
          color={colors.info}
          colors={colors}
        />
        <MenuItem
          icon="alert-circle"
          label="New Repair"
          onPress={() => router.push({ pathname: "/new-job", params: { jobType: "repair" } })}
          color={colors.primary}
          colors={colors}
        />
        <MenuItem
          icon="credit-card"
          label="New Invoice"
          onPress={() => router.push({ pathname: "/new-job", params: { jobType: "invoice" } })}
          color={colors.warning}
          colors={colors}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>INFO</Text>
      <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <MenuItem icon="info" label="Gas Safe Register" sublabel="gassaferegister.co.uk" onPress={() => {}} colors={colors} />
        <MenuItem icon="phone" label="Gas Emergency" sublabel="0800 111 999" onPress={() => {}} color={colors.danger} colors={colors} />
      </View>

      <Text style={[styles.version, { color: colors.textTertiary }]}>GasPro Engineer v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 120, gap: 0 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 7,
  },
  profileLogo: {
    width: "100%",
    height: "100%",
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold" },
  profileCompany: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", marginTop: 2 },
  profileGasSafe: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular", marginTop: 2 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statBlock: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: fontSize.xl, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  menuSection: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: fontSize.md, fontFamily: "Inter_500Medium" },
  menuSublabel: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular", marginTop: 2 },
  pressed: { opacity: 0.7 },
  version: {
    textAlign: "center",
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
});
