export type JobType =
  | "cp12"
  | "boiler_service"
  | "repair"
  | "installation"
  | "warning_notice"
  | "quote"
  | "invoice";

export type JobStatus = "draft" | "completed" | "invoiced" | "paid";

export type ApplianceType =
  | "boiler"
  | "fire"
  | "hob"
  | "cooker"
  | "water_heater"
  | "other";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  customerId: string;
  address: string;
  postcode: string;
  propertyType: "residential" | "commercial" | "landlord";
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appliance {
  type: ApplianceType;
  make: string;
  model: string;
  serialNumber: string;
  location: string;
  gcNumber?: string;
}

export interface SafetyChecks {
  gastigtness: "pass" | "fail" | "n/a";
  workingPressure: string;
  standingPressure: string;
  flueType: string;
  flueTermination: string;
  fluePull: "satisfactory" | "unsatisfactory" | "n/a";
  ventilation: "satisfactory" | "unsatisfactory" | "n/a";
  safetyDevices: "satisfactory" | "unsatisfactory" | "n/a";
  spillageTest: "pass" | "fail" | "n/a" | "not_applicable";
  combustionTest: "pass" | "fail" | "n/a" | "not_applicable";
  co2Percentage?: string;
  o2Percentage?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface Job {
  id: string;
  customerId: string;
  propertyId: string;
  jobType: JobType;
  status: JobStatus;
  jobNumber: string;
  date: string;
  engineerName: string;
  gasSafeNumber: string;
  companyName: string;

  appliances: Appliance[];
  safetyChecks?: SafetyChecks;

  defectsFound?: string;
  remedialWork?: string;
  observations?: string;
  inspectionOutcome?: "satisfactory" | "at_risk" | "immediately_dangerous";
  warningNoticeIssued?: boolean;
  warningNoticeRef?: string;

  // Invoice fields
  invoiceItems?: InvoiceItem[];
  vatRegistered?: boolean;
  vatNumber?: string;
  invoiceNotes?: string;
  quoteNotes?: string;
  dueDate?: string;
  amountDue?: number;
  paidAt?: string;
  lastReminderAt?: string;
  reminderCount?: number;

  // CP12 specific
  numberOfAppliances?: number;
  landlordCpCheckDateThisVisit?: string;
  nextServiceDue?: string;

  // Signatures
  engineerSignature?: string;
  customerSignature?: string;
  customerName?: string;

  createdAt: string;
  updatedAt: string;
}

export interface Engineer {
  name: string;
  gasSafeNumber: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  vatNumber?: string;
  vatRegistered: boolean;
  logoUri?: string;
}

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  cp12: "CP12 Gas Safety",
  boiler_service: "Boiler Service",
  repair: "Repair / Breakdown",
  installation: "Installation",
  warning_notice: "Warning Notice",
  quote: "Quote",
  invoice: "Invoice",
};

export const JOB_TYPE_COLORS: Record<JobType, string> = {
  cp12: "#22C55E",
  boiler_service: "#3B82F6",
  repair: "#F97316",
  installation: "#8B5CF6",
  warning_notice: "#EF4444",
  quote: "#EAB308",
  invoice: "#06B6D4",
};

export const JOB_TYPE_ICONS: Record<JobType, string> = {
  cp12: "shield-check",
  boiler_service: "tool",
  repair: "alert-circle",
  installation: "package",
  warning_notice: "alert-triangle",
  quote: "file-text",
  invoice: "dollar-sign",
};

export const STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  completed: "Completed",
  invoiced: "Invoiced",
  paid: "Paid",
};

export const STATUS_COLORS: Record<JobStatus, string> = {
  draft: "#64748B",
  completed: "#22C55E",
  invoiced: "#3B82F6",
  paid: "#8B5CF6",
};
