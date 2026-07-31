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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          cover_letter: string
          created_at: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          cover_letter?: string
          created_at?: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          cover_letter?: string
          created_at?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          approved: boolean
          company_size: string | null
          created_at: string
          description: string | null
          id: string
          industry: string | null
          location: string | null
          logo_url: string | null
          name: string
          owner_id: string
          slug: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          approved?: boolean
          company_size?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          approved?: boolean
          company_size?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      engagements: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          project_id: string
          started_at: string
          status: Database["public"]["Enums"]["engagement_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          project_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["engagement_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          project_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["engagement_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          created_at: string
          description: string
          due_date: string | null
          engagement_id: string
          feedback: string | null
          id: string
          order_index: number
          reviewed_at: string | null
          status: Database["public"]["Enums"]["milestone_status"]
          submission_note: string | null
          submission_url: string | null
          submitted_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          due_date?: string | null
          engagement_id: string
          feedback?: string | null
          id?: string
          order_index?: number
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          submission_note?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string | null
          engagement_id?: string
          feedback?: string | null
          id?: string
          order_index?: number
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          submission_note?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          cv_url: string | null
          degree: string | null
          full_name: string
          github_url: string | null
          graduation_year: number | null
          headline: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          portfolio_url: string | null
          skills: string[]
          university: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cv_url?: string | null
          degree?: string | null
          full_name?: string
          github_url?: string | null
          graduation_year?: number | null
          headline?: string | null
          id: string
          linkedin_url?: string | null
          location?: string | null
          portfolio_url?: string | null
          skills?: string[]
          university?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cv_url?: string | null
          degree?: string | null
          full_name?: string
          github_url?: string | null
          graduation_year?: number | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          portfolio_url?: string | null
          skills?: string[]
          university?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string
          company_id: string
          created_at: string
          deadline: string | null
          description: string
          difficulty: string
          duration_weeks: number
          id: string
          is_remote: boolean
          openings: number
          skills: string[]
          status: Database["public"]["Enums"]["project_status"]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          company_id: string
          created_at?: string
          deadline?: string | null
          description?: string
          difficulty?: string
          duration_weeks?: number
          id?: string
          is_remote?: boolean
          openings?: number
          skills?: string[]
          status?: Database["public"]["Enums"]["project_status"]
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          deadline?: string | null
          description?: string
          difficulty?: string
          duration_weeks?: number
          id?: string
          is_remote?: boolean
          openings?: number
          skills?: string[]
          status?: Database["public"]["Enums"]["project_status"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      can_view_engagement: {
        Args: { _engagement_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_company: { Args: { _company_id: string }; Returns: boolean }
      owns_engagement_company: {
        Args: { _engagement_id: string }
        Returns: boolean
      }
      owns_project: { Args: { _project_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "company" | "university" | "qa" | "admin"
      application_status:
        | "pending"
        | "shortlisted"
        | "accepted"
        | "rejected"
        | "withdrawn"
      engagement_status: "active" | "completed" | "cancelled"
      milestone_status:
        | "locked"
        | "active"
        | "submitted"
        | "changes_requested"
        | "approved"
      project_status: "draft" | "open" | "paused" | "closed" | "completed"
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
      app_role: ["student", "company", "university", "qa", "admin"],
      application_status: [
        "pending",
        "shortlisted",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      engagement_status: ["active", "completed", "cancelled"],
      milestone_status: [
        "locked",
        "active",
        "submitted",
        "changes_requested",
        "approved",
      ],
      project_status: ["draft", "open", "paused", "closed", "completed"],
    },
  },
} as const
