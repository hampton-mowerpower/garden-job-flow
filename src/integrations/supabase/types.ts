export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_customers: {
        Row: {
          created_at: string | null
          default_payment_terms: string | null
          emails: string[] | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_payment_terms?: string | null
          emails?: string[] | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_payment_terms?: string | null
          emails?: string[] | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      accounts: {
        Row: {
          created_at: string | null
          id: string
          invoices_to: string[] | null
          name: string
          payments_to: string[] | null
          quotes_to: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoices_to?: string[] | null
          name: string
          payments_to?: string[] | null
          quotes_to?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoices_to?: string[] | null
          name?: string
          payments_to?: string[] | null
          quotes_to?: string[] | null
        }
        Relationships: []
      }
      customer_change_audit: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          job_id: string | null
          new_customer_id: string | null
          old_customer_id: string | null
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          new_customer_id?: string | null
          old_customer_id?: string | null
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          new_customer_id?: string | null
          old_customer_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_change_audit_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
        ]
      }
      customers_db: {
        Row: {
          address: string | null
          company: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          invoice_number: string | null
          job_id: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          invoice_number?: string | null
          job_id?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          invoice_number?: string | null
          job_id?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
        ]
      }
      job_notes: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          note: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          note?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          note?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
        ]
      }
      job_payments: {
        Row: {
          amount: number
          created_at: string | null
          gst_component: number | null
          id: string
          job_id: string | null
          method: string | null
          paid_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          gst_component?: number | null
          id?: string
          job_id?: string | null
          method?: string | null
          paid_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          gst_component?: number | null
          id?: string
          job_id?: string | null
          method?: string | null
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
        ]
      }
      job_sales_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          job_id: string | null
          quantity: number | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_sales_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs_db: {
        Row: {
          balance_due: number | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          grand_total: number | null
          id: string
          job_number: string
          machine_brand: string | null
          machine_category: string | null
          machine_model: string | null
          machine_serial: string | null
          notes: string | null
          problem_description: string | null
          service_notes: string | null
          staff_notes: string | null
          status: string | null
        }
        Insert: {
          balance_due?: number | null
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          grand_total?: number | null
          id?: string
          job_number: string
          machine_brand?: string | null
          machine_category?: string | null
          machine_model?: string | null
          machine_serial?: string | null
          notes?: string | null
          problem_description?: string | null
          service_notes?: string | null
          staff_notes?: string | null
          status?: string | null
        }
        Update: {
          balance_due?: number | null
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          grand_total?: number | null
          id?: string
          job_number?: string
          machine_brand?: string | null
          machine_category?: string | null
          machine_model?: string | null
          machine_serial?: string | null
          notes?: string | null
          problem_description?: string | null
          service_notes?: string | null
          staff_notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_db_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_db"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string | null
          job_id: string | null
          payment_date: string | null
          payment_method: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reminders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          message: string | null
          reminder_date: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          message?: string | null
          reminder_date?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          message?: string | null
          reminder_date?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_reminders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_db"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_customer_duplicates: {
        Args: Record<PropertyKey, never>
        Returns: {
          customer_id: string
          duplicate_ids: string[]
        }[]
      }
      list_jobs_page: {
        Args: { p_before?: string; p_limit?: number; p_status?: string }
        Returns: {
          balance_due: number | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          grand_total: number | null
          id: string
          job_number: string
          machine_brand: string | null
          machine_category: string | null
          machine_model: string | null
          machine_serial: string | null
          notes: string | null
          problem_description: string | null
          service_notes: string | null
          staff_notes: string | null
          status: string | null
        }[]
      }
      search_job_by_number: {
        Args: { p_job_number: string }
        Returns: {
          balance_due: number | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          grand_total: number | null
          id: string
          job_number: string
          machine_brand: string | null
          machine_category: string | null
          machine_model: string | null
          machine_serial: string | null
          notes: string | null
          problem_description: string | null
          service_notes: string | null
          staff_notes: string | null
          status: string | null
        }[]
      }
      search_jobs_by_customer_name: {
        Args: { p_name: string }
        Returns: {
          balance_due: number | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          grand_total: number | null
          id: string
          job_number: string
          machine_brand: string | null
          machine_category: string | null
          machine_model: string | null
          machine_serial: string | null
          notes: string | null
          problem_description: string | null
          service_notes: string | null
          staff_notes: string | null
          status: string | null
        }[]
      }
      search_jobs_by_phone: {
        Args: { p_phone: string }
        Returns: {
          balance_due: number | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          grand_total: number | null
          id: string
          job_number: string
          machine_brand: string | null
          machine_category: string | null
          machine_model: string | null
          machine_serial: string | null
          notes: string | null
          problem_description: string | null
          service_notes: string | null
          staff_notes: string | null
          status: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
