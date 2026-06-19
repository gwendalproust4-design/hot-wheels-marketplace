import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { CartProvider } from '@/context/CartContext';
import LayoutHeader from '@/components/LayoutHeader';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Info, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bourse d\'Échanges de Hot Wheels Rares & Premium | Placeholder',
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
                  padding: '2.5rem 0', 
                  textAlign: 'center', 
                  fontSize: '0.8rem', 
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em'
                }}>
                  <div className="container">
                    <p style={{ marginBottom: '0.5rem', fontWeight: 700, color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                      <Sparkles size={12} className="logo-cyan" /> <strong>PLACEHOLDER COLLECTOR</strong> - 2026
                    </p>
                    <p>La plateforme ultime de miniatures de collection. Intégration Supabase Database & Stripe Payments.</p>
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
