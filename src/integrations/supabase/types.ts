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
      alerts: {
        Row: {
          acknowledged: boolean | null
          created_at: string
          event_id: string | null
          id: string
          level: Database["public"]["Enums"]["alert_level"]
          message: string | null
          narrative_id: string | null
          title: string
        }
        Insert: {
          acknowledged?: boolean | null
          created_at?: string
          event_id?: string | null
          id?: string
          level?: Database["public"]["Enums"]["alert_level"]
          message?: string | null
          narrative_id?: string | null
          title: string
        }
        Update: {
          acknowledged?: boolean | null
          created_at?: string
          event_id?: string | null
          id?: string
          level?: Database["public"]["Enums"]["alert_level"]
          message?: string | null
          narrative_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_narrative_id_fkey"
            columns: ["narrative_id"]
            isOneToOne: false
            referencedRelation: "narratives"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_scores: {
        Row: {
          created_at: string
          date: string
          goldstein_scale: number | null
          id: string
          month: string | null
          score: number
          stability_score: number | null
          status: string
        }
        Insert: {
          created_at?: string
          date: string
          goldstein_scale?: number | null
          id?: string
          month?: string | null
          score: number
          stability_score?: number | null
          status: string
        }
        Update: {
          created_at?: string
          date?: string
          goldstein_scale?: number | null
          id?: string
          month?: string | null
          score?: number
          stability_score?: number | null
          status?: string
        }
        Relationships: []
      }
      event_articles: {
        Row: {
          content: string
          created_at: string
          url: string
        }
        Insert: {
          content: string
          created_at?: string
          url: string
        }
        Update: {
          content?: string
          created_at?: string
          url?: string
        }
        Relationships: []
      }
      event_factchecks: {
        Row: {
          confidence: number
          created_at: string
          event_id: string
          reasoning: string | null
          red_flags: Json | null
          verdict: string
        }
        Insert: {
          confidence: number
          created_at?: string
          event_id: string
          reasoning?: string | null
          red_flags?: Json | null
          verdict: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_id?: string
          reasoning?: string | null
          red_flags?: Json | null
          verdict?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          action_geo_country: string | null
          action_geo_fullname: string | null
          actor1_country: string | null
          actor1_name: string | null
          actor2_country: string | null
          actor2_name: string | null
          avg_tone: number | null
          category: Database["public"]["Enums"]["event_category"] | null
          cluster: number | null
          content: string | null
          context_type: string | null
          country: string | null
          created_at: string
          event_code: string | null
          event_root_code: string | null
          event_type: string | null
          goldstein_scale: number | null
          id: string
          is_root_event: boolean | null
          lang: string | null
          lat: number | null
          lng: number | null
          location_name: string | null
          narrative_id: string | null
          num_articles: number | null
          num_mentions: number | null
          num_sources: number | null
          pca1: number | null
          pca2: number | null
          published_at: string
          raw: Json | null
          sentiment: number | null
          source: string
          source_url: string | null
          stability_impact: number | null
          summary: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          action_geo_country?: string | null
          action_geo_fullname?: string | null
          actor1_country?: string | null
          actor1_name?: string | null
          actor2_country?: string | null
          actor2_name?: string | null
          avg_tone?: number | null
          category?: Database["public"]["Enums"]["event_category"] | null
          cluster?: number | null
          content?: string | null
          context_type?: string | null
          country?: string | null
          created_at?: string
          event_code?: string | null
          event_root_code?: string | null
          event_type?: string | null
          goldstein_scale?: number | null
          id?: string
          is_root_event?: boolean | null
          lang?: string | null
          lat?: number | null
          lng?: number | null
          location_name?: string | null
          narrative_id?: string | null
          num_articles?: number | null
          num_mentions?: number | null
          num_sources?: number | null
          pca1?: number | null
          pca2?: number | null
          published_at?: string
          raw?: Json | null
          sentiment?: number | null
          source: string
          source_url?: string | null
          stability_impact?: number | null
          summary?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          action_geo_country?: string | null
          action_geo_fullname?: string | null
          actor1_country?: string | null
          actor1_name?: string | null
          actor2_country?: string | null
          actor2_name?: string | null
          avg_tone?: number | null
          category?: Database["public"]["Enums"]["event_category"] | null
          cluster?: number | null
          content?: string | null
          context_type?: string | null
          country?: string | null
          created_at?: string
          event_code?: string | null
          event_root_code?: string | null
          event_type?: string | null
          goldstein_scale?: number | null
          id?: string
          is_root_event?: boolean | null
          lang?: string | null
          lat?: number | null
          lng?: number | null
          location_name?: string | null
          narrative_id?: string | null
          num_articles?: number | null
          num_mentions?: number | null
          num_sources?: number | null
          pca1?: number | null
          pca2?: number | null
          published_at?: string
          raw?: Json | null
          sentiment?: number | null
          source?: string
          source_url?: string | null
          stability_impact?: number | null
          summary?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_narrative_fk"
            columns: ["narrative_id"]
            isOneToOne: false
            referencedRelation: "narratives"
            referencedColumns: ["id"]
          },
        ]
      }
      narratives: {
        Row: {
          created_at: string
          event_count: number | null
          first_seen: string | null
          id: string
          keywords: string[] | null
          label: string
          last_seen: string | null
          summary: string | null
          suspicion_score: number | null
        }
        Insert: {
          created_at?: string
          event_count?: number | null
          first_seen?: string | null
          id?: string
          keywords?: string[] | null
          label: string
          last_seen?: string | null
          summary?: string | null
          suspicion_score?: number | null
        }
        Update: {
          created_at?: string
          event_count?: number | null
          first_seen?: string | null
          id?: string
          keywords?: string[] | null
          label?: string
          last_seen?: string | null
          summary?: string | null
          suspicion_score?: number | null
        }
        Relationships: []
      }
      rag_chunks: {
        Row: {
          content: string
          created_at: string
          embedding: Json
          event_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          embedding: Json
          event_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: Json
          event_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rag_chunks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      stability_forecasts: {
        Row: {
          created_at: string
          date: string
          id: string
          predicted_stability_score: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          predicted_stability_score: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          predicted_stability_score?: number
        }
        Relationships: []
      }
      stability_snapshots: {
        Row: {
          computed_at: string
          drivers: Json | null
          id: string
          score: number
          state: Database["public"]["Enums"]["stability_state"]
        }
        Insert: {
          computed_at?: string
          drivers?: Json | null
          id?: string
          score: number
          state: Database["public"]["Enums"]["stability_state"]
        }
        Update: {
          computed_at?: string
          drivers?: Json | null
          id?: string
          score?: number
          state?: Database["public"]["Enums"]["stability_state"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_level: "low" | "moderate" | "high" | "critical"
      event_category:
        | "disinformation"
        | "propaganda"
        | "satire"
        | "reliable"
        | "unverified"
      stability_state: "stable" | "tension" | "crisis"
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
      alert_level: ["low", "moderate", "high", "critical"],
      event_category: [
        "disinformation",
        "propaganda",
        "satire",
        "reliable",
        "unverified",
      ],
      stability_state: ["stable", "tension", "crisis"],
    },
  },
} as const
