// Type definitions for VIP Parfumerie Bar database
// Generated from Supabase schema

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentMethod = 'mobile_money' | 'card' | 'cash_on_delivery'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          brand: string
          description: string | null
          price: number
          original_price: number | null
          collection_id: string | null
          category: string | null
          stock_quantity: number
          is_featured: boolean
          images: string[]
          notes: Json | null
          concentration: string | null
          volume: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          brand: string
          description?: string | null
          price: number
          original_price?: number | null
          collection_id?: string | null
          category?: string | null
          stock_quantity?: number
          is_featured?: boolean
          images?: string[]
          notes?: Json | null
          concentration?: string | null
          volume?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          brand?: string
          description?: string | null
          price?: number
          original_price?: number | null
          collection_id?: string | null
          category?: string | null
          stock_quantity?: number
          is_featured?: boolean
          images?: string[]
          notes?: Json | null
          concentration?: string | null
          volume?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      newsletter_subscriptions: {
        Row: {
          id: string
          email: string
          phone: string | null
          user_id: string | null
          subscribed_at: string
          source: string
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
          user_id?: string | null
          subscribed_at?: string
          source?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          user_id?: string | null
          subscribed_at?: string
          source?: string
          is_active?: boolean
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          status: OrderStatus
          total_amount: number
          payment_method: PaymentMethod
          payment_status: PaymentStatus
          shipping_address: Json
          phone: string
          email: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          status?: OrderStatus
          total_amount: number
          payment_method: PaymentMethod
          payment_status?: PaymentStatus
          shipping_address: Json
          phone: string
          email: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          status?: OrderStatus
          total_amount?: number
          payment_method?: PaymentMethod
          payment_status?: PaymentStatus
          shipping_address?: Json
          phone?: string
          email?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          action: string
          user_id: string | null
          metadata: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          action: string
          user_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          action?: string
          user_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
