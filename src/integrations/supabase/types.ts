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
      artist_profiles: {
        Row: {
          apple_music_url: string | null
          bio: string | null
          created_at: string
          genre: string | null
          id: string
          proof_url: string | null
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          soundcloud_url: string | null
          spotify_url: string | null
          stage_name: string
          status: string
          updated_at: string
          user_id: string
          youtube_url: string | null
        }
        Insert: {
          apple_music_url?: string | null
          bio?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          proof_url?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          stage_name: string
          status?: string
          updated_at?: string
          user_id: string
          youtube_url?: string | null
        }
        Update: {
          apple_music_url?: string | null
          bio?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          proof_url?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          stage_name?: string
          status?: string
          updated_at?: string
          user_id?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      artist_tracks: {
        Row: {
          album: string | null
          apple_music_url: string | null
          artist_user_id: string
          artwork_url: string | null
          audio_url: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          position: number
          soundcloud_url: string | null
          spotify_url: string | null
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          album?: string | null
          apple_music_url?: string | null
          artist_user_id: string
          artwork_url?: string | null
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          position?: number
          soundcloud_url?: string | null
          spotify_url?: string | null
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          album?: string | null
          apple_music_url?: string | null
          artist_user_id?: string
          artwork_url?: string | null
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          position?: number
          soundcloud_url?: string | null
          spotify_url?: string | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      coin_packages: {
        Row: {
          active: boolean
          coins: number
          created_at: string
          id: string
          label: string
          sort_order: number
          usd_cents: number
        }
        Insert: {
          active?: boolean
          coins: number
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          usd_cents: number
        }
        Update: {
          active?: boolean
          coins?: number
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          usd_cents?: number
        }
        Relationships: []
      }
      coin_purchases: {
        Row: {
          coins: number
          created_at: string
          id: string
          provider: string
          provider_ref: string | null
          status: string
          updated_at: string
          usd_cents: number
          user_id: string
        }
        Insert: {
          coins: number
          created_at?: string
          id?: string
          provider?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
          usd_cents: number
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          id?: string
          provider?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
          usd_cents?: number
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_flags: {
        Row: {
          created_at: string
          id: string
          meta: Json
          reason: string
          related_user_id: string | null
          resolved: boolean
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json
          reason: string
          related_user_id?: string | null
          resolved?: boolean
          severity?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json
          reason?: string
          related_user_id?: string | null
          resolved?: boolean
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gift_catalog: {
        Row: {
          active: boolean
          coin_value: number
          created_at: string
          gift_key: string
          name: string
          tier: string
        }
        Insert: {
          active?: boolean
          coin_value: number
          created_at?: string
          gift_key: string
          name: string
          tier?: string
        }
        Update: {
          active?: boolean
          coin_value?: number
          created_at?: string
          gift_key?: string
          name?: string
          tier?: string
        }
        Relationships: []
      }
      gifts_sent: {
        Row: {
          coin_value: number
          created_at: string
          gift_key: string
          gift_name: string
          id: string
          recipient_id: string
          sender_id: string
          stream_id: string | null
        }
        Insert: {
          coin_value: number
          created_at?: string
          gift_key: string
          gift_name: string
          id?: string
          recipient_id: string
          sender_id: string
          stream_id?: string | null
        }
        Update: {
          coin_value?: number
          created_at?: string
          gift_key?: string
          gift_name?: string
          id?: string
          recipient_id?: string
          sender_id?: string
          stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gifts_sent_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_sent_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_messages: {
        Row: {
          body: string
          created_at: string
          gift_coins: number
          gift_key: string | null
          id: string
          kind: string
          stream_id: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          gift_coins?: number
          gift_key?: string | null
          id?: string
          kind?: string
          stream_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          gift_coins?: number
          gift_key?: string | null
          id?: string
          kind?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          ended_at: string | null
          host_id: string
          id: string
          started_at: string
          status: string
          title: string | null
          viewer_count: number
        }
        Insert: {
          ended_at?: string | null
          host_id: string
          id?: string
          started_at?: string
          status?: string
          title?: string | null
          viewer_count?: number
        }
        Update: {
          ended_at?: string | null
          host_id?: string
          id?: string
          started_at?: string
          status?: string
          title?: string | null
          viewer_count?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action"]
          admin_id: string
          created_at: string
          expires_at: string | null
          id: string
          reason: string | null
          target_user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action"]
          admin_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          target_user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action"]
          admin_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          read: boolean
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          read?: boolean
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          admin_notes: string | null
          available_after: string | null
          coins: number
          created_at: string
          id: string
          payout_details: string
          payout_method: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          usd_cents: number
          user_id: string
          verified_at_request: boolean
        }
        Insert: {
          admin_notes?: string | null
          available_after?: string | null
          coins: number
          created_at?: string
          id?: string
          payout_details: string
          payout_method: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          usd_cents: number
          user_id: string
          verified_at_request?: boolean
        }
        Update: {
          admin_notes?: string | null
          available_after?: string | null
          coins?: number
          created_at?: string
          id?: string
          payout_details?: string
          payout_method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          usd_cents?: number
          user_id?: string
          verified_at_request?: boolean
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          coin_to_usd_cents: number
          creator_share_pct: number
          id: boolean
          min_payout_usd_cents: number
          payout_hold_days: number
          updated_at: string
        }
        Insert: {
          coin_to_usd_cents?: number
          creator_share_pct?: number
          id?: boolean
          min_payout_usd_cents?: number
          payout_hold_days?: number
          updated_at?: string
        }
        Update: {
          coin_to_usd_cents?: number
          creator_share_pct?: number
          id?: boolean
          min_payout_usd_cents?: number
          payout_hold_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          profile_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          profile_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          profile_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean
          bio: string | null
          coins: number
          cover_url: string | null
          created_at: string
          display_name: string
          earned_coins: number
          handle: string
          id: string
          is_verified: boolean
          location: string | null
          suspended_until: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          coins?: number
          cover_url?: string | null
          created_at?: string
          display_name: string
          earned_coins?: number
          handle: string
          id: string
          is_verified?: boolean
          location?: string | null
          suspended_until?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          coins?: number
          cover_url?: string | null
          created_at?: string
          display_name?: string
          earned_coins?: number
          handle?: string
          id?: string
          is_verified?: boolean
          location?: string | null
          suspended_until?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
        }
        Relationships: []
      }
      story_views: {
        Row: {
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_agent: boolean
          sender_id: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_agent?: boolean
          sender_id: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_agent?: boolean
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          coins: number
          created_at: string
          id: string
          kind: string
          meta: Json
          ref_id: string | null
          usd_cents: number
          user_id: string
        }
        Insert: {
          coins?: number
          created_at?: string
          id?: string
          kind: string
          meta?: Json
          ref_id?: string | null
          usd_cents?: number
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          ref_id?: string | null
          usd_cents?: number
          user_id?: string
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
      verifications: {
        Row: {
          country: string
          created_at: string
          document_type: string
          document_url: string
          id: string
          kind: Database["public"]["Enums"]["verification_kind"]
          legal_name: string
          notes: string | null
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: Database["public"]["Enums"]["verification_status"]
          user_id: string
        }
        Insert: {
          country: string
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          kind?: Database["public"]["Enums"]["verification_kind"]
          legal_name: string
          notes?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          kind?: Database["public"]["Enums"]["verification_kind"]
          legal_name?: string
          notes?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          user_id?: string
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          music: string | null
          status: string
          tags: string[]
          thumbnail_url: string | null
          user_id: string
          video_url: string
          views: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          music?: string | null
          status?: string
          tags?: string[]
          thumbnail_url?: string | null
          user_id: string
          video_url: string
          views?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          music?: string | null
          status?: string
          tags?: string[]
          thumbnail_url?: string | null
          user_id?: string
          video_url?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_count: { Args: never; Returns: number }
      claim_first_admin: { Args: never; Returns: boolean }
      get_or_create_conversation: {
        Args: { other_id: string }
        Returns: string
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      my_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          banned: boolean
          bio: string | null
          coins: number
          cover_url: string | null
          created_at: string
          display_name: string
          earned_coins: number
          handle: string
          id: string
          is_verified: boolean
          location: string | null
          suspended_until: string | null
          updated_at: string
          website: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_payout: {
        Args: { _coins: number; _details: string; _method: string }
        Returns: string
      }
      send_gift: {
        Args: { _gift_key: string; _recipient: string; _stream_id?: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      moderation_action:
        | "warn"
        | "suspend"
        | "unsuspend"
        | "ban"
        | "unban"
        | "verify"
        | "unverify"
      notification_kind:
        | "follow"
        | "like"
        | "comment"
        | "gift"
        | "mention"
        | "live"
        | "message"
        | "payout"
        | "topup"
      report_status: "open" | "reviewed" | "dismissed" | "actioned"
      verification_kind: "individual" | "business"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      moderation_action: [
        "warn",
        "suspend",
        "unsuspend",
        "ban",
        "unban",
        "verify",
        "unverify",
      ],
      notification_kind: [
        "follow",
        "like",
        "comment",
        "gift",
        "mention",
        "live",
        "message",
        "payout",
        "topup",
      ],
      report_status: ["open", "reviewed", "dismissed", "actioned"],
      verification_kind: ["individual", "business"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
