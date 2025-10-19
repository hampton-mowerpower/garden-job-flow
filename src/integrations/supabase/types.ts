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
          active: boolean | null
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
          active?: boolean | null
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
          active?: boolean | null
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
      brands: {
        Row: {
          active: boolean | null
          category_id: string | null
          created_at: string | null
          id: string
          name: string
          normalized_name: string | null
          oem_export_required: boolean | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          normalized_name?: string | null
          oem_export_required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          normalized_name?: string | null
          oem_export_required?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          normalized_name: string | null
          rate_default: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          normalized_name?: string | null
          rate_default?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          normalized_name?: string | null
          rate_default?: number | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          account_id: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string
          id: string
          last_name: string | null
          phone: string | null
          role: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name: string
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_audit: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_audit_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_db"
            referencedColumns: ["id"]
          },
        ]
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
          customer_type: string | null
          deleted_at: string | null
          email: string | null
          id: string
          is_deleted: boolean | null
          name: string
          notes: string | null
          phone: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean | null
          name: string
          notes?: string | null
          phone: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          notes?: string | null
          phone?: string
        }
        Relationships: []
      }
      email_outbox: {
        Row: {
          attempts: number | null
          body: string | null
          created_at: string | null
          error_message: string | null
          id: string
          sent_at: string | null
          status: string | null
          subject: string | null
          template: string | null
          to_email: string
        }
        Insert: {
          attempts?: number | null
          body?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template?: string | null
          to_email: string
        }
        Update: {
          attempts?: number | null
          body?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template?: string | null
          to_email?: string
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
          note_text: string | null
          user_id: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          note?: string | null
          note_text?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          note?: string | null
          note_text?: string | null
          user_id?: string | null
          visibility?: string | null
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
      job_parts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          job_id: string | null
          part_id: string | null
          quantity: number | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          part_id?: string | null
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          part_id?: string | null
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
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
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          grand_total: number | null
          id: string
          job_number: string
          labour_total: number | null
          machine_brand: string | null
          machine_category: string | null
          machine_model: string | null
          machine_serial: string | null
          notes: string | null
          problem_description: string | null
          service_notes: string | null
          sharpen_total_charge: number | null
          small_repair_total: number | null
          staff_notes: string | null
          status: string | null
          tenant_id: string | null
          transport_total_charge: number | null
        }
        Insert: {
          balance_due?: number | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          grand_total?: number | null
          id?: string
          job_number: string
          labour_total?: number | null
          machine_brand?: string | null
          machine_category?: string | null
          machine_model?: string | null
          machine_serial?: string | null
          notes?: string | null
          problem_description?: string | null
          service_notes?: string | null
          sharpen_total_charge?: number | null
          small_repair_total?: number | null
          staff_notes?: string | null
          status?: string | null
          tenant_id?: string | null
          transport_total_charge?: number | null
        }
        Update: {
          balance_due?: number | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          grand_total?: number | null
          id?: string
          job_number?: string
          labour_total?: number | null
          machine_brand?: string | null
          machine_category?: string | null
          machine_model?: string | null
          machine_serial?: string | null
          notes?: string | null
          problem_description?: string | null
          service_notes?: string | null
          sharpen_total_charge?: number | null
          small_repair_total?: number | null
          staff_notes?: string | null
          status?: string | null
          tenant_id?: string | null
          transport_total_charge?: number | null
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
      machine_category_map: {
        Row: {
          category_name: string
          created_at: string | null
          id: string
          size_tier: string | null
        }
        Insert: {
          category_name: string
          created_at?: string | null
          id?: string
          size_tier?: string | null
        }
        Update: {
          category_name?: string
          created_at?: string | null
          id?: string
          size_tier?: string | null
        }
        Relationships: []
      }
      machinery_models: {
        Row: {
          active: boolean | null
          brand_id: string | null
          category: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          default_price: number | null
          description: string | null
          honda_model_code: string | null
          id: string
          name: string
          normalized_name: string | null
          oem_export_required: boolean | null
          requires_engine_serial: boolean | null
          sku: string | null
          tax_code: string | null
          updated_at: string | null
          warranty_months: number | null
        }
        Insert: {
          active?: boolean | null
          brand_id?: string | null
          category?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          default_price?: number | null
          description?: string | null
          honda_model_code?: string | null
          id?: string
          name: string
          normalized_name?: string | null
          oem_export_required?: boolean | null
          requires_engine_serial?: boolean | null
          sku?: string | null
          tax_code?: string | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Update: {
          active?: boolean | null
          brand_id?: string | null
          category?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          default_price?: number | null
          description?: string | null
          honda_model_code?: string | null
          id?: string
          name?: string
          normalized_name?: string | null
          oem_export_required?: boolean | null
          requires_engine_serial?: boolean | null
          sku?: string | null
          tax_code?: string | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "machinery_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_models_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_audit_log: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          part_id: string | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          part_id?: string | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
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
          active: boolean | null
          base_price: number | null
          category: string | null
          competitor_price: number | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          in_stock: boolean | null
          markup: number | null
          name: string | null
          part_group: string | null
          part_number: string
          sell_price: number | null
          sku: string | null
          source: string | null
          stock_quantity: number | null
          supplier: string | null
          upc: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          base_price?: number | null
          category?: string | null
          competitor_price?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          in_stock?: boolean | null
          markup?: number | null
          name?: string | null
          part_group?: string | null
          part_number: string
          sell_price?: number | null
          sku?: string | null
          source?: string | null
          stock_quantity?: number | null
          supplier?: string | null
          upc?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          base_price?: number | null
          category?: string | null
          competitor_price?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          in_stock?: boolean | null
          markup?: number | null
          name?: string | null
          part_group?: string | null
          part_number?: string
          sell_price?: number | null
          sku?: string | null
          source?: string | null
          stock_quantity?: number | null
          supplier?: string | null
          upc?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      quick_problems: {
        Row: {
          active: boolean | null
          created_at: string | null
          display_order: number | null
          id: string
          label: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          label: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          label?: string
        }
        Relationships: []
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
      transport_charge_configs: {
        Row: {
          active: boolean | null
          base_charge: number | null
          created_at: string | null
          id: string
          included_km: number | null
          large_base: number | null
          min_charge: number | null
          origin_address: string | null
          per_km_charge: number | null
          per_km_rate: number | null
          small_medium_base: number | null
          zone_name: string
        }
        Insert: {
          active?: boolean | null
          base_charge?: number | null
          created_at?: string | null
          id?: string
          included_km?: number | null
          large_base?: number | null
          min_charge?: number | null
          origin_address?: string | null
          per_km_charge?: number | null
          per_km_rate?: number | null
          small_medium_base?: number | null
          zone_name: string
        }
        Update: {
          active?: boolean | null
          base_charge?: number | null
          created_at?: string | null
          id?: string
          included_km?: number | null
          large_base?: number | null
          min_charge?: number | null
          origin_address?: string | null
          per_km_charge?: number | null
          per_km_rate?: number | null
          small_medium_base?: number | null
          zone_name?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_table_layouts: {
        Row: {
          column_order: Json | null
          created_at: string | null
          id: string
          table_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          column_order?: Json | null
          created_at?: string | null
          id?: string
          table_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          column_order?: Json | null
          created_at?: string | null
          id?: string
          table_name?: string
          updated_at?: string | null
          user_id?: string
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
      find_duplicate_brands: {
        Args: Record<PropertyKey, never>
        Returns: {
          brand_id: string
          duplicate_ids: string[]
        }[]
      }
      find_duplicate_categories: {
        Args: Record<PropertyKey, never>
        Returns: {
          category_id: string
          duplicate_ids: string[]
        }[]
      }
      fn_search_customers: {
        Args: { p_search: string }
        Returns: {
          address: string | null
          company: string | null
          created_at: string | null
          customer_type: string | null
          deleted_at: string | null
          email: string | null
          id: string
          is_deleted: boolean | null
          name: string
          notes: string | null
          phone: string
        }[]
      }
      get_daily_takings: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          date: string
          job_count: number
          total_revenue: number
        }[]
      }
      get_job_stats_efficient: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_parts_usage_report: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          part_id: string
          part_name: string
          quantity_used: number
          total_value: number
        }[]
      }
      get_technician_productivity: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          avg_job_value: number
          jobs_completed: number
          technician: string
          total_revenue: number
        }[]
      }
      list_jobs_page: {
        Args: { p_before?: string; p_limit?: number; p_status?: string }
        Returns: {
          balance_due: number | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          grand_total: number | null
          id: string
          job_number: string
          labour_total: number | null
          machine_brand: string | null
          machine_category: string | null
          machine_model: string | null
          machine_serial: string | null
          notes: string | null
          problem_description: string | null
          service_notes: string | null
          sharpen_total_charge: number | null
          small_repair_total: number | null
          staff_notes: string | null
          status: string | null
          tenant_id: string | null
          transport_total_charge: number | null
        }[]
      }
      merge_brands: {
        Args: { p_keep_id: string; p_merge_ids: string[] }
        Returns: boolean
      }
      merge_categories: {
        Args: { p_keep_id: string; p_merge_ids: string[] }
        Returns: boolean
      }
      search_job_by_number: {
        Args: { p_job_number: string }
        Returns: {
          balance_due: number | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          grand_total: number | null
          id: string
          job_number: string
          labour_total: number | null
          machine_brand: string | null
          machine_category: string | null
          machine_model: string | null
          machine_serial: string | null
          notes: string | null
          problem_description: string | null
          service_notes: string | null
          sharpen_total_charge: number | null
          small_repair_total: number | null
          staff_notes: string | null
          status: string | null
          tenant_id: string | null
          transport_total_charge: number | null
        }[]
      }
      search_jobs_by_customer_name: {
        Args: { p_name: string }
        Returns: {
          balance_due: number | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          grand_total: number | null
          id: string
          job_number: string
          labour_total: number | null
          machine_brand: string | null
          machine_category: string | null
          machine_model: string | null
          machine_serial: string | null
          notes: string | null
          problem_description: string | null
          service_notes: string | null
          sharpen_total_charge: number | null
          small_repair_total: number | null
          staff_notes: string | null
          status: string | null
          tenant_id: string | null
          transport_total_charge: number | null
        }[]
      }
      search_jobs_by_phone: {
        Args: { p_phone: string }
        Returns: {
          balance_due: number | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          grand_total: number | null
          id: string
          job_number: string
          labour_total: number | null
          machine_brand: string | null
          machine_category: string | null
          machine_model: string | null
          machine_serial: string | null
          notes: string | null
          problem_description: string | null
          service_notes: string | null
          sharpen_total_charge: number | null
          small_repair_total: number | null
          staff_notes: string | null
          status: string | null
          tenant_id: string | null
          transport_total_charge: number | null
        }[]
      }
      upsert_contact: {
        Args: {
          p_account_id: string
          p_email: string
          p_full_name: string
          p_phone: string
          p_role: string
        }
        Returns: string
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
