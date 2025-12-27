import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// GET - Get all transactions
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode_id, jumlah } = body;

    if (!barcode_id || !jumlah || jumlah <= 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Get product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('barcode_id', barcode_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    // Check stock
    if (product.stok < jumlah) {
      return NextResponse.json(
        { error: `Stok tidak cukup. Tersedia: ${product.stok}` },
        { status: 400 }
      );
    }

    // Generate transaction ID
    const { data: lastTrans } = await supabase
      .from('transactions')
      .select('transaksi_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let transaksi_id = 'TRX00001';
    if (lastTrans) {
      const lastNum = parseInt(lastTrans.transaksi_id.replace('TRX', ''));
      transaksi_id = `TRX${(lastNum + 1).toString().padStart(5, '0')}`;
    }

    // Calculate totals
    const total_harga = jumlah * product.harga_jual;
    const keuntungan = jumlah * (product.harga_jual - product.harga_modal);

    // Create transaction
    const { data: transaction, error: transError } = await supabase
      .from('transactions')
      .insert([
        {
          transaksi_id,
          product_id: product.id,
          barcode_id: product.barcode_id,
          nama_produk: product.nama_produk,
          jumlah,
          harga_satuan: product.harga_jual,
          total_harga,
          keuntungan,
        },
      ])
      .select()
      .single();

    if (transError) throw transError;

    // Update stock
    const { error: stockError } = await supabase
      .from('products')
      .update({ stok: product.stok - jumlah })
      .eq('id', product.id);

    if (stockError) {
      // Rollback transaction if stock update fails
      await supabase.from('transactions').delete().eq('id', transaction.id);
      throw stockError;
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}