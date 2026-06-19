import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, buyerId, sellerId, title, image, price, deliveryMethod, shippingAddress, totalPrice, orderId } = body;

    if (!productId || !buyerId || !price) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (isStripeConfigured && stripe) {
      // Validate image URL for Stripe (must be HTTP/S and <= 2048 chars)
      const isValidUrl = image && (image.startsWith('http://') || image.startsWith('https://')) && image.length <= 2048;
      const stripeImages = isValidUrl ? [image] : [];

      const stripeMetadata: any = {
        productId,
        buyerId,
        sellerId,
        deliveryMethod,
        shippingAddress: JSON.stringify(shippingAddress),
      };
      if (orderId) {
        stripeMetadata.orderId = orderId;
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: title || 'Hot Wheels Collectible',
                images: stripeImages,
              },
              unit_amount: Math.round(price * 100), // Stripe expects cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: orderId 
          ? `${baseUrl}/profile?checkout_success=true&session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`
          : `${baseUrl}/profile?checkout_success=true&session_id={CHECKOUT_SESSION_ID}&productId=${productId}`,
        cancel_url: `${baseUrl}/cart?checkout_cancel=true`,
        metadata: stripeMetadata,
      });

      return NextResponse.json({ url: session.url });
    } else {
      // Fallback: Redirect to Mock Stripe Page
      // Serialize details to query params for the mock simulator
      const queryParams = new URLSearchParams({
        productId,
        buyerId,
        sellerId,
        price: price.toString(),
        totalPrice: totalPrice.toString(),
        deliveryMethod,
        fullName: shippingAddress.fullName || '',
        addressLine1: shippingAddress.addressLine1 || '',
        city: shippingAddress.city || '',
        postalCode: shippingAddress.postalCode || '',
        country: shippingAddress.country || '',
      });
      if (orderId) {
        queryParams.set('orderId', orderId);
      }

      return NextResponse.json({ 
        url: `/checkout/mock-stripe?${queryParams.toString()}`,
        mock: true 
      });
    }
  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
