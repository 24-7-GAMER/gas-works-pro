import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { FormField } from "@/components/ui/FormField";
import Colors from "@/constants/colors";
import { COMPANY_BRAND } from "@/constants/company-brand";
import { fontSize, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const { engineer, updateEngineer } = useApp();

  const [name, setName] = useState(engineer.name);
  const [gasSafeNumber, setGasSafeNumber] = useState(engineer.gasSafeNumber);
  const [companyName, setCompanyName] = useState(engineer.companyName);
  const [address, setAddress] = useState(engineer.address);
  const [phone, setPhone] = useState(engineer.phone);
  const [email, setEmail] = useState(engineer.email);
  const [vatNumber, setVatNumber] = useState(engineer.vatNumber ?? "");
  const [vatRegistered, setVatRegistered] = useState(engineer.vatRegistered);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateEngineer({
        name,
        gasSafeNumber,
        companyName,
        address,
        phone,
        email,
        vatNumber: vatNumber || undefined,
        vatRegistered,
      });
      Alert.alert("Saved", "Your settings have been updated.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="interactive"
      >
        <View style={[styles.profileIcon, { backgroundColor: "#FFF7ED", borderColor: colors.primary + "30" }]}>
          <Image source={COMPANY_BRAND.logoSource} style={styles.profileLogo} resizeMode="contain" />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>ENGINEER DETAILS</Text>
        <FormField label="Full Name" value={name} onChangeText={setName} placeholder="Your name" />
        <FormField label="Gas Safe Registration Number" value={gasSafeNumber} onChangeText={setGasSafeNumber} placeholder="e.g. 612345" />

        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>COMPANY</Text>
        <FormField label="Company Name" value={companyName} onChangeText={setCompanyName} placeholder="Your trading name" />
        <FormField label="Business Address" value={address} onChangeText={setAddress} placeholder="Full address" />
        <FormField label="Phone Number" value={phone} onChangeText={setPhone} placeholder="07700 900000" keyboardType="phone-pad" />
        <FormField label="Email Address" value={email} onChangeText={setEmail} placeholder="you@company.co.uk" keyboardType="email-address" />

        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>VAT</Text>
        <Pressable
          onPress={() => setVatRegistered(!vatRegistered)}
          style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
          <View>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>VAT Registered</Text>
            <Text style={[styles.toggleSub, { color: colors.textTertiary }]}>Add VAT to invoices</Text>
          </View>
          <View style={[styles.toggle, { backgroundColor: vatRegistered ? colors.primary : colors.backgroundSecondary }]}>
            <View style={[styles.toggleThumb, { transform: [{ translateX: vatRegistered ? 20 : 2 }] }]} />
          </View>
        </Pressable>
        {vatRegistered && (
          <FormField label="VAT Number" value={vatNumber} onChangeText={setVatNumber} placeholder="GB 123 4567 89" />
        )}

        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveBtn, { backgroundColor: isSaving ? colors.textTertiary : colors.primary }]}
        >
          <Feather name="save" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{isSaving ? "Saving..." : "Save Settings"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.xl,
    padding: 10,
  },
  profileLogo: {
    width: "100%",
    height: "100%",
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  toggleLabel: { fontSize: fontSize.md, fontFamily: "Inter_500Medium" },
  toggleSub: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular", marginTop: 2 },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  saveBtnText: { fontSize: fontSize.md, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
