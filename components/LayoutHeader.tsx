'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Car, ShoppingCart, MessageSquare, User, LogOut, LogIn, Menu, X } from 'lucide-react';

export default function LayoutHeader() {
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container flex items-center justify-between">
        <Link href="/" className="logo">
          <Car className="logo-cyan" size={26} />
          <span className="logo-place">Classic</span>
          <span className="logo-magenta">bug</span>
        </Link>

        <nav className="header-nav flex items-center gap-6" style={{ fontWeight: 600 }}>
          <Link href="/" style={{ fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }} className="logo-white:hover">
            Catalogue
          </Link>
          
          {user && (
            <>
              <Link href="/chat" style={{ fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }} className="flex items-center gap-2">
                <MessageSquare size={16} className="logo-cyan" />
                <span className="hide-mobile">Messages</span>
              </Link>
              <Link href="/profile" style={{ fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }} className="flex items-center gap-2">
                <User size={16} className="logo-cyan" />
                <span className="hide-mobile">Espace</span>
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">

          {/* Cart Icon */}
          <Link href="/cart" className="flex items-center justify-center" style={{ position: 'relative', padding: '0.5rem' }}>
            <ShoppingCart size={20} style={{ color: 'var(--text-primary)' }} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: 'var(--color-magenta)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(47, 47, 228, 0.5)',
                animation: 'neon-glow-pulse 1.5s infinite alternate'
              }}>
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Section (Desktop) */}
          {user ? (
            <div className="header-user-section flex items-center gap-3" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.username} 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-cyan)' }} 
                  />
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--color-cyan)',
                    color: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="hide-mobile" style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username}
                </span>
              </div>
              <button 
                onClick={signOut} 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '0.4rem', borderRadius: '50%' }}
                title="Se déconnecter"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link 
              href="/profile" 
              className="header-user-section btn btn-primary btn-sm flex items-center gap-2"
            >
              <LogIn size={14} />
              <span>Connexion</span>
            </Link>
          )}

          {/* Hamburger Menu Toggle Button on Mobile */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="mobile-burger-btn"
            style={{
              padding: '0.4rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              height: '34px',
              width: '34px'
            }}
            title={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Overlay */}
      {menuOpen && (
        <div className="mobile-drawer-overlay">
          <Link 
            href="/" 
            onClick={() => setMenuOpen(false)}
            style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}
          >
            Catalogue
          </Link>
          {user ? (
            <>
              <Link 
                href="/chat" 
                onClick={() => setMenuOpen(false)}
                style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}
              >
                <MessageSquare size={18} className="logo-cyan" />
                <span>Messages</span>
              </Link>
              <Link 
                href="/profile" 
                onClick={() => setMenuOpen(false)}
                style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}
              >
                <User size={18} className="logo-cyan" />
                <span>Mon Espace</span>
              </Link>
              
              {/* User stats / logout panel */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.username} 
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-cyan)' }} 
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--color-cyan)',
                      color: 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 700
                    }}>
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, display: 'block', color: '#fff' }}>
                      {user.full_name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      @{user.username}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => { signOut(); setMenuOpen(false); }} 
                  className="btn btn-secondary flex items-center justify-center gap-2"
                  style={{ width: '100%', padding: '0.85rem' }}
                >
                  <LogOut size={16} />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </>
          ) : (
            <Link 
              href="/profile" 
              onClick={() => setMenuOpen(false)}
              className="btn btn-primary flex items-center justify-center gap-2"
              style={{ width: '100%', padding: '0.85rem', marginTop: 'auto' }}
            >
              <LogIn size={16} />
              <span>Connexion / Inscription</span>
            </Link>
          )}
        </div>
      )}

    </header>
  );
}
