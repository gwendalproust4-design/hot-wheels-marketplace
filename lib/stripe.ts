import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

export const isStripeConfigured = !!stripeSecretKey;

export const stripe = isStripeConfigured
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15' as any,
    })
  : null;

if (!isStripeConfigured) {
  console.log('⚠️ Stripe Secret Key not found. Using local Stripe checkout simulator.');
}
