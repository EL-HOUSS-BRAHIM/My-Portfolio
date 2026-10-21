export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_members: {
        Row: {
          created_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          id: number;
          kind: string | null;
          record_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          kind?: string | null;
          record_id?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          kind?: string | null;
          record_id?: string | null;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          consent_at: string | null;
          created_at: string;
          email: string;
          id: string;
          locale: string;
          message: string;
          name: string;
          origin: string;
          status: string;
          subject: string;
          submission_id: string;
        };
        ComputedFields: never;
        Insert: {
          consent_at?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          locale: string;
          message: string;
          name: string;
          origin?: string;
          status?: string;
          subject?: string;
          submission_id: string;
        };
        Update: {
          consent_at?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          locale?: string;
          message?: string;
          name?: string;
          origin?: string;
          status?: string;
          subject?: string;
          submission_id?: string;
        };
        Relationships: [];
      };
      content: {
        Row: {
          category: string;
          created_at: string;
          demo_url: string;
          featured: boolean;
          id: string;
          image: string;
          kind: string;
          slug: string;
          sort_order: number;
          source_url: string;
          tags: string[];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category?: string;
          created_at?: string;
          demo_url?: string;
          featured?: boolean;
          id?: string;
          image?: string;
          kind: string;
          slug: string;
          sort_order?: number;
          source_url?: string;
          tags?: string[];
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          demo_url?: string;
          featured?: boolean;
          id?: string;
          image?: string;
          kind?: string;
          slug?: string;
          sort_order?: number;
          source_url?: string;
          tags?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      content_translations: {
        Row: {
          body: string;
          content_id: string;
          locale: string;
          published: boolean;
          summary: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          body?: string;
          content_id: string;
          locale: string;
          published?: boolean;
          summary?: string;
          title: string;
        };
        Update: {
          body?: string;
          content_id?: string;
          locale?: string;
          published?: boolean;
          summary?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_translations_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          },
        ];
      };
      email_outbox: {
        Row: {
          attempts: number;
          created_at: string;
          id: string;
          last_error: string | null;
          locked_at: string | null;
          message_id: string;
          next_attempt_at: string;
          sent_at: string | null;
          state: string;
        };
        ComputedFields: never;
        Insert: {
          attempts?: number;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          locked_at?: string | null;
          message_id: string;
          next_attempt_at?: string;
          sent_at?: string | null;
          state?: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          locked_at?: string | null;
          message_id?: string;
          next_attempt_at?: string;
          sent_at?: string | null;
          state?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_outbox_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: true;
            referencedRelation: "contact_messages";
            referencedColumns: ["id"];
          },
        ];
      };
      legacy_imports: {
        Row: {
          checksum: string;
          created_at: string;
          legacy_id: string;
          source: string;
          target_id: string;
        };
        ComputedFields: never;
        Insert: {
          checksum: string;
          created_at?: string;
          legacy_id: string;
          source: string;
          target_id: string;
        };
        Update: {
          checksum?: string;
          created_at?: string;
          legacy_id?: string;
          source?: string;
          target_id?: string;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          alt: NonNullable<Json>;
          bucket: string;
          created_at: string;
          id: string;
          mime_type: string;
          path: string;
        };
        ComputedFields: never;
        Insert: {
          alt?: NonNullable<Json>;
          bucket: string;
          created_at?: string;
          id?: string;
          mime_type: string;
          path: string;
        };
        Update: {
          alt?: NonNullable<Json>;
          bucket?: string;
          created_at?: string;
          id?: string;
          mime_type?: string;
          path?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          attempts: number;
          key: string;
          updated_at: string;
          window_start: string;
        };
        ComputedFields: never;
        Insert: {
          attempts: number;
          key: string;
          updated_at?: string;
          window_start: string;
        };
        Update: {
          attempts?: number;
          key?: string;
          updated_at?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      testimonial_submissions: {
        Row: {
          consent_at: string;
          created_at: string;
          id: string;
          locale: string;
          message: string;
          name: string;
          status: string;
          submission_id: string;
        };
        ComputedFields: never;
        Insert: {
          consent_at?: string;
          created_at?: string;
          id?: string;
          locale: string;
          message: string;
          name: string;
          status?: string;
          submission_id: string;
        };
        Update: {
          consent_at?: string;
          created_at?: string;
          id?: string;
          locale?: string;
          message?: string;
          name?: string;
          status?: string;
          submission_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      claim_email_jobs: {
        Args: { batch_size?: number };
        Returns: {
          attempts: number;
          created_at: string;
          id: string;
          last_error: string | null;
          locked_at: string | null;
          message_id: string;
          next_attempt_at: string;
          sent_at: string | null;
          state: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "email_outbox";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      cleanup_portfolio: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      save_content: { Args: { payload: Json }; Returns: string };
      submit_contact: {
        Args: { payload: Json; rate_key: string };
        Returns: string;
      };
      take_rate_limit: {
        Args: {
          max_attempts: number;
          rate_key: string;
          window_seconds: number;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
