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
      console.log('Reserving products via Admin client:', productIds);
      const { data, error } = await supabaseAdmin
        .from('products')
        .update({ status: 'sold', stock: 0 })
        .in('id', productIds)
        .select('id');
      
      if (error) {
        console.error('Supabase admin update error:', error);
        throw error;
      }
      
      console.log('Successfully reserved products:', data);
      return NextResponse.json({ success: true, reserved: data });
    } else {
      console.log('Mock fallback: Products reserved client-side.');
      return NextResponse.json({ success: true, mock: true });
    }
  } catch (error: any) {
    console.error('Reserve products API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
