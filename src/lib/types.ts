// Shared types for API responses

export type JobListRow = {
  id: string;
  job_number: string;
  status: string;
  created_at: string;
  grand_total: number | null;
  balance_due: number | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  machine_category: string | null;
  machine_brand: string | null;
  machine_model: string | null;
  machine_serial: string | null;
  problem_description: string | null;
  latest_note_text: string | null;
  latest_note_at: string | null;
};
