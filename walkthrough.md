# Bourse d'Échanges - Annonces, Esthétique & Flux de Devis

Toutes les fonctionnalités ont été développées, testées, intégrées et poussées sur le dépôt en ligne.

---

## 1. Nouvelle Logique de Livraison & Frais de Port
Mise à jour de la grille des frais de port pour s'aligner précisément sur vos conditions :
* **Mondial Relay (4.50 €)** : France, Belgique, Luxembourg, Allemagne, Espagne, Italie, Pays-Bas, Pologne, Portugal.
* **Royaume-Uni (19.00 €)**
* **Autre Europe (15.00 €)** : Pays européens hors liste Mondial Relay (ex: Suisse).
* **Reste du Monde (35.50 €)** : Envois internationaux.

---

## 2. Achat Direct vs Demande de Devis (Panier Multi-produits)
* **Achat unique (1 article)** : Le bouton de paiement direct Stripe est conservé. Les frais de port du pays de livraison sont appliqués automatiquement.
* **Achat multiple (2 articles ou plus)** :
  * **Dans le Panier** : Les frais de port affichent "Calculé par le vendeur". Le bouton devient "Demander un devis (Envoi au chat)".
  * **Soumission du Devis** :
    * Création d'une commande au statut `pending` (en attente).
    * Retrait instantané des articles du stock (mis à `stock: 0` et `status: 'sold'`).
    * Envoi d'une fiche de devis dynamique (`[BASKET_QUOTE]:{...}`) dans la conversation de chat.
    * Redirection automatique vers la messagerie instantanée.

---

## 3. Panier Interactif & Actions dans la Messagerie
L'interface de chat intercepte les messages de type panier et affiche un panneau récapitulatif interactif :
* **Vue Vendeur** : Un champ de saisie permet de spécifier les frais de port personnalisés et de cliquer sur "Valider". Cela met à jour le montant final en base et notifie l'acheteur.
* **Vue Acheteur** :
  * Tant que le vendeur n'a pas validé les frais de port, affichage de la mention "En attente de l'évaluation des frais par le vendeur...".
  * Dès validation par le vendeur, affichage du total mis à jour et d'un bouton "Procéder au paiement".
  * Au clic, redirection vers Stripe Simulator pour finaliser le paiement.
* **Validation Finale** : Une fois la transaction effectuée, l'encart passe au statut vert "Commande validée & payée ✓" en temps réel (mise à jour toutes les 2 secondes).

---

## 4. Design Esthétique Luxe & Showroom Hero Sans Cadre
* **Suppression des cadres inclinés (slant-cut)** : Les bordures rigides et sombres ont été supprimées pour donner une impression de légèreté et d'intégration parfaite.
* **Ambient Spotlight (Glow)** : Un dégradé radial animé en arrière-plan (`hero-glow-bg`) simule un projecteur de studio de shooting de luxe derrière le véhicule.
* **Effet de flottaison 3D** : L'image flotte doucement à la verticale (`hero-float`) synchronisée avec une ombre au sol ovale (`hero-floor-shadow`) qui s'estompe et se redimensionne selon la hauteur du modèle.
* **Conteneur Glassmorphic** : La photo du modèle repose dans un écrin de verre doté d'une fine bordure lumineuse réflective (`border: 1px solid rgba(255, 255, 255, 0.08)`) qui réagit doucement au survol (`scale`, augmentation de l'éclat).
* **Adaptabilité & Remplissage** : L'image remplit à 100% le conteneur adapté dynamiquement à l'aspect ratio (portrait ou paysage) sans jamais afficher de bandes noires.

---

## 5. Retrait de la section Achat pour le Vendeur unique
Comme le site est destiné à n'avoir qu'un seul vendeur qui ne réalise pas d'achats :
* **Filtrage de l'interface** : La section "Mes Achats" (historique des commandes) a été masquée pour le rôle vendeur (`user.role === 'seller'`) dans l'onglet des transactions du profil.
* **Layout Fluide & Plein Écran** : Le style CSS du conteneur `.grid-profile-transactions.seller-role` a été mis à jour pour s'afficher sur une seule colonne (`grid-template-columns: 1fr`) afin que la liste "Mes Ventes" occupe désormais 100% de la largeur d'écran disponible sur desktop de manière premium.
* **Texte des Onglets** : L'onglet de navigation a été renommé de "Commandes & Ventes" à "Commandes Clients" pour le vendeur pour plus de cohérence.

---

## 6. Améliorations de l'Ergonomie et de la Réactivité Mobile
Pour répondre aux contraintes d'affichage sur les petits écrans :
* **Réduction de l'image principale (Hero)** :
  * Création et application de la classe CSS `.hero-image-wrapper` pour limiter dynamiquement la largeur maximale du conteneur de l'image à `180px` sur mobile (sous `@media (max-width: 768px)`).
  * Réduction des paddings verticaux du Showcase (`.hero-showcase-container`) à `1rem 0.5rem` pour un affichage condensé et moderne sans encombrer la hauteur de l'écran.
* **Refonte de la Messagerie Mobile (Chat)** :
  * Fixation de la grille de chat (`.chat-grid`) en mode plein écran (`position: fixed`, collée de `top: 60px` à `bottom: 0`, `left: 0`, `right: 0`), ce qui masque proprement le pied de page et les titres de page pour offrir une expérience "application native" très fluide.
  * Ajustement fixe de la hauteur de l'en-tête de navigation (`.header`) à `60px` sur mobile pour éliminer tout risque de décalage visuel.
  * Utilisation de directives `!important` sur le masquage/affichage alternatif de la liste des discussions (`.chat-sidebar`) et du fil de discussion actif (`.chat-area`) pour corriger le conflit avec les styles Next.js/React inline.
  * Optimisation des paddings de la zone de message et du formulaire d'envoi pour maximiser la lisibilité des textes sur petit écran.

---

## 7. Suppression de Conversations & Page d'Erreur 404 Premium
* **Suppression des Conversations** :
  * Ajout de la méthode `deleteConversation` dans `db.ts` pour effacer de la base de données tous les messages échangés pour une annonce spécifique.
  * Intégration d'un bouton de suppression (icône Corbeille de Lucide) dans l'en-tête de la conversation active. Au clic, une boîte de confirmation prévient l'utilisateur et actualise instantanément l'affichage.
* **Page 404 & Gestion d'Objet Introuvable** :
  * Création d'une page [not-found.tsx](file:///C:/Users/Gwendal/.gemini/antigravity/scratch/hot-wheels-marketplace/app/not-found.tsx) personnalisée avec une charte graphique luxueuse (effet de verre dépoli, titre néon 404 et bouton de retour au catalogue).
  * Intégration du déclencheur natif `notFound()` de Next.js dans la page de détails des produits pour rediriger automatiquement l'utilisateur vers cette page d'erreur si l'identifiant du produit demandé n'existe pas en base de données.
* **Fichier de configuration** :
  * Création du fichier standard `next.config.js` pour initialiser proprement la configuration Next.js.

---

## 8. Build de Production & Validation Git
* **Compilation Next.js** : Le build de production est validé et fonctionnel sans aucun avertissement de compilation :
  ```bash
  ✓ Compiled successfully in 4.0s
  Running TypeScript ...
  Finished TypeScript in 6.5s ...
  ```
