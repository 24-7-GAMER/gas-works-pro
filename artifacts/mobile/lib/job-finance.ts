import type { Job } from "@/types";

export function getJobTotalAmount(job: Pick<Job, "invoiceItems">) {
  return (
    job.invoiceItems?.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const vat = subtotal * (item.vatRate / 100);
      return sum + subtotal + vat;
    }, 0) ?? 0
  );
}

export function parseCurrencyInput(value: string) {
  const stripped = value.trim().replace(/£/g, "").replace(/\s/g, "");
  const lastComma = stripped.lastIndexOf(",");
  const lastDot = stripped.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : ".";
  const normalized =
    decimalSeparator === ","
      ? stripped.replace(/\./g, "").replace(",", ".")
      : stripped.replace(/,/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function getJobAmountDue(job: Pick<Job, "amountDue" | "invoiceItems">) {
  if (typeof job.amountDue === "number" && Number.isFinite(job.amountDue)) {
    return job.amountDue;
  }

  return getJobTotalAmount(job);
}

export function getJobRevenue(job: Pick<Job, "status" | "amountDue" | "invoiceItems">) {
  if (job.status !== "paid" && job.status !== "invoiced") return 0;
  return getJobAmountDue(job);
}

export function isJobUnpaid(job: Pick<Job, "status" | "jobType" | "amountDue" | "invoiceItems">) {
  if (job.jobType === "quote") return false;
  return getJobAmountDue(job) > 0 && job.status !== "paid";
}

export function isJobPaid(job: Pick<Job, "status">) {
  return job.status === "paid";
}
