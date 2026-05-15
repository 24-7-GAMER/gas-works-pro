import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Customer, Engineer, Job, Property } from "@/types";

const STORAGE_KEYS = {
  customers: "@gasPro/customers",
  properties: "@gasPro/properties",
  jobs: "@gasPro/jobs",
  engineer: "@gasPro/engineer",
  jobCounter: "@gasPro/jobCounter",
};

const BACKUP_SCHEMA_VERSION = 1;

export interface AppBackup {
  app: "Gas Works Pro";
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  data: {
    customers: Customer[];
    properties: Property[];
    jobs: Job[];
    engineer: Engineer;
    jobCounter: number;
  };
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function generateJobNumber(counter: number): string {
  const year = new Date().getFullYear();
  return `GP-${year}-${String(counter).padStart(4, "0")}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertBackup(value: unknown): asserts value is AppBackup {
  if (!isPlainObject(value) || value.app !== "Gas Works Pro" || value.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error("This is not a compatible Gas Works Pro backup.");
  }

  const data = value.data;
  if (!isPlainObject(data)) {
    throw new Error("The backup data is missing.");
  }

  if (!Array.isArray(data.customers) || !Array.isArray(data.properties) || !Array.isArray(data.jobs)) {
    throw new Error("The backup is missing customers, properties, or jobs.");
  }

  if (!isPlainObject(data.engineer)) {
    throw new Error("The backup is missing engineer settings.");
  }

  if (typeof data.jobCounter !== "number" || !Number.isFinite(data.jobCounter)) {
    throw new Error("The backup has an invalid job counter.");
  }
}

const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: "cust-001",
    name: "Margaret Thompson",
    phone: "07712 345678",
    email: "m.thompson@email.co.uk",
    address: "14 Elmwood Drive, Sheffield, S10 3PQ",
    notes: "Long-standing customer. Prefers morning appointments.",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "cust-002",
    name: "James Hargreaves",
    phone: "07856 234567",
    email: "jhargreaves@gmail.com",
    address: "32 Victoria Street, Leeds, LS1 6BH",
    notes: "Landlord - 3 properties. Invoice at end of month.",
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-02-10T10:00:00Z",
  },
  {
    id: "cust-003",
    name: "Sarah Mitchell",
    phone: "07923 456789",
    email: "sarah.mitchell@hotmail.com",
    address: "8 Oakfield Road, Manchester, M20 6LJ",
    createdAt: "2024-03-05T14:00:00Z",
    updatedAt: "2024-03-05T14:00:00Z",
  },
];

const SAMPLE_PROPERTIES: Property[] = [
  {
    id: "prop-001",
    customerId: "cust-001",
    address: "14 Elmwood Drive",
    postcode: "S10 3PQ",
    propertyType: "residential",
    notes: "Combi boiler in kitchen cupboard. Worcester Bosch.",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "prop-002",
    customerId: "cust-002",
    address: "32 Victoria Street, Flat 1",
    postcode: "LS1 6BH",
    propertyType: "landlord",
    landlordName: "James Hargreaves",
    landlordPhone: "07856 234567",
    landlordEmail: "jhargreaves@gmail.com",
    notes: "Tenant: Paul Andrews. Gas meter in hallway cupboard.",
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-02-10T10:00:00Z",
  },
  {
    id: "prop-003",
    customerId: "cust-002",
    address: "34 Victoria Street",
    postcode: "LS1 6BH",
    propertyType: "landlord",
    landlordName: "James Hargreaves",
    landlordPhone: "07856 234567",
    landlordEmail: "jhargreaves@gmail.com",
    notes: "Tenant: Emma Clarke.",
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-02-10T10:00:00Z",
  },
  {
    id: "prop-004",
    customerId: "cust-003",
    address: "8 Oakfield Road",
    postcode: "M20 6LJ",
    propertyType: "residential",
    createdAt: "2024-03-05T14:00:00Z",
    updatedAt: "2024-03-05T14:00:00Z",
  },
];

const SAMPLE_JOBS: Job[] = [
  {
    id: "job-001",
    customerId: "cust-001",
    propertyId: "prop-001",
    jobType: "cp12",
    status: "completed",
    jobNumber: "GP-2025-0001",
    date: "2025-03-10",
    engineerName: "Dave Morrison",
    gasSafeNumber: "612345",
    companyName: "Morrison Gas Services",
    appliances: [
      {
        type: "boiler",
        make: "Worcester Bosch",
        model: "Greenstar 30i",
        serialNumber: "WB2301456",
        location: "Kitchen cupboard",
        gcNumber: "41-116-36",
      },
    ],
    safetyChecks: {
      gastigtness: "pass",
      workingPressure: "18 mbar",
      standingPressure: "20 mbar",
      flueType: "Room sealed",
      flueTermination: "External wall - satisfactory",
      fluePull: "satisfactory",
      ventilation: "satisfactory",
      safetyDevices: "satisfactory",
      spillageTest: "not_applicable",
      combustionTest: "pass",
      co2Percentage: "8.5%",
      o2Percentage: "6.2%",
    },
    defectsFound: "None",
    remedialWork: "None required",
    inspectionOutcome: "satisfactory",
    nextServiceDue: "2026-03-10",
    numberOfAppliances: 1,
    createdAt: "2025-03-10T10:00:00Z",
    updatedAt: "2025-03-10T11:30:00Z",
  },
  {
    id: "job-002",
    customerId: "cust-002",
    propertyId: "prop-002",
    jobType: "cp12",
    status: "invoiced",
    jobNumber: "GP-2025-0002",
    date: "2025-03-14",
    engineerName: "Dave Morrison",
    gasSafeNumber: "612345",
    companyName: "Morrison Gas Services",
    appliances: [
      {
        type: "boiler",
        make: "Vaillant",
        model: "ecoFIT Pure 825",
        serialNumber: "VL1910234",
        location: "Utility room",
        gcNumber: "47-116-19",
      },
    ],
    safetyChecks: {
      gastigtness: "pass",
      workingPressure: "19 mbar",
      standingPressure: "21 mbar",
      flueType: "Room sealed",
      flueTermination: "External wall - satisfactory",
      fluePull: "satisfactory",
      ventilation: "satisfactory",
      safetyDevices: "satisfactory",
      spillageTest: "not_applicable",
      combustionTest: "pass",
      co2Percentage: "9.1%",
      o2Percentage: "5.8%",
    },
    defectsFound: "None",
    remedialWork: "None required",
    inspectionOutcome: "satisfactory",
    nextServiceDue: "2026-03-14",
    numberOfAppliances: 1,
    invoiceItems: [
      {
        id: "item-001",
        description: "CP12 Landlord Gas Safety Record",
        quantity: 1,
        unitPrice: 85,
        vatRate: 0,
      },
    ],
    createdAt: "2025-03-14T09:00:00Z",
    updatedAt: "2025-03-14T12:00:00Z",
  },
  {
    id: "job-003",
    customerId: "cust-003",
    propertyId: "prop-004",
    jobType: "boiler_service",
    status: "completed",
    jobNumber: "GP-2025-0003",
    date: "2025-03-18",
    engineerName: "Dave Morrison",
    gasSafeNumber: "612345",
    companyName: "Morrison Gas Services",
    appliances: [
      {
        type: "boiler",
        make: "Ideal",
        model: "Logic Heat H15",
        serialNumber: "ID0823991",
        location: "Airing cupboard",
      },
    ],
    safetyChecks: {
      gastigtness: "pass",
      workingPressure: "17 mbar",
      standingPressure: "20 mbar",
      flueType: "Open flue",
      flueTermination: "Roof - satisfactory",
      fluePull: "satisfactory",
      ventilation: "satisfactory",
      safetyDevices: "satisfactory",
      spillageTest: "pass",
      combustionTest: "pass",
    },
    defectsFound: "Boiler pressure low on arrival. Repressuised to 1.5 bar.",
    remedialWork: "System repressuised. Advised customer to monitor.",
    observations:
      "Boiler showing signs of wear. May need heat exchanger replacement within 2 years.",
    inspectionOutcome: "satisfactory",
    nextServiceDue: "2026-03-18",
    createdAt: "2025-03-18T14:00:00Z",
    updatedAt: "2025-03-18T15:30:00Z",
  },
  {
    id: "job-004",
    customerId: "cust-001",
    propertyId: "prop-001",
    jobType: "repair",
    status: "paid",
    jobNumber: "GP-2025-0004",
    date: "2025-03-20",
    engineerName: "Dave Morrison",
    gasSafeNumber: "612345",
    companyName: "Morrison Gas Services",
    appliances: [
      {
        type: "boiler",
        make: "Worcester Bosch",
        model: "Greenstar 30i",
        serialNumber: "WB2301456",
        location: "Kitchen cupboard",
      },
    ],
    defectsFound: "Diverter valve faulty. No hot water.",
    remedialWork:
      "Replaced diverter valve - Worcester Bosch part 87161427060. Tested hot water and heating - both working correctly.",
    inspectionOutcome: "satisfactory",
    invoiceItems: [
      {
        id: "item-002",
        description: "Call out charge",
        quantity: 1,
        unitPrice: 65,
        vatRate: 20,
      },
      {
        id: "item-003",
        description: "Labour - 2 hours",
        quantity: 2,
        unitPrice: 55,
        vatRate: 20,
      },
      {
        id: "item-004",
        description: "Worcester Bosch Diverter Valve 87161427060",
        quantity: 1,
        unitPrice: 125,
        vatRate: 20,
      },
    ],
    vatRegistered: true,
    vatNumber: "GB 123 4567 89",
    paidAt: "2025-03-21T10:00:00Z",
    createdAt: "2025-03-20T09:00:00Z",
    updatedAt: "2025-03-21T10:00:00Z",
  },
];

const SAMPLE_ENGINEER: Engineer = {
  name: "Dave Morrison",
  gasSafeNumber: "612345",
  companyName: "Morrison Gas Services",
  address: "24 Station Road, Sheffield, S1 1AA",
  phone: "07700 900123",
  email: "dave@morrisongasservices.co.uk",
  vatNumber: "GB 123 4567 89",
  vatRegistered: true,
};

interface AppContextValue {
  customers: Customer[];
  properties: Property[];
  jobs: Job[];
  engineer: Engineer;
  isLoaded: boolean;

  addCustomer: (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  addProperty: (property: Omit<Property, "id" | "createdAt" | "updatedAt">) => Promise<Property>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;

  addJob: (job: Omit<Job, "id" | "jobNumber" | "createdAt" | "updatedAt">) => Promise<Job>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;

  updateEngineer: (updates: Partial<Engineer>) => Promise<void>;
  createBackup: () => AppBackup;
  importBackup: (backup: unknown) => Promise<AppBackup["data"]>;

  getCustomerById: (id: string) => Customer | undefined;
  getPropertyById: (id: string) => Property | undefined;
  getPropertiesByCustomer: (customerId: string) => Property[];
  getJobsByCustomer: (customerId: string) => Job[];
  getJobsByProperty: (propertyId: string) => Job[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [engineer, setEngineer] = useState<Engineer>(SAMPLE_ENGINEER);
  const [jobCounter, setJobCounter] = useState(4);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, p, j, e, jc] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.customers),
          AsyncStorage.getItem(STORAGE_KEYS.properties),
          AsyncStorage.getItem(STORAGE_KEYS.jobs),
          AsyncStorage.getItem(STORAGE_KEYS.engineer),
          AsyncStorage.getItem(STORAGE_KEYS.jobCounter),
        ]);

        setCustomers(c ? JSON.parse(c) : SAMPLE_CUSTOMERS);
        setProperties(p ? JSON.parse(p) : SAMPLE_PROPERTIES);
        setJobs(j ? JSON.parse(j) : SAMPLE_JOBS);
        setEngineer(e ? JSON.parse(e) : SAMPLE_ENGINEER);
        setJobCounter(jc ? parseInt(jc, 10) : 4);

        if (!c) await AsyncStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(SAMPLE_CUSTOMERS));
        if (!p) await AsyncStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(SAMPLE_PROPERTIES));
        if (!j) await AsyncStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(SAMPLE_JOBS));
        if (!e) await AsyncStorage.setItem(STORAGE_KEYS.engineer, JSON.stringify(SAMPLE_ENGINEER));
        if (!jc) await AsyncStorage.setItem(STORAGE_KEYS.jobCounter, "4");
      } catch (err) {
        setCustomers(SAMPLE_CUSTOMERS);
        setProperties(SAMPLE_PROPERTIES);
        setJobs(SAMPLE_JOBS);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const saveCustomers = useCallback(async (data: Customer[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(data));
  }, []);
  const saveProperties = useCallback(async (data: Property[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(data));
  }, []);
  const saveJobs = useCallback(async (data: Job[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(data));
  }, []);

  const addCustomer = useCallback(async (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newCustomer: Customer = { ...customer, id: generateId(), createdAt: now, updatedAt: now };
    const updated = [...customers, newCustomer];
    setCustomers(updated);
    await saveCustomers(updated);
    return newCustomer;
  }, [customers, saveCustomers]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
    setCustomers(updated);
    await saveCustomers(updated);
  }, [customers, saveCustomers]);

  const deleteCustomer = useCallback(async (id: string) => {
    const updatedCustomers = customers.filter(c => c.id !== id);
    const deletedPropertyIds = new Set(
      properties.filter(p => p.customerId === id).map(p => p.id)
    );
    const updatedProperties = properties.filter(p => p.customerId !== id);
    const updatedJobs = jobs.filter(
      j => j.customerId !== id && !deletedPropertyIds.has(j.propertyId)
    );

    setCustomers(updatedCustomers);
    setProperties(updatedProperties);
    setJobs(updatedJobs);
    await Promise.all([
      saveCustomers(updatedCustomers),
      saveProperties(updatedProperties),
      saveJobs(updatedJobs),
    ]);
  }, [customers, jobs, properties, saveCustomers, saveJobs, saveProperties]);

  const addProperty = useCallback(async (property: Omit<Property, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newProperty: Property = { ...property, id: generateId(), createdAt: now, updatedAt: now };
    const updated = [...properties, newProperty];
    setProperties(updated);
    await saveProperties(updated);
    return newProperty;
  }, [properties, saveProperties]);

  const updateProperty = useCallback(async (id: string, updates: Partial<Property>) => {
    const updated = properties.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
    setProperties(updated);
    await saveProperties(updated);
  }, [properties, saveProperties]);

  const deleteProperty = useCallback(async (id: string) => {
    const updatedProperties = properties.filter(p => p.id !== id);
    const updatedJobs = jobs.filter(j => j.propertyId !== id);

    setProperties(updatedProperties);
    setJobs(updatedJobs);
    await Promise.all([
      saveProperties(updatedProperties),
      saveJobs(updatedJobs),
    ]);
  }, [jobs, properties, saveJobs, saveProperties]);

  const addJob = useCallback(async (job: Omit<Job, "id" | "jobNumber" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const nextCounter = jobCounter + 1;
    const newJob: Job = {
      ...job,
      id: generateId(),
      jobNumber: generateJobNumber(nextCounter),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...jobs, newJob];
    setJobs(updated);
    setJobCounter(nextCounter);
    await saveJobs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.jobCounter, String(nextCounter));
    return newJob;
  }, [jobs, jobCounter, saveJobs]);

  const updateJob = useCallback(async (id: string, updates: Partial<Job>) => {
    const updated = jobs.map(j => j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j);
    setJobs(updated);
    await saveJobs(updated);
  }, [jobs, saveJobs]);

  const deleteJob = useCallback(async (id: string) => {
    const updated = jobs.filter(j => j.id !== id);
    setJobs(updated);
    await saveJobs(updated);
  }, [jobs, saveJobs]);

  const updateEngineer = useCallback(async (updates: Partial<Engineer>) => {
    const updated = { ...engineer, ...updates };
    setEngineer(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.engineer, JSON.stringify(updated));
  }, [engineer]);

  const createBackup = useCallback((): AppBackup => ({
    app: "Gas Works Pro",
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      customers,
      properties,
      jobs,
      engineer,
      jobCounter,
    },
  }), [customers, engineer, jobCounter, jobs, properties]);

  const importBackup = useCallback(async (backup: unknown) => {
    assertBackup(backup);
    const imported = backup.data;
    const nextJobCounter = Math.max(0, Math.floor(imported.jobCounter));

    setCustomers(imported.customers);
    setProperties(imported.properties);
    setJobs(imported.jobs);
    setEngineer(imported.engineer);
    setJobCounter(nextJobCounter);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(imported.customers)),
      AsyncStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(imported.properties)),
      AsyncStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(imported.jobs)),
      AsyncStorage.setItem(STORAGE_KEYS.engineer, JSON.stringify(imported.engineer)),
      AsyncStorage.setItem(STORAGE_KEYS.jobCounter, String(nextJobCounter)),
    ]);

    return { ...imported, jobCounter: nextJobCounter };
  }, []);

  const getCustomerById = useCallback((id: string) => customers.find(c => c.id === id), [customers]);
  const getPropertyById = useCallback((id: string) => properties.find(p => p.id === id), [properties]);
  const getPropertiesByCustomer = useCallback((customerId: string) => properties.filter(p => p.customerId === customerId), [properties]);
  const getJobsByCustomer = useCallback((customerId: string) => jobs.filter(j => j.customerId === customerId).sort((a, b) => b.date.localeCompare(a.date)), [jobs]);
  const getJobsByProperty = useCallback((propertyId: string) => jobs.filter(j => j.propertyId === propertyId).sort((a, b) => b.date.localeCompare(a.date)), [jobs]);

  return (
    <AppContext.Provider value={{
      customers, properties, jobs, engineer, isLoaded,
      addCustomer, updateCustomer, deleteCustomer,
      addProperty, updateProperty, deleteProperty,
      addJob, updateJob, deleteJob, updateEngineer,
      createBackup, importBackup,
      getCustomerById, getPropertyById, getPropertiesByCustomer,
      getJobsByCustomer, getJobsByProperty,
    }}>
      {children}
    </AppContext.Provider>
  );
}
