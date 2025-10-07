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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          created_at: string
          email: string | null
          failed_attempts: number
          id: string
          ip_address: unknown | null
          locked_until: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          failed_attempts?: number
          id?: string
          ip_address?: unknown | null
          locked_until?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          failed_attempts?: number
          id?: string
          ip_address?: unknown | null
          locked_until?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bandroom_visits: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          room_id: string
          user_id: string
          visited_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          room_id: string
          user_id: string
          visited_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          room_id?: string
          user_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      device_sessions: {
        Row: {
          browser_info: string | null
          created_at: string
          device_fingerprint: string
          device_name: string | null
          device_type: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_trusted: boolean
          last_seen: string
          location_info: Json | null
          user_id: string
        }
        Insert: {
          browser_info?: string | null
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_trusted?: boolean
          last_seen?: string
          location_info?: Json | null
          user_id: string
        }
        Update: {
          browser_info?: string | null
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_trusted?: boolean
          last_seen?: string
          location_info?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_position: Json | null
          avatar_ring_color: string | null
          avatar_url: string | null
          bio: string | null
          bragging_links: Json | null
          city: string | null
          created_at: string
          default_metronome_sound: string | null
          dropbox_token: string | null
          full_name: string | null
          google_drive_token: string | null
          group_skill_level: number | null
          id: string
          notification_settings: Json | null
          skill_level: number | null
          solo_skill_level: number | null
          title: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_position?: Json | null
          avatar_ring_color?: string | null
          avatar_url?: string | null
          bio?: string | null
          bragging_links?: Json | null
          city?: string | null
          created_at?: string
          default_metronome_sound?: string | null
          dropbox_token?: string | null
          full_name?: string | null
          google_drive_token?: string | null
          group_skill_level?: number | null
          id?: string
          notification_settings?: Json | null
          skill_level?: number | null
          solo_skill_level?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_position?: Json | null
          avatar_ring_color?: string | null
          avatar_url?: string | null
          bio?: string | null
          bragging_links?: Json | null
          city?: string | null
          created_at?: string
          default_metronome_sound?: string | null
          dropbox_token?: string | null
          full_name?: string | null
          google_drive_token?: string | null
          group_skill_level?: number | null
          id?: string
          notification_settings?: Json | null
          skill_level?: number | null
          solo_skill_level?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_ai_access: {
        Row: {
          created_at: string | null
          id: string
          total_requests: number | null
          trial_ends_at: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          total_requests?: number | null
          trial_ends_at?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          total_requests?: number | null
          trial_ends_at?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_audio_files: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_category: string
          file_name: string
          file_size: number
          id: string
          mime_type: string
          original_name: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_category?: string
          file_name: string
          file_size: number
          id?: string
          mime_type: string
          original_name: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_category?: string
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string
          original_name?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          two_factor_enabled: boolean
          two_factor_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          color_theme: string | null
          created_at: string
          default_bpm: number | null
          default_time_signature: string | null
          id: string
          metronome_enabled: boolean | null
          metronome_sound: string | null
          metronome_volume: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color_theme?: string | null
          created_at?: string
          default_bpm?: number | null
          default_time_signature?: string | null
          id?: string
          metronome_enabled?: boolean | null
          metronome_sound?: string | null
          metronome_volume?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color_theme?: string | null
          created_at?: string
          default_bpm?: number | null
          default_time_signature?: string | null
          id?: string
          metronome_enabled?: boolean | null
          metronome_sound?: string | null
          metronome_volume?: number | null
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
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
