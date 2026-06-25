import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { CartProvider } from '@/context/CartContext';
import LayoutHeader from '@/components/LayoutHeader';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Info, Sparkles, Car } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Bourse d\'Échanges de Hot Wheels Rares & Premium | Classicbug',
  description: 'La plateforme e-commerce de référence en France pour l\'achat et la revente de miniatures Hot Wheels de collection : Premium, RLC, Super Treasure Hunts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 stroke=%22%23a0cfff%22 stroke-width=%228%22 fill=%22none%22/><circle cx=%2250%22 cy=%2250%22 r=%2215%22 fill=%22%232f2fe4%22/></svg>" />
      </head>
      <body>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                
                {/* Supabase Config Warning Banner */}
                {!isSupabaseConfigured && (
                  <div className="warning-banner">
                    <Info size={14} style={{ color: 'var(--color-magenta)' }} />
                    <span>Mode Démo Actif. Configurez vos variables <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans <code>.env.local</code> pour lier votre vraie base Supabase.</span>
                  </div>
                )}

                <LayoutHeader />
                
                <main style={{ flex: 1, padding: '2rem 0' }}>
                  {children}
                </main>
                
                <footer style={{ 
                  backgroundColor: '#03040c', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
                  padding: '3rem 0 2rem 0', 
                  fontSize: '0.85rem', 
                  color: 'var(--text-muted)',
                }}>
                  <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', marginBottom: '2rem', textAlign: 'left' }}>
                    <div>
                      <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Car size={16} className="logo-cyan" /> CLASSICBUG
                      </h4>
                      <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
                        La boutique de référence pour l'achat et la revente de voitures miniatures de collection Hot Wheels rares, sous blister ou loose.
                      </p>
                    </div>
                    <div>
                      <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>Navigation</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li><Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>Catalogue</Link></li>
                        <li><Link href="/cart" style={{ textDecoration: 'none', color: 'inherit' }}>Mon Panier</Link></li>
                        <li><Link href="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>Espace Collectionneur</Link></li>
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>Informations Légales</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li><Link href="/legal?tab=cgu" style={{ textDecoration: 'none', color: 'inherit' }}>Conditions Générales d'Utilisation (CGU)</Link></li>
                        <li><Link href="/legal?tab=cgv" style={{ textDecoration: 'none', color: 'inherit' }}>Conditions Générales de Vente (CGV)</Link></li>
                        <li><Link href="/legal?tab=mentions" style={{ textDecoration: 'none', color: 'inherit' }}>Mentions Légales</Link></li>
                        <li><Link href="/legal?tab=confidentialite" style={{ textDecoration: 'none', color: 'inherit' }}>Politique de Confidentialité</Link></li>
                      </ul>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
                    <div className="container">
                      <p>&copy; {new Date().getFullYear()} <strong>CLASSICBUG</strong>. Tous droits réservés.</p>
                    </div>
                  </div>
                </footer>
              </div>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
