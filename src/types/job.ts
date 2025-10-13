export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  notes?: string;
  // Company details (optional)
  companyName?: string;
  companyAbn?: string;
  companyEmail?: string;
  companyPhone?: string;
  billingAddress?: string;
  customerType?: 'commercial' | 'domestic';
  createdAt: Date;
  updatedAt: Date;
}

export interface MachineCategory {
  id: string;
  name: string;
  labourRate: number; // per hour in AUD
  commonBrands: string[];
}

// Add Part interface with updated fields for competitor pricing support
export interface Part {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  sellPrice: number;
  markup?: number; // percentage - optional for global markup calculation
  competitorPrice?: number; // competitor/Google pricing
  source?: string; // source of competitor pricing
  inStock: boolean;
  description?: string;
}

export interface JobPart {
  id: string; // Add stable row ID
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

// Checklist item for service tasks
export interface ChecklistItem {
  id: string; // unique ID for each item
  label: string;
  checked: boolean;
  note?: string;
  isCustom?: boolean; // true if user-added
}

export interface ServiceChecklist {
  universal: ChecklistItem[];
  category: ChecklistItem[];
  categoryName?: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  customerId: string;
  customer: Customer;
  
  // Machine details
  machineCategory: string;
  machineBrand: string;
  machineModel: string;
  machineSerial?: string;
  
  // Problem description
  problemDescription: string;
  notes?: string;
  
  // Mechanic service notes
  servicePerformed?: string; // what work was actually completed
  recommendations?: string; // what to watch or do next
  
  // Service pricing
  serviceDeposit?: number; // deposit paid by customer
  quotationAmount?: number; // quotation amount for inspection
  discountType?: 'PERCENT' | 'AMOUNT'; // discount type
  discountValue?: number; // discount amount or percentage
  
  // Transport details
  transportPickupRequired?: boolean;
  transportDeliveryRequired?: boolean;
  transportSizeTier?: string;
  transportDistanceKm?: number;
  transportTotalCharge?: number;
  transportBreakdown?: string;
  
  // Sharpen details
  sharpenItems?: any[];
  sharpenTotalCharge?: number;
  sharpenBreakdown?: string;
  
  // Small Repair details
  smallRepairDetails?: string;
  smallRepairMinutes?: number;
  smallRepairRate?: number;
  smallRepairTotal?: number;
  
  // Computed parts list for display
  partsRequired?: string; // computed from parts array
  
  // Service checklist (split into universal + category)
  checklistUniversal?: ChecklistItem[];
  checklistCategory?: ChecklistItem[];
  equipmentCategory?: string;
  equipmentModel?: string;
  
  // Pricing
  parts: JobPart[];
  labourHours: number;
  labourRate: number;
  
  // Calculations
  partsSubtotal: number;
  labourTotal: number;
  subtotal: number;
  gst: number;
  grandTotal: number;
  balanceDue?: number;
  
  // Status
  status: 'pending' | 'in-progress' | 'completed' | 'delivered' | 'write_off';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  deliveredAt?: Date;
  
  // Customer type and company for this job
  customerType?: 'commercial' | 'domestic';
  jobCompanyName?: string;
  
  // Customer account settings
  hasAccount?: boolean; // true if customer has 30-day account terms
  accountCustomerId?: string; // Link to account_customers table if this is an account customer job
  accountId?: string; // Link to accounts table (companies like Citywide)
  contactId?: string; // Link to contacts table (person under the account)
  
  // Phase 2 additions
  requestedFinishDate?: Date; // Customer requested completion date
  attachments?: Array<{ name: string; problemDescription: string }>; // For Multi-Tool attachments
  additionalNotes?: string; // Extra notes separate from problem description
  
  // Quotation tracking
  quotationStatus?: 'pending' | 'approved' | 'rejected';
  quotationApprovedAt?: Date;
}

export interface JobBookingStats {
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  totalRevenue: number;
  averageJobValue: number;
}