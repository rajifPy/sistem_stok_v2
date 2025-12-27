import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// POST - Scan/validate barcode
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode_id } = body;

    if (!barcode_id) {
      return NextResponse.json({ error: 'Barcode ID required' }, { status: 400 });
    }

    // Search for product
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode_id', barcode_id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        {
          error: 'Produk tidak ditemukan',
          barcode_id,
          found: false,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      found: true,
      product,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}