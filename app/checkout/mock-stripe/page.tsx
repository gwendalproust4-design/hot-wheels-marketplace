'use client';

import React, { useState, use, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/db';
import { useToast } from '@/context/ToastContext';
import { ShieldCheck, CreditCard, Lock, Sparkles, Car, Info } from 'lucide-react';

function MockStripeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [product, setProduct] = useState<any>(null);
  
  // Extract queries
  const productId = searchParams.get('productId') || '';
  const buyerId = searchParams.get('buyerId') || '';
  const sellerId = searchParams.get('sellerId') || '';
  const price = parseFloat(searchParams.get('price') || '0');
  const totalPrice = parseFloat(searchParams.get('totalPrice') || '0');
  const deliveryMethod = searchParams.get('deliveryMethod') || 'Standard';
  const orderId = searchParams.get('orderId') || '';

  useEffect(() => {
    if (productId) {
      db.getProductById(productId).then(prod => {
        if (prod) {
          setProduct(prod);
        }
      });
    }
  }, [productId]);

  useEffect(() => {
    const emailParam = searchParams.get('buyerEmail');
    if (emailParam) {
      setCardForm(prev => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  const resolvedTitle = product ? product.title : (searchParams.get('title') || 'Miniature de Collection');
  const resolvedImage = product ? (product.images?.[0] || '') : (searchParams.get('image') || '');
  
  const address = {
    fullName: searchParams.get('fullName') || '',
    addressLine1: searchParams.get('addressLine1') || '',
    city: searchParams.get('city') || '',
    postalCode: searchParams.get('postalCode') || '',
    country: searchParams.get('country') || 'France',
  };

  const [cardForm, setCardForm] = useState({
    email: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    nameOnCard: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setLoadingStep('Connexion sécurisée à Stripe...');
    await new Promise(resolve => setTimeout(resolve, 800));

    setLoadingStep('Vérification de la carte...');
    await new Promise(resolve => setTimeout(resolve, 800));

    setLoadingStep('Autorisation de la transaction...');
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (orderId) {
        // Update existing order status to paid
        await db.updateOrderStatus(orderId, {
          status: 'paid',
          buyer_email: cardForm.email
        } as any);
      } else {
        // Record new order in local DB (which routes to Supabase or Mock fallback)
        await db.createOrder({
          buyer_id: buyerId,
          seller_id: sellerId,
          product_id: productId,
          product_title: resolvedTitle,
          product_image: resolvedImage,
          total_price: totalPrice,
          delivery_method: deliveryMethod,
          shipping_address: address,
          buyer_email: cardForm.email
        });
      }

      // Trigger order confirmation email to the buyer
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: cardForm.email,
            subject: `Confirmation de votre commande - Classicbug`,
            html: `
              <div style="background-color: #060713; color: #ffffff; font-family: sans-serif; padding: 2rem; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #00efff;">
                <h1 style="color: #00efff; text-align: center; border-bottom: 2px solid #ff007f; padding-bottom: 1rem; margin-top: 0;">Commande Confirmée !</h1>
                <p style="font-size: 1.1rem; line-height: 1.6;">Merci pour votre achat sur notre marketplace premium.</p>
                <div style="background-color: rgba(255,0,127,0.05); border: 1px solid rgba(255,0,127,0.2); padding: 1.25rem; border-radius: 6px; margin: 1.5rem 0;">
                  <h3 style="color: #ff007f; margin-top: 0; margin-bottom: 0.75rem;">Récapitulatif de la commande</h3>
                  <table style="width: 100%; color: #ffffff; font-size: 0.95rem;">
                    <tr>
                      <td style="padding: 0.25rem 0; color: #a3acb9;">Modèle :</td>
                      <td style="padding: 0.25rem 0; font-weight: bold; text-align: right;">${resolvedTitle}</td>
                    </tr>
                    <tr>
                      <td style="padding: 0.25rem 0; color: #a3acb9;">Mode de livraison :</td>
                      <td style="padding: 0.25rem 0; text-align: right;">${deliveryMethod}</td>
                    </tr>
                    <tr>
                      <td style="padding: 0.25rem 0; color: #a3acb9;">Montant Total :</td>
                      <td style="padding: 0.25rem 0; font-weight: bold; color: #ff007f; text-align: right;">${totalPrice.toFixed(2)} €</td>
                    </tr>
                  </table>
                </div>
                <div style="background-color: rgba(0,239,255,0.05); border: 1px solid rgba(0,239,255,0.2); padding: 1.25rem; border-radius: 6px; margin: 1.5rem 0;">
                  <h3 style="color: #00efff; margin-top: 0; margin-bottom: 0.75rem;">Adresse de livraison</h3>
                  <p style="margin: 0; font-size: 0.9rem; line-height: 1.5; color: #e6ebf1;">
                    <strong>${address.fullName}</strong><br/>
                    ${address.addressLine1}<br/>
                    ${address.postalCode} ${address.city}<br/>
                    ${address.country}
                  </p>
                </div>
                <p style="font-size: 0.9rem; color: #a3acb9; text-align: center; margin-top: 2rem;">Vous recevrez un e-mail avec un lien de suivi dès que le vendeur aura expédié votre colis.</p>
              </div>
            `
          })
        });
      } catch (emailErr) {
        console.warn('Failed to send confirmation email:', emailErr);
      }

      showToast('Paiement accepté ! Commande finalisée.', 'success');
      
      if (orderId) {
        router.push(`/profile?checkout_success=true&orderId=${orderId}`);
      } else {
        router.push('/profile?tab=transactions');
      }
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la validation du paiement', 'error');
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      color: '#30313d',
      minHeight: '100vh',
      margin: '-2rem 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '920px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0px 15px 35px rgba(50, 50, 93, 0.1), 0px 5px 15px rgba(0, 0, 0, 0.07)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        overflow: 'hidden'
      }}>
        {/* Left Column: Stripe Pricing and Item summary */}
        <div style={{
          backgroundColor: '#f4f6f8',
          padding: '2.5rem',
          borderRight: '1px solid #e6ebf1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff007f', fontWeight: 700, fontSize: '0.85rem', marginBottom: '2.5rem', letterSpacing: '0.05em' }}>
              <Sparkles size={14} fill="currentColor" />
              <span>TEST MODE STRIPE SIMULATOR</span>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <span style={{ color: '#697386', fontSize: '0.85rem', fontWeight: 600 }}>Payer Classicbug</span>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1a1f36', marginTop: '0.25rem' }}>
                {totalPrice.toFixed(2)} €
              </div>
            </div>

            {/* Product summary card */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #e6ebf1' }}>
              <div style={{ width: '64px', height: '48px', backgroundColor: '#000', borderRadius: '4px', overflow: 'hidden' }}>
                {resolvedImage ? (
                  <img src={resolvedImage} alt={resolvedTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                    <Car size={24} />
                  </div>
                )}
              </div>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1f36' }}>{resolvedTitle}</h4>
                <p style={{ fontSize: '0.75rem', color: '#697386' }}>{price.toFixed(2)} € + {deliveryMethod}</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <span style={{ color: '#697386', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={12} />
              Transactions de test sécurisées
            </span>
          </div>
        </div>

        {/* Right Column: Stripe card details entry */}
        <div style={{ padding: '2.5rem', position: 'relative' }}>
          {loading ? (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.95)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10
            }}>
              <div style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #635bff',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }} />
              <p style={{ fontWeight: 600, color: '#1a1f36', fontSize: '0.95rem' }}>{loadingStep}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1f36', marginBottom: '0.5rem' }}>Informations de paiement</h3>

            <div style={{ backgroundColor: '#e8f4fd', border: '1px solid #b3dbf8', borderRadius: '6px', padding: '0.85rem', color: '#0053b3', fontSize: '0.8rem', lineHeight: '1.4', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span><strong>Numéro de test Stripe :</strong> Saisissez n'importe quelle carte fictive (ex: <code>4242 4242 4242 4242</code>) avec n'importe quelle date future et CVC.</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4f566b', marginBottom: '0.35rem' }}>Adresse Email</label>
              <input 
                type="email" 
                name="email"
                required
                placeholder="nom@exemple.com"
                value={cardForm.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #d9dce1',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border 0.15s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#635bff'}
                onBlur={(e) => e.target.style.borderColor = '#d9dce1'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4f566b', marginBottom: '0.35rem' }}>Informations de carte</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #d9dce1', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    name="cardNumber"
                    required
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    value={cardForm.cardNumber}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                      border: 'none',
                      borderBottom: '1px solid #d9dce1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  <CreditCard size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a3acb9' }} />
                </div>
                
                <div style={{ display: 'flex' }}>
                  <input 
                    type="text" 
                    name="expiry"
                    required
                    placeholder="MM / AA"
                    maxLength={7}
                    value={cardForm.expiry}
                    onChange={handleInputChange}
                    style={{
                      width: '50%',
                      padding: '0.65rem 0.85rem',
                      border: 'none',
                      borderRight: '1px solid #d9dce1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  <input 
                    type="text" 
                    name="cvc"
                    required
                    placeholder="CVC"
                    maxLength={4}
                    value={cardForm.cvc}
                    onChange={handleInputChange}
                    style={{
                      width: '50%',
                      padding: '0.65rem 0.85rem',
                      border: 'none',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4f566b', marginBottom: '0.35rem' }}>Nom sur la carte</label>
              <input 
                type="text" 
                name="nameOnCard"
                required
                placeholder="Lucas Dubois"
                value={cardForm.nameOnCard}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #d9dce1',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <button 
              type="submit" 
              style={{
                background: '#635bff',
                color: '#ffffff',
                border: 'none',
                padding: '0.8rem',
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#7a73ff'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#635bff'}
            >
              <ShieldCheck size={16} />
              <span>Payer {totalPrice.toFixed(2)} €</span>
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function MockStripePage() {
  return (
    <Suspense fallback={
      <div style={{
        backgroundColor: '#f8f9fa',
        color: '#30313d',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', fontWeight: 600 }}>Chargement du module de paiement...</div>
      </div>
    }>
      <MockStripeContent />
    </Suspense>
  );
}
