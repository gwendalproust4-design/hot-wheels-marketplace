import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, buyerId, sellerId, title, image, price, deliveryMethod, shippingAddress, totalPrice, orderId } = body;

    if (!productId || !buyerId || !price) {
      console.warn('Checkout API: Missing required parameters', { productId, buyerId, price });
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Safely parse shipping address (could be stringified JSON or an object)
    let parsedAddress: any = {};
    if (shippingAddress) {
      if (typeof shippingAddress === 'string') {
        try {
          parsedAddress = JSON.parse(shippingAddress);
        } catch (e) {
          console.warn('Checkout API: Failed to parse shippingAddress as JSON, using raw string:', shippingAddress);
          parsedAddress = { addressLine1: shippingAddress };
        }
      } else {
        parsedAddress = shippingAddress;
      }
    }

    // Dynamically resolve baseUrl from request headers to support any Vercel domain automatically
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    if (isStripeConfigured && stripe) {
      // Validate image URL for Stripe (must be HTTP/S and <= 2048 chars)
      const isValidUrl = image && (image.startsWith('http://') || image.startsWith('https://')) && image.length <= 2048;
      const stripeImages = isValidUrl ? [image] : [];

      const stripeMetadata: any = {
        productId,
        buyerId,
        sellerId,
        deliveryMethod: deliveryMethod || 'Standard',
        shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress || {}),
      };
      if (orderId) {
        stripeMetadata.orderId = orderId;
      }

      console.log('Checkout API: Creating Stripe session with metadata:', stripeMetadata);

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
              unit_amount: Math.round(Number(price) * 100), // Stripe expects cents
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
      console.log('Checkout API: Stripe is not configured. Falling back to local Simulator.');
      
      // Fallback: Redirect to Mock Stripe Page
      // Serialize details to query params for the mock simulator
      const queryParams = new URLSearchParams({
        productId,
        buyerId,
        sellerId,
        price: price.toString(),
        totalPrice: (totalPrice ?? price ?? 0).toString(),
        deliveryMethod: deliveryMethod || 'Standard',
        fullName: parsedAddress?.fullName || '',
        addressLine1: parsedAddress?.addressLine1 || '',
        city: parsedAddress?.city || '',
        postalCode: parsedAddress?.postalCode || '',
        country: parsedAddress?.country || '',
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
