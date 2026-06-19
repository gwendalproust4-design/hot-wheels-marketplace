# 🏎️ Hot Wheels Collector Marketplace

Une plateforme web moderne et haut de gamme (marketplace) dédiée à l'achat, la vente et l'échange de miniatures automobiles de collection (Hot Wheels, Matchbox, etc.).

Ce projet intègre une interface utilisateur immersive au style "cyber-sport", une messagerie instantanée en direct, une gestion complète des transactions via Stripe, et une liaison avec Supabase.

---

## 🌟 Fonctionnalités Clés

1. **Showroom Dynamique** : Page d'accueil interactive mettant en valeur un modèle vedette du showroom.
   - Les vendeurs peuvent **épingler** une de leurs annonces pour l'afficher en gros plan.
   - En l'absence d'annonce épinglée, l'algorithme bascule automatiquement sur la dernière mise en ligne en stock.
2. **Design Cyber-Sport Premium** :
   - Interface épurée et luxueuse avec des bordures ultra-fines, des effets de flou de verre (`backdrop-filter`) et des transitions douces.
   - Zéro emoji brut : interface épurée s'appuyant sur les icônes de la bibliothèque **Lucide**.
   - Cartes de produits sans bordures épaisses, affichant un fond translucide subtil au survol.
3. **Tunnel d'Achat & Calculateur de Livraison Automatique** :
   - Les frais de port internationaux sont calculés dynamiquement en fonction du pays de l'acheteur (France, Belgique, Luxembourg, Suisse, etc.).
   - Suppression du choix manuel du transporteur pour une expérience d'achat simplifiée.
4. **Messagerie Live intégrée** : Système de discussion en temps réel entre acheteurs et vendeurs pour négocier et finaliser les échanges.
5. **Espace Vendeur / Profil** :
   - Gestion des annonces en ligne (ajout avec images, modification, suppression).
   - Suivi complet des ventes et achats avec un stepper d'état de commande (`Payé` ➔ `Expédié` ➔ `Livré`).
   - Simulateur de paiement Stripe et mails de confirmation automatisés.

---

## 🛠️ Stack Technique

* **Framework** : Next.js 15 (React, TypeScript)
* **Design & Styles** : CSS natif / CSS Modules (variables HSL cyber-indigo & sky blue)
* **Base de données / Authentification** : Supabase (PostgreSQL client) ou Mock local automatique en cas d'absence de configuration.
* **Iconographie** : Lucide React
* **Paiements** : Stripe Checkout (intégration API)
* **E-mails** : Resend API (simulation console par défaut)

---

## 🚀 Démarrage Rapide

### 1. Cloner et Installer les Dépendances
```bash
npm install
```

### 2. Configuration des Variables d'Environnement
Créez un fichier `.env.local` à la racine et renseignez vos clés :
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase

# Stripe (Paiements de test)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend (E-mails)
RESEND_API_KEY=re_...
EMAIL_FROM=onboarding@resend.dev
```

### 3. Lancer en Mode Développement
```bash
npm run dev
```

### 4. Build de Production
```bash
npm run build
```
