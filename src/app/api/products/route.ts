import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// GET - Get all products
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode_id, nama_produk, kategori, stok, harga_modal, harga_jual } = body;

    // Validation
    if (!barcode_id || !nama_produk || !kategori) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (harga_jual <= harga_modal) {
      return NextResponse.json(
        { error: 'Harga jual harus lebih besar dari harga modal' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{ barcode_id, nama_produk, kategori, stok, harga_modal, harga_jual }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const { nama_produk, kategori, stok, harga_modal, harga_jual } = body;

    const { data, error } = await supabase
      .from('products')
      .update({ nama_produk, kategori, stok, harga_modal, harga_jual })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}