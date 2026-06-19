import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Extract address and metadata
    const shippingAddress = session.metadata?.shippingAddress 
      ? JSON.parse(session.metadata.shippingAddress) 
      : {
          fullName: session.customer_details?.name || 'Client Stripe',
          addressLine1: session.customer_details?.address?.line1 || 'Adresse Stripe',
          city: session.customer_details?.address?.city || '',
          postalCode: session.customer_details?.address?.postal_code || '',
          country: session.customer_details?.address?.country || '',
        };

    return NextResponse.json({
      productId: session.metadata?.productId,
      buyerId: session.metadata?.buyerId,
      sellerId: session.metadata?.sellerId,
      deliveryMethod: session.metadata?.deliveryMethod || 'Standard',
      shippingAddress,
      totalPrice: session.amount_total ? session.amount_total / 100 : 0,
      buyerEmail: session.customer_details?.email
    });
  } catch (error: any) {
    console.error('Retrieve Stripe session error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
