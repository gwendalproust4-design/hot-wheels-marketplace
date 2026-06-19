import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { productIds } = await request.json();
    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json({ error: 'Invalid productIds' }, { status: 400 });
    }

    if (productIds.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    if (supabaseAdmin) {
      console.log('Releasing products via Admin client:', productIds);
      const { data, error } = await supabaseAdmin
        .from('products')
        .update({ status: 'available', stock: 1 })
        .in('id', productIds)
        .select('id');
      
      if (error) {
        console.error('Supabase admin release error:', error);
        throw error;
      }
      
      console.log('Successfully released products:', data);
      return NextResponse.json({ success: true, released: data });
    } else {
      console.log('Mock fallback: Products released.');
      return NextResponse.json({ success: true, mock: true });
    }
  } catch (error: any) {
    console.error('Release products API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
