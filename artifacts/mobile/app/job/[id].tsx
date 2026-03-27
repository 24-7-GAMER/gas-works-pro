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
import Colors from "@/constants/colors";
import { fontSize, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { getJobAmountDue, isJobUnpaid } from "@/lib/job-finance";
import {
  JOB_TYPE_COLORS,
  JOB_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/types";

function InfoRow({ label, value, colors }: { label: string; value?: string; colors: typeof Colors.dark }) {
  if (!value) return null;
  return (
    <View style={rowStyles.row}>
      <Text style={[rowStyles.label, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
  },
  label: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", flex: 1 },
  value: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium", flex: 1.5, textAlign: "right" },
});

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const { getCustomerById, getPropertyById, updateJob, deleteJob, jobs } = useApp();

  const job = jobs.find((j) => j.id === id);
  const customer = job ? getCustomerById(job.customerId) : undefined;
  const property = job ? getPropertyById(job.propertyId) : undefined;

  if (!job) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>Job not found</Text>
      </View>
    );
  }

  const typeColor = JOB_TYPE_COLORS[job.jobType];
  const statusColor = STATUS_COLORS[job.status];
  const totalExVat = job.invoiceItems?.reduce((s, i) => s + i.quantity * i.unitPrice, 0) ?? 0;
  const totalVat = job.invoiceItems?.reduce((s, i) => s + i.quantity * i.unitPrice * (i.vatRate / 100), 0) ?? 0;
  const totalInc = totalExVat + totalVat;
  const amountDue = getJobAmountDue(job);
  const unpaid = isJobUnpaid(job);

  const handleMarkPaid = () => {
    Alert.alert("Mark as Paid", "Mark this job as paid?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Paid",
        onPress: () => updateJob(job.id, { status: "paid", paidAt: new Date().toISOString() }),
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Delete Job", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteJob(job.id);
          router.back();
        },
      },
    ]);
  };

  const handleViewCertificate = () => {
    router.push({ pathname: "/certificate", params: { jobId: job.id } });
  };

  const openPhone = async () => {
    if (!customer?.phone) return;
    const url = `tel:${customer.phone.replace(/\s+/g, "")}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const openEmail = async () => {
    if (!customer?.email) return;
    const url = `mailto:${customer.email}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const sendReminder = async () => {
    if (!customer?.email) {
      Alert.alert("No email address", "This customer has no email saved.");
      return;
    }

    const formattedDueDate = job.dueDate
      ? new Date(job.dueDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "on receipt";
    const subject = `Payment reminder - ${job.jobNumber}`;
    const body = `Dear ${customer.name},

This is a friendly reminder that payment is still outstanding for job ${job.jobNumber}.

Amount due: £${amountDue.toFixed(2)}
Due date: ${formattedDueDate}
Property: ${property?.address ?? ""}

Please let us know if you have any queries.

Kind regards,
${job.engineerName}
${job.companyName}`;

    const url = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    await Linking.openURL(url);
    await updateJob(job.id, {
      lastReminderAt: new Date().toISOString(),
      reminderCount: (job.reminderCount ?? 0) + 1,
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.typeIcon, { backgroundColor: typeColor + "20" }]}>
          <Feather name="clipboard" size={28} color={typeColor} />
        </View>
        <Text style={[styles.jobType, { color: colors.text }]}>{JOB_TYPE_LABELS[job.jobType]}</Text>
        <Text style={[styles.jobNumber, { color: colors.textTertiary }]}>{job.jobNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[job.status]}</Text>
        </View>
        {amountDue > 0 && (
          <View style={[styles.amountBadge, { backgroundColor: unpaid ? colors.warning + "20" : colors.accent + "20" }]}>
            <Text style={[styles.amountBadgeText, { color: unpaid ? colors.warning : colors.accent }]}>
              {unpaid ? `Unpaid: £${amountDue.toFixed(2)}` : `Paid: £${amountDue.toFixed(2)}`}
            </Text>
          </View>
        )}
      </View>

      {(customer?.phone || customer?.email) && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textTertiary }]}>CONTACT</Text>
          {customer?.phone && (
            <Pressable onPress={openPhone} style={styles.contactRow}>
              <Feather name="phone" size={16} color={colors.accent} />
              <Text style={[styles.contactText, { color: colors.text }]}>{customer.phone}</Text>
            </Pressable>
          )}
          {customer?.email && (
            <Pressable onPress={openEmail} style={styles.contactRow}>
              <Feather name="mail" size={16} color={colors.info} />
              <Text style={[styles.contactText, { color: colors.text }]}>{customer.email}</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.textTertiary }]}>JOB DETAILS</Text>
        <InfoRow label="Date" value={new Date(job.date).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} colors={colors} />
        <InfoRow label="Customer" value={customer?.name} colors={colors} />
        <InfoRow label="Property" value={property?.address} colors={colors} />
        <InfoRow label="Postcode" value={property?.postcode} colors={colors} />
        <InfoRow label="Engineer" value={job.engineerName} colors={colors} />
        <InfoRow label="Gas Safe No." value={job.gasSafeNumber} colors={colors} />
        <InfoRow label="Company" value={job.companyName} colors={colors} />
        {job.nextServiceDue && <InfoRow label="Next Service Due" value={new Date(job.nextServiceDue).toLocaleDateString("en-GB")} colors={colors} />}
      </View>

      {job.appliances.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textTertiary }]}>APPLIANCES</Text>
          {job.appliances.map((appliance, i) => (
            <View key={i}>
              {i > 0 && <View style={[styles.separator, { backgroundColor: colors.separator }]} />}
              <InfoRow label="Type" value={appliance.type.replace("_", " ")} colors={colors} />
              <InfoRow label="Make" value={appliance.make} colors={colors} />
              <InfoRow label="Model" value={appliance.model} colors={colors} />
              <InfoRow label="Serial No." value={appliance.serialNumber} colors={colors} />
              <InfoRow label="Location" value={appliance.location} colors={colors} />
              {appliance.gcNumber && <InfoRow label="GC No." value={appliance.gcNumber} colors={colors} />}
            </View>
          ))}
        </View>
      )}

      {job.safetyChecks && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textTertiary }]}>SAFETY CHECKS</Text>
          <InfoRow label="Gas Tightness" value={job.safetyChecks.gastigtness.toUpperCase()} colors={colors} />
          <InfoRow label="Working Pressure" value={job.safetyChecks.workingPressure} colors={colors} />
          <InfoRow label="Standing Pressure" value={job.safetyChecks.standingPressure} colors={colors} />
          <InfoRow label="Flue Type" value={job.safetyChecks.flueType} colors={colors} />
          <InfoRow label="Flue Termination" value={job.safetyChecks.flueTermination} colors={colors} />
          <InfoRow label="Flue Pull Test" value={job.safetyChecks.fluePull} colors={colors} />
          <InfoRow label="Ventilation" value={job.safetyChecks.ventilation} colors={colors} />
          <InfoRow label="Safety Devices" value={job.safetyChecks.safetyDevices} colors={colors} />
          <InfoRow label="Spillage Test" value={job.safetyChecks.spillageTest} colors={colors} />
          <InfoRow label="Combustion Test" value={job.safetyChecks.combustionTest} colors={colors} />
          {job.safetyChecks.co2Percentage && <InfoRow label="CO2 %" value={job.safetyChecks.co2Percentage} colors={colors} />}
        </View>
      )}

      {(job.inspectionOutcome || job.defectsFound || job.remedialWork || job.observations) && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textTertiary }]}>INSPECTION OUTCOME</Text>
          {job.inspectionOutcome && (
            <View
              style={[
                styles.outcomeBadge,
                {
                  backgroundColor:
                    job.inspectionOutcome === "satisfactory" ? colors.accent + "20" :
                    job.inspectionOutcome === "at_risk" ? colors.warning + "20" :
                    colors.danger + "20",
                },
              ]}
            >
              <Feather
                name={job.inspectionOutcome === "satisfactory" ? "check-circle" : "alert-triangle"}
                size={16}
                color={
                  job.inspectionOutcome === "satisfactory" ? colors.accent :
                  job.inspectionOutcome === "at_risk" ? colors.warning :
                  colors.danger
                }
              />
              <Text
                style={[
                  styles.outcomeText,
                  {
                    color:
                      job.inspectionOutcome === "satisfactory" ? colors.accent :
                      job.inspectionOutcome === "at_risk" ? colors.warning :
                      colors.danger,
                  },
                ]}
              >
                {job.inspectionOutcome === "satisfactory" ? "Satisfactory" :
                 job.inspectionOutcome === "at_risk" ? "At Risk" :
                 "Immediately Dangerous"}
              </Text>
            </View>
          )}
          {job.defectsFound && (
            <View style={styles.textBlock}>
              <Text style={[styles.textBlockLabel, { color: colors.textTertiary }]}>Defects Found</Text>
              <Text style={[styles.textBlockValue, { color: colors.text }]}>{job.defectsFound}</Text>
            </View>
          )}
          {job.remedialWork && (
            <View style={styles.textBlock}>
              <Text style={[styles.textBlockLabel, { color: colors.textTertiary }]}>Remedial Work</Text>
              <Text style={[styles.textBlockValue, { color: colors.text }]}>{job.remedialWork}</Text>
            </View>
          )}
          {job.observations && (
            <View style={styles.textBlock}>
              <Text style={[styles.textBlockLabel, { color: colors.textTertiary }]}>Engineer Notes</Text>
              <Text style={[styles.textBlockValue, { color: colors.text }]}>{job.observations}</Text>
            </View>
          )}
        </View>
      )}

      {(job.invoiceItems?.length ?? 0) > 0 || amountDue > 0 ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textTertiary }]}>BILLING</Text>
          {(job.invoiceItems ?? []).map((item) => (
            <View key={item.id} style={styles.invoiceItem}>
              <Text style={[styles.invoiceItemDesc, { color: colors.text }]}>{item.description}</Text>
              <View style={styles.invoiceItemRow}>
                <Text style={[styles.invoiceItemQty, { color: colors.textTertiary }]}>
                  {item.quantity} x £{item.unitPrice.toFixed(2)} + {item.vatRate}% VAT
                </Text>
                <Text style={[styles.invoiceItemTotal, { color: colors.text }]}>
                  £{(item.quantity * item.unitPrice * (1 + item.vatRate / 100)).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
          <View style={[styles.invoiceTotals, { borderTopColor: colors.separator }]}>
            {!!totalInc && (
              <>
                <View style={styles.invoiceTotalRow}>
                  <Text style={[styles.invoiceTotalLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                  <Text style={[styles.invoiceTotalValue, { color: colors.text }]}>£{totalExVat.toFixed(2)}</Text>
                </View>
                <View style={styles.invoiceTotalRow}>
                  <Text style={[styles.invoiceTotalLabel, { color: colors.textSecondary }]}>VAT</Text>
                  <Text style={[styles.invoiceTotalValue, { color: colors.text }]}>£{totalVat.toFixed(2)}</Text>
                </View>
              </>
            )}
            {job.dueDate && (
              <View style={styles.invoiceTotalRow}>
                <Text style={[styles.invoiceTotalLabel, { color: colors.textSecondary }]}>Due Date</Text>
                <Text style={[styles.invoiceTotalValue, { color: colors.text }]}>
                  {new Date(job.dueDate).toLocaleDateString("en-GB")}
                </Text>
              </View>
            )}
            <View style={[styles.invoiceTotalRow, styles.invoiceTotalGrand]}>
              <Text style={[styles.invoiceGrandLabel, { color: colors.text }]}>Amount Due</Text>
              <Text style={[styles.invoiceGrandValue, { color: unpaid ? colors.warning : colors.primary }]}>
                £{amountDue.toFixed(2)}
              </Text>
            </View>
          </View>
          {job.lastReminderAt && (
            <Text style={[styles.reminderText, { color: colors.textTertiary }]}>
              Reminder sent {new Date(job.lastReminderAt).toLocaleDateString("en-GB")} ({job.reminderCount ?? 1} total)
            </Text>
          )}
          {job.paidAt && (
            <View style={[styles.paidBadge, { backgroundColor: colors.accent + "20" }]}>
              <Feather name="check-circle" size={14} color={colors.accent} />
              <Text style={[styles.paidText, { color: colors.accent }]}>
                Paid {new Date(job.paidAt).toLocaleDateString("en-GB")}
              </Text>
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={handleViewCertificate} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
          <Feather name="eye" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>View Certificate</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(`/edit-billing?jobId=${job.id}` as any)}
          style={[styles.actionBtn, { backgroundColor: colors.info }]}
        >
          <Feather name="edit-3" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Edit Billing</Text>
        </Pressable>

        {unpaid && customer?.email && (
          <Pressable onPress={sendReminder} style={[styles.actionBtn, { backgroundColor: colors.warning }]}>
            <Feather name="send" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Send Reminder</Text>
          </Pressable>
        )}

        {(job.status === "completed" || job.status === "invoiced") && (
          <Pressable onPress={handleMarkPaid} style={[styles.actionBtn, { backgroundColor: colors.accent }]}>
            <Feather name="check-circle" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Mark as Paid</Text>
          </Pressable>
        )}

        <Pressable onPress={handleDelete} style={[styles.actionBtnOutline, { borderColor: colors.danger + "60" }]}>
          <Feather name="trash-2" size={16} color={colors.danger} />
          <Text style={[styles.actionBtnOutlineText, { color: colors.danger }]}>Delete Job</Text>
        </Pressable>
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
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  jobType: { fontSize: fontSize.xxl, fontFamily: "Inter_700Bold" },
  jobNumber: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular" },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  statusText: { fontSize: fontSize.xs, fontFamily: "Inter_600SemiBold" },
  amountBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  amountBadgeText: { fontSize: fontSize.sm, fontFamily: "Inter_700Bold" },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  contactText: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium" },
  separator: { height: 1, marginVertical: spacing.sm },
  outcomeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  outcomeText: { fontSize: fontSize.md, fontFamily: "Inter_700Bold" },
  textBlock: { marginTop: spacing.md },
  textBlockLabel: { fontSize: fontSize.xs, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginBottom: 4 },
  textBlockValue: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", lineHeight: 20 },
  invoiceItem: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#33415540" },
  invoiceItemDesc: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium", marginBottom: 2 },
  invoiceItemRow: { flexDirection: "row", justifyContent: "space-between" },
  invoiceItemQty: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular" },
  invoiceItemTotal: { fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  invoiceTotals: { borderTopWidth: 1, paddingTop: spacing.md, marginTop: spacing.sm, gap: spacing.sm },
  invoiceTotalRow: { flexDirection: "row", justifyContent: "space-between" },
  invoiceTotalLabel: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular" },
  invoiceTotalValue: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium" },
  invoiceTotalGrand: { paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#33415540" },
  invoiceGrandLabel: { fontSize: fontSize.lg, fontFamily: "Inter_700Bold" },
  invoiceGrandValue: { fontSize: fontSize.xl, fontFamily: "Inter_700Bold" },
  reminderText: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular", marginTop: spacing.sm },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  paidText: { fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  actionBtnText: { fontSize: fontSize.md, fontFamily: "Inter_600SemiBold", color: "#fff" },
  actionBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  actionBtnOutlineText: { fontSize: fontSize.md, fontFamily: "Inter_600SemiBold" },
});
