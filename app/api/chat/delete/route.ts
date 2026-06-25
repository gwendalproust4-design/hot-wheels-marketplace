import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, otherUserId, productId } = await request.json();

    if (!userId || !otherUserId || !productId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 });
    }

    const { error: error1 } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('product_id', productId)
      .eq('sender_id', userId)
      .eq('receiver_id', otherUserId);

    const { error: error2 } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('product_id', productId)
      .eq('sender_id', otherUserId)
      .eq('receiver_id', userId);

    if (error1 || error2) {
      throw error1 || error2;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting conversation in API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
