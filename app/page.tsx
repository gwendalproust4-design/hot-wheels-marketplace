'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Product } from '@/lib/mockDb';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Search, Plus, ShoppingCart, Sparkles, Shield, Truck, MessageSquare, Send, Calendar, Star, Image } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroAspectRatio, setHeroAspectRatio] = useState<number>(1.6);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  useEffect(() => {
    setHeroAspectRatio(1.6);
  }, [products]);

  useEffect(() => {
    document.title = 'Bourse d\'Échanges de Hot Wheels Rares & Premium | Classicbug';
    let metaDescription = document.querySelector('meta[name="description"]');
    const descText = 'La plateforme de référence en France pour la revente de voitures miniatures Hot Wheels de collection. Retrouvez des modèles rares : Premium Boulevard, Red Line Club (RLC), Super Treasure Hunts (STH), Mainlines neuves sous blister ou loose.';
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', descText);
  }, []);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState<'all' | 'blister' | 'loose'>('all');
  const [series, setSeries] = useState('all');
  const [year, setYear] = useState('all');
  
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const availableProducts = await db.getProducts();
        setProducts(availableProducts);
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleSubscribeNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubmittingNewsletter(true);
    try {
      // 1. Save in database
      await db.subscribeNewsletter(newsletterEmail);

      // 2. Trigger send-email API
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: newsletterEmail,
          subject: 'Bienvenue au Cercle des Collectionneurs Hot Wheels ! 🚗',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; background-color: #060713; color: #ffffff; border: 1px solid #1b1d30; border-radius: 8px;">
              <h2 style="color: #00efff; text-align: center; text-transform: uppercase;">Bienvenue au Cercle !</h2>
              <p>Bonjour,</p>
              <p>Merci pour votre inscription à notre newsletter d\'alertes privées.</p>
              <p><strong>Vous recevrez désormais une alerte par email à chaque nouvel ajout de miniature rare au catalogue de la Bourse d\'Échanges.</strong></p>
              <p>À très vite sur la boutique !</p>
              <hr style="border: 0; border-top: 1px solid #1b1d30; margin: 2rem 0;" />
              <p style="font-size: 0.8rem; color: #a3acb9; text-align: center;">Classicbug - La plateforme ultime de miniatures de collection</p>
            </div>
          `
        })
      });

      alert('Inscription enregistrée ! Un e-mail de confirmation vous a été envoyé.');
      setNewsletterEmail('');
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l\'inscription.");
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  const uniqueSeries = Array.from(new Set(products.map(p => p.series)));
  const uniqueYears = Array.from(new Set(products.map(p => p.year.toString()))).sort((a,b) => b.localeCompare(a));

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCondition = condition === 'all' || product.condition === condition;
    const matchesSeries = series === 'all' || product.series === series;
    const matchesYear = year === 'all' || product.year.toString() === year;
    
    return matchesSearch && matchesCondition && matchesSeries && matchesYear;
  });

  // Highlighted masterpiece for the showroom hero (prefer pinned first, fallback to latest in stock, then fallback to first product)
  const featuredProduct = products.find(p => p.is_pinned && p.stock > 0 && p.status === 'available')
    || [...products]
        .filter(p => p.stock > 0 && p.status === 'available')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    || products[0];

  return (
    <div className="container">
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
        Bourse d'Échanges de Hot Wheels de Collection Rares | Premium, RLC, STH
      </h1>
      {/* Redesigned Showroom Hero */}
      {featuredProduct && (
        <section style={{
          background: 'linear-gradient(135deg, rgba(16, 19, 38, 0.95) 0%, rgba(47, 47, 228, 0.08) 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md), 0 0 25px rgba(47, 47, 228, 0.05)',
          padding: '3.5rem 2.5rem',
          marginBottom: '3rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 80% 40%, rgba(0, 225, 255, 0.08) 0%, transparent 60%)',
            zIndex: 1
          }} />
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2
          }}>
            {/* Left Column: Widescreen Info */}
            <div>
              <span className="badge badge-blister" style={{ marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Star size={12} fill="currentColor" /> Modèle Vedette du Showroom
              </span>
              <h2 className="page-title" style={{ fontSize: '2.8rem', lineHeight: '1.1', marginBottom: '1rem', textTransform: 'none' }}>
                {featuredProduct.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                {featuredProduct.description}
              </p>

              <div className="flex items-center gap-6" style={{ marginBottom: '2rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Série de sortie</span>
                  <span style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>{featuredProduct.series}</span>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Année de fonderie</span>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>{featuredProduct.year}</span>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Prix</span>
                  <span style={{ color: 'var(--color-crimson)', fontWeight: 800 }}>{featuredProduct.price.toFixed(2)} €</span>
                </div>
              </div>

              <div className="flex gap-4 hero-buttons-container">
                <Link href={`/products/${featuredProduct.id}`} className="btn btn-primary btn-glow">
                  Découvrir la Galerie
                </Link>
                <button 
                  onClick={() => addToCart(featuredProduct)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  <span>Acheter direct</span>
                </button>
              </div>
            </div>

            {/* Right Column: Luxurious Floating Showroom Display */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              <div className="hero-showcase-container">
                {/* Radial spotlight effect behind the product */}
                <div className="hero-glow-bg" />
                
                {/* Float animation wrapper */}
                <div className="hero-product-wrapper">
                  {/* High-end borderless glassmorphic showcase */}
                  <div className="hero-product-image-container hero-image-wrapper" style={{
                    width: '100%',
                    maxWidth: heroAspectRatio < 1.1 ? '280px' : '420px',
                    aspectRatio: heroAspectRatio,
                    position: 'relative'
                  }}>
                    {/* Soft ambient back-illumination clone */}
                    <img 
                      src={featuredProduct.images[0]} 
                      alt="" 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'blur(20px) brightness(0.6)',
                        opacity: 0.5,
                        zIndex: 1,
                        transform: 'scale(1.1)'
                      }}
                    />
                    
                    {/* Front high-resolution model view */}
                    <img 
                      src={featuredProduct.images[0]} 
                      alt={featuredProduct.title} 
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) {
                          setHeroAspectRatio(img.naturalWidth / img.naturalHeight);
                        }
                      }}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        position: 'relative',
                        zIndex: 2
                      }}
                    />
                  </div>
                  
                  {/* Soft 3D ground shadow */}
                  <div className="hero-floor-shadow" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trust Badges Grid */}
      <section className="hide-mobile" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '4rem'
      }}>
        <div className="card card-glass flex items-center gap-4" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ color: 'var(--color-crimson)' }}>
            <Truck size={32} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', textTransform: 'uppercase' }}>Expédition Blindée</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Emballage carton double-cannelure avec papier bulle de qualité.</p>
          </div>
        </div>

        <div className="card card-glass flex items-center gap-4" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ color: 'var(--color-cyan)' }}>
            <Shield size={32} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', textTransform: 'uppercase' }}>Authenticité Vérifiée</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Chaque miniature est inspectée pour certifier son état exact.</p>
          </div>
        </div>

        <div className="card card-glass flex items-center gap-4" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ color: 'var(--color-gold)' }}>
            <MessageSquare size={32} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', textTransform: 'uppercase' }}>Service Live Support</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Une question sur un modèle ? Discutez en direct avec la boutique.</p>
          </div>
        </div>
      </section>

      {/* Catalog Search & Filters Header */}
      <section id="catalog" style={{ marginBottom: '2rem' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '2rem' }}>
          <Sparkles className="logo-cyan" size={20} />
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'Outfit, sans-serif', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', color: '#fff' }}>
            Catalogue des modèles
          </h2>
        </div>

        <div className="card card-glass" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="grid gap-4 grid-filters">
            {/* Search */}
            <div className="form-group filter-search-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rechercher</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Cobra, Porsche GT3, Corvette..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-cyan)' }} />
              </div>
            </div>

            {/* Condition Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">État</label>
              <select 
                className="form-input form-select" 
                value={condition} 
                onChange={(e) => setCondition(e.target.value as any)}
              >
                <option value="all">Tous les états</option>
                <option value="blister">Sous Blister</option>
                <option value="loose">Loose (Sans emballage)</option>
              </select>
            </div>

            {/* Series Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Série</label>
              <select 
                className="form-input form-select" 
                value={series} 
                onChange={(e) => setSeries(e.target.value)}
              >
                <option value="all">Toutes les séries</option>
                {uniqueSeries.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Année</label>
              <select 
                className="form-input form-select" 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="all">Toutes les années</option>
                {uniqueYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="grid gap-6 grid-catalog">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="card shimmer" style={{ height: '380px' }} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Aucun modèle miniature disponible ne correspond à vos critères.
            </p>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch('');
                setCondition('all');
                setSeries('all');
                setYear('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid gap-6 grid-catalog">
            {filteredProducts.map((product) => {
              const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=400';
              return (
                <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Product Image Panel */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '4/3',
                    height: 'auto',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    backgroundColor: '#03040c',
                    marginBottom: '1rem',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Blurred background clone to handle portrait/landscape nicely */}
                    <img 
                      src={primaryImage} 
                      alt="" 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'blur(12px) brightness(0.65)',
                        opacity: 0.6,
                        zIndex: 1
                      }}
                    />
                    {/* Crisp foreground product thumbnail */}
                    <img 
                      src={primaryImage} 
                      alt={product.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        position: 'relative',
                        zIndex: 2,
                        transition: 'transform var(--transition-normal)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    {/* Condition Badge */}
                    <span className={`badge badge-${product.condition}`} style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      zIndex: 3,
                      fontWeight: 700
                    }}>
                      {product.condition === 'blister' ? 'Blister' : 'Loose'}
                    </span>
                    
                    {/* Year Badge */}
                    <span style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      zIndex: 3,
                      backgroundColor: 'rgba(4, 5, 10, 0.85)',
                      color: 'var(--color-cyan)',
                      border: '1px solid var(--border-color)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.7rem',
                      fontWeight: 700
                    }}>
                      {product.year}
                    </span>
                  </div>

                  {/* Info and Price */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                      {product.series}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: '1.3', marginBottom: '0.5rem', color: '#fff' }}>
                      {product.title}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 'auto' }}>
                      {product.description}
                    </p>
                    
                    {product.date_released && (
                      <div className="flex items-center gap-1" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontWeight: 600 }}>
                        <Calendar size={12} />
                        <span>Sorti le : {new Date(product.date_released).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between" style={{ marginTop: '1rem' }}>
                      <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-crimson)', textShadow: '0 0 10px rgba(47, 47, 228, 0.2)' }}>
                        {product.price.toFixed(2)} €
                      </span>
                      {product.images.length > 1 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '2px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Image size={10} /> {product.images.length} photos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid gap-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
                    <Link href={`/products/${product.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                      Détails
                    </Link>
                    <button 
                      onClick={() => addToCart(product)}
                      className="btn btn-primary btn-sm"
                      title="Ajouter au Panier"
                    >
                      <ShoppingCart size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section style={{
        marginTop: '5rem',
        background: 'linear-gradient(135deg, rgba(16, 19, 38, 0.95) 0%, rgba(0, 225, 255, 0.05) 100%)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, textTransform: 'uppercase', fontStyle: 'italic', marginBottom: '0.5rem', color: '#fff' }}>
          Rejoignez le Cercle des Collectionneurs
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
          Inscrivez-vous à nos alertes privées pour recevoir en exclusivité les nouveaux arrivages de modèles miniatures rares dans notre boutique.
          <br />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
            * L'inscription à la newsletter implique de recevoir une notification automatique par email à chaque nouvel ajout de miniature au catalogue.
          </span>
        </p>

        <form onSubmit={handleSubscribeNewsletter} style={{
          display: 'flex',
          maxWidth: '440px',
          margin: '0 auto',
          gap: '0.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <input 
            type="email" 
            className="form-input" 
            placeholder="Saisissez votre email" 
            required 
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            disabled={submittingNewsletter}
            style={{ flex: 1, minWidth: '240px', borderRadius: 'var(--radius-sm)' }}
          />
          <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={submittingNewsletter}>
            <Send size={14} />
            <span>{submittingNewsletter ? 'Inscription...' : "S'inscrire"}</span>
          </button>
        </form>
      </section>

      <style jsx global>{`
        #catalog {
          scroll-margin-top: 100px;
        }

        /* Showroom Hero Luxurious Animations */
        @keyframes hero-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
          100% { transform: translateY(0px); }
        }
        @keyframes ambient-glow {
          0% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.9); }
          50% { opacity: 0.85; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.9); }
        }
        @keyframes floor-shadow {
          0% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(0.85); opacity: 0.18; }
          100% { transform: scale(1); opacity: 0.35; }
        }

        .hero-showcase-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 2.5rem 1.5rem;
          overflow: visible;
        }

        .hero-glow-bg {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 130%;
          height: 130%;
          background: radial-gradient(circle, rgba(0, 225, 255, 0.15) 0%, rgba(228, 47, 153, 0.06) 45%, transparent 70%);
          filter: blur(45px);
          pointer-events: none;
          z-index: 1;
          animation: ambient-glow 7s ease-in-out infinite;
        }

        .hero-product-wrapper {
          position: relative;
          z-index: 2;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: hero-float 5.5s ease-in-out infinite;
        }

        .hero-product-image-container {
          width: 100%;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 
            0 25px 55px rgba(0, 0, 0, 0.55), 
            0 0 30px rgba(0, 225, 255, 0.05);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .hero-product-image-container:hover {
          box-shadow: 
            0 35px 75px rgba(0, 0, 0, 0.65), 
            0 0 50px rgba(0, 225, 255, 0.2);
          border-color: rgba(0, 225, 255, 0.25);
          transform: scale(1.02);
        }

        .hero-floor-shadow {
          width: 75%;
          height: 16px;
          background: radial-gradient(ellipse, rgba(0, 0, 0, 0.6) 0%, transparent 80%);
          position: absolute;
          bottom: -15px;
          left: 12.5%;
          z-index: 1;
          pointer-events: none;
          animation: floor-shadow 5.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
