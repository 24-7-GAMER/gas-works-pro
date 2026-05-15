import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { getJobAmountDue, parseCurrencyInput } from "@/lib/job-finance";
import { goBackOrReplace } from "@/lib/navigation";

export default function EditBillingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { jobs, updateJob, engineer } = useApp();

  const job = jobs.find((item) => item.id === jobId);
  const firstInvoiceItem = job?.invoiceItems?.[0];

  const [description, setDescription] = useState(firstInvoiceItem?.description ?? "");
  const [amountDue, setAmountDue] = useState(job ? String(getJobAmountDue(job).toFixed(2)) : "");
  const [dueDate, setDueDate] = useState(job?.dueDate ?? "");
  const [notes, setNotes] = useState(job?.invoiceNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const parsedAmount = useMemo(() => parseCurrencyInput(amountDue), [amountDue]);

  if (!job) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>Job not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!amountDue.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Amount required", "Enter a valid amount due.");
      return;
    }

    setIsSaving(true);
    try {
      const invoiceItems =
        job.invoiceItems && job.invoiceItems.length > 1
          ? job.invoiceItems
          : (() => {
              const vatRate = firstInvoiceItem?.vatRate ?? (engineer.vatRegistered ? 20 : 0);
              const unitPrice = parsedAmount / (1 + vatRate / 100);

              return [
                {
                  id: firstInvoiceItem?.id ?? Date.now().toString(),
                  description: description.trim() || "Job charge",
                  quantity: 1,
                  unitPrice,
                  vatRate,
                },
              ];
            })();

      await updateJob(job.id, {
        invoiceItems,
        amountDue: parsedAmount,
        dueDate: dueDate.trim() || undefined,
        invoiceNotes: notes.trim() || undefined,
        status: job.status === "paid" ? "paid" : "invoiced",
      });

      goBackOrReplace({ pathname: "/job/[id]", params: { id: job.id } } as any);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => goBackOrReplace({ pathname: "/job/[id]", params: { id: job.id } } as any)}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Edit Billing</Text>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveBtn, { backgroundColor: isSaving ? colors.textTertiary : colors.primary }]}
        >
          <Text style={styles.saveBtnText}>{isSaving ? "Saving..." : "Save"}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardDismissMode="interactive">
        <FormField
          label="Charge Description"
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Boiler service"
        />
        <FormField
          label="Amount Due (£)"
          value={amountDue}
          onChangeText={setAmountDue}
          placeholder="85.00"
          keyboardType="decimal-pad"
        />
        <FormField
          label="Due Date"
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="YYYY-MM-DD"
        />
        <FormField
          label="Billing Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Optional reminder or payment notes"
          style={styles.multiline}
        />
        {job.invoiceItems && job.invoiceItems.length > 1 ? (
          <Text style={[styles.helperText, { color: colors.textTertiary }]}>
            This job already has multiple invoice lines. Updating amount due here changes the tracked balance due without rewriting those line items.
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: fontSize.lg, fontFamily: "Inter_400Regular" },
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
  multiline: { minHeight: 88, textAlignVertical: "top" },
  helperText: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: spacing.sm },
});
