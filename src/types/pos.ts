/**
 * POS and Reporting System Types
 */

// Brand and Machinery Types
export interface Brand {
  id: string;
  name: string;
  website?: string;
  supplier?: string;
  oem_export_required: boolean;
  oem_export_format?: 'HONDA' | 'HUSQVARNA' | 'ECHO' | 'GENERIC';
  logo_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MachineryModel {
  id: string;
  brand_id: string;
  name: string;
  sku?: string;
  category?: string;
  description?: string;
  default_price?: number;
  cost_price?: number;
  tax_code: string;
  requires_engine_serial: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  brand?: Brand;
}

export interface MachinerySale {
  id: string;
  invoice_id?: string;
  brand_id: string;
  model_id?: string;
  model_name: string;
  serial_number: string;
  engine_serial?: string;
  purchase_date: string;
  customer_id: string;
  price_ex_gst?: number;
  price_incl_gst?: number;
  salesperson_id?: string;
  channel?: 'POS' | 'ONLINE' | 'PHONE' | 'SERVICE';
  exported_at?: string;
  oem_export_status: 'NOT_EXPORTED' | 'EXPORTED' | 'ERROR';
  oem_export_errors?: Record<string, any>;
  created_at: string;
  updated_at: string;
  brand?: Brand;
  model?: MachineryModel;
  customer?: any;
  salesperson?: any;
}

// Invoice Types
export type InvoiceType = 'SALE' | 'QUOTE' | 'SERVICE' | 'REFUND';
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED' | 'VOID';
export type LineType = 'MACHINERY' | 'PART' | 'LABOUR' | 'MISC';
export type Channel = 'POS' | 'ONLINE' | 'PHONE' | 'SERVICE';
export type PaymentMethod = 'CASH' | 'CARD' | 'EFTPOS' | 'SPLIT' | 'GIFT_CARD' | 'STORE_CREDIT' | 'ACCOUNT';

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  customer_id?: string;
  job_id?: string;
  subtotal: number;
  discount_type?: 'PERCENT' | 'AMOUNT';
  discount_value?: number;
  discount_amount: number;
  surcharge_amount: number;
  gst: number;
  total: number;
  deposit_amount: number;
  balance_due: number;
  status: InvoiceStatus;
  channel: Channel;
  notes?: string;
  cashier_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  customer?: any;
  cashier?: any;
  lines?: InvoiceLine[];
  payments?: Payment[];
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  line_type: LineType;
  brand_id?: string;
  model_id?: string;
  part_id?: string;
  serial_number?: string;
  engine_serial?: string;
  technician_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  line_total: number;
  tax_code: string;
  notes?: string;
  created_at: string;
  brand?: Brand;
  model?: MachineryModel;
  part?: any;
  technician?: any;
}

export interface Payment {
  id: string;
  invoice_id?: string;
  job_id?: string;
  payment_method: PaymentMethod;
  amount: number;
  gst_component: number;
  reference?: string;
  card_last_four?: string;
  terminal_id?: string;
  notes?: string;
  cashier_id?: string;
  session_id?: string;
  paid_at: string;
  created_at: string;
  cashier?: any;
}

// Cash Session Types
export interface CashSession {
  id: string;
  session_number: string;
  cashier_id: string;
  terminal_id?: string;
  opening_float: number;
  closing_cash?: number;
  expected_cash?: number;
  over_short?: number;
  total_sales: number;
  total_refunds: number;
  opened_at: string;
  closed_at?: string;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
  reconciliation_summary?: Record<string, any>;
  cashier?: any;
}

// Warranty Export Types
export interface WarrantyExport {
  id: string;
  brand_id: string;
  export_format: string;
  date_range_start: string;
  date_range_end: string;
  records_count: number;
  file_name?: string;
  file_url?: string;
  exported_by?: string;
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  error_log?: Record<string, any>;
  created_at: string;
  brand?: Brand;
  exporter?: any;
}

// Report Filter Types
export interface ReportFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  brandId?: string;
  category?: string;
  modelId?: string;
  technicianId?: string;
  customerId?: string;
  channel?: Channel;
  status?: InvoiceStatus | string;
}

// Dashboard KPI Types
export interface DashboardKPIs {
  totalRevenue: number;
  grossMarginPercent: number;
  avgTicketSize: number;
  jobsCompleted: number;
  quoteConversionPercent: number;
  onTimeCompletionPercent: number;
  inventoryValue: number;
}

// Honda CSV Export Row (exact column order)
export interface HondaCSVRow {
  PurchaseDate: string;
  CustomerFirstName: string;
  CustomerLastName: string;
  Email: string;
  Phone: string;
  Address1: string;
  Address2: string;
  Suburb: string;
  State: string;
  Postcode: string;
  Country: string;
  Brand: string;
  Model: string;
  SerialNumber: string;
  EngineSerial: string;
  InvoiceNumber: string;
  PriceInclGST: string;
}
