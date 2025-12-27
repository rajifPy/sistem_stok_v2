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

// Database types
export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>;
      };
    };
  };
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to call generate_transaction_id function
export async function generateTransactionId(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_transaction_id');
  
  if (error) {
    console.error('Error generating transaction ID:', error);
    // Fallback to manual generation
    const { data: lastTrans } = await supabase
      .from('transactions')
      .select('transaksi_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastTrans) return 'TRX00001';
    
    const lastNum = parseInt(lastTrans.transaksi_id.replace('TRX', ''));
    return `TRX${(lastNum + 1).toString().padStart(5, '0')}`;
  }
  
  return data as string;
}
