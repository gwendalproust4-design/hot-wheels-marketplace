'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { db } from '@/lib/db';
import { mockDb, Product, Order, Review } from '@/lib/mockDb';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, ShoppingBag, Heart, BarChart3, Star, LogIn, UserPlus, Tag, Calendar, Image, Trash2, Mail, Info, Shield, Key, Pin, Check, Globe } from 'lucide-react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const CAR_PRESETS = [
  {
    name: 'Shelby Cobra 427 S/C',
    series: 'Mini Roadsters',
    year: 2023,
    images: [
      'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600'
    ],
    date_released: '2023-04-12',
    desc: 'Classic Shelby Cobra 427 S/C. Metallic blue paint with white racing stripes. Chrome details, loose condition.'
  },
  {
    name: 'Porsche 911 GT3 RS',
    series: 'Speed Graphics',
    year: 2024,
    images: [
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=600'
    ],
    date_released: '2024-01-20',
    desc: 'Sleek silver Porsche 911 GT3 RS. Mint under blister. Highly detailed headlights and spoiler.'
  },
  {
    name: 'Corvette Stingray Vintage',
    series: 'Showroom Classics',
    year: 1976,
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=600'
    ],
    date_released: '1976-09-05',
    desc: 'Vintage Stingray model, vibrant red paint with decals. Shows minor paint flecks.'
  }
];

const renderDeliveryMethod = (method: string) => {
  if (!method) return 'Non spécifié';
  if (method.startsWith('DEVIS_PENDING|')) {
    return 'Devis (Frais de port à définir par le vendeur)';
  }
  return method;
};

