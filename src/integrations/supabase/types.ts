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
      asset_loans: {
        Row: {
          asset_id: string
          borrower_label: string
          created_at: string
          created_by: string | null
          deposit_amount: number
          due_date: string | null
          fee_amount: number
          household_id: string | null
          id: string
          loan_date: string
          notes: string | null
          paid_amount: number
          quantity: number
          returned_date: string | null
          status: Database["public"]["Enums"]["loan_status"]
          updated_at: string
        }
        Insert: {
          asset_id: string
          borrower_label: string
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          due_date?: string | null
          fee_amount?: number
          household_id?: string | null
          id?: string
          loan_date?: string
          notes?: string | null
          paid_amount?: number
          quantity?: number
          returned_date?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Update: {
          asset_id?: string
          borrower_label?: string
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          due_date?: string | null
          fee_amount?: number
          household_id?: string | null
          id?: string
          loan_date?: string
          notes?: string | null
          paid_amount?: number
          quantity?: number
          returned_date?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          category: Database["public"]["Enums"]["asset_category"]
          condition: Database["public"]["Enums"]["asset_condition"]
          created_at: string
          created_by: string | null
          currency: string
          id: string
          location: string | null
          name: string
          notes: string | null
          total_quantity: number
          unit_value: number
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["asset_category"]
          condition?: Database["public"]["Enums"]["asset_condition"]
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          total_quantity?: number
          unit_value?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["asset_category"]
          condition?: Database["public"]["Enums"]["asset_condition"]
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          total_quantity?: number
          unit_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      citizens: {
        Row: {
          birth_date: string | null
          birth_place: string | null
          cin: string | null
          created_at: string
          created_by: string | null
          education: string | null
          first_names: string
          household_id: string | null
          id: string
          is_head: boolean
          last_name: string
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          notes: string | null
          phone: string | null
          profession: string | null
          sex: Database["public"]["Enums"]["sex"]
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          birth_place?: string | null
          cin?: string | null
          created_at?: string
          created_by?: string | null
          education?: string | null
          first_names: string
          household_id?: string | null
          id?: string
          is_head?: boolean
          last_name: string
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          notes?: string | null
          phone?: string | null
          profession?: string | null
          sex: Database["public"]["Enums"]["sex"]
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          birth_place?: string | null
          cin?: string | null
          created_at?: string
          created_by?: string | null
          education?: string | null
          first_names?: string
          household_id?: string | null
          id?: string
          is_head?: boolean
          last_name?: string
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          notes?: string | null
          phone?: string | null
          profession?: string | null
          sex?: Database["public"]["Enums"]["sex"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "citizens_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          deadline: string | null
          description: string | null
          id: string
          status: Database["public"]["Enums"]["campaign_status"]
          target_amount_per_household: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          deadline?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          target_amount_per_household?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          deadline?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          target_amount_per_household?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount: number
          campaign_id: string
          created_at: string
          household_id: string | null
          household_label: string | null
          id: string
          method: string | null
          notes: string | null
          paid_at: string
          receipt_number: string | null
          recorded_by: string | null
        }
        Insert: {
          amount: number
          campaign_id: string
          created_at?: string
          household_id?: string | null
          household_label?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string
          receipt_number?: string | null
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string
          created_at?: string
          household_id?: string | null
          household_label?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string
          receipt_number?: string | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "contribution_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_issued: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          citizen_id: string | null
          citizen_snapshot: Json
          created_at: string
          doc_number: string
          doc_type: Database["public"]["Enums"]["document_type"]
          id: string
          issued_at: string
          issued_by: string | null
          issuer_name: string | null
          payload: Json
          status: Database["public"]["Enums"]["document_status"]
          verify_code: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          citizen_id?: string | null
          citizen_snapshot: Json
          created_at?: string
          doc_number: string
          doc_type: Database["public"]["Enums"]["document_type"]
          id?: string
          issued_at?: string
          issued_by?: string | null
          issuer_name?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["document_status"]
          verify_code?: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          citizen_id?: string | null
          citizen_snapshot?: Json
          created_at?: string
          doc_number?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          issued_at?: string
          issued_by?: string | null
          issuer_name?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["document_status"]
          verify_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_issued_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          invoice_ref: string | null
          spent_at: string
          title: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          invoice_ref?: string | null
          spent_at?: string
          title: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          invoice_ref?: string | null
          spent_at?: string
          title?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      households: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          fokontany: string | null
          head_full_name: string
          household_number: string
          id: string
          lat: number | null
          lng: number | null
          member_count: number | null
          notes: string | null
          socio_level: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          fokontany?: string | null
          head_full_name: string
          household_number: string
          id?: string
          lat?: number | null
          lng?: number | null
          member_count?: number | null
          notes?: string | null
          socio_level?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          fokontany?: string | null
          head_full_name?: string
          household_number?: string
          id?: string
          lat?: number | null
          lng?: number | null
          member_count?: number | null
          notes?: string | null
          socio_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meeting_attendance: {
        Row: {
          checked_in_at: string
          citizen_id: string | null
          citizen_label: string
          id: string
          meeting_id: string
          recorded_by: string | null
        }
        Insert: {
          checked_in_at?: string
          citizen_id?: string | null
          citizen_label: string
          id?: string
          meeting_id: string
          recorded_by?: string | null
        }
        Update: {
          checked_in_at?: string
          citizen_id?: string | null
          citizen_label?: string
          id?: string
          meeting_id?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: string | null
          attendance_code: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          location: string | null
          starts_at: string
          status: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          attendance_code?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          attendance_code?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          fokontany: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          fokontany?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          fokontany?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      verify_document: {
        Args: { _code: string }
        Returns: {
          citizen_snapshot: Json
          doc_number: string
          doc_type: Database["public"]["Enums"]["document_type"]
          issued_at: string
          issuer_name: string
          status: Database["public"]["Enums"]["document_status"]
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "president" | "viewer"
      asset_category:
        | "mobilier"
        | "tente"
        | "sono"
        | "outillage"
        | "vaisselle"
        | "autre"
      asset_condition: "neuf" | "bon" | "use" | "hors_service"
      campaign_status: "active" | "closed" | "draft"
      document_status: "active" | "cancelled"
      document_type:
        | "residence"
        | "vie"
        | "bonne_conduite"
        | "naissance"
        | "celibat"
        | "vente"
        | "deces"
        | "autre"
      expense_category:
        | "infrastructure"
        | "sanitaire"
        | "education"
        | "securite"
        | "evenement"
        | "administration"
        | "autre"
      loan_status: "reserved" | "active" | "returned" | "overdue" | "cancelled"
      marital_status: "single" | "married" | "divorced" | "widowed"
      meeting_status: "scheduled" | "ongoing" | "closed" | "cancelled"
      sex: "M" | "F"
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
      app_role: ["admin", "agent", "president", "viewer"],
      asset_category: [
        "mobilier",
        "tente",
        "sono",
        "outillage",
        "vaisselle",
        "autre",
      ],
      asset_condition: ["neuf", "bon", "use", "hors_service"],
      campaign_status: ["active", "closed", "draft"],
      document_status: ["active", "cancelled"],
      document_type: [
        "residence",
        "vie",
        "bonne_conduite",
        "naissance",
        "celibat",
        "vente",
        "deces",
        "autre",
      ],
      expense_category: [
        "infrastructure",
        "sanitaire",
        "education",
        "securite",
        "evenement",
        "administration",
        "autre",
      ],
      loan_status: ["reserved", "active", "returned", "overdue", "cancelled"],
      marital_status: ["single", "married", "divorced", "widowed"],
      meeting_status: ["scheduled", "ongoing", "closed", "cancelled"],
      sex: ["M", "F"],
    },
  },
} as const
