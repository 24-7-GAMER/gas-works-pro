import { Feather } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { COMPANY_BRAND } from "@/constants/company-brand";
import { COMPANY_LOGO_DATA_URI } from "@/constants/company-logo-base64";
import Colors from "@/constants/colors";
import { fontSize, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { openWhatsAppMessage } from "@/lib/whatsapp";
import { JOB_TYPE_LABELS, type JobType } from "@/types";

function formatCurrency(value: number) {
  return `Â£${value.toFixed(2)}`;
}

function escapeHtml(value?: string | null) {
  return (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMultiline(value?: string | null) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function getJobTypeLabel(jobType: unknown) {
  if (typeof jobType === "string" && jobType in JOB_TYPE_LABELS) {
    return JOB_TYPE_LABELS[jobType as JobType];
  }

  return "Job";
}

function buildHtml(params: {
  job: any;
  customer: any;
  property: any;
  engineer: any;
  formattedDate: string;
  totalExVat: number;
  totalVat: number;
  totalInc: number;
}) {
  const { job, customer, property, engineer, formattedDate, totalExVat, totalVat, totalInc } = params;
  const isCP12 = job.jobType === "cp12";
  const isService = job.jobType === "boiler_service";
  const isInvoice = ["invoice", "quote"].includes(job.jobType);
  const isQuote = job.jobType === "quote";
  const docTitle = isCP12
    ? "Landlord Gas Safety Record (CP12)"
    : isService
    ? "Gas Appliance Service Record"
    : isQuote
    ? "Quotation"
    : isInvoice
    ? "Invoice"
    : getJobTypeLabel(job.jobType);

  const invoiceCompanyName =
    engineer.companyName && engineer.companyName !== "Morrison Gas Services"
      ? engineer.companyName
      : COMPANY_BRAND.companyName;
  const invoiceCompanyNumber =
    engineer.companyNumber ?? COMPANY_BRAND.companyNumber;
  const invoiceIssueDate = formattedDate;
  const invoiceDueDate = job.dueDate
    ? new Date(job.dueDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : invoiceIssueDate;
  const invoiceStatus = isQuote
    ? "Quote"
    : job.status === "paid"
    ? "Paid"
    : "Payment Due";

  if (isInvoice && job.invoiceItems?.length) {
    const money = (value: number) => `£${value.toFixed(2)}`;
    const invoiceItemsHtml = job.invoiceItems
      .map((item: any, index: number) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const lineVat = lineSubtotal * (item.vatRate / 100);
        const lineTotal = lineSubtotal + lineVat;

        return `<tr>
          <td class="col-index">${index + 1}</td>
          <td class="col-description">
            <div class="item-title">${escapeHtml(item.description)}</div>
            <div class="item-subtitle">${escapeHtml(getJobTypeLabel(job.jobType))} for ${escapeHtml(customer?.name ?? "Customer")}</div>
          </td>
          <td class="col-qty">${escapeHtml(String(item.quantity))}</td>
          <td class="col-money">${money(item.unitPrice)}</td>
          <td class="col-money">${item.vatRate}%</td>
          <td class="col-money amount-strong">${money(lineTotal)}</td>
        </tr>`;
      })
      .join("");

    const invoiceNotesHtml = job.invoiceNotes
      ? formatMultiline(job.invoiceNotes)
      : job.quoteNotes
      ? formatMultiline(job.quoteNotes)
      : job.observations
      ? formatMultiline(job.observations)
      : "Thank you for your business.";

    const paymentTerms = isQuote
      ? "This quotation is valid for 30 days from the issue date unless otherwise agreed in writing."
      : job.dueDate
      ? `Payment due by ${escapeHtml(invoiceDueDate)}. Please use ${escapeHtml(job.jobNumber)} as the payment reference.`
      : `Payment due on receipt. Please use ${escapeHtml(job.jobNumber)} as the payment reference.`;

    const invoiceStatusClass = isQuote
      ? "status-quote"
      : job.status === "paid"
      ? "status-paid"
      : "status-due";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 100%;
    }
    .accent-bar {
      height: 6px;
      background: linear-gradient(90deg, #0f172a 0%, #1e293b 55%, #f97316 100%);
      border-radius: 999px;
      margin-bottom: 18px;
    }
    .masthead {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
    .masthead td {
      vertical-align: top;
    }
    .brand-cell {
      width: 58%;
      padding-right: 14px;
    }
    .invoice-cell {
      width: 42%;
      text-align: right;
    }
    .brand-wrap {
      width: 100%;
      border: 1px solid #dbe3ee;
      border-radius: 16px;
      background: #f8fafc;
      padding: 16px;
    }
    .brand-table {
      width: 100%;
      border-collapse: collapse;
    }
    .brand-table td {
      vertical-align: middle;
    }
    .logo-cell {
      width: 74px;
      padding-right: 14px;
    }
    .logo-shell {
      width: 60px;
      height: 60px;
      border-radius: 14px;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      padding: 8px;
    }
    .logo-shell img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .company-name {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0f172a;
      margin: 0 0 6px;
    }
    .company-meta {
      font-size: 12px;
      line-height: 1.55;
      color: #475569;
    }
    .company-meta strong {
      color: #0f172a;
    }
    .document-title {
      font-size: 30px;
      font-weight: 800;
      letter-spacing: 0.18em;
      color: #0f172a;
      margin: 0 0 10px;
      text-transform: uppercase;
    }
    .status-pill {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .status-paid {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }
    .status-due {
      background: #ffedd5;
      color: #c2410c;
      border: 1px solid #fdba74;
    }
    .status-quote {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }
    .doc-meta {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border: 1px solid #dbe3ee;
      border-radius: 16px;
      overflow: hidden;
    }
    .doc-meta td {
      padding: 9px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }
    .doc-meta tr:last-child td {
      border-bottom: none;
    }
    .doc-meta-label {
      width: 44%;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 10px;
      font-weight: 700;
    }
    .doc-meta-value {
      width: 56%;
      text-align: right;
      font-weight: 700;
      color: #0f172a;
    }
    .detail-grid {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 12px;
      margin-bottom: 8px;
    }
    .detail-grid td {
      width: 50%;
      vertical-align: top;
    }
    .detail-left {
      padding-right: 8px;
    }
    .detail-right {
      padding-left: 8px;
    }
    .detail-card {
      border: 1px solid #dbe3ee;
      border-radius: 16px;
      padding: 16px;
      min-height: 128px;
      background: #ffffff;
    }
    .detail-label {
      margin: 0 0 8px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 10px;
      font-weight: 700;
    }
    .detail-title {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    .detail-text {
      font-size: 12px;
      line-height: 1.6;
      color: #334155;
    }
    .detail-text strong {
      color: #0f172a;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      overflow: hidden;
    }
    .items-table thead th {
      background: #eff6ff;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 10px;
      padding: 11px 12px;
      text-align: left;
      border-bottom: 1px solid #cbd5e1;
    }
    .items-table tbody td {
      padding: 12px;
      font-size: 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .items-table tbody tr:last-child td {
      border-bottom: none;
    }
    .items-table tbody tr:nth-child(even) td {
      background: #f8fafc;
    }
    .col-index {
      width: 36px;
      text-align: center;
      color: #64748b;
    }
    .col-description {
      width: auto;
    }
    .col-qty {
      width: 58px;
      text-align: center;
      white-space: nowrap;
    }
    .col-money {
      width: 92px;
      text-align: right;
      white-space: nowrap;
    }
    .item-title {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .item-subtitle {
      font-size: 11px;
      color: #64748b;
      line-height: 1.45;
    }
    .amount-strong {
      font-weight: 700;
    }
    .after-items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .after-items td {
      vertical-align: top;
    }
    .notes-cell {
      width: 57%;
      padding-right: 14px;
    }
    .totals-cell {
      width: 43%;
      padding-left: 14px;
    }
    .notes-card,
    .totals-card {
      border: 1px solid #dbe3ee;
      border-radius: 16px;
      overflow: hidden;
      background: #ffffff;
    }
    .card-head {
      padding: 10px 14px;
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .card-body {
      padding: 14px;
      font-size: 12px;
      line-height: 1.65;
      color: #334155;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 11px 14px;
      font-size: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .totals-table tr:last-child td {
      border-bottom: none;
    }
    .totals-table .label {
      color: #475569;
    }
    .totals-table .value {
      text-align: right;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
    }
    .totals-table .grand td {
      background: #fff7ed;
      color: #9a3412;
      font-size: 15px;
      font-weight: 800;
    }
    .totals-table .grand .value {
      color: #c2410c;
    }
    .footer {
      margin-top: 8px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      font-size: 11px;
      line-height: 1.6;
      color: #64748b;
      text-align: center;
    }
    .footer strong {
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="accent-bar"></div>

    <table class="masthead">
      <tr>
        <td class="brand-cell">
          <div class="brand-wrap">
            <table class="brand-table">
              <tr>
                <td class="logo-cell">
                  <div class="logo-shell">
                    <img src="${COMPANY_LOGO_DATA_URI}" alt="${escapeHtml(invoiceCompanyName)} logo">
                  </div>
                </td>
                <td>
                  <div class="company-name">${escapeHtml(invoiceCompanyName)}</div>
                  <div class="company-meta">
                    <strong>Company No:</strong> ${escapeHtml(invoiceCompanyNumber)}<br>
                    ${engineer.vatRegistered && engineer.vatNumber ? `<strong>VAT No:</strong> ${escapeHtml(engineer.vatNumber)}<br>` : ""}
                    ${engineer.email ? `<strong>Email:</strong> ${escapeHtml(engineer.email)}<br>` : ""}
                    ${engineer.phone ? `<strong>Tel:</strong> ${escapeHtml(engineer.phone)}` : ""}
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </td>
        <td class="invoice-cell">
          <div class="document-title">${isQuote ? "Quote" : "Invoice"}</div>
          <div class="status-pill ${invoiceStatusClass}">${escapeHtml(invoiceStatus)}</div>
          <table class="doc-meta">
            <tr>
              <td class="doc-meta-label">${isQuote ? "Quote Number" : "Invoice Number"}</td>
              <td class="doc-meta-value">${escapeHtml(job.jobNumber)}</td>
            </tr>
            <tr>
              <td class="doc-meta-label">${isQuote ? "Quote Date" : "Issue Date"}</td>
              <td class="doc-meta-value">${escapeHtml(invoiceIssueDate)}</td>
            </tr>
            <tr>
              <td class="doc-meta-label">${isQuote ? "Valid Until" : "Due Date"}</td>
              <td class="doc-meta-value">${escapeHtml(invoiceDueDate)}</td>
            </tr>
            <tr>
              <td class="doc-meta-label">Reference</td>
              <td class="doc-meta-value">${escapeHtml(job.id)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table class="detail-grid">
      <tr>
        <td class="detail-left">
          <div class="detail-card">
            <div class="detail-label">Bill To</div>
            <div class="detail-title">${escapeHtml(customer?.name ?? "Customer")}</div>
            <div class="detail-text">
              ${customer?.address ? `${formatMultiline(customer.address)}<br>` : ""}
              ${customer?.email ? `${escapeHtml(customer.email)}<br>` : ""}
              ${customer?.phone ? `${escapeHtml(customer.phone)}` : ""}
            </div>
          </div>
        </td>
        <td class="detail-right">
          <div class="detail-card">
            <div class="detail-label">Service Details</div>
            <div class="detail-title">${escapeHtml(getJobTypeLabel(job.jobType))}</div>
            <div class="detail-text">
              <strong>Service Address:</strong><br>
              ${formatMultiline(property?.address ?? customer?.address ?? "Not provided")}
              ${property?.postcode ? `<br>${escapeHtml(property.postcode)}` : ""}
              <br><br>
              <strong>Engineer:</strong> ${escapeHtml(job.engineerName || engineer.name || invoiceCompanyName)}<br>
              <strong>Visit Date:</strong> ${escapeHtml(formattedDate)}
            </div>
          </div>
        </td>
      </tr>
    </table>

    <table class="items-table">
      <thead>
        <tr>
          <th class="col-index">#</th>
          <th>Description</th>
          <th class="col-qty">Qty</th>
          <th class="col-money">Unit Price</th>
          <th class="col-money">VAT</th>
          <th class="col-money">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoiceItemsHtml}
      </tbody>
    </table>

    <table class="after-items">
      <tr>
        <td class="notes-cell">
          <div class="notes-card">
            <div class="card-head">${isQuote ? "Quotation Notes" : "Payment & Notes"}</div>
            <div class="card-body">
              <strong>${isQuote ? "Terms:" : "Payment Terms:"}</strong> ${paymentTerms}<br><br>
              <strong>${isQuote ? "Notes:" : "Additional Notes:"}</strong><br>
              ${invoiceNotesHtml}
            </div>
          </div>
        </td>
        <td class="totals-cell">
          <div class="totals-card">
            <div class="card-head">${isQuote ? "Quote Summary" : "Invoice Summary"}</div>
            <table class="totals-table">
              <tr>
                <td class="label">Net</td>
                <td class="value">${money(totalExVat)}</td>
              </tr>
              <tr>
                <td class="label">VAT</td>
                <td class="value">${money(totalVat)}</td>
              </tr>
              <tr class="grand">
                <td>${isQuote ? "Total" : "Amount Due"}</td>
                <td class="value">${money(totalInc)}</td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    </table>

    <div class="footer">
      <strong>${escapeHtml(invoiceCompanyName)}</strong>
      ${engineer.email ? ` | ${escapeHtml(engineer.email)}` : ""}
      ${engineer.phone ? ` | ${escapeHtml(engineer.phone)}` : ""}
      | Company No: ${escapeHtml(invoiceCompanyNumber)}
      ${engineer.vatRegistered && engineer.vatNumber ? ` | VAT No: ${escapeHtml(engineer.vatNumber)}` : ""}
    </div>
  </div>
</body>
</html>`;
  }

  const outcomeColor =
    job.inspectionOutcome === "satisfactory"
      ? "#16A34A"
      : job.inspectionOutcome === "at_risk"
      ? "#CA8A04"
      : "#DC2626";
  const outcomeBg =
    job.inspectionOutcome === "satisfactory"
      ? "#DCFCE7"
      : job.inspectionOutcome === "at_risk"
      ? "#FEF9C3"
      : "#FEE2E2";
  const outcomeLabel =
    job.inspectionOutcome === "satisfactory"
      ? "SATISFACTORY"
      : job.inspectionOutcome === "at_risk"
      ? "AT RISK"
      : "IMMEDIATELY DANGEROUS";

  const nextServiceDate = job.nextServiceDue
    ? new Date(job.nextServiceDue).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  const safetyRows = job.safetyChecks
    ? [
        ["Gas Tightness Test", job.safetyChecks.gastigtness === "pass" ? "âœ“ PASS" : "âœ— FAIL", job.safetyChecks.gastigtness === "pass" ? "#16A34A" : "#DC2626"],
        ["Working Pressure", job.safetyChecks.workingPressure, "#0F172A"],
        ["Standing Pressure", job.safetyChecks.standingPressure, "#0F172A"],
        ["Flue Type", job.safetyChecks.flueType, "#0F172A"],
        ["Flue Termination", job.safetyChecks.flueTermination, "#0F172A"],
        ["Flue Pull / Draw", job.safetyChecks.fluePull === "satisfactory" ? "âœ“ Satisfactory" : job.safetyChecks.fluePull, job.safetyChecks.fluePull === "satisfactory" ? "#16A34A" : "#DC2626"],
        ["Ventilation", job.safetyChecks.ventilation === "satisfactory" ? "âœ“ Satisfactory" : job.safetyChecks.ventilation, job.safetyChecks.ventilation === "satisfactory" ? "#16A34A" : "#DC2626"],
        ["Safety Devices", job.safetyChecks.safetyDevices === "satisfactory" ? "âœ“ Satisfactory" : job.safetyChecks.safetyDevices, job.safetyChecks.safetyDevices === "satisfactory" ? "#16A34A" : "#DC2626"],
        ["Spillage Test", job.safetyChecks.spillageTest === "pass" ? "âœ“ PASS" : job.safetyChecks.spillageTest === "not_applicable" ? "N/A" : "âœ— FAIL", job.safetyChecks.spillageTest === "pass" ? "#16A34A" : "#0F172A"],
        ["Combustion Test", job.safetyChecks.combustionTest === "pass" ? "âœ“ PASS" : "âœ— FAIL", job.safetyChecks.combustionTest === "pass" ? "#16A34A" : "#DC2626"],
      ]
    : [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      color: #0F172A;
      background: #fff;
      padding: 0;
    }
    .page {
      max-width: 794px;
      margin: 0 auto;
      padding: 32px 40px 40px;
    }

    /* â”€â”€â”€ HEADER â”€â”€â”€ */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #F97316;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .header-logo-wrap {
      width: 58px;
      height: 58px;
      border-radius: 14px;
      background: #FFF7ED;
      border: 1px solid #FDBA74;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .header-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .company-name {
      font-size: 22pt;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.5px;
    }
    .company-tagline {
      font-size: 9pt;
      color: #64748B;
      margin-top: 2px;
    }
    .gas-safe-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #FFF7ED;
      border: 1.5px solid #F97316;
      border-radius: 8px;
      padding: 8px 14px;
    }
    .gas-safe-badge-icon {
      font-size: 18pt;
      color: #F97316;
    }
    .gas-safe-badge-text { font-size: 9pt; }
    .gas-safe-badge-reg { font-weight: 700; color: #F97316; font-size: 11pt; }

    /* â”€â”€â”€ ADDRESS BLOCK â”€â”€â”€ */
    .address-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 28px;
      gap: 20px;
    }
    .address-from {
      flex: 1;
    }
    .address-to {
      flex: 1;
      background: #F8FAFC;
      border-left: 3px solid #E2E8F0;
      padding: 12px 16px;
      border-radius: 0 6px 6px 0;
    }
    .address-label {
      font-size: 8pt;
      font-weight: 700;
      color: #94A3B8;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .address-text {
      font-size: 10.5pt;
      color: #0F172A;
      line-height: 1.6;
    }
    .address-text strong { font-weight: 700; }

    /* â”€â”€â”€ GREETING â”€â”€â”€ */
    .greeting {
      margin-bottom: 24px;
    }
    .greeting h1 {
      font-size: 20pt;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.2;
    }
    .greeting h1 span { color: #F97316; }
    .greeting-meta {
      margin-top: 12px;
      font-size: 10pt;
      color: #475569;
      line-height: 1.8;
    }
    .greeting-meta strong { color: #0F172A; font-weight: 600; }

    /* â”€â”€â”€ SUMMARY BOX â”€â”€â”€ */
    .summary-box {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      border-radius: 10px;
      padding: 0;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .summary-box-header {
      background: #F97316;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .summary-box-header-title {
      font-size: 11pt;
      font-weight: 700;
      color: #fff;
    }
    .summary-box-body { padding: 16px 18px; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      color: #CBD5E1;
      font-size: 10pt;
    }
    .summary-row:last-child { border-bottom: none; }
    .summary-row.total {
      border-top: 1px solid rgba(255,255,255,0.2);
      margin-top: 4px;
      padding-top: 12px;
      color: #fff;
      font-weight: 700;
      font-size: 12pt;
    }
    .summary-row .amount { font-weight: 600; }
    .summary-row.total .amount { color: #F97316; font-size: 14pt; }

    /* â”€â”€â”€ OUTCOME BOX â”€â”€â”€ */
    .outcome-box {
      background: ${outcomeBg};
      border: 2px solid ${outcomeColor};
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .outcome-badge {
      background: ${outcomeColor};
      color: #fff;
      font-size: 10pt;
      font-weight: 800;
      letter-spacing: 1px;
      padding: 6px 14px;
      border-radius: 20px;
      white-space: nowrap;
    }
    .outcome-label {
      font-size: 10pt;
      color: ${outcomeColor};
      font-weight: 600;
    }

    /* â”€â”€â”€ PAYMENT BOX â”€â”€â”€ */
    .payment-box {
      background: #F0FDF4;
      border: 2px solid #16A34A;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .payment-box-header {
      background: #16A34A;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .payment-box-header-title {
      font-size: 11pt;
      font-weight: 700;
      color: #fff;
    }
    .payment-box-body { padding: 14px 18px; }
    .payment-due {
      font-size: 13pt;
      font-weight: 700;
      color: #0F172A;
    }
    .payment-due span { color: #16A34A; }
    .payment-note {
      font-size: 9.5pt;
      color: #475569;
      margin-top: 4px;
    }

    /* â”€â”€â”€ NEXT SERVICE BOX â”€â”€â”€ */
    .next-service-box {
      background: #FFF7ED;
      border: 1.5px solid #F97316;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .next-service-label {
      font-size: 10pt;
      color: #92400E;
      font-weight: 600;
    }
    .next-service-date {
      font-size: 12pt;
      font-weight: 800;
      color: #F97316;
    }

    /* â”€â”€â”€ SECTION â”€â”€â”€ */
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 9pt;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }

    /* â”€â”€â”€ GRID â”€â”€â”€ */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 20px;
    }
    .grid-item { padding: 4px 0; }
    .grid-label {
      font-size: 8.5pt;
      color: #94A3B8;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .grid-value {
      font-size: 10.5pt;
      color: #0F172A;
      font-weight: 500;
      margin-top: 1px;
    }

    /* â”€â”€â”€ SAFETY CHECKS TABLE â”€â”€â”€ */
    .checks-table { width: 100%; border-collapse: collapse; }
    .checks-table tr:nth-child(even) td { background: #F8FAFC; }
    .checks-table td {
      padding: 7px 10px;
      font-size: 10pt;
      border-bottom: 1px solid #F1F5F9;
    }
    .checks-table td:first-child { color: #475569; width: 55%; }
    .checks-table td:last-child { font-weight: 600; text-align: right; }

    /* â”€â”€â”€ INVOICE TABLE â”€â”€â”€ */
    .invoice-table { width: 100%; border-collapse: collapse; }
    .invoice-table th {
      text-align: left;
      font-size: 8.5pt;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding: 8px 10px;
      background: #F8FAFC;
      border-bottom: 2px solid #E2E8F0;
    }
    .invoice-table th:last-child { text-align: right; }
    .invoice-table td {
      padding: 9px 10px;
      font-size: 10.5pt;
      border-bottom: 1px solid #F1F5F9;
      color: #0F172A;
    }
    .invoice-table td:not(:first-child) { text-align: right; color: #475569; white-space: nowrap; }
    .invoice-table td:first-child { font-weight: 500; }
    .invoice-totals {
      margin-left: auto;
      margin-top: 8px;
      width: 260px;
    }
    .invoice-total-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 10px;
      font-size: 10pt;
      color: #475569;
    }
    .invoice-total-row.grand {
      background: #0F172A;
      color: #fff;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13pt;
      padding: 10px 14px;
      margin-top: 6px;
    }
    .invoice-total-row.grand span:last-child { color: #F97316; }

    /* â”€â”€â”€ NOTES BOX â”€â”€â”€ */
    .notes-box {
      background: #F8FAFC;
      border-radius: 6px;
      padding: 12px 14px;
      font-size: 10pt;
      color: #334155;
      line-height: 1.6;
    }

    /* â”€â”€â”€ FOOTER â”€â”€â”€ */
    .footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 16px;
      margin-top: 28px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    .footer-text {
      font-size: 8.5pt;
      color: #94A3B8;
      line-height: 1.7;
      flex: 1;
    }
    .footer-badge {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 8px 12px;
      text-align: center;
      font-size: 8.5pt;
    }
    .footer-badge-reg { font-weight: 700; font-size: 10pt; color: #F97316; }
    .footer-badge-label { color: #64748B; margin-top: 2px; }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <div class="header-logo-wrap">
        <img class="header-logo" src="${COMPANY_LOGO_DATA_URI}" alt="${escapeHtml(invoiceCompanyName)} logo">
      </div>
      <div>
        <div class="company-name">${invoiceCompanyName}</div>
      <div class="company-tagline">Gas Safe Registered Engineers Â· Professional Gas Services</div>
    </div>
    <div class="gas-safe-badge">
      <div class="gas-safe-badge-icon">ðŸ”¥</div>
      <div>
        <div class="gas-safe-badge-text">Gas Safe Registered</div>
        <div class="gas-safe-badge-reg">${engineer.gasSafeNumber}</div>
      </div>
    </div>
  </div>

  <!-- ADDRESS BLOCK -->
  <div class="address-section">
    <div class="address-from">
      <div class="address-label">From</div>
      <div class="address-text">
        <strong>${engineer.name}</strong><br>
        ${engineer.phone}<br>
        ${engineer.email}
        ${invoiceCompanyNumber ? `<br>Company No: ${invoiceCompanyNumber}` : ""}
        ${engineer.vatRegistered && engineer.vatNumber ? `<br>VAT No: ${engineer.vatNumber}` : ""}
      </div>
    </div>
    <div class="address-to">
      <div class="address-label">To</div>
      <div class="address-text">
        <strong>${customer?.name ?? "Customer"}</strong><br>
        ${(property?.address ?? "").replace(/,\s*/g, "<br>")}<br>
        ${property?.postcode ?? ""}
        ${property?.propertyType === "landlord" && property.landlordName
          ? `<br><br>Landlord: <strong>${property.landlordName}</strong>`
          : ""}
      </div>
    </div>
  </div>

  <!-- GREETING -->
  <div class="greeting">
    <h1>Hello ${customer?.name?.split(" ")[0] ?? ""},<br>
      <span>here is your ${docTitle}.</span>
    </h1>
    <div class="greeting-meta">
      <strong>Reference:</strong> ${job.jobNumber} &nbsp;Â·&nbsp;
      <strong>Date of visit:</strong> ${formattedDate} &nbsp;Â·&nbsp;
      <strong>Engineer:</strong> ${job.engineerName}
    </div>
  </div>

  ${
    job.appliances?.length
      ? `<!-- APPLIANCE -->
  <div class="section">
    <div class="section-title">Appliance Details</div>
    <div class="grid-2">
      ${job.appliances
        .map(
          (a: any) => `
        <div class="grid-item"><div class="grid-label">Type</div><div class="grid-value">${a.type.charAt(0).toUpperCase() + a.type.slice(1)}</div></div>
        <div class="grid-item"><div class="grid-label">Make</div><div class="grid-value">${a.make || "â€”"}</div></div>
        <div class="grid-item"><div class="grid-label">Model</div><div class="grid-value">${a.model || "â€”"}</div></div>
        <div class="grid-item"><div class="grid-label">Serial Number</div><div class="grid-value">${a.serialNumber || "â€”"}</div></div>
        <div class="grid-item"><div class="grid-label">Location</div><div class="grid-value">${a.location || "â€”"}</div></div>
        ${a.gcNumber ? `<div class="grid-item"><div class="grid-label">GC Number</div><div class="grid-value">${a.gcNumber}</div></div>` : ""}
      `
        )
        .join("")}
    </div>
  </div>`
      : ""
  }

  ${
    safetyRows.length
      ? `<!-- SAFETY CHECKS -->
  <div class="section">
    <div class="section-title">Safety Checks</div>
    <table class="checks-table">
      ${safetyRows
        .map(
          ([label, value, color]) =>
            `<tr><td>${label}</td><td style="color:${color}">${value}</td></tr>`
        )
        .join("")}
    </table>
  </div>`
      : ""
  }

  ${
    job.inspectionOutcome
      ? `<!-- OUTCOME -->
  <div class="outcome-box">
    <div class="outcome-badge">${outcomeLabel}</div>
    <div class="outcome-label">Inspection Outcome</div>
  </div>`
      : ""
  }

  ${
    job.defectsFound && job.defectsFound !== "None"
      ? `<div class="section">
    <div class="section-title">Defects Found</div>
    <div class="notes-box">${job.defectsFound}</div>
  </div>`
      : ""
  }

  ${
    job.remedialWork && job.remedialWork !== "None required"
      ? `<div class="section">
    <div class="section-title">Remedial Work Carried Out</div>
    <div class="notes-box">${job.remedialWork}</div>
  </div>`
      : ""
  }

  ${
    job.observations
      ? `<div class="section">
    <div class="section-title">Engineer's Observations</div>
    <div class="notes-box">${job.observations}</div>
  </div>`
      : ""
  }

  ${
    nextServiceDate
      ? `<!-- NEXT SERVICE -->
  <div class="next-service-box">
    <div class="next-service-label">â° Next Annual Service / Safety Check Due</div>
    <div class="next-service-date">${nextServiceDate}</div>
  </div>`
      : ""
  }

  ${
    isInvoice && job.invoiceItems?.length
      ? `<!-- INVOICE ITEMS -->
  <div class="section">
    <div class="section-title">Invoice Summary</div>
    <table class="invoice-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>VAT</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${job.invoiceItems
          .map(
            (item: any) =>
              `<tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>Â£${item.unitPrice.toFixed(2)}</td>
            <td>${item.vatRate}%</td>
            <td>Â£${(item.quantity * item.unitPrice * (1 + item.vatRate / 100)).toFixed(2)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
    <div class="invoice-totals">
      <div class="invoice-total-row"><span>Subtotal (ex VAT)</span><span>Â£${totalExVat.toFixed(2)}</span></div>
      <div class="invoice-total-row"><span>VAT</span><span>Â£${totalVat.toFixed(2)}</span></div>
      <div class="invoice-total-row grand"><span>${isQuote ? "Quote Total" : "Amount Due"}</span><span>Â£${totalInc.toFixed(2)}</span></div>
    </div>
  </div>

  <!-- PAYMENT BOX -->
  ${
    !isQuote
      ? `<div class="payment-box">
    <div class="payment-box-header">
      <div class="payment-box-header-title">ðŸ’³ Payment Details</div>
    </div>
    <div class="payment-box-body">
      <div class="payment-due">Please pay <span>Â£${totalInc.toFixed(2)}</span> â€” thank you</div>
      <div class="payment-note">Please use your job reference <strong>${job.jobNumber}</strong> as your payment reference.</div>
      ${engineer.phone ? `<div class="payment-note" style="margin-top:4px">To pay by card or bank transfer, please contact us on ${engineer.phone}.</div>` : ""}
    </div>
  </div>`
      : ""
  }`
      : ""
  }

  <!-- SUMMARY BOX (for CP12 / non-invoice) -->
  ${
    (isCP12 || isService) && job.safetyChecks
      ? `<div class="summary-box">
    <div class="summary-box-header">
      <div class="summary-box-header-title">ðŸ“‹ Certificate Summary</div>
    </div>
    <div class="summary-box-body">
      <div class="summary-row">
        <span>Gas Tightness</span>
        <span class="amount" style="color:${job.safetyChecks.gastigtness === "pass" ? "#4ADE80" : "#F87171"}">${job.safetyChecks.gastigtness.toUpperCase()}</span>
      </div>
      <div class="summary-row">
        <span>Working Pressure</span>
        <span class="amount" style="color:#CBD5E1">${job.safetyChecks.workingPressure}</span>
      </div>
      <div class="summary-row">
        <span>Ventilation Check</span>
        <span class="amount" style="color:${job.safetyChecks.ventilation === "satisfactory" ? "#4ADE80" : "#F87171"}">${job.safetyChecks.ventilation.toUpperCase()}</span>
      </div>
      <div class="summary-row">
        <span>Safety Devices</span>
        <span class="amount" style="color:${job.safetyChecks.safetyDevices === "satisfactory" ? "#4ADE80" : "#F87171"}">${job.safetyChecks.safetyDevices.toUpperCase()}</span>
      </div>
      <div class="summary-row total">
        <span>Overall Result</span>
        <span class="amount" style="color:${outcomeColor === "#16A34A" ? "#4ADE80" : outcomeColor === "#CA8A04" ? "#FDE047" : "#F87171"}">${outcomeLabel}</span>
      </div>
    </div>
  </div>`
      : ""
  }

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-text">
      This document has been issued by a Gas Safe registered engineer and is a legal record of the work carried out.<br>
      Please retain this document for your records. ${isCP12 ? "Landlords are required by law to keep a copy of this certificate for at least two years." : ""}
      <br>Certificate issued by <strong>${engineer.companyName}</strong> Â· Gas Safe Reg No. ${engineer.gasSafeNumber}
    </div>
    <div class="footer-badge">
      <div class="footer-badge-reg">${engineer.gasSafeNumber}</div>
      <div class="footer-badge-label">Gas Safe<br>Registered</div>
    </div>
  </div>

</div>
</body>
</html>`;
}

export default function CertificateScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { jobs, getCustomerById, getPropertyById, engineer } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);

  const job = jobs.find((j) => j.id === jobId);
  const customer = job ? getCustomerById(job.customerId) : undefined;
  const property = job ? getPropertyById(job.propertyId) : undefined;

  const isCP12 = job?.jobType === "cp12";
  const isService = job?.jobType === "boiler_service";
  const isInvoice = ["invoice", "quote"].includes(job?.jobType ?? "");

  const totalExVat = job?.invoiceItems?.reduce((s, i) => s + i.quantity * i.unitPrice, 0) ?? 0;
  const totalVat = job?.invoiceItems?.reduce((s, i) => s + i.quantity * i.unitPrice * (i.vatRate / 100), 0) ?? 0;
  const totalInc = totalExVat + totalVat;

  const formattedDate = job
    ? new Date(job.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "";
  const brandedCompanyName =
    engineer.companyName && engineer.companyName !== "Morrison Gas Services"
      ? engineer.companyName
      : COMPANY_BRAND.companyName;

  const getDocLabel = () => {
    if (!job) return "Document";
    if (isCP12) return "CP12 Certificate";
    if (isService) return "Service Record";
    if (job.jobType === "quote") return "Quote";
    if (isInvoice) return "Invoice";
    return JOB_TYPE_LABELS[job.jobType];
  };

  const generateAndShare = async () => {
    if (!job) return;
    setIsGenerating(true);
    try {
      const html = buildHtml({ job, customer, property, engineer, formattedDate, totalExVat, totalVat, totalInc });
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `${getDocLabel()} - ${job.jobNumber}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Sharing not available", "PDF sharing is not supported on this device.");
      }
    } catch (e) {
      Alert.alert("Error", "Could not generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const shareWhatsApp = async () => {
    if (!job) return;
    const text = `${getDocLabel()} for ${customer?.name} at ${property?.address}.\nRef: ${job.jobNumber} Â· Date: ${formattedDate}\nEngineer: ${engineer.name} (Gas Safe: ${engineer.gasSafeNumber})${totalInc > 0 ? `\nTotal: Â£${totalInc.toFixed(2)}` : ""}`;
    const result = await openWhatsAppMessage(text);
    if (result.fallbackUsed) {
      Alert.alert(
        "WhatsApp unavailable",
        "WhatsApp could not be opened on this build, so the system share sheet was opened instead.",
      );
    }
  };

  const shareEmail = () => {
    if (!job) return;
    if (!customer?.email) {
      Alert.alert("No email address", "This customer has no email saved.");
      return;
    }
    const subject = `${getDocLabel()} - ${job.jobNumber}`;
    const body = `Dear ${customer.name},\n\nPlease find details of your recent gas ${isInvoice ? "invoice" : "safety inspection"} below.\n\nReference: ${job.jobNumber}\nDate: ${formattedDate}\nProperty: ${property?.address}, ${property?.postcode}\nEngineer: ${engineer.name} Â· Gas Safe: ${engineer.gasSafeNumber}${totalInc > 0 ? `\n\nTotal Amount Due: Â£${totalInc.toFixed(2)}` : ""}\n\nKind regards,\n${engineer.name}\n${engineer.companyName}\n${engineer.phone}`;
    Linking.openURL(`mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (!job) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.textTertiary} />
        <Text style={[styles.errorText, { color: colors.text }]}>Job not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{getDocLabel()}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Document card preview */}
        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Mini header */}
          <View style={[styles.previewHeader, { backgroundColor: "#0F172A" }]}>
            <View style={styles.previewBrand}>
              <View style={styles.previewLogoWrap}>
                <Image source={COMPANY_BRAND.logoSource} style={styles.previewLogo} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.previewCompany}>{brandedCompanyName}</Text>
              <Text style={styles.previewTagline}>Gas Safe Registered Â· No. {engineer.gasSafeNumber}</Text>
            </View>
            </View>
            <View style={[styles.gasSafeChip, { backgroundColor: "rgba(249,115,22,0.2)" }]}>
              <Feather name="shield" size={16} color="#F97316" />
            </View>
          </View>

          {/* Doc info */}
          <View style={styles.previewBody}>
            <Text style={[styles.previewGreeting, { color: colors.text }]}>
              Hello {customer?.name?.split(" ")[0]},{"\n"}
              <Text style={{ color: colors.primary }}>here is your {getDocLabel()}.</Text>
            </Text>

            <View style={styles.previewMeta}>
              <View style={styles.previewMetaRow}>
                <Feather name="hash" size={12} color={colors.textTertiary} />
                <Text style={[styles.previewMetaText, { color: colors.textSecondary }]}>{job.jobNumber}</Text>
              </View>
              <View style={styles.previewMetaRow}>
                <Feather name="calendar" size={12} color={colors.textTertiary} />
                <Text style={[styles.previewMetaText, { color: colors.textSecondary }]}>{formattedDate}</Text>
              </View>
              <View style={styles.previewMetaRow}>
                <Feather name="map-pin" size={12} color={colors.textTertiary} />
                <Text style={[styles.previewMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {property?.address}
                </Text>
              </View>
            </View>

            {/* Summary section */}
            {(isCP12 || isService) && job.safetyChecks && (
              <View style={[styles.summaryChip, { backgroundColor: job.inspectionOutcome === "satisfactory" ? "#DCFCE7" : "#FEE2E2" }]}>
                <Feather
                  name={job.inspectionOutcome === "satisfactory" ? "check-circle" : "alert-triangle"}
                  size={14}
                  color={job.inspectionOutcome === "satisfactory" ? "#16A34A" : "#DC2626"}
                />
                <Text style={[styles.summaryChipText, { color: job.inspectionOutcome === "satisfactory" ? "#16A34A" : "#DC2626" }]}>
                  {job.inspectionOutcome === "satisfactory" ? "Inspection: Satisfactory" :
                   job.inspectionOutcome === "at_risk" ? "Inspection: At Risk" : "Immediately Dangerous"}
                </Text>
              </View>
            )}

            {totalInc > 0 && (
              <View style={[styles.totalChip, { backgroundColor: "#0F172A" }]}>
                <Text style={styles.totalChipLabel}>Total Amount</Text>
                <Text style={styles.totalChipAmount}>Â£{totalInc.toFixed(2)}</Text>
              </View>
            )}
          </View>

          {/* PDF indicator */}
          <View style={[styles.pdfBadge, { borderTopColor: colors.separator }]}>
            <Feather name="file-text" size={14} color={colors.textTertiary} />
            <Text style={[styles.pdfBadgeText, { color: colors.textTertiary }]}>
              PDF document Â· tap below to generate &amp; share
            </Text>
          </View>
        </View>

        {/* Actions */}
        <Text style={[styles.actionsLabel, { color: colors.textTertiary }]}>SHARE DOCUMENT</Text>

        {/* Primary: Generate PDF */}
        <Pressable
          onPress={generateAndShare}
          disabled={isGenerating}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="download" size={20} color="#fff" />
          )}
          <Text style={styles.primaryBtnText}>
            {isGenerating ? "Generating PDFâ€¦" : "Save & Share PDF"}
          </Text>
        </Pressable>

        {/* Secondary actions */}
        <View style={styles.secondaryRow}>
          <Pressable
            onPress={shareEmail}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { backgroundColor: colors.info, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="mail" size={18} color="#fff" />
            <Text style={styles.secondaryBtnText}>Email</Text>
          </Pressable>

          <Pressable
            onPress={shareWhatsApp}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { backgroundColor: "#25D366", opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="message-circle" size={18} color="#fff" />
            <Text style={styles.secondaryBtnText}>WhatsApp</Text>
          </Pressable>
        </View>

        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          The PDF includes all job details, safety checks, and your Gas Safe registration â€” ready to send to your customer.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  errorText: { fontSize: fontSize.lg, fontFamily: "Inter_400Regular" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: { padding: spacing.xs },
  headerTitle: { fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold" },
  headerRight: { width: 32 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 60 },

  previewCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  previewBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  previewLogoWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLogo: {
    width: "100%",
    height: "100%",
  },
  previewCompany: {
    fontSize: fontSize.md,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  previewTagline: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  gasSafeChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  previewGreeting: {
    fontSize: fontSize.lg,
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  previewMeta: {
    gap: 6,
  },
  previewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  previewMetaText: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  summaryChipText: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_600SemiBold",
  },
  totalChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.md,
  },
  totalChipLabel: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  totalChipAmount: {
    fontSize: fontSize.xl,
    fontFamily: "Inter_700Bold",
    color: "#F97316",
  },
  pdfBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  pdfBadgeText: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
  },

  actionsLabel: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  primaryBtnText: {
    fontSize: fontSize.md,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  secondaryBtnText: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  hint: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    textAlign: "center",
  },
});

