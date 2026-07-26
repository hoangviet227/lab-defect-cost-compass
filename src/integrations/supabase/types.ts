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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
          ip_address: string | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          allow_negative_stock: boolean
          created_at: string
          currency: string
          id: string
          is_singleton: boolean
          logo_url: string | null
          low_price_variance_percent: number
          roll_length_rounding_mm: number
          roll_width_mm: number
          timezone: string
          updated_at: string
          updated_by: string | null
          workshop_address: string | null
          workshop_email: string | null
          workshop_name: string
          workshop_phone: string | null
          workshop_tax_code: string | null
        }
        Insert: {
          allow_negative_stock?: boolean
          created_at?: string
          currency?: string
          id?: string
          is_singleton?: boolean
          logo_url?: string | null
          low_price_variance_percent?: number
          roll_length_rounding_mm?: number
          roll_width_mm?: number
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          workshop_address?: string | null
          workshop_email?: string | null
          workshop_name?: string
          workshop_phone?: string | null
          workshop_tax_code?: string | null
        }
        Update: {
          allow_negative_stock?: boolean
          created_at?: string
          currency?: string
          id?: string
          is_singleton?: boolean
          logo_url?: string | null
          low_price_variance_percent?: number
          roll_length_rounding_mm?: number
          roll_width_mm?: number
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          workshop_address?: string | null
          workshop_email?: string | null
          workshop_name?: string
          workshop_phone?: string | null
          workshop_tax_code?: string | null
        }
        Relationships: []
      }
      cash_accounts: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          code: string
          created_at: string
          current_balance: number
          id: string
          is_active: boolean
          kind: string
          name: string
          notes: string | null
          opening_balance: number
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          code: string
          created_at?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          kind?: string
          name: string
          notes?: string | null
          opening_balance?: number
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          code?: string
          created_at?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          notes?: string | null
          opening_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_tiers: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_percent: number
          id: string
          is_active: boolean
          name: string
          note: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name: string
          note?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name?: string
          note?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          code: string
          contact_person: string | null
          created_at: string
          created_by: string | null
          credit_limit: number
          customer_type: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          note: string | null
          phone: string | null
          tax_code: string | null
          tier_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit?: number
          customer_type?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          note?: string | null
          phone?: string | null
          tax_code?: string | null
          tier_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit?: number
          customer_type?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          note?: string | null
          phone?: string | null
          tax_code?: string | null
          tier_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "customer_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          base_salary: number
          created_at: string
          created_by: string | null
          daily_rate: number
          employee_code: string
          id: string
          is_active: boolean
          join_date: string | null
          note: string | null
          shift_rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          base_salary?: number
          created_at?: string
          created_by?: string | null
          daily_rate?: number
          employee_code: string
          id?: string
          is_active?: boolean
          join_date?: string | null
          note?: string | null
          shift_rate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          base_salary?: number
          created_at?: string
          created_by?: string | null
          daily_rate?: number
          employee_code?: string
          id?: string
          is_active?: boolean
          join_date?: string | null
          note?: string | null
          shift_rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          amount: number
          cash_account_id: string
          category: string | null
          code: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          notes: string | null
          order_id: string | null
          purchase_receipt_id: string | null
          status: string
          supplier_id: string | null
          txn_date: string
          txn_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          cash_account_id: string
          category?: string | null
          code: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          purchase_receipt_id?: string | null
          status?: string
          supplier_id?: string | null
          txn_date?: string
          txn_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cash_account_id?: string
          category?: string | null
          code?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          purchase_receipt_id?: string | null
          status?: string
          supplier_id?: string | null
          txn_date?: string
          txn_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "cash_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_debts"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "finance_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_purchase_receipt_id_fkey"
            columns: ["purchase_receipt_id"]
            isOneToOne: false
            referencedRelation: "purchase_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_debts"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      material_categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          avg_cost: number
          category_id: string | null
          code: string
          created_at: string
          default_supplier_id: string | null
          id: string
          is_active: boolean
          min_stock: number
          name: string
          notes: string | null
          thickness_mm: number | null
          unit: string
          updated_at: string
          width_cm: number | null
        }
        Insert: {
          avg_cost?: number
          category_id?: string | null
          code: string
          created_at?: string
          default_supplier_id?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number
          name: string
          notes?: string | null
          thickness_mm?: number | null
          unit?: string
          updated_at?: string
          width_cm?: number | null
        }
        Update: {
          avg_cost?: number
          category_id?: string | null
          code?: string
          created_at?: string
          default_supplier_id?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number
          name?: string
          notes?: string | null
          thickness_mm?: number | null
          unit?: string
          updated_at?: string
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_default_supplier_id_fkey"
            columns: ["default_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_default_supplier_id_fkey"
            columns: ["default_supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_debts"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          customer_id: string | null
          id: string
          is_read: boolean
          message: string | null
          read_at: string | null
          recipient_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          read_at?: string | null
          recipient_user_id?: string | null
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          read_at?: string | null
          recipient_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_debts"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          height_cm: number | null
          id: string
          line_total: number
          notes: string | null
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          width_cm: number | null
        }
        Insert: {
          created_at?: string
          height_cm?: number | null
          id?: string
          line_total?: number
          notes?: string | null
          order_id: string
          product_id: string
          quantity: number
          unit_price?: number
          width_cm?: number | null
        }
        Update: {
          created_at?: string
          height_cm?: number | null
          id?: string
          line_total?: number
          notes?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          code: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          delivery_date: string | null
          discount: number
          id: string
          notes: string | null
          order_date: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tier_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          code: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          delivery_date?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_date?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tier_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          code?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          delivery_date?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_date?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tier_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_debts"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "orders_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "customer_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bom: {
        Row: {
          created_at: string
          id: string
          material_id: string
          notes: string | null
          product_id: string
          quantity: number
          updated_at: string
          waste_pct: number
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          notes?: string | null
          product_id: string
          quantity?: number
          updated_at?: string
          waste_pct?: number
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          updated_at?: string
          waste_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_bom_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bom_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_prices: {
        Row: {
          created_at: string
          discount_pct: number
          id: string
          price: number
          product_id: string
          tier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_pct?: number
          id?: string
          price?: number
          product_id: string
          tier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_pct?: number
          id?: string
          price?: number
          product_id?: string
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "customer_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          planned_qty: number
          produced_qty: number
          product_id: string
          production_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          planned_qty: number
          produced_qty?: number
          product_id: string
          production_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          planned_qty?: number
          produced_qty?: number
          product_id?: string
          production_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          assigned_to: string | null
          code: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          notes: string | null
          order_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["production_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["production_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["production_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category_id: string | null
          code: string
          created_at: string
          created_by: string | null
          height_cm: number | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          notes: string | null
          unit: string
          updated_at: string
          width_cm: number | null
        }
        Insert: {
          base_price?: number
          category_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          height_cm?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          unit?: string
          updated_at?: string
          width_cm?: number | null
        }
        Update: {
          base_price?: number
          category_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          height_cm?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          unit?: string
          updated_at?: string
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          employee_code: string | null
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          employee_code?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          employee_code?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_receipt_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          material_id: string
          quantity: number
          receipt_id: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number
          material_id: string
          quantity: number
          receipt_id: string
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          material_id?: string
          quantity?: number
          receipt_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipt_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "purchase_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipts: {
        Row: {
          code: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          receipt_date: string
          status: Database["public"]["Enums"]["purchase_receipt_status"]
          supplier_id: string | null
          total_amount: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          code: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          receipt_date?: string
          status?: Database["public"]["Enums"]["purchase_receipt_status"]
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          code?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          receipt_date?: string
          status?: Database["public"]["Enums"]["purchase_receipt_status"]
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_debts"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "purchase_receipts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_counters: {
        Row: {
          created_at: string
          id: string
          last_value: number
          period: string
          prefix: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_value?: number
          period?: string
          prefix: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_value?: number
          period?: string
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_balances: {
        Row: {
          id: string
          material_id: string
          quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          id?: string
          material_id: string
          quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          id?: string
          material_id?: string
          quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_balances_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_balances_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_issue_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          material_id: string
          quantity: number
          stock_issue_id: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number
          material_id: string
          quantity: number
          stock_issue_id: string
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          material_id?: string
          quantity?: number
          stock_issue_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_issue_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_issue_items_stock_issue_id_fkey"
            columns: ["stock_issue_id"]
            isOneToOne: false
            referencedRelation: "stock_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_issues: {
        Row: {
          code: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          production_order_id: string | null
          status: Database["public"]["Enums"]["stock_issue_status"]
          total_amount: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          code: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          production_order_id?: string | null
          status?: Database["public"]["Enums"]["stock_issue_status"]
          total_amount?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          code?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          production_order_id?: string | null
          status?: Database["public"]["Enums"]["stock_issue_status"]
          total_amount?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_issues_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_issues_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transactions: {
        Row: {
          created_at: string
          id: string
          material_id: string
          notes: string | null
          performed_by: string | null
          quantity: number
          ref_id: string | null
          ref_table: string | null
          txn_type: Database["public"]["Enums"]["stock_txn_type"]
          unit_cost: number
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          notes?: string | null
          performed_by?: string | null
          quantity: number
          ref_id?: string | null
          ref_table?: string | null
          txn_type: Database["public"]["Enums"]["stock_txn_type"]
          unit_cost?: number
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          notes?: string | null
          performed_by?: string | null
          quantity?: number
          ref_id?: string | null
          ref_table?: string | null
          txn_type?: Database["public"]["Enums"]["stock_txn_type"]
          unit_cost?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          code: string
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          note: string | null
          phone: string | null
          tax_code: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          note?: string | null
          phone?: string | null
          tax_code?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          note?: string | null
          phone?: string | null
          tax_code?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_customer_debts: {
        Row: {
          balance: number | null
          code: string | null
          customer_id: string | null
          name: string | null
          total_orders: number | null
          total_paid: number | null
        }
        Insert: {
          balance?: never
          code?: string | null
          customer_id?: string | null
          name?: string | null
          total_orders?: never
          total_paid?: never
        }
        Update: {
          balance?: never
          code?: string | null
          customer_id?: string | null
          name?: string | null
          total_orders?: never
          total_paid?: never
        }
        Relationships: []
      }
      v_supplier_debts: {
        Row: {
          balance: number | null
          code: string | null
          name: string | null
          supplier_id: string | null
          total_paid: number | null
          total_purchases: number | null
        }
        Insert: {
          balance?: never
          code?: string | null
          name?: string | null
          supplier_id?: string | null
          total_paid?: never
          total_purchases?: never
        }
        Update: {
          balance?: never
          code?: string | null
          name?: string | null
          supplier_id?: string | null
          total_paid?: never
          total_purchases?: never
        }
        Relationships: []
      }
    }
    Functions: {
      confirm_finance_transaction: {
        Args: { _txn_id: string }
        Returns: {
          amount: number
          cash_account_id: string
          category: string | null
          code: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          notes: string | null
          order_id: string | null
          purchase_receipt_id: string | null
          status: string
          supplier_id: string | null
          txn_date: string
          txn_type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "finance_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_order: {
        Args: { _order_id: string }
        Returns: {
          code: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          delivery_date: string | null
          discount: number
          id: string
          notes: string | null
          order_date: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tier_id: string | null
          total_amount: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_purchase_receipt: {
        Args: { _receipt_id: string }
        Returns: {
          code: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          receipt_date: string
          status: Database["public"]["Enums"]["purchase_receipt_status"]
          supplier_id: string | null
          total_amount: number
          updated_at: string
          warehouse_id: string
        }
        SetofOptions: {
          from: "*"
          to: "purchase_receipts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_stock_issue: {
        Args: { _issue_id: string }
        Returns: {
          code: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          production_order_id: string | null
          status: Database["public"]["Enums"]["stock_issue_status"]
          total_amount: number
          updated_at: string
          warehouse_id: string
        }
        SetofOptions: {
          from: "*"
          to: "stock_issues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_production_from_order: {
        Args: { _order_id: string }
        Returns: {
          assigned_to: string | null
          code: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          notes: string | null
          order_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["production_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "production_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_roles: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_sequence: {
        Args: { _pad?: number; _period?: string; _prefix: string }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "sales"
        | "warehouse"
        | "production"
        | "accountant"
        | "delivery"
        | "customer"
      order_status:
        | "draft"
        | "confirmed"
        | "in_production"
        | "delivered"
        | "cancelled"
      production_status: "pending" | "in_progress" | "completed" | "cancelled"
      purchase_receipt_status: "draft" | "confirmed" | "cancelled"
      stock_issue_status: "draft" | "confirmed" | "cancelled"
      stock_txn_type: "in" | "out" | "adjust"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "sales",
        "warehouse",
        "production",
        "accountant",
        "delivery",
        "customer",
      ],
      order_status: [
        "draft",
        "confirmed",
        "in_production",
        "delivered",
        "cancelled",
      ],
      production_status: ["pending", "in_progress", "completed", "cancelled"],
      purchase_receipt_status: ["draft", "confirmed", "cancelled"],
      stock_issue_status: ["draft", "confirmed", "cancelled"],
      stock_txn_type: ["in", "out", "adjust"],
    },
  },
} as const
