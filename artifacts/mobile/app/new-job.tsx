import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { parseCurrencyInput } from "@/lib/job-finance";
import { goBackOrReplace } from "@/lib/navigation";
import {
  JOB_TYPE_COLORS,
  JOB_TYPE_LABELS,
  type ApplianceType,
  type JobType,
} from "@/types";

const JOB_TYPES: JobType[] = [
  "cp12",
  "boiler_service",
  "repair",
  "installation",
  "warning_notice",
  "quote",
  "invoice",
];

const APPLIANCE_TYPES: { label: string; value: ApplianceType }[] = [
  { label: "Boiler", value: "boiler" },
  { label: "Gas Fire", value: "fire" },
  { label: "Hob", value: "hob" },
  { label: "Cooker", value: "cooker" },
  { label: "Water Heater", value: "water_heater" },
  { label: "Other", value: "other" },
];

export default function NewJobScreen() {
  const { jobType: initialType, customerId: initialCustomerId, propertyId: initialPropertyId } =
    useLocalSearchParams<{ jobType?: JobType; customerId?: string; propertyId?: string }>();

  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { customers, properties, getPropertiesByCustomer, engineer, addJob } = useApp();

  const [step, setStep] = useState(initialType ? 1 : 0);
  const [jobType, setJobType] = useState<JobType>(initialType ?? "cp12");
  const [customerId, setCustomerId] = useState(initialCustomerId ?? "");
  const [propertyId, setPropertyId] = useState(initialPropertyId ?? "");
  const [isSaving, setIsSaving] = useState(false);

  // Job fields
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [engineerName, setEngineerName] = useState(engineer.name);
  const [gasSafeNumber, setGasSafeNumber] = useState(engineer.gasSafeNumber);
  const [companyName, setCompanyName] = useState(engineer.companyName);

  // Appliance
  const [applianceType, setApplianceType] = useState<ApplianceType>("boiler");
  const [applianceMake, setApplianceMake] = useState("");
  const [applianceModel, setApplianceModel] = useState("");
  const [applianceSerial, setApplianceSerial] = useState("");
  const [applianceLocation, setApplianceLocation] = useState("");

  // Safety checks
  const [workingPressure, setWorkingPressure] = useState("");
  const [standingPressure, setStandingPressure] = useState("");
  const [flueType, setFlueType] = useState("");
  const [defectsFound, setDefectsFound] = useState("");
  const [remedialWork, setRemedialWork] = useState("");
  const [observations, setObservations] = useState("");
  const [outcome, setOutcome] = useState<"satisfactory" | "at_risk" | "immediately_dangerous">("satisfactory");

  // Invoice
  const [invoiceDesc, setInvoiceDesc] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [invoiceNotes, setInvoiceNotes] = useState("");

  const availableProperties = customerId ? getPropertiesByCustomer(customerId) : [];
  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedProperty = properties.find((p) => p.id === propertyId);

  const needsAppliance = ["cp12", "boiler_service", "repair", "installation", "warning_notice"].includes(jobType);
  const parsedInvoiceAmount = parseCurrencyInput(invoiceAmount);
  const hasBilling = Boolean(invoiceDesc.trim() && invoiceAmount.trim() && parsedInvoiceAmount > 0);

  const handleClose = () => {
    goBackOrReplace("/(tabs)/jobs");
  };

  const handlePreviousStep = () => {
    setStep((current) => Math.max(0, current - 1));
  };

  const handleSave = async () => {
    if (!customerId || !propertyId) {
      Alert.alert("Missing info", "Please select a customer and property.");
      return;
    }
    setIsSaving(true);
    try {
      const unitPrice = Number.isFinite(parsedInvoiceAmount) ? parsedInvoiceAmount : 0;
      const vatRate = engineer.vatRegistered ? 20 : 0;
      const amountDue = hasBilling ? unitPrice * (1 + vatRate / 100) : 0;
      const job = await addJob({
        customerId,
        propertyId,
        jobType,
        status: jobType === "quote" ? "draft" : hasBilling ? "invoiced" : "completed",
        date,
        engineerName,
        gasSafeNumber,
        companyName,
        appliances: needsAppliance ? [{
          type: applianceType,
          make: applianceMake,
          model: applianceModel,
          serialNumber: applianceSerial,
          location: applianceLocation,
        }] : [],
        safetyChecks: needsAppliance ? {
          gastigtness: "pass",
          workingPressure: workingPressure || "N/A",
          standingPressure: standingPressure || "N/A",
          flueType: flueType || "N/A",
          flueTermination: "Satisfactory",
          fluePull: "satisfactory",
          ventilation: "satisfactory",
          safetyDevices: "satisfactory",
          spillageTest: "not_applicable",
          combustionTest: "pass",
        } : undefined,
        defectsFound,
        remedialWork,
        observations,
        inspectionOutcome: needsAppliance ? outcome : undefined,
        invoiceItems: hasBilling ? [{
          id: Date.now().toString(),
          description: invoiceDesc.trim(),
          quantity: 1,
          unitPrice,
          vatRate,
        }] : [],
        amountDue: hasBilling ? amountDue : undefined,
        dueDate: hasBilling ? dueDate : undefined,
        invoiceNotes: invoiceNotes.trim() || undefined,
        nextServiceDue: ["cp12", "boiler_service"].includes(jobType)
          ? new Date(new Date(date).setFullYear(new Date(date).getFullYear() + 1)).toISOString().slice(0, 10)
          : undefined,
      });
      router.replace({ pathname: "/job/[id]", params: { id: job.id } });
    } catch (e) {
      Alert.alert("Error", "Failed to save job. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Modal header */}
      <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, 16), borderBottomColor: colors.separator }]}>
        <View style={styles.headerActions}>
          <Pressable onPress={handleClose} style={styles.iconBtn} accessibilityLabel="Close new job">
            <Feather name="x" size={22} color={colors.textSecondary} />
          </Pressable>
          {step > 0 ? (
            <Pressable onPress={handlePreviousStep} style={styles.iconBtn} accessibilityLabel="Previous step">
              <Feather name="chevron-left" size={24} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Text
          style={[styles.modalTitle, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          {step === 0 ? "Job Type" : step === 1 ? "Customer & Property" : JOB_TYPE_LABELS[jobType]}
        </Text>
        <View style={styles.headerActions}>
          <View style={styles.headerSpacer} />
          {step < 2 ? (
            <Pressable
              onPress={() => setStep((s) => s + 1)}
              disabled={step === 1 && (!customerId || !propertyId)}
              accessibilityLabel="Next step"
              style={[
                styles.primaryIconBtn,
                { backgroundColor: step === 1 && (!customerId || !propertyId) ? colors.textTertiary : colors.primary },
              ]}
            >
              <Feather name="chevron-right" size={24} color="#fff" />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              accessibilityLabel="Save job"
              style={[styles.primaryIconBtn, { backgroundColor: isSaving ? colors.textTertiary : colors.accent }]}
            >
              <Feather name="check" size={22} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Step 0: Job Type */}
      {step === 0 && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.stepHint, { color: colors.textTertiary }]}>Select the type of job</Text>
          {JOB_TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => { setJobType(type); setStep(1); }}
              style={({ pressed }) => [
                styles.typeOption,
                {
                  backgroundColor: jobType === type ? JOB_TYPE_COLORS[type] + "20" : colors.card,
                  borderColor: jobType === type ? JOB_TYPE_COLORS[type] : colors.cardBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.typeOptionIcon, { backgroundColor: JOB_TYPE_COLORS[type] + "20" }]}>
                <Feather name="clipboard" size={20} color={JOB_TYPE_COLORS[type]} />
              </View>
              <Text style={[styles.typeOptionLabel, { color: colors.text }]}>{JOB_TYPE_LABELS[type]}</Text>
              {jobType === type && <Feather name="check" size={18} color={JOB_TYPE_COLORS[type]} />}
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Step 1: Customer & Property */}
      {step === 1 && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.stepHint, { color: colors.textTertiary }]}>
            {!customerId ? "Tap a customer to select them" : "Now tap a property to continue"}
          </Text>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CUSTOMER</Text>
          {customers.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => { setCustomerId(c.id); setPropertyId(""); }}
              style={({ pressed }) => [
                styles.selectOption,
                {
                  backgroundColor: customerId === c.id ? colors.primary + "15" : colors.card,
                  borderColor: customerId === c.id ? colors.primary : colors.cardBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectOptionText, { color: colors.text }]}>{c.name}</Text>
                <Text style={[styles.selectOptionSub, { color: colors.textTertiary }]}>{c.address}</Text>
              </View>
              {customerId === c.id && <Feather name="check-circle" size={18} color={colors.primary} />}
            </Pressable>
          ))}

          {customerId && availableProperties.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PROPERTY</Text>
              {availableProperties.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => { setPropertyId(p.id); setStep(2); }}
                  style={({ pressed }) => [
                    styles.selectOption,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectOptionText, { color: colors.text }]}>{p.address}</Text>
                    <Text style={[styles.selectOptionSub, { color: colors.textTertiary }]}>{p.postcode}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.primary} />
                </Pressable>
              ))}
            </>
          )}
          {customerId && availableProperties.length === 0 && (
            <Text style={[styles.noProperties, { color: colors.textTertiary }]}>
              No properties for this customer yet. Add one from the customer's profile first.
            </Text>
          )}
        </ScrollView>
      )}

      {/* Step 2: Job Details */}
      {step === 2 && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="interactive"
        >
          {/* Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.summaryRow}>
              <Feather name="user" size={14} color={colors.textTertiary} />
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{selectedCustomer?.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Feather name="map-pin" size={14} color={colors.textTertiary} />
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{selectedProperty?.address}</Text>
            </View>
          </View>

          <FormField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <FormField label="Engineer Name" value={engineerName} onChangeText={setEngineerName} />
          <FormField label="Gas Safe Registration No." value={gasSafeNumber} onChangeText={setGasSafeNumber} />
          <FormField label="Company Name" value={companyName} onChangeText={setCompanyName} />

          {needsAppliance && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPLIANCE</Text>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Appliance Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                <View style={styles.chips}>
                  {APPLIANCE_TYPES.map((t) => (
                    <Pressable
                      key={t.value}
                      onPress={() => setApplianceType(t.value)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: applianceType === t.value ? colors.primary : colors.backgroundSecondary,
                          borderColor: applianceType === t.value ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: applianceType === t.value ? "#fff" : colors.text }]}>
                        {t.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <FormField label="Make" value={applianceMake} onChangeText={setApplianceMake} placeholder="e.g. Worcester Bosch" />
              <FormField label="Model" value={applianceModel} onChangeText={setApplianceModel} placeholder="e.g. Greenstar 30i" />
              <FormField label="Serial Number" value={applianceSerial} onChangeText={setApplianceSerial} />
              <FormField label="Location" value={applianceLocation} onChangeText={setApplianceLocation} placeholder="e.g. Kitchen cupboard" />
              <FormField label="Working Pressure (mbar)" value={workingPressure} onChangeText={setWorkingPressure} placeholder="e.g. 18" />
              <FormField label="Standing Pressure (mbar)" value={standingPressure} onChangeText={setStandingPressure} placeholder="e.g. 20" />
              <FormField label="Flue Type" value={flueType} onChangeText={setFlueType} placeholder="e.g. Room sealed" />

              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>OUTCOME</Text>
              {(["satisfactory", "at_risk", "immediately_dangerous"] as const).map((o) => (
                <Pressable
                  key={o}
                  onPress={() => setOutcome(o)}
                  style={[
                    styles.selectOption,
                    {
                      backgroundColor: outcome === o ? (o === "satisfactory" ? colors.accent : o === "at_risk" ? colors.warning : colors.danger) + "20" : colors.card,
                      borderColor: outcome === o ? (o === "satisfactory" ? colors.accent : o === "at_risk" ? colors.warning : colors.danger) : colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.selectOptionText, { color: colors.text }]}>
                    {o === "satisfactory" ? "Satisfactory" : o === "at_risk" ? "At Risk" : "Immediately Dangerous"}
                  </Text>
                  {outcome === o && <Feather name="check" size={16} color={colors.text} />}
                </Pressable>
              ))}
            </>
          )}

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>NOTES</Text>
          <FormField label="Defects Found" value={defectsFound} onChangeText={setDefectsFound} multiline placeholder="None" style={styles.multilineInput} />
          <FormField label="Remedial Work Carried Out" value={remedialWork} onChangeText={setRemedialWork} multiline placeholder="None required" style={styles.multilineInput} />
          <FormField label="Engineer Observations" value={observations} onChangeText={setObservations} multiline style={styles.multilineInput} />

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {jobType === "quote" ? "QUOTE / BILLING" : "BILLING"}
          </Text>
          <FormField
            label="Charge Description"
            value={invoiceDesc}
            onChangeText={setInvoiceDesc}
            placeholder={jobType === "invoice" ? "e.g. Boiler repair invoice" : "e.g. CP12 Gas Safety Check"}
          />
          <FormField
            label="Amount (£ ex VAT)"
            value={invoiceAmount}
            onChangeText={setInvoiceAmount}
            placeholder="85.00"
            keyboardType="decimal-pad"
          />
          <FormField
            label={jobType === "quote" ? "Valid Until" : "Due Date"}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
          />
          <FormField
            label="Billing Notes"
            value={invoiceNotes}
            onChangeText={setInvoiceNotes}
            multiline
            placeholder="Optional payment or invoice notes"
            style={styles.multilineInput}
          />
          {hasBilling && (
            <Text style={[styles.billingHint, { color: colors.textTertiary }]}>
              This job will be saved as {jobType === "quote" ? "a draft quote" : "unpaid / invoiced"}.
            </Text>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerActions: {
    width: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerSpacer: { flex: 1 },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryIconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { flex: 1, minWidth: 0, fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 100, gap: 4 },
  stepHint: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", marginBottom: spacing.lg },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  typeOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  typeOptionLabel: { flex: 1, fontSize: fontSize.md, fontFamily: "Inter_500Medium" },
  pressed: { opacity: 0.7 },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  selectOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  selectOptionText: { flex: 1, fontSize: fontSize.md, fontFamily: "Inter_500Medium" },
  selectOptionSub: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular" },
  noProperties: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  summaryCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: 6,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  summaryText: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular" },
  fieldLabel: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium", marginBottom: spacing.sm },
  multilineInput: { minHeight: 80, textAlignVertical: "top" },
  chipsScroll: { flexGrow: 0, marginBottom: spacing.md },
  chips: { flexDirection: "row", gap: spacing.sm, paddingVertical: 4 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium" },
  billingHint: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", marginTop: spacing.sm },
});
