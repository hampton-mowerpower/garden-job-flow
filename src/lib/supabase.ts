// Use the integrated Supabase client
export { supabase } from '@/integrations/supabase/client';

// Database types
export interface Database {
  public: {
    Tables: {
      parts_catalogue: {
        Row: {
          id: string
          sku: string
          upc: string | null
          name: string
          description: string | null
          category: string
          base_price: number
          sell_price: number
          markup: number | null
          competitor_price: number | null
          source: string | null
          in_stock: boolean
          stock_quantity: number
          supplier: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          upc?: string | null
          name: string
          description?: string | null
          category: string
          base_price: number
          sell_price: number
          markup?: number | null
          competitor_price?: number | null
          source?: string | null
          in_stock?: boolean
          stock_quantity?: number
          supplier?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          upc?: string | null
          name?: string
          description?: string | null
          category?: string
          base_price?: number
          sell_price?: number
          markup?: number | null
          competitor_price?: number | null
          source?: string | null
          in_stock?: boolean
          stock_quantity?: number
          supplier?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'technician' | 'counter'
          permissions: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'technician' | 'counter'
          permissions?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'technician' | 'counter'
          permissions?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      customers_db: {
        Row: {
          id: string
          name: string
          phone: string
          address: string
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          address: string
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          address?: string
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs_db: {
        Row: {
          id: string
          job_number: string
          customer_id: string
          machine_category: string
          machine_brand: string
          machine_model: string
          machine_serial: string | null
          problem_description: string
          notes: string | null
          service_performed: string | null
          recommendations: string | null
          service_deposit: number | null
          quotation_amount: number | null
          parts_required: string | null
          labour_hours: number
          labour_rate: number
          parts_subtotal: number
          labour_total: number
          subtotal: number
          gst: number
          grand_total: number
          status: 'pending' | 'in-progress' | 'completed' | 'delivered'
          assigned_technician: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          job_number: string
          customer_id: string
          machine_category: string
          machine_brand: string
          machine_model: string
          machine_serial?: string | null
          problem_description: string
          notes?: string | null
          service_performed?: string | null
          recommendations?: string | null
          service_deposit?: number | null
          quotation_amount?: number | null
          parts_required?: string | null
          labour_hours?: number
          labour_rate?: number
          parts_subtotal?: number
          labour_total?: number
          subtotal?: number
          gst?: number
          grand_total?: number
          status?: 'pending' | 'in-progress' | 'completed' | 'delivered'
          assigned_technician?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          job_number?: string
          customer_id?: string
          machine_category?: string
          machine_brand?: string
          machine_model?: string
          machine_serial?: string | null
          problem_description?: string
          notes?: string | null
          service_performed?: string | null
          recommendations?: string | null
          service_deposit?: number | null
          quotation_amount?: number | null
          parts_required?: string | null
          labour_hours?: number
          labour_rate?: number
          parts_subtotal?: number
          labour_total?: number
          subtotal?: number
          gst?: number
          grand_total?: number
          status?: 'pending' | 'in-progress' | 'completed' | 'delivered'
          assigned_technician?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      job_parts: {
        Row: {
          id: string
          job_id: string
          part_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          part_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          part_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
    }
  }
}

export type UserRole = 'admin' | 'technician' | 'counter'

export const ROLE_PERMISSIONS = {
  admin: ['all'],
  technician: ['view_jobs', 'edit_jobs', 'create_jobs', 'view_parts', 'use_parts'],
  counter: ['view_jobs', 'create_jobs', 'view_customers', 'edit_customers', 'create_customers']
} as const