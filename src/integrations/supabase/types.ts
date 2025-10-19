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
      account_customer_history: {
        Row: {
          account_customer_id: string
          amount: number | null
          created_at: string
          created_by: string | null
          id: string
          kind: string
          ref_id: string | null
          summary: string
        }
        Insert: {
          account_customer_id: string
          amount?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          ref_id?: string | null
          summary: string
        }
        Update: {
          account_customer_id?: string
          amount?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          ref_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_customer_history_account_customer_id_fkey"
            columns: ["account_customer_id"]
            isOneToOne: false
            referencedRelation: "account_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      account_customer_messages: {
        Row: {
          account_customer_id: string
          created_at: string
          error_message: string | null
          id: string
          message_type: string
          payload: Json | null
          quotation_pdf_url: string | null
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
          quotation_pdf_url?: string | null
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
          quotation_pdf_url?: string | null
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
      accounts: {
        Row: {
          abn: string | null
          active: boolean
          billing_address: string | null
          created_at: string
          email: string | null
          id: string
          invoices_to: string[] | null
          name: string
          name_norm: string | null
          notes: string | null
          payments_to: string[] | null
          phone: string | null
          quotes_to: string[] | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          abn?: string | null
          active?: boolean
          billing_address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invoices_to?: string[] | null
          name: string
          name_norm?: string | null
          notes?: string | null
          payments_to?: string[] | null
          phone?: string | null
          quotes_to?: string[] | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          abn?: string | null
          active?: boolean
          billing_address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invoices_to?: string[] | null
          name?: string
          name_norm?: string | null
          notes?: string | null
          payments_to?: string[] | null
          phone?: string | null
          quotes_to?: string[] | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          changed_at: string | null
          changed_by: string
          changed_fields: string[] | null
          client_ip: unknown | null
          id: number
          new_values: Json | null
          old_values: Json | null
          operation: string
          record_id: string
          request_id: string | null
          review_at: string | null
          review_by: string | null
          review_status: string | null
          reviewed: boolean | null
          source: string | null
          table_name: string
          user_agent: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          changed_fields?: string[] | null
          client_ip?: unknown | null
          id?: number
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          record_id: string
          request_id?: string | null
          review_at?: string | null
          review_by?: string | null
          review_status?: string | null
          reviewed?: boolean | null
          source?: string | null
          table_name: string
          user_agent?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          changed_fields?: string[] | null
          client_ip?: unknown | null
          id?: number
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          record_id?: string
          request_id?: string | null
          review_at?: string | null
          review_by?: string | null
          review_status?: string | null
          reviewed?: boolean | null
          source?: string | null
          table_name?: string
          user_agent?: string | null
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
          category_id: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          normalized_name: string | null
          oem_export_format: string | null
          oem_export_required: boolean | null
          supplier: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          normalized_name?: string | null
          oem_export_format?: string | null
          oem_export_required?: boolean | null
          supplier?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          normalized_name?: string | null
          oem_export_format?: string | null
          oem_export_required?: boolean | null
          supplier?: string | null
          updated_at?: string
          website?: string | null
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
          is_transport_large: boolean | null
          name: string
          normalized_name: string | null
          rate_default: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_transport_large?: boolean | null
          name: string
          normalized_name?: string | null
          rate_default?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_transport_large?: boolean | null
          name?: string
          normalized_name?: string | null
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
      contacts: {
        Row: {
          account_id: string | null
          active: boolean
          address: string | null
          created_at: string
          customer_type: string | null
          display_name: string | null
          email: string | null
          email_lower: string | null
          first_name: string
          full_name: string | null
          id: string
          last_name: string | null
          name_norm: string | null
          notes: string | null
          phone: string | null
          phone_e164: string | null
          phone_local: string | null
          postcode: string | null
          suburb: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          active?: boolean
          address?: string | null
          created_at?: string
          customer_type?: string | null
          display_name?: string | null
          email?: string | null
          email_lower?: string | null
          first_name: string
          full_name?: string | null
          id?: string
          last_name?: string | null
          name_norm?: string | null
          notes?: string | null
          phone?: string | null
          phone_e164?: string | null
          phone_local?: string | null
          postcode?: string | null
          suburb?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          active?: boolean
          address?: string | null
          created_at?: string
          customer_type?: string | null
          display_name?: string | null
          email?: string | null
          email_lower?: string | null
          first_name?: string
          full_name?: string | null
          id?: string
          last_name?: string | null
          name_norm?: string | null
          notes?: string | null
          phone?: string | null
          phone_e164?: string | null
          phone_local?: string | null
          postcode?: string | null
          suburb?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
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
      customer_audit: {
        Row: {
          action: string
          details: Json | null
          id: string
          merged_into_id: string | null
          new_customer_id: string | null
          old_customer_id: string | null
          performed_at: string
          performed_by: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          merged_into_id?: string | null
          new_customer_id?: string | null
          old_customer_id?: string | null
          performed_at?: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          merged_into_id?: string | null
          new_customer_id?: string | null
          old_customer_id?: string | null
          performed_at?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_audit_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "customers_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_audit_new_customer_id_fkey"
            columns: ["new_customer_id"]
            isOneToOne: false
            referencedRelation: "customers_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_audit_old_customer_id_fkey"
            columns: ["old_customer_id"]
            isOneToOne: false
            referencedRelation: "customers_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_audit_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      customer_change_audit: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          created_at: string
          id: string
          job_id: string
          job_number: string | null
          metadata: Json | null
          new_customer_company: string | null
          new_customer_email: string | null
          new_customer_id: string | null
          new_customer_name: string | null
          new_customer_phone: string | null
          old_customer_company: string | null
          old_customer_email: string | null
          old_customer_id: string | null
          old_customer_name: string | null
          old_customer_phone: string | null
          tenant_id: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          job_id: string
          job_number?: string | null
          metadata?: Json | null
          new_customer_company?: string | null
          new_customer_email?: string | null
          new_customer_id?: string | null
          new_customer_name?: string | null
          new_customer_phone?: string | null
          old_customer_company?: string | null
          old_customer_email?: string | null
          old_customer_id?: string | null
          old_customer_name?: string | null
          old_customer_phone?: string | null
          tenant_id?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          job_id?: string
          job_number?: string | null
          metadata?: Json | null
          new_customer_company?: string | null
          new_customer_email?: string | null
          new_customer_id?: string | null
          new_customer_name?: string | null
          new_customer_phone?: string | null
          old_customer_company?: string | null
          old_customer_email?: string | null
          old_customer_id?: string | null
          old_customer_name?: string | null
          old_customer_phone?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_change_audit_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_change_audit_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_change_audit_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
          },
        ]
      }
      customers_db: {
        Row: {
          address: string
          billing_address: string | null
          company_abn: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          email: string | null
          email_norm: string | null
          id: string
          is_deleted: boolean | null
          merged_into_id: string | null
          name: string
          name_lower: string | null
          name_norm: string | null
          normalized_email: string | null
          normalized_phone: string | null
          notes: string | null
          phone: string
          phone_digits: string | null
          phone_e164: string | null
          phone_local: string | null
          postcode: string | null
          suburb: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          address?: string
          billing_address?: string | null
          company_abn?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          email?: string | null
          email_norm?: string | null
          id?: string
          is_deleted?: boolean | null
          merged_into_id?: string | null
          name: string
          name_lower?: string | null
          name_norm?: string | null
          normalized_email?: string | null
          normalized_phone?: string | null
          notes?: string | null
          phone: string
          phone_digits?: string | null
          phone_e164?: string | null
          phone_local?: string | null
          postcode?: string | null
          suburb?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          address?: string
          billing_address?: string | null
          company_abn?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          email?: string | null
          email_norm?: string | null
          id?: string
          is_deleted?: boolean | null
          merged_into_id?: string | null
          name?: string
          name_lower?: string | null
          name_norm?: string | null
          normalized_email?: string | null
          normalized_phone?: string | null
          notes?: string | null
          phone?: string
          phone_digits?: string | null
          phone_e164?: string | null
          phone_local?: string | null
          postcode?: string | null
          suburb?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_db_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "customers_db"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          meta_json: Json | null
          outbox_id: string | null
          provider_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          meta_json?: Json | null
          outbox_id?: string | null
          provider_id?: string | null
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          meta_json?: Json | null
          outbox_id?: string | null
          provider_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "email_outbox"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          attempts: number
          bcc_email: string | null
          cc_email: string | null
          created_at: string
          error_message: string | null
          id: string
          idempotency_key: string
          job_id: string | null
          payload_json: Json
          provider_id: string | null
          sent_at: string | null
          status: string
          subject: string
          template: string
          to_email: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          bcc_email?: string | null
          cc_email?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key: string
          job_id?: string | null
          payload_json?: Json
          provider_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template: string
          to_email: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          bcc_email?: string | null
          cc_email?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string
          job_id?: string | null
          payload_json?: Json
          provider_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template?: string
          to_email?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_outbox_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_outbox_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
          },
        ]
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
          line_memo: string | null
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
          line_memo?: string | null
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
          line_memo?: string | null
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
            referencedRelation: "job_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
          },
        ]
      }
      job_labour: {
        Row: {
          calc_total: number
          created_at: string
          id: string
          job_id: string
          minutes: number
          notes: string | null
          override_total: number | null
          rate_per_hr: number | null
          rate_per_min: number | null
          updated_at: string
        }
        Insert: {
          calc_total?: number
          created_at?: string
          id?: string
          job_id: string
          minutes?: number
          notes?: string | null
          override_total?: number | null
          rate_per_hr?: number | null
          rate_per_min?: number | null
          updated_at?: string
        }
        Update: {
          calc_total?: number
          created_at?: string
          id?: string
          job_id?: string
          minutes?: number
          notes?: string | null
          override_total?: number | null
          rate_per_hr?: number | null
          rate_per_min?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_labour_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_labour_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_labour_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
          },
        ]
      }
      job_notes: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          job_id: string
          note_text: string
          tenant_id: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          job_id: string
          note_text: string
          tenant_id?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          job_id?: string
          note_text?: string
          tenant_id?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
          },
        ]
      }
      job_parts: {
        Row: {
          awaiting_stock: boolean | null
          created_at: string
          description: string
          equipment_category: string | null
          id: string
          is_custom: boolean | null
          job_id: string
          overridden_price: number | null
          override_reason: string | null
          part_group: string | null
          part_id: string | null
          quantity: number
          sku: string | null
          tax_code: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          awaiting_stock?: boolean | null
          created_at?: string
          description: string
          equipment_category?: string | null
          id?: string
          is_custom?: boolean | null
          job_id: string
          overridden_price?: number | null
          override_reason?: string | null
          part_group?: string | null
          part_id?: string | null
          quantity?: number
          sku?: string | null
          tax_code?: string | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          awaiting_stock?: boolean | null
          created_at?: string
          description?: string
          equipment_category?: string | null
          id?: string
          is_custom?: boolean | null
          job_id?: string
          overridden_price?: number | null
          override_reason?: string | null
          part_group?: string | null
          part_id?: string | null
          quantity?: number
          sku?: string | null
          tax_code?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_parts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_parts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_parts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
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
            referencedRelation: "job_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
          },
        ]
      }
      job_recovery_staging: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          created_at: string
          created_by: string
          id: string
          job_id: string
          job_number: string
          recovery_data: Json
          recovery_reason: string
          reverted_at: string | null
          reverted_by: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          job_id: string
          job_number: string
          recovery_data: Json
          recovery_reason: string
          reverted_at?: string | null
          reverted_by?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          job_id?: string
          job_number?: string
          recovery_data?: Json
          recovery_reason?: string
          reverted_at?: string | null
          reverted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_recovery_staging_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_recovery_staging_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_recovery_staging_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
          },
        ]
      }
      job_sales_items: {
        Row: {
          amount: number
          category: string
          collect_with_job: boolean | null
          created_at: string | null
          customer_id: string
          description: string
          id: string
          job_id: string
          notes: string | null
          paid_date: string | null
          paid_status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          collect_with_job?: boolean | null
          created_at?: string | null
          customer_id: string
          description: string
          id?: string
          job_id: string
          notes?: string | null
          paid_date?: string | null
          paid_status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          collect_with_job?: boolean | null
          created_at?: string | null
          customer_id?: string
          description?: string
          id?: string
          job_id?: string
          notes?: string | null
          paid_date?: string | null
          paid_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_sales_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_sales_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_sales_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_sales_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
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
          account_id: string | null
          additional_notes: string | null
          assigned_technician: string | null
          attachments: Json | null
          balance_due: number
          brand_norm: string | null
          category_norm: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          customer_id: string
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          deleted_at: string | null
          deleted_by: string | null
          delivered_at: string | null
          discount_type: string | null
          discount_value: number | null
          grand_total: number
          gst: number
          id: string
          job_company_name: string | null
          job_number: string
          job_number_digits: string | null
          job_number_norm: string | null
          job_type: string | null
          labour_hours: number
          labour_rate: number
          labour_total: number
          machine_brand: string
          machine_category: string
          machine_model: string
          machine_serial: string | null
          model_norm: string | null
          notes: string | null
          parts_required: string | null
          parts_subtotal: number
          problem_description: string
          quotation_amount: number | null
          quotation_approved_at: string | null
          quotation_status: string | null
          recommendations: string | null
          requested_finish_date: string | null
          serial_norm: string | null
          service_deposit: number | null
          service_performed: string | null
          sharpen_breakdown: string | null
          sharpen_items: Json | null
          sharpen_total_charge: number | null
          small_repair_details: string | null
          small_repair_minutes: number | null
          small_repair_rate: number | null
          small_repair_total: number | null
          status: string
          subtotal: number
          tenant_id: string | null
          transport_breakdown: string | null
          transport_delivery_distance_km: number | null
          transport_delivery_required: boolean | null
          transport_distance_km: number | null
          transport_distance_source: string | null
          transport_pickup_distance_km: number | null
          transport_pickup_required: boolean | null
          transport_size_tier: string | null
          transport_total_charge: number | null
          updated_at: string
          version: number | null
        }
        Insert: {
          account_customer_id?: string | null
          account_id?: string | null
          additional_notes?: string | null
          assigned_technician?: string | null
          attachments?: Json | null
          balance_due?: number
          brand_norm?: string | null
          category_norm?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          customer_id: string
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          deleted_at?: string | null
          deleted_by?: string | null
          delivered_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          grand_total?: number
          gst?: number
          id?: string
          job_company_name?: string | null
          job_number: string
          job_number_digits?: string | null
          job_number_norm?: string | null
          job_type?: string | null
          labour_hours?: number
          labour_rate?: number
          labour_total?: number
          machine_brand: string
          machine_category: string
          machine_model: string
          machine_serial?: string | null
          model_norm?: string | null
          notes?: string | null
          parts_required?: string | null
          parts_subtotal?: number
          problem_description: string
          quotation_amount?: number | null
          quotation_approved_at?: string | null
          quotation_status?: string | null
          recommendations?: string | null
          requested_finish_date?: string | null
          serial_norm?: string | null
          service_deposit?: number | null
          service_performed?: string | null
          sharpen_breakdown?: string | null
          sharpen_items?: Json | null
          sharpen_total_charge?: number | null
          small_repair_details?: string | null
          small_repair_minutes?: number | null
          small_repair_rate?: number | null
          small_repair_total?: number | null
          status?: string
          subtotal?: number
          tenant_id?: string | null
          transport_breakdown?: string | null
          transport_delivery_distance_km?: number | null
          transport_delivery_required?: boolean | null
          transport_distance_km?: number | null
          transport_distance_source?: string | null
          transport_pickup_distance_km?: number | null
          transport_pickup_required?: boolean | null
          transport_size_tier?: string | null
          transport_total_charge?: number | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          account_customer_id?: string | null
          account_id?: string | null
          additional_notes?: string | null
          assigned_technician?: string | null
          attachments?: Json | null
          balance_due?: number
          brand_norm?: string | null
          category_norm?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          customer_id?: string
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          deleted_at?: string | null
          deleted_by?: string | null
          delivered_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          grand_total?: number
          gst?: number
          id?: string
          job_company_name?: string | null
          job_number?: string
          job_number_digits?: string | null
          job_number_norm?: string | null
          job_type?: string | null
          labour_hours?: number
          labour_rate?: number
          labour_total?: number
          machine_brand?: string
          machine_category?: string
          machine_model?: string
          machine_serial?: string | null
          model_norm?: string | null
          notes?: string | null
          parts_required?: string | null
          parts_subtotal?: number
          problem_description?: string
          quotation_amount?: number | null
          quotation_approved_at?: string | null
          quotation_status?: string | null
          recommendations?: string | null
          requested_finish_date?: string | null
          serial_norm?: string | null
          service_deposit?: number | null
          service_performed?: string | null
          sharpen_breakdown?: string | null
          sharpen_items?: Json | null
          sharpen_total_charge?: number | null
          small_repair_details?: string | null
          small_repair_minutes?: number | null
          small_repair_rate?: number | null
          small_repair_total?: number | null
          status?: string
          subtotal?: number
          tenant_id?: string | null
          transport_breakdown?: string | null
          transport_delivery_distance_km?: number | null
          transport_delivery_required?: boolean | null
          transport_distance_km?: number | null
          transport_distance_source?: string | null
          transport_pickup_distance_km?: number | null
          transport_pickup_required?: boolean | null
          transport_size_tier?: string | null
          transport_total_charge?: number | null
          updated_at?: string
          version?: number | null
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
            foreignKeyName: "jobs_db_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
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
            foreignKeyName: "jobs_db_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
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
          normalized_name: string | null
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
          normalized_name?: string | null
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
          normalized_name?: string | null
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
            referencedRelation: "job_calculated_totals"
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
            foreignKeyName: "machinery_sales_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
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
      maintenance_audit: {
        Row: {
          action: string
          description: string | null
          id: string
          metadata: Json | null
          performed_at: string
          performed_by: string | null
          rows_affected: number | null
          table_name: string
        }
        Insert: {
          action: string
          description?: string | null
          id?: string
          metadata?: Json | null
          performed_at?: string
          performed_by?: string | null
          rows_affected?: number | null
          table_name: string
        }
        Update: {
          action?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          performed_at?: string
          performed_by?: string | null
          rows_affected?: number | null
          table_name?: string
        }
        Relationships: []
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
          part_group: string | null
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
          part_group?: string | null
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
          part_group?: string | null
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
            referencedRelation: "job_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
          },
        ]
      }
      protected_field_changes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_reason: string
          changed_at: string
          changed_by: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_reason: string
          changed_at?: string
          changed_by: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_reason?: string
          changed_at?: string
          changed_by?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
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
      record_locks: {
        Row: {
          id: string
          lock_reason: string | null
          locked_at: string
          locked_by: string
          record_id: string
          table_name: string
        }
        Insert: {
          id?: string
          lock_reason?: string | null
          locked_at?: string
          locked_by: string
          record_id: string
          table_name: string
        }
        Update: {
          id?: string
          lock_reason?: string | null
          locked_at?: string
          locked_by?: string
          record_id?: string
          table_name?: string
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
          machine_brand: string | null
          machine_category: string | null
          machine_model: string | null
          machine_serial: string | null
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
          machine_brand?: string | null
          machine_category?: string | null
          machine_model?: string | null
          machine_serial?: string | null
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
          machine_brand?: string | null
          machine_category?: string | null
          machine_model?: string | null
          machine_serial?: string | null
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
            referencedRelation: "job_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reminders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reminders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
          },
        ]
      }
      shadow_audit_log: {
        Row: {
          audit_type: string
          details: Json
          detected_at: string
          id: string
          record_id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          table_name: string
        }
        Insert: {
          audit_type: string
          details: Json
          detected_at?: string
          id?: string
          record_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          table_name: string
        }
        Update: {
          audit_type?: string
          details?: Json
          detected_at?: string
          id?: string
          record_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          table_name?: string
        }
        Relationships: []
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
            referencedRelation: "job_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_db"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["job_id"]
          },
        ]
      }
      system_maintenance_mode: {
        Row: {
          affected_tables: string[]
          disabled_at: string | null
          enabled_at: string | null
          enabled_by: string | null
          excluded_roles: string[]
          id: string
          mode_type: string
          reason: string | null
        }
        Insert: {
          affected_tables: string[]
          disabled_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          excluded_roles?: string[]
          id?: string
          mode_type: string
          reason?: string | null
        }
        Update: {
          affected_tables?: string[]
          disabled_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          excluded_roles?: string[]
          id?: string
          mode_type?: string
          reason?: string | null
        }
        Relationships: []
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
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
      job_calculated_totals: {
        Row: {
          balance_mismatch: boolean | null
          calculated_balance_due: number | null
          calculated_grand_total: number | null
          calculated_gst: number | null
          calculated_subtotal: number | null
          id: string | null
          job_number: string | null
          parts_count: number | null
          parts_total: number | null
          payment_count: number | null
          stored_balance_due: number | null
          stored_deposit: number | null
          stored_grand_total: number | null
          total_mismatch: boolean | null
          total_paid: number | null
        }
        Relationships: []
      }
      v_jobs_list: {
        Row: {
          balance_due: number | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          grand_total: number | null
          job_id: string | null
          job_number: string | null
          machine_brand: string | null
          machine_category: string | null
          machine_model: string | null
          machine_serial: string | null
          problem_description: string | null
          status: string | null
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
    }
    Functions: {
      _ef_read_job_detail: {
        Args: { p_job_id: string }
        Returns: {
          balance_due: number
          created_at: string
          customer_address: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
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
          machine_serial: string
          notes: string
          parts_subtotal: number
          problem_description: string
          recommendations: string
          service_performed: string
          status: string
          subtotal: number
          updated_at: string
        }[]
      }
      _ef_read_jobs_list: {
        Args: { p_limit: number; p_offset: number }
        Returns: {
          balance_due: number
          created_at: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          grand_total: number
          job_id: string
          job_number: string
          machine_brand: string
          machine_category: string
          machine_model: string
          machine_serial: string
          problem_description: string
          status: string
        }[]
      }
      api_health_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          now: string
          ok: boolean
        }[]
      }
      compute_job_totals: {
        Args: { p_job_id: string }
        Returns: Json
      }
      digits_only: {
        Args: { t: string }
        Returns: string
      }
      find_customer_deterministic: {
        Args: {
          p_email?: string
          p_name?: string
          p_phone: string
          p_suburb?: string
        }
        Returns: {
          customer_id: string
          match_score: number
          match_type: string
        }[]
      }
      find_customer_duplicates: {
        Args: Record<PropertyKey, never>
        Returns: {
          customer_id: string
          duplicate_count: number
          duplicate_ids: string[]
          email: string
          name: string
          phone: string
        }[]
      }
      find_duplicate_brands: {
        Args: Record<PropertyKey, never>
        Returns: {
          brand_ids: string[]
          brand_names: string[]
          category_id: string
          category_name: string
          model_count: number
          normalized_name: string
        }[]
      }
      find_duplicate_categories: {
        Args: Record<PropertyKey, never>
        Returns: {
          brand_count: number
          category_ids: string[]
          category_names: string[]
          normalized_name: string
          part_count: number
        }[]
      }
      find_jobs_with_calculation_errors: {
        Args: Record<PropertyKey, never>
        Returns: {
          balance_diff: number
          calculated_balance: number
          calculated_total: number
          difference: number
          job_number: string
          stored_balance: number
          stored_total: number
        }[]
      }
      find_or_create_customer: {
        Args: {
          p_address?: string
          p_company_name?: string
          p_customer_type?: Database["public"]["Enums"]["customer_type"]
          p_email?: string
          p_name: string
          p_phone: string
        }
        Returns: string
      }
      find_rapid_changes: {
        Args: { minutes?: number; threshold?: number }
        Returns: {
          change_count: number
          first_change: string
          job_number: string
          last_change: string
          record_id: string
          table_name: string
          time_span: unknown
        }[]
      }
      find_suspicious_customer_changes: {
        Args: { days?: number }
        Returns: {
          change_reason: string
          changed_at: string
          changed_by_user: string
          job_number: string
          new_customer: string
          old_customer: string
        }[]
      }
      fn_search_customers: {
        Args: {
          limit_count?: number
          offset_count?: number
          search_query?: string
        }
        Returns: {
          address: string
          company_name: string
          created_at: string
          customer_type: Database["public"]["Enums"]["customer_type"]
          email: string
          id: string
          name: string
          notes: string
          phone: string
          postcode: string
          suburb: string
          updated_at: string
        }[]
      }
      get_all_jobs_simple: {
        Args: Record<PropertyKey, never>
        Returns: {
          balance_due: number
          created_at: string
          customer_id: string
          grand_total: number
          id: string
          job_number: string
          status: string
        }[]
      }
      get_brand_reference_count: {
        Args: { brand_id: string }
        Returns: Json
      }
      get_category_reference_count: {
        Args: { category_id: string }
        Returns: Json
      }
      get_customers_by_ids: {
        Args: { p_customer_ids: string[] }
        Returns: {
          address: string
          email: string
          id: string
          name: string
          phone: string
          postcode: string
          suburb: string
        }[]
      }
      get_daily_takings: {
        Args: { end_date: string; start_date: string }
        Returns: {
          average_job_value: number
          date: string
          total_jobs: number
          total_revenue: number
        }[]
      }
      get_job_audit_trail: {
        Args: { p_job_id: string }
        Returns: {
          changed_at: string
          changed_by: string
          changed_fields: string[]
          new_values: Json
          old_values: Json
          operation: string
        }[]
      }
      get_job_detail_simple: {
        Args: { p_job_id: string }
        Returns: {
          balance_due: number
          created_at: string
          customer_address: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
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
          machine_serial: string
          notes: string
          parts_subtotal: number
          problem_description: string
          recommendations: string
          service_performed: string
          status: string
          subtotal: number
          updated_at: string
          version: number
        }[]
      }
      get_job_details: {
        Args: { p_job_id: string }
        Returns: {
          additional_notes: string
          assigned_technician: string
          balance_due: number
          completed_at: string
          created_at: string
          customer_address: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          customer_postcode: string
          customer_suburb: string
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
          machine_serial: string
          notes: string
          parts_subtotal: number
          problem_description: string
          quotation_amount: number
          quotation_status: string
          recommendations: string
          requested_finish_date: string
          service_deposit: number
          service_performed: string
          sharpen_total_charge: number
          small_repair_total: number
          status: string
          subtotal: number
          transport_delivery_required: boolean
          transport_pickup_required: boolean
          transport_total_charge: number
          updated_at: string
        }[]
      }
      get_jobs_list_simple: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          balance_due: number
          created_at: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          grand_total: number
          id: string
          job_number: string
          machine_brand: string
          machine_category: string
          machine_model: string
          machine_serial: string
          problem_description: string
          status: string
        }[]
      }
      get_machine_brands: {
        Args: { p_category_id?: string }
        Returns: {
          category_id: string
          id: string
          name: string
        }[]
      }
      get_machine_categories: {
        Args: Record<PropertyKey, never>
        Returns: {
          display_order: number
          id: string
          name: string
          rate_default: number
        }[]
      }
      get_machine_models: {
        Args: { p_brand_id?: string }
        Returns: {
          brand_id: string
          id: string
          name: string
        }[]
      }
      get_null_overwrites: {
        Args: { days?: number }
        Returns: {
          changed_at: string
          changed_by: string
          fields_nullified: string[]
          job_number: string
          record_id: string
          table_name: string
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
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_any_role: {
        Args: { _roles: string[]; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      link_jobs_to_contacts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      list_jobs_page: {
        Args: { p_before?: string; p_limit?: number; p_status?: string }
        Returns: {
          balance_due: number
          created_at: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          grand_total: number
          id: string
          job_number: string
          machine_brand: string
          machine_category: string
          machine_model: string
          machine_serial: string
          problem_description: string
          status: string
        }[]
      }
      merge_brands: {
        Args: { duplicate_ids: string[]; primary_id: string }
        Returns: Json
      }
      merge_categories: {
        Args: { duplicate_ids: string[]; primary_id: string }
        Returns: Json
      }
      norm_text: {
        Args: { t: string }
        Returns: string
      }
      normalize_contact_name: {
        Args: { txt: string }
        Returns: string
      }
      normalize_name: {
        Args: { input_text: string }
        Returns: string
      }
      normalize_phone: {
        Args: { phone_input: string }
        Returns: string
      }
      normalize_phone_e164: {
        Args: { phone_local: string }
        Returns: string
      }
      recover_citywide_contacts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      search_job_by_number: {
        Args: { p_job_number: string }
        Returns: {
          balance_due: number
          created_at: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          grand_total: number
          id: string
          job_number: string
          machine_brand: string
          machine_category: string
          machine_model: string
          machine_serial: string
          problem_description: string
          status: string
        }[]
      }
      search_jobs_by_customer_name: {
        Args: { p_limit?: number; p_name: string }
        Returns: {
          balance_due: number
          created_at: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          grand_total: number
          id: string
          job_number: string
          machine_brand: string
          machine_category: string
          machine_model: string
          machine_serial: string
          problem_description: string
          status: string
        }[]
      }
      search_jobs_by_phone: {
        Args: { p_limit?: number; p_phone: string }
        Returns: {
          balance_due: number
          created_at: string
          customer_id: string
          customer_name: string
          customer_phone: string
          grand_total: number
          id: string
          job_number: string
          machine_brand: string
          machine_category: string
          machine_model: string
          problem_description: string
          status: string
        }[]
      }
      search_jobs_unified: {
        Args: { p_limit?: number; p_query: string; p_tenant_id?: string }
        Returns: {
          balance_due: number
          created_at: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          grand_total: number
          id: string
          job_number: string
          machine_brand: string
          machine_category: string
          machine_model: string
          machine_serial: string
          problem_description: string
          status: string
        }[]
      }
      seed_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      update_job_simple: {
        Args: { p_job_id: string; p_patch: Json; p_version: number }
        Returns: Json
      }
      upsert_contact: {
        Args: {
          p_account_id: string
          p_email?: string
          p_first_name: string
          p_last_name?: string
          p_phone?: string
          p_tenant_id?: string
        }
        Returns: string
      }
      validate_job_customer_links: {
        Args: Record<PropertyKey, never>
        Returns: {
          customer_id: string
          issue: string
          job_number: string
          severity: string
        }[]
      }
      verify_job_recovery: {
        Args: { p_job_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "technician" | "clerk" | "cashier"
      customer_type: "commercial" | "domestic"
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
      customer_type: ["commercial", "domestic"],
    },
  },
} as const