function ProfilePageContent() {
  const { user, signIn, signUp, signOut, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL parameters handling for success checks
  useEffect(() => {
    const success = searchParams.get('checkout_success');
    const orderId = searchParams.get('orderId');
    const prodId = searchParams.get('productId');
    const sessionId = searchParams.get('session_id');

    if (success === 'true') {
      if (orderId) {
        showToast('Paiement validé ! Commande enregistrée.', 'success');
        async function confirmExistingOrder() {
          try {
            await db.updateOrderStatus(orderId as string, { status: 'paid' });
            loadProfileData(); // Reload orders lists
          } catch (err) {
            console.error('Failed to confirm existing order:', err);
          } finally {
            setActiveTab('transactions');
            router.replace('/profile?tab=transactions');
          }
        }
        confirmExistingOrder();
        return;
      }

      if (prodId) {
        showToast('Paiement validé ! Commande enregistrée.', 'success');
        
        async function registerOrder() {
          if (!user || !prodId) return;
          try {
            let orderData = {
              buyer_id: user.id,
              seller_id: '',
              product_id: prodId,
              product_title: '',
              product_image: '',
              total_price: 0,
              delivery_method: 'Colissimo',
              shipping_address: {
                fullName: user.full_name,
                addressLine1: 'Stripe Address',
                city: 'Paris',
                postalCode: '75000',
                country: 'France'
              },
              buyer_email: user.email
            };

            if (sessionId) {
              try {
                const res = await fetch(`/api/checkout/session?session_id=${sessionId}`);
                if (res.ok) {
                  const stripeData = await res.json();
                  orderData.shipping_address = stripeData.shippingAddress;
                  orderData.delivery_method = stripeData.deliveryMethod;
                  orderData.total_price = stripeData.totalPrice;
                  if (stripeData.buyerEmail) {
                    orderData.buyer_email = stripeData.buyerEmail;
                  }
                }
              } catch (err) {
                console.warn('Failed to retrieve Stripe session details, using fallback:', err);
              }
            }

            const prod = await db.getProductById(prodId);
            if (prod) {
              orderData.seller_id = prod.seller_id;
              orderData.product_title = prod.title;
              orderData.product_image = prod.images[0] || '';
              if (orderData.total_price === 0) {
                orderData.total_price = prod.price + 5.90;
              }
              await db.createOrder(orderData);

              // Trigger order confirmation email
              try {
                await fetch('/api/send-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: user.email,
                    subject: `Confirmation de votre commande - Hot Wheels Marketplace`,
                    html: `
                      <div style="background-color: #060713; color: #ffffff; font-family: sans-serif; padding: 2rem; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #00efff;">
                        <h1 style="color: #00efff; text-align: center; border-bottom: 2px solid #ff007f; padding-bottom: 1rem; margin-top: 0;">Commande Confirmée !</h1>
                        <p style="font-size: 1.1rem; line-height: 1.6;">Merci pour votre achat sur notre marketplace premium.</p>
                        <div style="background-color: rgba(255,0,127,0.05); border: 1px solid rgba(255,0,127,0.2); padding: 1.25rem; border-radius: 6px; margin: 1.5rem 0;">
                          <h3 style="color: #ff007f; margin-top: 0; margin-bottom: 0.75rem;">Récapitulatif de la commande</h3>
                          <table style="width: 100%; color: #ffffff; font-size: 0.95rem;">
                            <tr>
                              <td style="padding: 0.25rem 0; color: #a3acb9;">Modèle :</td>
                              <td style="padding: 0.25rem 0; font-weight: bold; text-align: right;">${orderData.product_title}</td>
                            </tr>
                            <tr>
                              <td style="padding: 0.25rem 0; color: #a3acb9;">Mode de livraison :</td>
                              <td style="padding: 0.25rem 0; text-align: right;">${orderData.delivery_method}</td>
                            </tr>
                            <tr>
                              <td style="padding: 0.25rem 0; color: #a3acb9;">Montant Total :</td>
                              <td style="padding: 0.25rem 0; font-weight: bold; color: #ff007f; text-align: right;">${orderData.total_price.toFixed(2)} €</td>
                            </tr>
                          </table>
                        </div>
                        <div style="background-color: rgba(0,239,255,0.05); border: 1px solid rgba(0,239,255,0.2); padding: 1.25rem; border-radius: 6px; margin: 1.5rem 0;">
                          <h3 style="color: #00efff; margin-top: 0; margin-bottom: 0.75rem;">Adresse de livraison</h3>
                          <p style="margin: 0; font-size: 0.9rem; line-height: 1.5; color: #e6ebf1;">
                            <strong>${orderData.shipping_address.fullName}</strong><br/>
                            ${orderData.shipping_address.addressLine1}<br/>
                            ${orderData.shipping_address.postalCode} ${orderData.shipping_address.city}<br/>
                            ${orderData.shipping_address.country}
                          </p>
                        </div>
                        <p style="font-size: 0.9rem; color: #a3acb9; text-align: center; margin-top: 2rem;">Vous recevrez un e-mail avec un lien de suivi dès que le vendeur aura expédié votre colis.</p>
                      </div>
                    `
                  })
                });
              } catch (emailErr) {
                console.warn('Failed to send confirmation email:', emailErr);
              }

              loadProfileData(); // Reload orders lists
            }
          } catch (err) {
            console.error(err);
          } finally {
            setActiveTab('transactions');
            router.replace('/profile?tab=transactions');
          }
        }
        registerOrder();
      }
    }
  }, [searchParams, user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'transactions' || tab === 'account' || tab === 'dashboard') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const newFiles = [...selectedFiles, ...files].slice(0, 3);
    setSelectedFiles(newFiles);

    const newPreviews: string[] = [];
    let loadedCount = 0;
    
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        loadedCount++;
        if (loadedCount === newFiles.length) {
          setPreviewUrls(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSelectedFile = (index: number) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);

    const updatedPreviews = [...previewUrls];
    updatedPreviews.splice(index, 1);
    setPreviewUrls(updatedPreviews);
  };

  const uploadImagesToSupabase = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      if (isSupabaseConfigured && supabase) {
        try {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
          continue;
        } catch (err: any) {
          console.warn('Supabase Storage upload failed, falling back to Base64:', err.message);
        }
      }

      // Base64 fallback
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      uploadedUrls.push(base64);
    }
    return uploadedUrls;
  };

  const [isLogin, setIsLogin] = useState(true);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'account'>('dashboard');
  const [authForm, setAuthForm] = useState({
    email: '',
    username: '',
    fullName: '',
    password: ''
  });

  // Multple image fields
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    year: new Date().getFullYear(),
    series: '',
    condition: 'blister' as 'blister' | 'loose',
    stock: '1',
    image1: '',
    image2: '',
    image3: '',
    date_released: ''
  });

  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });
  const [notifyNewsletter, setNotifyNewsletter] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [dbLoading, setDbLoading] = useState(false);

  const loadProfileData = async () => {
    if (!user) return;
    setDbLoading(true);
    try {
      if (user.role === 'seller') {
        const allProducts = await db.getProducts();
        setProducts(allProducts.filter(p => p.seller_id === user.id));
        const sellerSales = await db.getSales(user.id);
        setSales([...sellerSales].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        const buyerOrders = await db.getOrders(user.id);
        setOrders([...buyerOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } else {
        const buyerOrders = await db.getOrders(user.id);
        setOrders([...buyerOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

        // Load favorites
        const allProducts = await db.getProducts();
        const favList: Product[] = [];
        for (const p of allProducts) {
          const isF = await db.isFavorite(user.id, p.id);
          if (isF) favList.push(p);
        }
        setFavorites(favList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const res = await signIn(authForm.email, authForm.password);
      if (res.success) {
        showToast('Ravi de vous revoir !', 'success');
      } else {
        showToast(res.error || 'Erreur de connexion', 'error');
      }
    } else {
      const res = await signUp(
        authForm.email,
        authForm.password,
        authForm.username,
        authForm.fullName
      );
      if (res.success) {
        setSignupSuccess(true);
        showToast('Inscription réussie ! Veuillez valider votre e-mail.', 'success');
      } else {
        showToast(res.error || 'Erreur lors de la création du compte', 'error');
      }
    }
  };

  const handleAuthInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const applyCarPreset = (preset: typeof CAR_PRESETS[0]) => {
    setProductForm({
      title: preset.name,
      series: preset.series,
      year: preset.year,
      description: preset.desc,
      image1: preset.images[0] || '',
      image2: preset.images[1] || '',
      image3: preset.images[2] || '',
      date_released: preset.date_released,
      condition: 'blister',
      price: '15.00',
      stock: '1'
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    showToast(`Preset "${preset.name}" appliqué !`, 'info');
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const priceNum = parseFloat(productForm.price);
    const stockNum = parseInt(productForm.stock);
    
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Veuillez entrer un prix valide supérieur à 0', 'error');
      return;
    }

    let imagesArray: string[] = [];
    
    if (selectedFiles.length > 0) {
      setUploadingImages(true);
      try {
        imagesArray = await uploadImagesToSupabase(selectedFiles);
      } catch (err: any) {
        showToast("Erreur lors de l'upload des images", 'error');
        setUploadingImages(false);
        return;
      }
    } else {
      imagesArray = [productForm.image1, productForm.image2, productForm.image3].filter(url => url.trim() !== '');
    }

    if (imagesArray.length === 0) {
      showToast('Veuillez renseigner au moins une photo principale ou utiliser un preset', 'error');
      setUploadingImages(false);
      return;
    }

    try {
      const productPayload = {
        seller_id: user.id,
        seller_name: user.username,
        title: productForm.title,
        description: productForm.description,
        price: priceNum,
        year: Number(productForm.year),
        series: productForm.series,
        condition: productForm.condition,
        stock: isNaN(stockNum) ? 1 : stockNum,
        images: imagesArray,
        date_released: productForm.date_released || undefined
      };

      await db.createProduct(productPayload);
      showToast('Annonce miniature publiée avec succès !', 'success');

      // Notify newsletter subscribers
      if (notifyNewsletter) {
        try {
          const subscribers = await db.getNewsletterSubscribers();
          subscribers.forEach(email => {
            fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: email,
                subject: `Nouvel ajout : ${productPayload.title} ! 🚗`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; background-color: #060713; color: #ffffff; border: 1px solid #1b1d30; border-radius: 8px;">
                    <h2 style="color: #00efff; text-align: center; text-transform: uppercase; margin-bottom: 1.5rem;">Nouveauté au catalogue</h2>
                    <p>Bonjour,</p>
                    <p>Un nouveau modèle vient d'être mis en ligne sur la Bourse d'Échanges :</p>
                    
                    <div style="background-color: #0c0e1e; border: 1px solid #1b1d30; padding: 1.5rem; border-radius: 6px; margin: 1.5rem 0; text-align: center;">
                      <img src="${productPayload.images[0]}" alt="${productPayload.title}" style="max-width: 240px; max-height: 180px; border-radius: 4px; margin-bottom: 1rem; object-fit: contain;" />
                      <h3 style="color: #ffffff; margin: 0 0 0.5rem 0; font-size: 1.25rem;">${productPayload.title}</h3>
                      <p style="color: #ff007f; font-weight: bold; margin: 0 0 0.5rem 0; font-size: 1.35rem;">${productPayload.price.toFixed(2)} €</p>
                      <p style="color: #a3acb9; margin: 0; font-size: 0.85rem;">Série : ${productPayload.series} • Année : ${productPayload.year} • État : ${productPayload.condition === 'blister' ? 'Sous Blister' : 'Loose'}</p>
                    </div>
                    
                    <p>Ne tardez pas à vous connecter pour acheter ce modèle en direct ou faire une offre de devis au vendeur !</p>
                    <div style="text-align: center; margin-top: 2rem; margin-bottom: 1rem;">
                      <a href="${window.location.origin}/" style="background-color: #00efff; color: #000000; padding: 0.8rem 1.75rem; border-radius: 4px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em; display: inline-block;">Découvrir l'annonce</a>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid #1b1d30; margin: 2rem 0;" />
                    <p style="font-size: 0.8rem; color: #a3acb9; text-align: center;">Classicbug - La plateforme ultime de miniatures de collection</p>
                  </div>
                `
              })
            }).catch(err => console.error('Error sending email to subscriber:', email, err));
          });
        } catch (err) {
          console.error('Failed to notify newsletter subscribers:', err);
        }
      }
      
      setProductForm({
        title: '',
        description: '',
        price: '',
        year: new Date().getFullYear(),
        series: '',
        condition: 'blister',
        stock: '1',
        image1: '',
        image2: '',
        image3: '',
        date_released: ''
      });
      setSelectedFiles([]);
      setPreviewUrls([]);

      loadProfileData();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la création', 'error');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleProductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewOrder) return;

    try {
      await db.addReview({
        order_id: reviewOrder.id,
        reviewer_id: user.id,
        reviewer_name: user.username,
        reviewee_id: reviewOrder.seller_id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });

      showToast('Merci pour votre évaluation !', 'success');
      setReviewOrder(null);
      setReviewForm({ rating: 5, comment: '' });
      loadProfileData(); // Reload profile listings
    } catch (err) {
      showToast('Erreur lors de l\'envoi de l\'avis', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.")) {
      return;
    }
    try {
      await db.deleteProduct(id);
      showToast("Annonce supprimée avec succès !", 'success');
      loadProfileData();
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la suppression de l'annonce", 'error');
    }
  };

  const handleTogglePinProduct = async (productId: string) => {
    try {
      await db.togglePinProduct(productId);
      showToast("Statut de l'épingle mis à jour !", 'success');
      loadProfileData();
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la mise à jour de l'épingle", 'error');
    }
  };

  const handleMarkAsShipped = async (orderId: string, carrier: string, trackingNumber: string) => {
    try {
      const sale = sales.find(s => s.id === orderId);
      if (!sale) return;

      await db.updateOrderStatus(orderId, {
        status: 'shipped',
        carrier,
        tracking_number: trackingNumber
      });

      // Send shipment email to the buyer
      try {
        const buyerEmail = sale.buyer_email || 'acheteur@exemple.com';

        const getTrackingLink = (c: string, num: string) => {
          if (c.toLowerCase().includes('mondial')) {
            return `https://www.mondialrelay.fr/suivi-de-colis?numeroColis=${num}`;
          }
          if (c.toLowerCase().includes('colissimo') || c.toLowerCase().includes('poste')) {
            return `https://www.laposte.fr/outils/suivre-un-envoi?code=${num}`;
          }
          return `https://www.google.com/search?q=${encodeURIComponent(c + ' ' + num + ' suivi')}`;
        };

        const trackingUrl = getTrackingLink(carrier, trackingNumber);

        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: buyerEmail,
            subject: `Votre colis est en route ! - Hot Wheels Marketplace`,
            html: `
              <div style="background-color: #060713; color: #ffffff; font-family: sans-serif; padding: 2rem; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #ff007f;">
                <h1 style="color: #ff007f; text-align: center; border-bottom: 2px solid #00efff; padding-bottom: 1rem; margin-top: 0;">Colis Expédié !</h1>
                <p style="font-size: 1.1rem; line-height: 1.6;">Bonne nouvelle ! Le vendeur a expédié votre commande pour la miniature <strong>${sale.product_title}</strong>.</p>
                <div style="background-color: rgba(0,239,255,0.05); border: 1px solid rgba(0,239,255,0.2); padding: 1.25rem; border-radius: 6px; margin: 1.5rem 0;">
                  <h3 style="color: #00efff; margin-top: 0; margin-bottom: 0.75rem;">Informations de livraison</h3>
                  <table style="width: 100%; color: #ffffff; font-size: 0.95rem;">
                    <tr>
                      <td style="padding: 0.25rem 0; color: #a3acb9;">Transporteur :</td>
                      <td style="padding: 0.25rem 0; font-weight: bold; text-align: right;">${carrier}</td>
                    </tr>
                    <tr>
                      <td style="padding: 0.25rem 0; color: #a3acb9;">Numéro de suivi :</td>
                      <td style="padding: 0.25rem 0; font-weight: bold; text-align: right; color: #00efff;">${trackingNumber}</td>
                    </tr>
                  </table>
                </div>
                <div style="text-align: center; margin: 2rem 0;">
                  <a href="${trackingUrl}" target="_blank" style="background: linear-gradient(135deg, #00efff 0%, #ff007f 100%); color: #ffffff; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 4px; font-weight: bold; display: inline-block;">Suivre mon colis</a>
                </div>
                <p style="font-size: 0.9rem; color: #a3acb9; text-align: center;">Une fois votre colis reçu, n'oubliez pas de vous rendre dans votre espace membre pour confirmer la réception et laisser une note d'évaluation au vendeur !</p>
              </div>
            `
          })
        });
      } catch (emailErr) {
        console.warn('Failed to send shipment email:', emailErr);
      }

      showToast('Commande marquée comme expédiée !', 'success');
      loadProfileData();
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la mise à jour de la commande", 'error');
    }
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      await db.updateOrderStatus(orderId, {
        status: 'delivered'
      });
      showToast('Réception confirmée ! Vous pouvez maintenant évaluer le vendeur.', 'success');
      loadProfileData();
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la mise à jour de la commande", 'error');
    }
  };

  if (!user && !authLoading) {
    if (signupSuccess) {
      return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="card card-glass" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--color-cyan)', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Mail size={48} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>Vérification requise</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              Un e-mail de confirmation a été envoyé à l'adresse <strong>{authForm.email}</strong>. 
              Veuillez cliquer sur le lien de validation contenu dans ce message pour activer votre compte avant de vous connecter.
            </p>
            <button 
              onClick={() => {
                setSignupSuccess(false);
                setIsLogin(true);
                setAuthForm({ ...authForm, password: '' });
              }}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Retour à la Connexion
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card card-glass" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {isLogin ? <span className="neon-gradient-text">Espace Membre</span> : <span className="neon-gradient-text">Créer un Compte</span>}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Rejoignez la bourse d'échange de miniatures !
            </p>
          </div>

          <form onSubmit={handleAuthSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">Nom complet</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    className="form-input" 
                    placeholder="Lucas Dubois"
                    required
                    value={authForm.fullName}
                    onChange={handleAuthInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom d'utilisateur</label>
                  <input 
                    type="text" 
                    name="username" 
                    className="form-input" 
                    placeholder="Mini_Fan"
                    required
                    value={authForm.username}
                    onChange={handleAuthInputChange}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Adresse Email</label>
              <input 
                type="email" 
                name="email" 
                className="form-input" 
                placeholder="collector@gmail.com"
                required
                value={authForm.email}
                onChange={handleAuthInputChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Mot de passe</label>
              <input 
                type="password" 
                name="password" 
                className="form-input" 
                placeholder="••••••••"
                required
                value={authForm.password}
                onChange={handleAuthInputChange}
              />
            </div>

            {!isLogin && (
              <div style={{
                background: 'rgba(0, 225, 255, 0.05)',
                border: '1px solid rgba(0, 225, 255, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                marginBottom: '1.25rem',
                fontSize: '0.75rem',
                color: 'var(--color-cyan)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-cyan)' }} />
                <span>
                  <strong>Confirmation requise :</strong> Un e-mail de validation vous sera envoyé. Vous devrez confirmer votre adresse avant de pouvoir vous connecter.
                </span>
              </div>
            )}

            <button type="submit" className="btn btn-primary flex items-center justify-center gap-2" style={{ width: '100%', padding: '0.85rem' }}>
              <LogIn size={16} />
              <span>{isLogin ? 'Se connecter' : "S'enregistrer"}</span>
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              style={{ fontSize: '0.8rem', color: 'var(--color-cyan)', textDecoration: 'underline' }}
            >
              {isLogin ? "Nouveau ici ? Créer un compte" : "Déjà membre ? Se connecter"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || !user) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Chargement de la session...</p>
      </div>
    );
  }

  const sellerRevenue = sales.reduce((acc, item) => acc + item.total_price - 5.90, 0);

  return (
    <div className="container">
      {/* Dashboard User Profile Header */}
      <section className="card card-glass" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
          <div className="flex items-center gap-4">
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: user.role === 'seller' ? 'var(--color-magenta)' : 'var(--color-cyan)',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700
            }}>
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>{user.full_name}</h2>
                <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>@{user.username}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Type de profil : <strong>{user.role === 'seller' ? 'Propriétaire Boutique' : 'Collectionneur (Acheteur)'}</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex gap-4" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="btn"
          style={{
            background: activeTab === 'dashboard' ? 'var(--bg-card)' : 'none',
            border: activeTab === 'dashboard' ? '1px solid var(--border-color)' : '1px solid transparent',
            color: activeTab === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'dashboard' ? '0 0 10px rgba(47, 47, 228, 0.15)' : 'none',
            padding: '0.5rem 1rem'
          }}
        >
          Tableau de bord
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className="btn"
          style={{
            background: activeTab === 'transactions' ? 'var(--bg-card)' : 'none',
            border: activeTab === 'transactions' ? '1px solid var(--border-color)' : '1px solid transparent',
            color: activeTab === 'transactions' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'transactions' ? '0 0 10px rgba(47, 47, 228, 0.15)' : 'none',
            padding: '0.5rem 1rem'
          }}
        >
          {user.role === 'seller' ? 'Commandes Clients' : 'Mes Commandes'}
        </button>
        <button 
          onClick={() => setActiveTab('account')}
          className="btn"
          style={{
            background: activeTab === 'account' ? 'var(--bg-card)' : 'none',
            border: activeTab === 'account' ? '1px solid var(--border-color)' : '1px solid transparent',
            color: activeTab === 'account' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'account' ? '0 0 10px rgba(47, 47, 228, 0.15)' : 'none',
            padding: '0.5rem 1rem'
          }}
        >
          Mon Compte
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        user.role === 'buyer' ? (
          /* Buyer Dashboard: Favorites only */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 className="flex items-center gap-2" style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.05em', color: 'var(--color-cyan)' }}>
                <Heart size={16} />
                <span>Modèles Favoris ({favorites.length})</span>
              </h3>

              {favorites.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Vous n'avez aucun modèle miniature en favoris pour le moment.
                  </p>
                  <Link href="/" className="btn btn-secondary btn-sm">
                    Parcourir le catalogue
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6 grid-catalog">
                  {favorites.map((fav) => {
                    const primaryImage = fav.images?.[0] || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=400';
                    return (
                      <div key={fav.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ position: 'relative', width: '100%', height: '150px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: '#03040c', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                          <img src={primaryImage} alt={fav.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span className={`badge badge-${fav.condition}`} style={{ position: 'absolute', top: '10px', left: '10px', fontWeight: 700 }}>
                            {fav.condition === 'blister' ? 'Blister' : 'Loose'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{fav.series}</span>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '0.5rem' }}>{fav.title}</h4>
                        <div className="flex justify-between items-center" style={{ marginTop: 'auto' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-magenta)' }}>{fav.price.toFixed(2)} €</span>
                          <Link href={`/products/${fav.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.75rem', fontSize: '0.65rem' }}>
                            Détails
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Seller Dashboard: Add miniature form & inventory list */
          <div className="grid grid-profile-dashboard" style={{ gap: '2.5rem', alignItems: 'start' }}>
            {/* Form to create new listing */}
            <div className="card card-glass" style={{ padding: '1.5rem' }}>
              <h3 className="flex items-center gap-2" style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em', color: 'var(--color-magenta)' }}>
                <Plus size={18} />
                <span>Ajouter une Miniature</span>
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Presets Remplissage Rapide</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {CAR_PRESETS.map((preset, i) => (
                    <button 
                      key={i} 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.65rem', padding: '0.35rem 0.6rem' }}
                      onClick={() => applyCarPreset(preset)}
                    >
                      {preset.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateProduct}>
                <div className="form-group">
                  <label className="form-label">Titre de l'annonce</label>
                  <input 
                    type="text" 
                    name="title" 
                    className="form-input" 
                    placeholder="Ex: Shelby Cobra Metal 1968"
                    required 
                    value={productForm.title}
                    onChange={handleProductInputChange}
                  />
                </div>

                <div className="grid gap-4 grid-form-two-cols skew-1-2">
                  <div className="form-group">
                    <label className="form-label">Série</label>
                    <input 
                      type="text" 
                      name="series" 
                      className="form-input" 
                      placeholder="Ex: Mainline Classic"
                      required 
                      value={productForm.series}
                      onChange={handleProductInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Année de fonderie</label>
                    <input 
                      type="number" 
                      name="year" 
                      className="form-input" 
                      placeholder="Ex: 2023"
                      required 
                      value={productForm.year}
                      onChange={handleProductInputChange}
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-form-two-cols">
                  <div className="form-group">
                    <label className="form-label">État</label>
                    <select 
                      name="condition" 
                      className="form-input form-select"
                      value={productForm.condition}
                      onChange={handleProductInputChange}
                    >
                      <option value="blister">Sous Blister</option>
                      <option value="loose">Loose (Sans emballage)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date de parution (Optionnel)</label>
                    <input 
                      type="date" 
                      name="date_released" 
                      className="form-input" 
                      value={productForm.date_released}
                      onChange={handleProductInputChange}
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-form-two-cols">
                  <div className="form-group">
                    <label className="form-label">Prix de vente (€)</label>
                    <input 
                      type="text" 
                      name="price" 
                      className="form-input" 
                      placeholder="35.00"
                      required 
                      value={productForm.price}
                      onChange={handleProductInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantité en stock</label>
                    <input 
                      type="number" 
                      name="stock" 
                      className="form-input" 
                      min="1"
                      required 
                      value={productForm.stock}
                      onChange={handleProductInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description du modèle</label>
                  <textarea 
                    name="description" 
                    className="form-input" 
                    rows={4}
                    placeholder="Détaillez l'état de la carte, les roues, la peinture..."
                    required 
                    value={productForm.description}
                    onChange={handleProductInputChange}
                  />
                </div>

                {/* Newsletter notification checkbox */}
                <div className="form-group flex items-center gap-2" style={{ cursor: 'pointer', userSelect: 'none', margin: '1.25rem 0' }}>
                  <input 
                    type="checkbox" 
                    id="notifyNewsletter" 
                    checked={notifyNewsletter}
                    onChange={(e) => setNotifyNewsletter(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: 'var(--color-cyan)'
                    }}
                  />
                  <label htmlFor="notifyNewsletter" style={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    Informer les abonnés inscrits à la newsletter de cet ajout (Envoi d'e-mails)
                  </label>
                </div>

                {/* Local photo uploader block */}
                <div className="form-group">
                  <label className="form-label">Photos du modèle (Max 3)</label>
                  <div 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    style={{
                      border: '2px dashed var(--color-cyan)',
                      padding: '1.5rem',
                      textAlign: 'center',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      backgroundColor: 'rgba(0, 225, 255, 0.02)',
                      transition: 'all var(--transition-fast)',
                      marginBottom: '1rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-crimson)';
                      e.currentTarget.style.backgroundColor = 'rgba(47, 47, 228, 0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-cyan)';
                      e.currentTarget.style.backgroundColor = 'rgba(0, 225, 255, 0.02)';
                    }}
                  >
                    <input 
                      type="file" 
                      id="file-upload" 
                      multiple 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleFileChange}
                    />
                    <div style={{ color: 'var(--color-cyan)', display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      <Image size={24} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>Importer depuis la bibliothèque</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Format JPG, PNG ou WebP (max 3 images)</span>
                  </div>

                  {/* Preview gallery */}
                  {previewUrls.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                      {previewUrls.map((url, index) => (
                        <div key={index} style={{ position: 'relative', height: '70px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <img src={url} alt={`Aperçu ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => removeSelectedFile(index)}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              backgroundColor: 'rgba(255, 0, 60, 0.85)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.6rem',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                            title="Supprimer la photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Presets / Static Text Fallback Inputs (if needed) */}
                  {previewUrls.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        name="image1" 
                        className="form-input" 
                        placeholder="Image URL 1 (Optionnel si fichier importé)"
                        value={productForm.image1}
                        onChange={handleProductInputChange}
                        style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem' }}
                      />
                      <input 
                        type="text" 
                        name="image2" 
                        className="form-input" 
                        placeholder="Image URL 2"
                        value={productForm.image2}
                        onChange={handleProductInputChange}
                        style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem' }}
                      />
                      <input 
                        type="text" 
                        name="image3" 
                        className="form-input" 
                        placeholder="Image URL 3"
                        value={productForm.image3}
                        onChange={handleProductInputChange}
                        style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem' }}
                      />
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary flex items-center justify-center gap-2" style={{ width: '100%', padding: '0.85rem' }} disabled={uploadingImages}>
                  <Tag size={14} />
                  <span>{uploadingImages ? 'Upload en cours...' : "Publier l'annonce"}</span>
                </button>
              </form>
            </div>

            {/* Right Column: Inventory & Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Revenue des Ventes</h4>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)', margin: '0.5rem 0' }}>
                  {sellerRevenue.toFixed(2)} €
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Basé sur {sales.length} transactions terminées.</p>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em', color: 'var(--color-magenta)' }}>
                  Mes Annonces ({products.length})
                </h3>

                {products.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>Aucune annonce publiée.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {products.map((item) => {
                      const primaryImage = item.images?.[0] || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=400';
                      return (
                        <div key={item.id} className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                          <div className="flex items-center gap-3">
                            <div style={{ width: '45px', height: '34px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: '#03040c', border: '1px solid var(--border-color)' }}>
                              <img src={primaryImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                              <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h4>
                              <span style={{ fontSize: '0.65rem' }} className={`badge badge-${item.condition}`}>{item.condition}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 700, color: 'var(--color-magenta)', fontSize: '0.9rem', display: 'block' }}>{item.price.toFixed(2)} €</span>
                              <span style={{ fontSize: '0.75rem', color: item.status === 'available' ? 'var(--success)' : 'var(--error)' }}>
                                {item.status === 'available' ? `Stock (${item.stock})` : 'Vendu'}
                              </span>
                            </div>
                            
                            {item.status === 'available' && (
                              <>
                                <button 
                                  onClick={() => handleTogglePinProduct(item.id)}
                                  style={{ 
                                    color: item.is_pinned ? 'var(--color-cyan)' : 'var(--text-muted)', 
                                    cursor: 'pointer', 
                                    padding: '0.25rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    transition: 'all var(--transition-fast)',
                                    filter: item.is_pinned ? 'drop-shadow(0 0 4px rgba(0, 225, 255, 0.4))' : 'none'
                                  }}
                                  title={item.is_pinned ? "Désépingler de l'accueil" : "Épingler en haut de l'accueil"}
                                  onMouseEnter={(e) => { if (!item.is_pinned) e.currentTarget.style.color = 'var(--color-cyan)'; }}
                                  onMouseLeave={(e) => { if (!item.is_pinned) e.currentTarget.style.color = 'var(--text-muted)'; }}
                                >
                                  <Pin size={14} fill={item.is_pinned ? 'currentColor' : 'none'} />
                                </button>

                                <button 
                                  onClick={() => handleDeleteProduct(item.id)}
                                  style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Supprimer l'annonce"
                                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {activeTab === 'transactions' && (
        <div className={`grid grid-profile-transactions ${user.role === 'seller' ? 'seller-role' : 'buyer-role'}`} style={{ gap: '2.5rem' }}>
          {/* Purchases List */}
          {user.role !== 'seller' && (
            <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.05em', color: 'var(--color-cyan)' }}>
              Mes Achats (Historique Commandes)
            </h3>

            {orders.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>Aucun achat enregistré.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orders.map((ord) => (
                  <div key={ord.id} className="card-glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID : #{ord.id.substring(0,8).toUpperCase()}</span>
                      <span className={`badge ${
                        ord.status === 'paid' ? 'badge-success' :
                        ord.status === 'shipped' ? 'badge-loose' :
                        ord.status === 'pending' ? 'badge-blister' : 'badge-danger'
                      }`} style={{ fontSize: '0.6rem' }}>
                        {ord.status === 'pending' && 'Devis en attente'}
                        {ord.status === 'paid' && 'Payé'}
                        {ord.status === 'shipped' && 'Expédié'}
                        {ord.status === 'delivered' && 'Livré'}
                        {ord.status === 'cancelled' && 'Annulé'}
                      </span>
                    </div>

                    {/* Progress Bar Visualizer */}
                    <div style={{ margin: '1rem 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 0.5rem' }}>
                        {/* Connecting Line */}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10%',
                          right: '10%',
                          height: '2px',
                          backgroundColor: '#1b1d30',
                          zIndex: 1
                        }} />
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10%',
                          width: ord.status === 'delivered' ? '80%' : ord.status === 'shipped' ? '40%' : '0%',
                          height: '2px',
                          background: 'linear-gradient(90deg, var(--color-cyan) 0%, var(--color-magenta) 100%)',
                          zIndex: 2,
                          transition: 'width 0.4s ease'
                        }} />

                        {/* Step 1: Paid */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#060713',
                            border: `2px solid ${ord.status !== 'pending' ? 'var(--color-cyan)' : '#1b1d30'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            color: ord.status !== 'pending' ? 'var(--color-cyan)' : 'var(--text-muted)',
                            fontWeight: 'bold',
                            boxShadow: ord.status !== 'pending' ? '0 0 8px rgba(0, 225, 255, 0.4)' : 'none'
                          }}>
                            {ord.status !== 'pending' ? <Check size={10} /> : '1'}
                          </div>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            marginTop: '0.25rem', 
                            color: ord.status !== 'pending' ? 'var(--color-cyan)' : 'var(--text-muted)', 
                            fontWeight: ord.status !== 'pending' ? 'bold' : 'normal' 
                          }}>Payé</span>
                        </div>

                        {/* Step 2: Shipped */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#060713',
                            border: `2px solid ${ord.status === 'shipped' || ord.status === 'delivered' ? 'var(--color-magenta)' : '#1b1d30'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            color: ord.status === 'shipped' || ord.status === 'delivered' ? 'var(--color-magenta)' : 'var(--text-muted)',
                            fontWeight: 'bold',
                            boxShadow: ord.status === 'shipped' || ord.status === 'delivered' ? '0 0 8px rgba(255, 0, 127, 0.4)' : 'none'
                          }}>
                            {ord.status === 'shipped' || ord.status === 'delivered' ? <Check size={10} /> : '2'}
                          </div>
                          <span style={{
                            fontSize: '0.65rem',
                            marginTop: '0.25rem',
                            color: ord.status === 'shipped' || ord.status === 'delivered' ? 'var(--color-magenta)' : 'var(--text-muted)',
                            fontWeight: ord.status === 'shipped' || ord.status === 'delivered' ? 'bold' : 'normal'
                          }}>Expédié</span>
                        </div>

                        {/* Step 3: Delivered */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#060713',
                            border: `2px solid ${ord.status === 'delivered' ? 'var(--success)' : '#1b1d30'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            color: ord.status === 'delivered' ? 'var(--success)' : 'var(--text-muted)',
                            fontWeight: 'bold',
                            boxShadow: ord.status === 'delivered' ? '0 0 8px rgba(0, 255, 102, 0.4)' : 'none'
                          }}>
                            {ord.status === 'delivered' ? <Check size={10} /> : '3'}
                          </div>
                          <span style={{
                            fontSize: '0.65rem',
                            marginTop: '0.25rem',
                            color: ord.status === 'delivered' ? 'var(--success)' : 'var(--text-muted)',
                            fontWeight: ord.status === 'delivered' ? 'bold' : 'normal'
                          }}>Livré</span>
                        </div>
                      </div>
                    </div>

                    {/* Carrier details and direct link */}
                    {(ord.status === 'shipped' || ord.status === 'delivered') && ord.carrier && ord.tracking_number && (
                      <div style={{
                        backgroundColor: 'rgba(0, 225, 255, 0.02)',
                        border: '1px solid rgba(0, 225, 255, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem',
                        marginBottom: '1.25rem',
                        fontSize: '0.8rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span>Transporteur : <strong>{ord.carrier}</strong></span>
                          <span>Suivi : <code style={{ color: 'var(--color-cyan)', backgroundColor: 'rgba(0,225,255,0.05)', padding: '2px 4px', borderRadius: '3px' }}>{ord.tracking_number}</code></span>
                        </div>
                        {(() => {
                          const getTrackingLink = (c: string, num: string) => {
                            if (c.toLowerCase().includes('mondial')) {
                              return `https://www.mondialrelay.fr/suivi-de-colis?numeroColis=${num}`;
                            }
                            if (c.toLowerCase().includes('colissimo') || c.toLowerCase().includes('poste')) {
                              return `https://www.laposte.fr/outils/suivre-un-envoi?code=${num}`;
                            }
                            return `https://www.google.com/search?q=${encodeURIComponent(c + ' ' + num + ' suivi')}`;
                          };
                          return (
                            <a
                              href={getTrackingLink(ord.carrier, ord.tracking_number)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', textTransform: 'none', fontStyle: 'normal', padding: '0.35rem' }}
                            >
                              <Globe size={12} /> Suivre l'envoi en direct
                            </a>
                          );
                        })()}
                      </div>
                    )}

                    <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: '60px', height: '45px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: '#03040c', border: '1px solid var(--border-color)' }}>
                          <img src={ord.product_image} alt={ord.product_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{ord.product_title}</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Livraison : {renderDeliveryMethod(ord.delivery_method)}</p>
                          {ord.delivery_method.startsWith('DEVIS_PENDING|') && (() => {
                            try {
                              const productsList = JSON.parse(ord.delivery_method.split('|')[1]);
                              return (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', borderLeft: '2px solid rgba(0,225,255,0.3)', paddingLeft: '0.5rem' }}>
                                  <span style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem', color: 'var(--color-cyan)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Modèles demandés :</span>
                                  <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                    {productsList.map((p: any, idx: number) => (
                                      <li key={idx} style={{ marginBottom: '0.15rem' }}>
                                        • {p.title} ({p.price.toFixed(2)} €)
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            } catch (e) {
                              return null;
                            }
                          })()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span style={{ fontWeight: 700, color: 'var(--color-magenta)', fontSize: '1.05rem' }}>
                          {ord.total_price.toFixed(2)} €
                        </span>
                        
                        {ord.status === 'shipped' && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ textTransform: 'none', fontStyle: 'normal', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => handleMarkAsDelivered(ord.id)}
                          >
                            Confirmer la réception
                          </button>
                        )}

                        {ord.status === 'delivered' && (
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setReviewOrder(ord)}
                          >
                            Avis
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Sales List (for Seller only) */}
          {user.role === 'seller' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.5rem', color: 'var(--color-magenta)', letterSpacing: '0.05em' }}>
                Commandes Clients (Mes Ventes)
              </h3>

              {sales.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>Aucune vente enregistrée.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {sales.map((sale) => (
                    <div key={sale.id} className="card-glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Commande : #{sale.id.substring(0,8).toUpperCase()}</span>
                        <span className={`badge ${
                          sale.status === 'paid' ? 'badge-success' :
                          sale.status === 'shipped' ? 'badge-loose' :
                          sale.status === 'pending' ? 'badge-blister' : 'badge-danger'
                        }`} style={{ fontSize: '0.65rem' }}>
                          {sale.status === 'pending' && 'Devis à évaluer'}
                          {sale.status === 'paid' && 'Payé'}
                          {sale.status === 'shipped' && 'Expédié'}
                          {sale.status === 'delivered' && 'Livré'}
                          {sale.status === 'cancelled' && 'Annulé'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '60px', height: '45px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: '#03040c', border: '1px solid var(--border-color)' }}>
                            <img src={sale.product_image} alt={sale.product_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{sale.product_title}</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Livraison : {renderDeliveryMethod(sale.delivery_method)} • Date : {new Date(sale.created_at).toLocaleDateString('fr-FR')}</p>
                            {sale.delivery_method.startsWith('DEVIS_PENDING|') && (() => {
                              try {
                                const productsList = JSON.parse(sale.delivery_method.split('|')[1]);
                                return (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', borderLeft: '2px solid rgba(228,47,153,0.3)', paddingLeft: '0.5rem' }}>
                                    <span style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem', color: 'var(--color-magenta)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Modèles demandés :</span>
                                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                      {productsList.map((p: any, idx: number) => (
                                        <li key={idx} style={{ marginBottom: '0.15rem' }}>
                                          • {p.title} ({p.price.toFixed(2)} €)
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              } catch (e) {
                                return null;
                              }
                            })()}
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '0.5rem' }}>
                              Client : <strong>{sale.shipping_address.fullName}</strong><br/>
                              Email : <a href={`mailto:${sale.buyer_email}`} style={{ color: 'var(--color-cyan)', textDecoration: 'underline' }}>{sale.buyer_email}</a><br/>
                              Tél : <strong>{sale.shipping_address.phone || 'Non renseigné'}</strong><br/>
                              Adresse : {sale.shipping_address.addressLine1}, {sale.shipping_address.postalCode} {sale.shipping_address.city}, {sale.shipping_address.country}
                            </p>
                            <div style={{ marginTop: '0.5rem' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.65rem',
                                  textTransform: 'none',
                                  fontStyle: 'normal',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.03)'
                                }}
                                onClick={() => {
                                  const textToCopy = `Nom : ${sale.shipping_address.fullName}\n` +
                                                     `Tél : ${sale.shipping_address.phone || 'Non renseigné'}\n` +
                                                     `Email : ${sale.buyer_email}\n` +
                                                     `Adresse : ${sale.shipping_address.addressLine1}\n` +
                                                     `Code Postal : ${sale.shipping_address.postalCode}\n` +
                                                     `Ville : ${sale.shipping_address.city}\n` +
                                                     `Pays : ${sale.shipping_address.country}`;
                                  navigator.clipboard.writeText(textToCopy);
                                  showToast('Informations copiées avec succès !', 'success');
                                }}
                              >
                                📋 Copier le bordereau de livraison
                              </button>
                            </div>
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--color-magenta)', fontSize: '1.1rem' }}>
                          {sale.total_price.toFixed(2)} €
                        </span>
                      </div>
                      {/* Seller Shipping Entry Form */}
                      {sale.status === 'paid' && (
                        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const carrier = formData.get('carrier') as string;
                            const trackingNumber = formData.get('tracking_number') as string;
                            handleMarkAsShipped(sale.id, carrier, trackingNumber);
                          }} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Transporteur</label>
                              <select name="carrier" className="form-input form-select" required style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: '34px', backgroundPosition: 'right 0.5rem center' }}>
                                <option value="Mondial Relay">Mondial Relay</option>
                                <option value="Colissimo">Colissimo (La Poste)</option>
                                <option value="Chronopost">Chronopost</option>
                                <option value="DHL">DHL</option>
                              </select>
                            </div>
                            <div style={{ flex: '2 1 180px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Numéro de suivi</label>
                              <input type="text" name="tracking_number" className="form-input" required placeholder="Ex: MR987654" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: '34px' }} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.4rem 1rem', height: '34px', fontSize: '0.75rem', textTransform: 'none', fontStyle: 'normal' }}>
                              Expédier
                            </button>
                          </form>
                        </div>
                      )}

                      {/* Display Shipping Details */}
                      {(sale.status === 'shipped' || sale.status === 'delivered') && sale.carrier && sale.tracking_number && (
                        <div style={{
                          marginTop: '1rem',
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          paddingTop: '0.75rem',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}>
                          <span>Expédié par : <strong>{sale.carrier}</strong></span>
                          <span>Suivi : <code style={{ color: 'var(--color-cyan)', backgroundColor: 'rgba(0,225,255,0.05)', padding: '2px 4px', borderRadius: '3px' }}>{sale.tracking_number}</code></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Review Dialog modal */}
      {reviewOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(6, 7, 19, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999
        }}>
          <div className="card card-glass" style={{ width: '100%', maxWidth: '380px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.5rem', color: 'var(--color-cyan)' }}>Évaluer la transaction</h3>
            
            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="form-label">Note</label>
                <select 
                  className="form-input form-select"
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                >
                  <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                  <option value="4">⭐⭐⭐⭐ (Très Bien)</option>
                  <option value="3">⭐⭐⭐ (Correct)</option>
                  <option value="2">⭐⭐ (Moyen)</option>
                  <option value="1">⭐ (Mauvais)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Commentaire</label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  required
                  placeholder="Qualité du modèle, emballage, communication..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReviewOrder(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1">
                  <Star size={12} fill="currentColor" />
                  <span>Envoyer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Chargement de l'espace membre...</p>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
