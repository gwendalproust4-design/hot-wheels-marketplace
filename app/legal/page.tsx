'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileText, Shield, Scale, HelpCircle } from 'lucide-react';

function LegalPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'cgu' | 'cgv' | 'mentions' | 'confidentialite'>('cgu');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'cgu' || tab === 'cgv' || tab === 'mentions' || tab === 'confidentialite') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'cgu' | 'cgv' | 'mentions' | 'confidentialite') => {
    setActiveTab(tab);
    router.replace(`/legal?tab=${tab}`);
  };

  return (
    <div className="container" style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 className="page-title" style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: '2rem', background: 'linear-gradient(90deg, var(--color-cyan) 0%, var(--color-magenta) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Informations Légales & Conditions
      </h1>

      {/* Tabs Navigation */}
      <div className="flex gap-4" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        <button 
          onClick={() => handleTabChange('cgu')}
          className="btn"
          style={{
            background: activeTab === 'cgu' ? 'var(--bg-card)' : 'none',
            border: activeTab === 'cgu' ? '1px solid var(--border-color)' : '1px solid transparent',
            color: activeTab === 'cgu' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Scale size={16} />
          <span>CGU</span>
        </button>
        <button 
          onClick={() => handleTabChange('cgv')}
          className="btn"
          style={{
            background: activeTab === 'cgv' ? 'var(--bg-card)' : 'none',
            border: activeTab === 'cgv' ? '1px solid var(--border-color)' : '1px solid transparent',
            color: activeTab === 'cgv' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FileText size={16} />
          <span>CGV</span>
        </button>
        <button 
          onClick={() => handleTabChange('mentions')}
          className="btn"
          style={{
            background: activeTab === 'mentions' ? 'var(--bg-card)' : 'none',
            border: activeTab === 'mentions' ? '1px solid var(--border-color)' : '1px solid transparent',
            color: activeTab === 'mentions' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <HelpCircle size={16} />
          <span>Mentions Légales</span>
        </button>
        <button 
          onClick={() => handleTabChange('confidentialite')}
          className="btn"
          style={{
            background: activeTab === 'confidentialite' ? 'var(--bg-card)' : 'none',
            border: activeTab === 'confidentialite' ? '1px solid var(--border-color)' : '1px solid transparent',
            color: activeTab === 'confidentialite' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Shield size={16} />
          <span>Confidentialité</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="card card-glass" style={{ padding: '2rem', lineHeight: '1.6' }}>
        {activeTab === 'cgu' && (
          <div>
            <h2 style={{ color: 'var(--color-cyan)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Conditions Générales d'Utilisation (CGU)</h2>
            <p style={{ marginBottom: '1rem' }}>En vigueur au 25 juin 2026.</p>
            
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Article 1 : Objet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Les présentes Conditions Générales d'Utilisation encadrent l'accès et l'utilisation de la plateforme <strong>Classicbug</strong>. L'accès au site implique l'acceptation pleine et entière de ces conditions par l'utilisateur.
            </p>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Article 2 : Description du service</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Classicbug propose un service de vente en ligne et de bourse d'échanges de miniatures de collection (notamment Hot Wheels). L'application permet la consultation de catalogue, l'achat en ligne via Stripe et la messagerie instantanée directe avec le vendeur.
            </p>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Article 3 : Responsabilité et Propriété</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Les images et textes publiés sur le site sont protégés par le droit d'auteur. Tout usage commercial non autorisé des contenus du site est interdit. L'utilisateur s'engage à ne pas perturber le bon fonctionnement de la plateforme.
            </p>
          </div>
        )}

        {activeTab === 'cgv' && (
          <div>
            <h2 style={{ color: 'var(--color-cyan)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Conditions Générales de Vente (CGV)</h2>
            <p style={{ marginBottom: '1rem' }}>En vigueur au 25 juin 2026.</p>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Article 1 : Produits et Prix</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Les modèles vendus sur Classicbug sont des pièces de collection d'occasion ou neuves. Les prix sont affichés en Euros (€) nets hors frais de livraison.
            </p>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Article 2 : Expédition et Frais de Port</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Les colis sont expédiés de manière ultra-sécurisée. Les modes de livraison incluent Mondial Relay et Colissimo avec des tarifs fixes par pays. Pour les commandes de plusieurs articles, les frais de port sont évalués par le vendeur via le système de devis avant règlement.
            </p>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Article 3 : Rétractation</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Conformément à la législation en vigueur, l'acheteur dispose d'un délai légal de 14 jours pour exercer son droit de rétractation à compter de la réception de sa commande. Les frais de retour restent à la charge de l'acheteur. Les articles doivent être retournés dans leur état d'origine (sous blister intact le cas échéant).
            </p>
          </div>
        )}

        {activeTab === 'mentions' && (
          <div>
            <h2 style={{ color: 'var(--color-cyan)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Mentions Légales</h2>
            
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Édition du site</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Le site <strong>Classicbug</strong> est édité par la boutique de revente de véhicules miniatures de collection Classicbug.
            </p>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Hébergement</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              L'application est hébergée par <strong>Vercel Inc.</strong>, situé au 650 California St, San Francisco, CA 94108, États-Unis.
            </p>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Nous contacter</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Pour toute question ou réclamation concernant l'application, vous pouvez envoyer un message via l'espace de messagerie instantanée intégré ou par e-mail.
            </p>
          </div>
        )}

        {activeTab === 'confidentialite' && (
          <div>
            <h2 style={{ color: 'var(--color-cyan)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Politique de Confidentialité</h2>
            <p style={{ marginBottom: '1rem' }}>En vigueur au 25 juin 2026.</p>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Données Collectées</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Pour traiter vos commandes et assurer la livraison, nous collectons des données à caractère personnel : nom complet, adresse postale de livraison, adresse email, numéro de téléphone, et adresse IP.
            </p>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Utilisation des données</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Ces données sont utilisées uniquement pour la gestion des transactions, l'expédition des modèles via les transporteurs (Mondial Relay, Colissimo) et l'envoi d'alertes par email à chaque nouvel ajout au catalogue (newsletter). Vos données ne sont jamais partagées, vendues ou louées à des tiers.
            </p>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Vos Droits</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Conformément à la réglementation RGPD, vous disposez d'un droit d'accès, de rectification et d'effacement de l'ensemble de vos données. Vous pouvez exercer ce droit à tout moment depuis l'espace "Mon Compte".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Chargement...</div>}>
      <LegalPageContent />
    </Suspense>
  );
}
