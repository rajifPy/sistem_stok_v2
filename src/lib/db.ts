import { createClient } from '@supabase/supabase-js';

// TypeScript interfaces
export interface Product {
  id: string;
  barcode_id: string;
  nama_produk: string;
  kategori: string;
  stok: number;
  harga_modal: number;
  harga_jual: number;
  created_at: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  transaksi_id: string;
  product_id?: string;
  barcode_id: string;
  nama_produk: string;
  jumlah: number;
  harga_satuan: number;
  total_harga: number;
  keuntungan: number;
  created_at: string;
}

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: {
          barcode_id: string;
          nama_produk: string;
          kategori: string;
          stok: number;
          harga_modal: number;
          harga_jual: number;
        };
        Update: {
          barcode_id?: string;
          nama_produk?: string;
          kategori?: string;
          stok?: number;
          harga_modal?: number;
          harga_jual?: number;
        };
      };
      transactions: {
        Row: Transaction;
        Insert: {
          transaksi_id: string;
          product_id?: string;
          barcode_id: string;
          nama_produk: string;
          jumlah: number;
          harga_satuan: number;
          total_harga: number;
          keuntungan: number;
        };
        Update: {
          transaksi_id?: string;
          product_id?: string;
          barcode_id?: string;
          nama_produk?: string;
          jumlah?: number;
          harga_satuan?: number;
          total_harga?: number;
          keuntungan?: number;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to generate transaction ID
export async function generateTransactionId(): Promise<string> {
  try {
    const { data: lastTrans } = await supabase
      .from('transactions')
      .select('transaksi_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastTrans) return 'TRX00001';
    
    const lastNum = parseInt(lastTrans.transaksi_id.replace('TRX', ''));
    return `TRX${(lastNum + 1).toString().padStart(5, '0')}`;
  } catch (error) {
    // If no transactions exist, start with TRX00001
    return 'TRX00001';
  }
}
