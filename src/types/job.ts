export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MachineCategory {
  id: string;
  name: string;
  labourRate: number; // per hour in AUD
  commonBrands: string[];
}

export interface Part {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  sellPrice: number;
  markup?: number; // percentage - optional for global markup calculation
  inStock: boolean;
  description?: string;
  competitorPrice?: number; // competitor/Google pricing
  source?: string; // source of competitor pricing
}

export interface JobPart {
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
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
  serviceTemplates?: string[]; // selected service note templates
  
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
  
  // Status
  status: 'pending' | 'in-progress' | 'completed' | 'delivered';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface JobBookingStats {
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  totalRevenue: number;
  averageJobValue: number;
}