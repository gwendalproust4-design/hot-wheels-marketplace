# Guide et Checklist pour le Déploiement Définitif

Ce document récapitule les étapes techniques indispensables pour mettre l'application en production avec une base de données live, des paiements réels et des emails fonctionnels pour vos clients.

---

## 1. Base de données (Supabase)

Supabase est déjà configuré dans le code, mais les tables et déclencheurs doivent être initialisés sur votre projet de production.

### Étapes à suivre :
- [ ] **Exécuter le script SQL** :
  1. Allez sur votre [Console Supabase](https://database.supabase.com/).
  2. Ouvrez l'onglet **SQL Editor** > **New Query**.
  3. Copiez le contenu complet du fichier [supabase_setup.sql](file:///C:/Users/Gwendal/.gemini/antigravity/scratch/hot-wheels-marketplace/supabase_setup.sql) et cliquez sur **Run**.
  4. Cela va créer automatiquement les tables (`profiles`, `products`, `orders`, `messages`, `reviews`, `favorites`, `newsletter_subscribers`), les règles de sécurité RLS, et le déclencheur d'inscription.

- [ ] **Définir le compte Vendeur unique** :
  Par défaut, le script SQL attribue le rôle de vendeur (`role: 'seller'`) à l'adresse `vendeur@placeholder.com` lors de son inscription :
  ```sql
  WHEN new.email = 'vendeur@placeholder.com' THEN 'seller'
  ```
  *Option A (Recommandée)* : Modifiez cette adresse directement dans le fichier [supabase_setup.sql](file:///C:/Users/Gwendal/.gemini/antigravity/scratch/hot-wheels-marketplace/supabase_setup.sql) avec votre propre email de vendeur avant d'exécuter la requête.
  *Option B* : Inscrivez-vous normalement, puis allez dans la table `profiles` sur le tableau de bord Supabase et changez manuellement la valeur de la colonne `role` de `buyer` à `seller` pour votre ligne utilisateur.

- [ ] **Activer la méthode d'authentification par email** :
  Dans Supabase > **Authentication** > **Providers**, assurez-vous que **Email** est activé. 
  *(Facultatif mais recommandé)* : Configurez votre propre serveur SMTP pour envoyer des e-mails de confirmation d'inscription professionnels, plutôt que d'utiliser la limite par défaut de Supabase.

---

## 2. Système d'envois d'e-mails (Resend)

Actuellement, l'envoi d'e-mails fonctionne avec votre clé de test Resend, mais il est limité aux adresses vérifiées de votre compte (souvent uniquement la vôtre).

### Étapes à suivre :
- [ ] **Valider votre domaine de messagerie** :
  1. Connectez-vous sur [Resend](https://resend.com/).
  2. Allez dans **Domains** > **Add Domain**.
  3. Ajoutez les enregistrements DNS (MX, TXT/SPF, DKIM) fournis par Resend dans l'espace client de votre hébergeur de nom de domaine (OVH, Hostinger, GoDaddy, etc.).
  4. Une fois le statut à **Verified**, vos emails ne finiront plus en spam et pourront être envoyés à n'importe quel client.
- [ ] **Modifier l'adresse d'expéditeur** :
  Configurez la variable d'environnement `EMAIL_FROM` pour utiliser une adresse liée à votre domaine (ex : `no-reply@votredomaine.com`).

---

## 3. Système de paiement (Stripe)

L'application bascule automatiquement en mode test ou réel selon la configuration de Stripe.

### Étapes à suivre :
- [ ] **Activer le mode réel (Live Mode)** :
  1. Allez sur votre [Tableau de bord Stripe](https://dashboard.stripe.com/).
  2. Passez en mode réel en désactivant le bouton "Mode Test".
  3. Récupérez votre clé secrète de production (qui commence par `sk_live_...`).
- [ ] **Mettre à jour les variables d'environnement de production** avec cette clé `sk_live_...`.

---

## 4. Hébergement et variables d'environnement (ex: Vercel)

Pour héberger l'application, nous vous recommandons **Vercel** qui s'intègre parfaitement avec Next.js et gère le déploiement en quelques secondes à partir de votre dépôt GitHub.

### Variables d'environnement à configurer sur Vercel :

| Nom de la variable | Rôle | Valeur de production |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | `https://qqvqhfvjhxdllhypsuys.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anonyme Supabase | *Clé publique de votre Supabase* |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé d'administration privée Supabase | *Clé service role privée* |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe pour le paiement | `sk_live_...` *(Clé Stripe réelle)* |
| `RESEND_API_KEY` | Clé d'envoi d'emails Resend | `re_...` *(Clé de production)* |
| `EMAIL_FROM` | Adresse d'expédition des emails | `Hot Wheels Bourse <contact@votredomaine.com>` |
| `NEXT_PUBLIC_APP_URL` | URL définitive de votre site | `https://votredomaine.com` |
| `NEXT_PUBLIC_SELLER_EMAIL` | Email du vendeur unique | `votre-email@gmail.com` *(Doit être identique au compte vendeur)* |

---

## 5. Processus de mise en ligne (Vercel)

1. **Connecter GitHub** : Importez le dépôt de votre projet sur Vercel.
2. **Ajouter les variables** : Renseignez les variables d'environnement listées ci-dessus dans les paramètres du projet Vercel.
3. **Déployer** : Vercel va compiler le projet en mode production et vous attribuer une URL de test (ex : `https://projet.vercel.app`).
4. **Associer votre nom de domaine** : Allez dans **Settings** > **Domains** sur Vercel, ajoutez votre nom de domaine personnalisé (`votredomaine.com`) et configurez les DNS correspondants (CNAME / A Records).
