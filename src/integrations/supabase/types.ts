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
      custom_machine_data: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          data_type: string
          id: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          data_type: string
          id?: string
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          data_type?: string
          id?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      customers_db: {
        Row: {
          address: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_parts: {
        Row: {
          created_at: string
          id: string
          job_id: string
          part_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          part_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          part_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_parts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalogue"
            referencedColumns: ["id"]
          },
        ]
      }
      job_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          gst_component: number
          id: string
          job_id: string
          method: string
          notes: string | null
          paid_at: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          gst_component?: number
          id?: string
          job_id: string
          method: string
          notes?: string | null
          paid_at?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          gst_component?: number
          id?: string
          job_id?: string
          method?: string
          notes?: string | null
          paid_at?: string
          reference?: string | null
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
      job_search_prefs: {
        Row: {
          created_at: string
          id: string
          prefs: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prefs?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prefs?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs_db: {
        Row: {
          assigned_technician: string | null
          balance_due: number
          completed_at: string | null
          created_at: string
          customer_id: string
          discount_type: string | null
          discount_value: number | null
          grand_total: number
          gst: number
          id: string
          job_number: string
          labour_hours: number
          labour_rate: number
          labour_total: number
          machine_brand: string
          machine_category: string
          machine_model: string
          machine_serial: string | null
          notes: string | null
          parts_required: string | null
          parts_subtotal: number
          problem_description: string
          quotation_amount: number | null
          recommendations: string | null
          service_deposit: number | null
          service_performed: string | null
          status: string
          subtotal: number
          updated_at: string
        }
        Insert: {
          assigned_technician?: string | null
          balance_due?: number
          completed_at?: string | null
          created_at?: string
          customer_id: string
          discount_type?: string | null
          discount_value?: number | null
          grand_total?: number
          gst?: number
          id?: string
          job_number: string
          labour_hours?: number
          labour_rate?: number
          labour_total?: number
          machine_brand: string
          machine_category: string
          machine_model: string
          machine_serial?: string | null
          notes?: string | null
          parts_required?: string | null
          parts_subtotal?: number
          problem_description: string
          quotation_amount?: number | null
          recommendations?: string | null
          service_deposit?: number | null
          service_performed?: string | null
          status?: string
          subtotal?: number
          updated_at?: string
        }
        Update: {
          assigned_technician?: string | null
          balance_due?: number
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          discount_type?: string | null
          discount_value?: number | null
          grand_total?: number
          gst?: number
          id?: string
          job_number?: string
          labour_hours?: number
          labour_rate?: number
          labour_total?: number
          machine_brand?: string
          machine_category?: string
          machine_model?: string
          machine_serial?: string | null
          notes?: string | null
          parts_required?: string | null
          parts_subtotal?: number
          problem_description?: string
          quotation_amount?: number | null
          recommendations?: string | null
          service_deposit?: number | null
          service_performed?: string | null
          status?: string
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_db_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_db_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_db"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_audit_log: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          part_id: string | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          part_id?: string | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          part_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_audit_log_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalogue"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_catalogue: {
        Row: {
          base_price: number
          category: string
          competitor_price: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          in_stock: boolean
          markup: number | null
          name: string
          sell_price: number
          sku: string
          source: string | null
          stock_quantity: number
          supplier: string | null
          upc: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_price: number
          category: string
          competitor_price?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          in_stock?: boolean
          markup?: number | null
          name: string
          sell_price: number
          sku: string
          source?: string | null
          stock_quantity?: number
          supplier?: string | null
          upc?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_price?: number
          category?: string
          competitor_price?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          in_stock?: boolean
          markup?: number | null
          name?: string
          sell_price?: number
          sku?: string
          source?: string | null
          stock_quantity?: number
          supplier?: string | null
          upc?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      service_reminders: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          error_message: string | null
          id: string
          job_id: string | null
          message: string | null
          reminder_date: string
          reminder_type: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          reminder_date: string
          reminder_type: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          reminder_date?: string
          reminder_type?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reminders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reminders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_job_notes: {
        Row: {
          created_at: string
          id: string
          job_id: string
          note_text: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          note_text: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          note_text?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          permissions: string[] | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          permissions?: string[] | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          permissions?: string[] | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_takings: {
        Args: { end_date: string; start_date: string }
        Returns: {
          average_job_value: number
          date: string
          total_jobs: number
          total_revenue: number
        }[]
      }
      get_parts_usage_report: {
        Args: { end_date: string; start_date: string }
        Returns: {
          part_id: string
          part_name: string
          sku: string
          total_quantity: number
          total_value: number
        }[]
      }
      get_technician_productivity: {
        Args: {
          end_date: string
          filter_technician_id?: string
          start_date: string
        }
        Returns: {
          average_job_time: number
          jobs_completed: number
          technician_id: string
          technician_name: string
          total_revenue: number
        }[]
      }
      has_any_role: {
        Args: { _roles: string[]; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
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
