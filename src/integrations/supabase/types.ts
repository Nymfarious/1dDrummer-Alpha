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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          created_at: string
          email: string
          failed_attempts: number
          id: string
          locked_until: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failed_attempts?: number
          id?: string
          locked_until?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failed_attempts?: number
          id?: string
          locked_until?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      avatar_collection: {
        Row: {
          avatar_url: string
          created_at: string
          id: string
          is_current: boolean | null
          source: string
          user_id: string
        }
        Insert: {
          avatar_url: string
          created_at?: string
          id?: string
          is_current?: boolean | null
          source: string
          user_id: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          id?: string
          is_current?: boolean | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      device_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_trusted: boolean | null
          last_activity: string
          last_seen: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_activity?: string
          last_seen?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_activity?: string
          last_seen?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          google_drive_token: string | null
          id: string
          location: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          google_drive_token?: string | null
          id?: string
          location?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          google_drive_token?: string | null
          id?: string
          location?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      two_factor_settings: {
        Row: {
          backup_codes: Json | null
          created_at: string
          enabled: boolean | null
          id: string
          secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          secret?: string
          updated_at?: string
          user_id?: string
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
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_category: string
          file_name: string
          file_size: number
          id?: string
          mime_type: string
          original_name: string
          storage_path: string
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
          user_id?: string
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          backup_codes: Json | null
          created_at: string
          id: string
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: Json | null
          created_at?: string
          id?: string
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: Json | null
          created_at?: string
          id?: string
          two_factor_enabled?: boolean | null
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
          max_library_files: number | null
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
          max_library_files?: number | null
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
          max_library_files?: number | null
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
