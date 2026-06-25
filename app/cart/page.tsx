'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, CreditCard, Shield, Truck, MapPin, ArrowRight, ShoppingCart } from 'lucide-react';
import { db } from '@/lib/db';

const SHIPPING_COSTS: Record<string, { price: number; name: string }> = {
  'France': { price: 4.50, name: 'Mondial Relay (France)' },
  'Belgique': { price: 4.50, name: 'Mondial Relay (Belgique)' },
  'Luxembourg': { price: 4.50, name: 'Mondial Relay (Luxembourg)' },
  'Allemagne': { price: 4.50, name: 'Mondial Relay (Allemagne)' },
  'Espagne': { price: 4.50, name: 'Mondial Relay (Espagne)' },
  'Italie': { price: 4.50, name: 'Mondial Relay (Italie)' },
  'Pays-Bas': { price: 4.50, name: 'Mondial Relay (Pays-Bas)' },
  'Pologne': { price: 4.50, name: 'Mondial Relay (Pologne)' },
  'Portugal': { price: 4.50, name: 'Mondial Relay (Portugal)' },
  'Royaume-Uni': { price: 19.00, name: 'Livraison Suivie (Royaume-Uni)' },
  'Autre Europe': { price: 15.00, name: 'Livraison Suivie (Europe)' },
  'Reste du monde': { price: 35.50, name: 'Livraison Suivie (International)' }
};

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [address, setAddress] = useState({
    fullName: '',
    addressLine1: '',
    city: '',
    postalCode: '',
    country: 'France',
    phone: ''
  });
  const [checkingOut, setCheckingOut] = useState(false);
  const [acceptCGV, setAcceptCGV] = useState(false);

  const isMultiProduct = cartItems.length > 1;
  const shippingInfo = SHIPPING_COSTS[address.country] || SHIPPING_COSTS['France'];
  const itemsSubtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
  const totalPrice = isMultiProduct ? itemsSubtotal : (itemsSubtotal + shippingInfo.price);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptCGV) {
      showToast('Veuillez accepter les Conditions Générales de Vente (CGV) pour continuer', 'error');
      return;
    }
    
    if (!user) {
      showToast('Veuillez vous connecter pour procéder au paiement', 'info');
      router.push('/profile?redirect=cart');
      return;
    }

    if (cartItems.length === 0) {
      showToast('Votre panier est vide', 'error');
      return;
    }

    if (!address.fullName || !address.addressLine1 || !address.city || !address.postalCode || !address.phone) {
      showToast('Veuillez remplir toutes les informations de livraison, y compris le numéro de téléphone', 'error');
      return;
    }

    setCheckingOut(true);

    if (isMultiProduct) {
      try {
        const primaryProduct = cartItems[0];
        
        // 1. Create a pending order with status pending (let the DB generate the ID)
        const createdOrder = await db.createOrder({
          buyer_id: user.id,
          seller_id: primaryProduct.seller_id,
          product_id: primaryProduct.id,
          product_title: `${primaryProduct.title} + ${cartItems.length - 1} autre(s) modèle(s)`,
          product_image: primaryProduct.images?.[0] || '',
          total_price: itemsSubtotal,
          delivery_method: `DEVIS_PENDING|${JSON.stringify(cartItems.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price,
            image: item.images?.[0] || '',
            series: item.series,
            year: item.year,
            condition: item.condition
          })))}`,
          shipping_address: address,
          buyer_email: user.email,
          status: 'pending' as any
        });

        // 2. Decrement stock of all items in cart to 0 (reserved) via server API to bypass client RLS limits
        try {
          await fetch('/api/products/reserve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds: cartItems.map(item => item.id) })
          });
        } catch (err) {
          console.error('Failed to reserve products via API:', err);
        }

        // Local state mock update for local mode
        const isSup = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        if (!isSup) {
          for (const item of cartItems) {
            await db.updateProduct(item.id, { stock: 0, status: 'sold' });
          }
        }

        // 3. Send quote message structure to live chat
        const msgContent = `[BASKET_QUOTE]:${JSON.stringify({
          orderId: createdOrder.id,
          items: cartItems.map(item => ({ id: item.id, title: item.title, price: item.price })),
          subtotal: itemsSubtotal,
          shippingAddress: address
        })}`;

        await db.sendMessage({
          sender_id: user.id,
          receiver_id: primaryProduct.seller_id,
          product_id: primaryProduct.id,
          content: msgContent
        });

        // 4. Clear cart and redirect to conversation
        clearCart();
        showToast('Demande de devis envoyée avec succès au vendeur !', 'success');
        router.push(`/chat?productId=${primaryProduct.id}&recipientId=${primaryProduct.seller_id}`);
      } catch (err: any) {
        console.error('Quote checkout error:', err);
        showToast(err.message || 'Erreur lors de la création du devis', 'error');
      } finally {
        setCheckingOut(false);
      }
      return;
    }

    try {
      const primaryProduct = cartItems[0];
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: primaryProduct.id,
          buyerId: user.id,
          sellerId: primaryProduct.seller_id,
          title: primaryProduct.title,
          image: primaryProduct.images?.[0] || '',
          price: primaryProduct.price,
          deliveryMethod: shippingInfo.name,
          shippingAddress: address,
          totalPrice: totalPrice,
          buyerEmail: user.email
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        clearCart();
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erreur lors du checkout');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      showToast(err.message || 'Une erreur est survenue lors de la redirection', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card card-glass" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <ShoppingCart size={48} className="logo-cyan" />
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Votre panier est vide</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Parcourez notre catalogue et dénichez des pièces de collection uniques !</p>
          <Link href="/" className="btn btn-primary">
            Retourner au catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title" style={{ marginBottom: '2rem' }}>
        Mon Panier <span className="neon-gradient-text">({cartItems.length})</span>
      </h1>

      <div className="grid grid-cart" style={{
        gap: '2.5rem',
        alignItems: 'start'
      }}>
        {/* Left: Cart Items & Delivery Mode */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Cart Products List */}
          <div className="card card-glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.05em', color: 'var(--color-cyan)' }}>
              Articles sélectionnés
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center cart-item" style={{
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '1.25rem',
                  marginBottom: '1.25rem'
                }}>
                  <div className="flex items-center gap-4">
                    <div style={{ width: '80px', height: '60px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: '#03040c', border: '1px solid var(--border-color)' }}>
                      <img src={item.images?.[0] || ''} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <span className={`badge badge-${item.condition}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', marginBottom: '0.25rem' }}>
                        {item.condition}
                      </span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Série : {item.series} • Année : {item.year}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span style={{ fontWeight: 800, color: 'var(--color-magenta)', fontSize: '1.1rem' }}>
                      {item.price.toFixed(2)} €
                    </span>
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      style={{ color: 'var(--text-muted)' }}
                      title="Retirer du panier"
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Automatic Shipping Cost Calculation Panel */}
          <div className="card card-glass" style={{ padding: '1.5rem' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em', color: 'var(--color-cyan)' }}>
              <Truck size={18} />
              <span>Tarif de livraison</span>
            </h3>
            {isMultiProduct ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Pour un panier contenant plusieurs articles, les frais de port sont calculés manuellement par le vendeur dans le chat après soumission du panier.
              </p>
            ) : (
              <>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                  Les frais de port sont calculés automatiquement en fonction du pays de destination saisi ci-contre.
                </p>
                <div className="flex justify-between items-center" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{shippingInfo.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Envoi soigné avec suivi international</p>
                  </div>
                  <span style={{ fontWeight: 800, color: 'var(--color-cyan)', fontSize: '1.15rem' }}>
                    {shippingInfo.price.toFixed(2)} €
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Checkout Shipping Form & Payment Summary */}
        <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Shipping Address form */}
          <div className="card card-glass" style={{ padding: '1.5rem' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.05em', color: 'var(--color-cyan)' }}>
              <MapPin size={18} />
              <span>Adresse de livraison</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input 
                type="text" 
                name="fullName" 
                className="form-input" 
                placeholder="Lucas Dubois"
                required 
                value={address.fullName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Numéro de téléphone</label>
              <input 
                type="tel" 
                name="phone" 
                className="form-input" 
                placeholder="Ex : 06 12 34 56 78"
                required 
                value={address.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Adresse de livraison</label>
              <input 
                type="text" 
                name="addressLine1" 
                className="form-input" 
                placeholder="12 rue des Chenilles"
                required 
                value={address.addressLine1}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-4 grid-shipping-city-zip">
              <div className="form-group">
                <label className="form-label">Ville</label>
                <input 
                  type="text" 
                  name="city" 
                  className="form-input" 
                  placeholder="Paris"
                  required 
                  value={address.city}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Code postal</label>
                <input 
                  type="text" 
                  name="postalCode" 
                  className="form-input" 
                  placeholder="75001"
                  required 
                  value={address.postalCode}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Pays</label>
              <select 
                name="country" 
                className="form-input form-select" 
                value={address.country}
                onChange={handleInputChange}
              >
                <option value="France">France</option>
                <option value="Belgique">Belgique</option>
                <option value="Luxembourg">Luxembourg</option>
                <option value="Allemagne">Allemagne</option>
                <option value="Espagne">Espagne</option>
                <option value="Italie">Italie</option>
                <option value="Pays-Bas">Pays-Bas</option>
                <option value="Pologne">Pologne</option>
                <option value="Portugal">Portugal</option>
                <option value="Royaume-Uni">Royaume-Uni</option>
                <option value="Autre Europe">Autre pays d'Europe</option>
                <option value="Reste du monde">Reste du monde</option>
              </select>
            </div>
          </div>

          {/* Pricing Summary & Trigger */}
          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.05em', color: 'var(--color-cyan)' }}>
              Récapitulatif
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                <span>Sous-total</span>
                <span>{itemsSubtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                {isMultiProduct ? (
                  <>
                    <span>Frais de port</span>
                    <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Calculé par le vendeur</span>
                  </>
                ) : (
                  <>
                    <span>Frais de port ({shippingInfo.name})</span>
                    <span>{shippingInfo.price.toFixed(2)} €</span>
                  </>
                )}
              </div>
              
              <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0', paddingTop: '1rem' }} />
              
              <div className="flex justify-between" style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                <span>Total</span>
                <span className="neon-gradient-text" style={{ fontSize: '1.3rem' }}>{totalPrice.toFixed(2)} €</span>
              </div>
            </div>

            {/* CGV acceptance checkbox */}
            <div className="flex items-start gap-2" style={{ margin: '1.25rem 0 1.5rem 0', userSelect: 'none' }}>
              <input 
                type="checkbox" 
                id="acceptCGV" 
                checked={acceptCGV}
                onChange={(e) => setAcceptCGV(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  marginTop: '2px',
                  cursor: 'pointer',
                  accentColor: 'var(--color-cyan)',
                  flexShrink: 0
                }}
              />
              <label htmlFor="acceptCGV" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: '1.4' }}>
                En cochant cette case, j'accepte sans réserve les{' '}
                <Link href="/legal?tab=cgv" target="_blank" style={{ color: 'var(--color-cyan)', textDecoration: 'underline' }}>
                  Conditions Générales de Vente (CGV)
                </Link>
                .
              </label>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary flex items-center justify-center gap-2" 
              style={{ width: '100%', padding: '0.95rem' }}
              disabled={checkingOut}
            >
              <CreditCard size={16} />
              <span>
                {checkingOut 
                  ? 'Redirection...' 
                  : isMultiProduct 
                    ? 'Demander un devis (Envoi au chat)' 
                    : 'Payer avec Stripe'}
              </span>
              <ArrowRight size={14} />
            </button>

            <div className="flex items-center justify-center gap-2" style={{ marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Shield size={12} />
              <span>Transactions cryptées SSL</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
