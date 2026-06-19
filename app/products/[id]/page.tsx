'use client';

import React, { use, useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Product, Review } from '@/lib/mockDb';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, MessageSquare, Heart, Star, Calendar, Bookmark, ShieldCheck, Tag } from 'lucide-react';

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Gallery State
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    async function loadProductAndReviews() {
      setLoading(true);
      try {
        const currentProduct = await db.getProductById(id);

        if (currentProduct) {
          setProduct(currentProduct);
          
          if (user) {
            const favoriteState = await db.isFavorite(user.id, currentProduct.id);
            setIsFav(favoriteState);
          }

          const sellerReviews = await db.getReviews(currentProduct.seller_id);
          setReviews(sellerReviews);
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProductAndReviews();
  }, [id, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      showToast('Connectez-vous pour ajouter des favoris !', 'info');
      router.push('/profile');
      return;
    }
    if (product) {
      try {
        const active = await db.toggleFavorite(user.id, product.id);
        setIsFav(active);
        showToast(active ? 'Ajouté aux favoris !' : 'Retiré des favoris', 'success');
      } catch (err) {
        showToast('Erreur favoris', 'error');
      }
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      showToast('Connectez-vous pour envoyer un message au vendeur !', 'info');
      router.push('/profile');
      return;
    }
    if (!product) return;

    if (user.id === product.seller_id) {
      showToast('Vous ne pouvez pas discuter avec vous-même !', 'info');
      return;
    }

    setChatLoading(true);
    try {
      const initialText = `Bonjour, je suis intéressé par votre annonce "${product.title}". Est-elle toujours disponible ?`;
      const allMsgs = await db.getMessages(user.id);
      
      const chatExists = allMsgs.some(
        m => m.product_id === product.id && 
        ((m.sender_id === user.id && m.receiver_id === product.seller_id) || 
         (m.sender_id === product.seller_id && m.receiver_id === user.id))
      );

      if (!chatExists) {
        await db.sendMessage({
          sender_id: user.id,
          receiver_id: product.seller_id,
          product_id: product.id,
          content: initialText
        });
      }

      router.push(`/chat?productId=${product.id}&recipientId=${product.seller_id}`);
    } catch (err) {
      console.error(err);
      showToast('Erreur chat', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card shimmer" style={{ height: '500px', maxWidth: '900px', margin: '0 auto' }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Modèle introuvable</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Ce produit n'existe plus ou a été retiré de la vente.</p>
        <Link href="/" className="btn btn-primary flex items-center gap-2" style={{ display: 'inline-flex' }}>
          <ArrowLeft size={16} />
          <span>Retour au catalogue</span>
        </Link>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  const hasMultipleImages = product.images && product.images.length > 1;

  return (
    <div className="container">
      <Link href="/" className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 600 }}>
        <ArrowLeft size={16} />
        <span>Retour au catalogue</span>
      </Link>

      <div className="grid grid-details" style={{
        gap: '3rem',
        alignItems: 'start'
      }}>
        {/* Left Column: Widescreen Image Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card card-glass" style={{ padding: '1rem', position: 'relative' }}>
            <div style={{
              width: '100%',
              aspectRatio: '4/3',
              height: 'auto',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              backgroundColor: '#03040c',
              border: '1px solid var(--border-color)'
            }}>
              <img 
                src={product.images[activeImgIndex] || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=800'} 
                alt={product.title} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            
            <button 
              onClick={handleToggleFavorite}
              style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(6, 7, 19, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-color)',
                color: isFav ? 'var(--color-crimson)' : '#ffffff',
                transition: 'all var(--transition-fast)',
                boxShadow: isFav ? '0 0 10px rgba(67, 130, 223, 0.3)' : 'none'
              }}
              title="Ajouter aux favoris"
            >
              <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Clickable Image Thumbnails Gallery */}
          {hasMultipleImages && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {product.images.map((img, index) => {
                const isActive = activeImgIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => setActiveImgIndex(index)}
                    style={{
                      width: '80px',
                      height: '60px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      backgroundColor: '#03040c',
                      border: isActive ? '2px solid var(--color-crimson)' : '1px solid var(--border-color)',
                      boxShadow: isActive ? '0 0 8px rgba(255, 0, 60, 0.3)' : 'none',
                      transition: 'all var(--transition-fast)',
                      opacity: isActive ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.opacity = '0.6'; }}
                  >
                    <img src={img} alt={`Photo ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Listing Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Metadata Block */}
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
              <span className={`badge badge-${product.condition}`}>
                {product.condition === 'blister' ? 'Blister' : 'Loose (Sans boîte)'}
              </span>
              <span style={{
                color: 'var(--color-cyan)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }} className="flex items-center gap-1">
                <Bookmark size={14} />
                {product.series}
              </span>
            </div>
            
            <h1 className="page-title" style={{ fontSize: '2.2rem', marginBottom: '0.5rem', textTransform: 'none' }}>
              {product.title}
            </h1>
            
            <div className="flex items-center gap-4" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Année {product.year}
              </span>
              <span>•</span>
              {product.date_released && (
                <>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    Parution : {new Date(product.date_released).toLocaleDateString('fr-FR')}
                  </span>
                  <span>•</span>
                </>
              )}
              <span>Stock : {product.stock}</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prix de vente</span>
            <div className="flex items-baseline gap-2" style={{ margin: '0.5rem 0 1.5rem 0' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-crimson)', textShadow: '0 0 15px rgba(47, 47, 228, 0.2)' }}>
                {product.price.toFixed(2)} €
              </span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>TVA incluse</span>
            </div>

            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr' }}>
              <button 
                onClick={() => addToCart(product)} 
                className="btn btn-primary flex items-center justify-center gap-2"
                style={{ width: '100%', padding: '1rem' }}
              >
                <ShoppingCart size={18} />
                <span>Ajouter au panier</span>
              </button>
              
              <button 
                onClick={handleStartChat} 
                className="btn btn-secondary flex items-center justify-center gap-2"
                style={{ width: '100%', padding: '1rem' }}
                disabled={chatLoading}
              >
                <MessageSquare size={18} />
                <span>Contacter le vendeur</span>
              </button>
            </div>

            <div className="flex items-center gap-2" style={{ marginTop: '1.25rem', color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>
              <ShieldCheck size={14} />
              <span>Achat Garanti & Sécurisé</span>
            </div>
          </div>

          {/* Description Block */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em', color: 'var(--color-cyan)' }}>Description</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              {product.description || "Aucune description supplémentaire fournie pour ce modèle miniature."}
            </p>
          </div>

          {/* Seller profile block */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em', color: 'var(--color-cyan)' }}>Profil Vendeur</h3>
            
            <div className="flex items-center gap-4" style={{ marginBottom: '1.5rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--color-cyan)',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem'
              }}>
                {(product.seller_name || 'Vendeur').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>@{product.seller_name || 'vendeur'}</h4>
                <div className="flex items-center gap-1" style={{ color: 'var(--color-yellow)', fontSize: '0.85rem', fontWeight: 700 }}>
                  <Star size={14} fill="currentColor" />
                  <span>{averageRating} / 5</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({reviews.length} avis)</span>
                </div>
              </div>
            </div>

            {/* Seller Reviews List */}
            {reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((rev) => (
                  <div key={rev.id} className="card card-glass" style={{ padding: '1rem' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-cyan)' }}>@{rev.reviewer_name}</span>
                      <div className="flex items-center gap-0.5" style={{ color: 'var(--color-yellow)' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={12} 
                            fill={i < rev.rating ? 'currentColor' : 'none'} 
                            stroke="currentColor" 
                          />
                        ))}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                Aucune évaluation pour ce vendeur pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
