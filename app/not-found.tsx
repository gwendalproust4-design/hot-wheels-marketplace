import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '4rem 1.5rem',
      textAlign: 'center'
    }}>
      <div className="card card-glass" style={{
        maxWidth: '500px',
        width: '100%',
        padding: '3rem 2rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: 'var(--shadow-md), 0 0 30px rgba(47, 47, 228, 0.1)'
      }}>
        <div style={{
          color: 'var(--color-crimson)',
          background: 'rgba(47, 47, 228, 0.1)',
          padding: '1rem',
          borderRadius: '50%',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px var(--color-crimson-glow)'
        }}>
          <AlertCircle size={40} />
        </div>
        
        <h1 className="neon-gradient-text" style={{
          fontSize: '4rem',
          fontWeight: 900,
          marginBottom: '0.5rem',
          fontStyle: 'italic',
          fontFamily: 'Outfit, sans-serif',
          lineHeight: 1
        }}>
          404
        </h1>
        
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
          Page ou Objet Introuvable
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
          La page que vous recherchez ou la miniature demandée n'existe pas, a été vendue ou a été déplacée.
        </p>

        <Link href="/" className="btn btn-primary flex items-center gap-2" style={{ width: '100%', justifyContent: 'center' }}>
          <ArrowLeft size={16} />
          <span>Retour au catalogue</span>
        </Link>
      </div>
    </div>
  );
}
