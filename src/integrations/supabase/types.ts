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
      account_customer_messages: {
        Row: {
          account_customer_id: string
          created_at: string
          error_message: string | null
          id: string
          message_type: string
          payload: Json | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          account_customer_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_type: string
          payload?: Json | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          account_customer_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_type?: string
          payload?: Json | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_customer_messages_account_customer_id_fkey"
            columns: ["account_customer_id"]
            isOneToOne: false
            referencedRelation: "account_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      account_customers: {
        Row: {
          active: boolean | null
          created_at: string
          default_payment_terms: string | null
          emails: string[] | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          default_payment_terms?: string | null
          emails?: string[] | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          default_payment_terms?: string | null
          emails?: string[] | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          meta: Json | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          oem_export_format: string | null
          oem_export_required: boolean | null
          supplier: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          oem_export_format?: string | null
          oem_export_required?: boolean | null
          supplier?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          oem_export_format?: string | null
          oem_export_required?: boolean | null
          supplier?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      cash_sessions: {
        Row: {
          cashier_id: string
          closed_at: string | null
          closing_cash: number | null
          expected_cash: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_float: number | null
          over_short: number | null
          reconciliation_summary: Json | null
          session_number: string
          status: string | null
          terminal_id: string | null
          total_refunds: number | null
          total_sales: number | null
        }
        Insert: {
          cashier_id: string
          closed_at?: string | null
          closing_cash?: number | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_float?: number | null
          over_short?: number | null
          reconciliation_summary?: Json | null
          session_number: string
          status?: string | null
          terminal_id?: string | null
          total_refunds?: number | null
          total_sales?: number | null
        }
        Update: {
          cashier_id?: string
          closed_at?: string | null
          closing_cash?: number | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_float?: number | null
          over_short?: number | null
          reconciliation_summary?: Json | null
          session_number?: string
          status?: string | null
          terminal_id?: string | null
          total_refunds?: number | null
          total_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string
          display_order: number | null
          id: string
          name: string
          rate_default: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
          rate_default?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
          rate_default?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      category_common_brands: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string
          display_order: number | null
          free_text: string | null
          id: string
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          display_order?: number | null
          free_text?: string | null
          id?: string
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          display_order?: number | null
          free_text?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_common_brands_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_common_brands_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
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
      invoice_lines: {
        Row: {
          brand_id: string | null
          created_at: string
          description: string
          discount_amount: number | null
          discount_percent: number | null
          engine_serial: string | null
          id: string
          invoice_id: string
          line_total: number
          line_type: string
          model_id: string | null
          notes: string | null
          part_id: string | null
          quantity: number | null
          serial_number: string | null
          tax_code: string | null
          technician_id: string | null
          unit_price: number
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          description: string
          discount_amount?: number | null
          discount_percent?: number | null
          engine_serial?: string | null
          id?: string
          invoice_id: string
          line_total: number
          line_type: string
          model_id?: string | null
          notes?: string | null
          part_id?: string | null
          quantity?: number | null
          serial_number?: string | null
          tax_code?: string | null
          technician_id?: string | null
          unit_price: number
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          description?: string
          discount_amount?: number | null
          discount_percent?: number | null
          engine_serial?: string | null
          id?: string
          invoice_id?: string
          line_total?: number
          line_type?: string
          model_id?: string | null
          notes?: string | null
          part_id?: string | null
          quantity?: number | null
          serial_number?: string | null
          tax_code?: string | null
          technician_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "machinery_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_due: number | null
          cashier_id: string | null
          channel: string | null
          completed_at: string | null
          created_at: string
          customer_id: string | null
          deposit_amount: number | null
          discount_amount: number | null
          discount_type: string | null
          discount_value: number | null
          gst: number | null
          id: string
          invoice_number: string
          invoice_type: string | null
          job_id: string | null
          notes: string | null
          status: string | null
          subtotal: number | null
          surcharge_amount: number | null
          total: number | null
          updated_at: string
        }
        Insert: {
          balance_due?: number | null
          cashier_id?: string | null
          channel?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          deposit_amount?: number | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          gst?: number | null
          id?: string
          invoice_number: string
          invoice_type?: string | null
          job_id?: string | null
          notes?: string | null
          status?: string | null
          subtotal?: number | null
          surcharge_amount?: number | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          balance_due?: number | null
          cashier_id?: string | null
          channel?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          deposit_amount?: number | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          gst?: number | null
          id?: string
          invoice_number?: string
          invoice_type?: string | null
          job_id?: string | null
          notes?: string | null
          status?: string | null
          subtotal?: number | null
          surcharge_amount?: number | null
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
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
      job_parts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          job_id: string
          part_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          job_id: string
          part_id?: string | null
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string
          part_id?: string | null
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
          account_customer_id: string | null
          additional_notes: string | null
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
          account_customer_id?: string | null
          additional_notes?: string | null
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
          account_customer_id?: string | null
          additional_notes?: string | null
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
            foreignKeyName: "jobs_db_account_customer_id_fkey"
            columns: ["account_customer_id"]
            isOneToOne: false
            referencedRelation: "account_customers"
            referencedColumns: ["id"]
          },
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
      machine_category_map: {
        Row: {
          category_name: string
          created_at: string
          id: string
          size_tier: string
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          size_tier: string
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          size_tier?: string
        }
        Relationships: []
      }
      machinery_models: {
        Row: {
          active: boolean | null
          brand_id: string
          category: string | null
          cost_price: number | null
          created_at: string
          default_price: number | null
          description: string | null
          id: string
          name: string
          requires_engine_serial: boolean | null
          sku: string | null
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          brand_id: string
          category?: string | null
          cost_price?: number | null
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          name: string
          requires_engine_serial?: boolean | null
          sku?: string | null
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          brand_id?: string
          category?: string | null
          cost_price?: number | null
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          name?: string
          requires_engine_serial?: boolean | null
          sku?: string | null
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machinery_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      machinery_sales: {
        Row: {
          brand_id: string
          channel: string | null
          created_at: string
          customer_id: string
          engine_serial: string | null
          exported_at: string | null
          id: string
          invoice_id: string | null
          model_id: string | null
          model_name: string
          oem_export_errors: Json | null
          oem_export_status: string | null
          price_ex_gst: number | null
          price_incl_gst: number | null
          purchase_date: string
          salesperson_id: string | null
          serial_number: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          channel?: string | null
          created_at?: string
          customer_id: string
          engine_serial?: string | null
          exported_at?: string | null
          id?: string
          invoice_id?: string | null
          model_id?: string | null
          model_name: string
          oem_export_errors?: Json | null
          oem_export_status?: string | null
          price_ex_gst?: number | null
          price_incl_gst?: number | null
          purchase_date: string
          salesperson_id?: string | null
          serial_number: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          channel?: string | null
          created_at?: string
          customer_id?: string
          engine_serial?: string | null
          exported_at?: string | null
          id?: string
          invoice_id?: string | null
          model_id?: string | null
          model_name?: string
          oem_export_errors?: Json | null
          oem_export_status?: string | null
          price_ex_gst?: number | null
          price_incl_gst?: number | null
          purchase_date?: string
          salesperson_id?: string | null
          serial_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machinery_sales_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_sales_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_sales_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "machinery_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_sales_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
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
          brand_id: string | null
          category: string
          category_id: string | null
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
          brand_id?: string | null
          category: string
          category_id?: string | null
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
          brand_id?: string | null
          category?: string
          category_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "parts_catalogue_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_catalogue_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          card_last_four: string | null
          cashier_id: string | null
          created_at: string
          gst_component: number | null
          id: string
          invoice_id: string | null
          job_id: string | null
          notes: string | null
          paid_at: string
          payment_method: string
          reference: string | null
          session_id: string | null
          terminal_id: string | null
        }
        Insert: {
          amount: number
          card_last_four?: string | null
          cashier_id?: string | null
          created_at?: string
          gst_component?: number | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          notes?: string | null
          paid_at?: string
          payment_method: string
          reference?: string | null
          session_id?: string | null
          terminal_id?: string | null
        }
        Update: {
          amount?: number
          card_last_four?: string | null
          cashier_id?: string | null
          created_at?: string
          gst_component?: number | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          notes?: string | null
          paid_at?: string
          payment_method?: string
          reference?: string | null
          session_id?: string | null
          terminal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
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
          created_at: string
          display_order: number | null
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          display_order?: number | null
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          display_order?: number | null
          id?: string
          label?: string
          updated_at?: string
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
      transport_charge_configs: {
        Row: {
          created_at: string
          id: string
          included_km: number | null
          large_base: number | null
          origin_address: string | null
          per_km_rate: number | null
          small_medium_base: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          included_km?: number | null
          large_base?: number | null
          origin_address?: string | null
          per_km_rate?: number | null
          small_medium_base?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          included_km?: number | null
          large_base?: number | null
          origin_address?: string | null
          per_km_rate?: number | null
          small_medium_base?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_approvals: {
        Row: {
          approved_at: string
          approved_by: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string
          approved_by: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string
          approved_by?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          permissions: string[] | null
          role: string
          status: string | null
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
          status?: string | null
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
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_table_layouts: {
        Row: {
          column_order: Json | null
          created_at: string
          id: string
          table_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          column_order?: Json | null
          created_at?: string
          id?: string
          table_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          column_order?: Json | null
          created_at?: string
          id?: string
          table_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      warranty_exports: {
        Row: {
          brand_id: string
          created_at: string
          date_range_end: string
          date_range_start: string
          error_log: Json | null
          export_format: string
          exported_by: string | null
          file_name: string | null
          file_url: string | null
          id: string
          records_count: number | null
          status: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          date_range_end: string
          date_range_start: string
          error_log?: Json | null
          export_format: string
          exported_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          records_count?: number | null
          status?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          error_log?: Json | null
          export_format?: string
          exported_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          records_count?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_exports_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_exports_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
      app_role: "admin" | "manager" | "technician" | "clerk" | "cashier"
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
    Enums: {
      app_role: ["admin", "manager", "technician", "clerk", "cashier"],
    },
  },
} as const
