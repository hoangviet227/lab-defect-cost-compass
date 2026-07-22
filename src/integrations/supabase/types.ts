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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    },
  },
} as const
