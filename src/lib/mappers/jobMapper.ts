import type { JobListRow } from "@/lib/types";
import type { Job } from "@/types/job";

export type JobCard = {
  id: string;
  jobNumber: string;
  status: string;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  machineCategory: string | null;
  machineBrand: string | null;
  machineModel: string | null;
  latestNoteText: string | null;
  latestNoteAt: string | null;
  grandTotal: number | null;
  balanceDue: number | null;
};

/**
 * Pure mapper: converts RPC result row to Job type
 * No runtime imports to avoid circular dependencies
 */
export function convertToJob(row: JobListRow): Job & { latestNoteAt?: string } {
  return {
    id: row.id,
    jobNumber: row.job_number,
    status: row.status as any,
    createdAt: new Date(row.job_created_at),
    subtotal: parseFloat(String(row.subtotal || 0)),
    grandTotal: parseFloat(String(row.grand_total || 0)),
    customer: {
      id: row.customer_id || '',
      name: row.customer_name || 'Unknown',
      phone: row.customer_phone || '',
      email: row.customer_email || '',
      address: '',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    customerId: row.customer_id || '',
    machineCategory: row.machine_category || '',
    machineBrand: row.machine_brand || '',
    machineModel: row.machine_model || '',
    machineSerial: row.machine_serial || '',
    problemDescription: row.problem_description || '',
    balanceDue: parseFloat(String(row.balance_due || 0)),
    parts: [],
    labourHours: 0,
    labourRate: 0,
    labourTotal: 0,
    partsSubtotal: 0,
    gst: 0,
    notes: row.latest_note_text || '',
    latestNoteAt: row.latest_note_at || undefined,
    updatedAt: new Date(row.job_updated_at)
  };
}
