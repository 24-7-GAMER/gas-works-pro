import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Alert,
  Image,
  Linking,
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
import { getJobRevenue } from "@/lib/job-finance";

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
        <Text style={[styles.menuLabel, { color: colors.text }]} numberOfLines={1}>{label}</Text>
        {sublabel && <Text style={[styles.menuSublabel, { color: colors.textTertiary }]} numberOfLines={1}>{sublabel}</Text>}
      </View>
      <Feather name="chevron-right" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

function backupFileName() {
  const stamp = new Date().toISOString().slice(0, 10);
  return `gas-works-pro-backup-${stamp}.json`;
}

export default function MoreScreen() {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { engineer, jobs, customers, properties, createBackup, importBackup } = useApp();

  const topInset = Platform.OS === "web" ? 59 : insets.top;

  const totalRevenue = jobs.reduce((sum, j) => {
    return sum + getJobRevenue(j);
  }, 0);

  const exportData = async () => {
    try {
      const backup = createBackup();
      const file = new File(Paths.cache, backupFileName());
      file.create({ overwrite: true });
      file.write(JSON.stringify(backup, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: "Export Gas Works Pro backup",
          UTI: "public.json",
        });
      } else {
        Alert.alert("Backup ready", `Your backup was created at ${file.uri}`);
      }
    } catch {
      Alert.alert("Export failed", "The backup file could not be created. Please try again.");
    }
  };

  const confirmImport = (backup: unknown) => {
    const data = (backup as any)?.data;
    const customerCount = Array.isArray(data?.customers) ? data.customers.length : 0;
    const propertyCount = Array.isArray(data?.properties) ? data.properties.length : 0;
    const jobCount = Array.isArray(data?.jobs) ? data.jobs.length : 0;

    Alert.alert(
      "Import backup?",
      `This will replace the current app data with ${customerCount} customers, ${propertyCount} properties and ${jobCount} jobs from the backup file.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          style: "destructive",
          onPress: async () => {
            try {
              const imported = await importBackup(backup);
              Alert.alert(
                "Import complete",
                `Restored ${imported.customers.length} customers, ${imported.properties.length} properties and ${imported.jobs.length} jobs.`
              );
            } catch (error) {
              Alert.alert(
                "Import failed",
                error instanceof Error ? error.message : "The selected file is not a valid backup."
              );
            }
          },
        },
      ]
    );
  };

  const importData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/json", "public.json"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset?.uri) {
        Alert.alert("Import failed", "No backup file was selected.");
        return;
      }

      const text = await new File(asset.uri).text();
      confirmImport(JSON.parse(text));
    } catch {
      Alert.alert("Import failed", "The selected file could not be read.");
    }
  };

  const openCertificateTemplates = () => {
    Alert.alert("Choose document type", "Start a job using one of the available document templates.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "New CP12",
        onPress: () => router.push({ pathname: "/new-job", params: { jobType: "cp12" } }),
      },
      {
        text: "New Service",
        onPress: () => router.push({ pathname: "/new-job", params: { jobType: "boiler_service" } }),
      },
      {
        text: "New Invoice",
        onPress: () => router.push({ pathname: "/new-job", params: { jobType: "invoice" } }),
      },
    ]);
  };

  const openGasSafeRegister = async () => {
    await Linking.openURL("https://www.gassaferegister.co.uk/");
  };

  const callGasEmergency = async () => {
    await Linking.openURL("tel:0800111999");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 8 }]}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.profileAvatar, { backgroundColor: "#FFF7ED", borderColor: colors.primary + "30" }]}>
          <Image source={COMPANY_BRAND.logoSource} style={styles.profileLogo} resizeMode="contain" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>{engineer.name}</Text>
          <Text style={[styles.profileCompany, { color: colors.textSecondary }]} numberOfLines={1}>{engineer.companyName}</Text>
          <Text style={[styles.profileGasSafe, { color: colors.textTertiary }]} numberOfLines={1}>Gas Safe: {engineer.gasSafeNumber}</Text>
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
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Jobs</Text>
        </View>
        <View style={[styles.statBlock, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{properties.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Properties</Text>
        </View>
      </View>

      {/* Menu sections */}
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>ENGINEER</Text>
      <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <MenuItem icon="settings" label="Engineer Settings" sublabel="Name, Gas Safe number, company" onPress={() => router.push("/settings")} colors={colors} />
        <MenuItem icon="file-text" label="Start From Template" sublabel="CP12, service or invoice" onPress={openCertificateTemplates} colors={colors} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>DATA TRANSFER</Text>
      <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <MenuItem
          icon="download"
          label="Export Backup"
          sublabel="Share all customers, properties, jobs and settings"
          onPress={exportData}
          color={colors.info}
          colors={colors}
        />
        <MenuItem
          icon="upload"
          label="Import Backup"
          sublabel="Restore from another device or previous install"
          onPress={importData}
          color={colors.primary}
          colors={colors}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>INFO</Text>
      <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <MenuItem icon="info" label="Gas Safe Register" sublabel="gassaferegister.co.uk" onPress={openGasSafeRegister} colors={colors} />
        <MenuItem icon="phone" label="Gas Emergency" sublabel="0800 111 999" onPress={callGasEmergency} color={colors.danger} colors={colors} />
      </View>

      <Text style={[styles.version, { color: colors.textTertiary }]}>
        Gas Works Pro v1.0.0 · Revenue £{totalRevenue.toFixed(0)}
      </Text>
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
  profileInfo: { flex: 1, minWidth: 0 },
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
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: fontSize.xl, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 13 },
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
  menuText: { flex: 1, minWidth: 0 },
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
