import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormField } from "@/components/ui/FormField";
import Colors from "@/constants/colors";
import { fontSize, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function NewCustomerScreen() {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { addCustomer, addProperty } = useApp();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [propAddress, setPropAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [propType, setPropType] = useState<"residential" | "landlord">("residential");
  const [landlordName, setLandlordName] = useState("");
  const [propNotes, setPropNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter the customer's name.");
      return;
    }
    setIsSaving(true);
    try {
      const customer = await addCustomer({ name: name.trim(), phone, email, address, notes });
      if (propAddress.trim()) {
        await addProperty({
          customerId: customer.id,
          address: propAddress.trim(),
          postcode,
          propertyType: propType,
          landlordName: propType === "landlord" ? landlordName : undefined,
          notes: propNotes,
        });
      }
      router.replace({ pathname: "/customer/[id]", params: { id: customer.id } });
    } catch (e) {
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>New Customer</Text>
        <Pressable
          onPress={handleSave}
          disabled={isSaving || !name.trim()}
          style={[styles.saveBtn, { backgroundColor: (!name.trim() || isSaving) ? colors.textTertiary : colors.primary }]}
        >
          <Text style={styles.saveBtnText}>{isSaving ? "Saving..." : "Save"}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="interactive"
      >
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>CUSTOMER DETAILS</Text>
        <FormField label="Full Name *" value={name} onChangeText={setName} placeholder="e.g. Margaret Thompson" />
        <FormField label="Phone" value={phone} onChangeText={setPhone} placeholder="07700 900000" keyboardType="phone-pad" />
        <FormField label="Email" value={email} onChangeText={setEmail} placeholder="email@example.co.uk" keyboardType="email-address" />
        <FormField label="Address" value={address} onChangeText={setAddress} placeholder="Full address" />
        <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Any special instructions..." multiline style={styles.multiline} />

        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>FIRST PROPERTY (optional)</Text>
        <FormField label="Property Address" value={propAddress} onChangeText={setPropAddress} placeholder="e.g. 14 Elmwood Drive, Sheffield" />
        <FormField label="Postcode" value={postcode} onChangeText={setPostcode} placeholder="e.g. S10 3PQ" />

        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Property Type</Text>
        <View style={styles.typeRow}>
          {(["residential", "landlord"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setPropType(t)}
              style={[
                styles.typeBtn,
                {
                  backgroundColor: propType === t ? colors.primary + "20" : colors.backgroundSecondary,
                  borderColor: propType === t ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Feather
                name={t === "residential" ? "home" : "key"}
                size={16}
                color={propType === t ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.typeBtnText, { color: propType === t ? colors.primary : colors.textSecondary }]}>
                {t === "residential" ? "Residential" : "Landlord"}
              </Text>
            </Pressable>
          ))}
        </View>

        {propType === "landlord" && (
          <FormField label="Landlord Name" value={landlordName} onChangeText={setLandlordName} />
        )}
        <FormField label="Property Notes" value={propNotes} onChangeText={setPropNotes} multiline style={styles.multiline} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelText: { fontSize: fontSize.md, fontFamily: "Inter_400Regular" },
  title: { fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  saveBtnText: { fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold", color: "#fff" },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  fieldLabel: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium", marginBottom: spacing.sm },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: spacing.md,
  },
  typeBtnText: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium" },
});
