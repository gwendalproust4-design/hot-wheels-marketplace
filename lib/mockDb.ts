// Mock Database Simulator for Placeholder Miniature Marketplace
// Powered by localStorage to run instantly without Supabase setup

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  role: 'buyer' | 'seller';
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  seller_name: string;
  title: string;
  description: string;
  price: number;
  year: number;
  series: string;
  condition: 'blister' | 'loose';
  stock: number;
  images: string[]; // Support multiple images
  date_released?: string; // Release date
  status: 'available' | 'sold';
  is_pinned?: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  product_title: string;
  product_image: string;
  total_price: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  stripe_session_id?: string;
  delivery_method: string;
  shipping_address: {
    fullName: string;
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  tracking_number?: string;
  carrier?: string;
  buyer_email: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  product_id: string;
  content: string;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

// Seed Data with multiple images
const SEED_PROFILES: Profile[] = [
  {
    id: 'seller-1',
    username: 'vendeur_legends',
    full_name: 'Boutique Collectionneur',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    role: 'seller',
    created_at: new Date().toISOString()
  }
];

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    seller_id: 'seller-1',
    seller_name: 'vendeur_legends',
    title: 'Shelby Cobra 427 S/C 1965',
    description: 'Modèle de collection miniature de la Shelby Cobra 427. Peinture bleu métallisé avec doubles bandes blanches. Excellente finition des jantes chromées et habitacle détaillé.',
    price: 35.00,
    year: 2023,
    series: 'Mini Roadsters',
    condition: 'loose',
    stock: 1,
    images: [
      'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600'
    ],
    date_released: '2023-04-12',
    status: 'available',
    is_pinned: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-2',
    seller_id: 'seller-1',
    seller_name: 'vendeur_legends',
    title: 'Porsche 911 GT3 RS',
    description: 'Version course aérodynamique de la Porsche 911 GT3 RS. Modèle sous blister scellé. Carrosserie gris argent avec jantes et stickers orange racing.',
    price: 45.00,
    year: 2024,
    series: 'Speed Graphics',
    condition: 'blister',
    stock: 2,
    images: [
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=600'
    ],
    date_released: '2024-01-20',
    status: 'available',
    is_pinned: false,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-3',
    seller_id: 'seller-1',
    seller_name: 'vendeur_legends',
    title: 'Corvette Stingray 1976 Vintage',
    description: 'Modèle muscle car rétro Corvette Stingray de 1976. Robe rouge cerise brillante avec décorations latérales d\'époque. Modèle d\'occasion très propre, peinture à 98% intacte.',
    price: 55.00,
    year: 1976,
    series: 'Showroom Classics',
    condition: 'loose',
    stock: 1,
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=600'
    ],
    date_released: '1976-09-05',
    status: 'available',
    is_pinned: false,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    order_id: 'mock-order-0',
    reviewer_id: 'buyer-demo',
    reviewer_name: 'Mini_Collector',
    reviewee_id: 'seller-1',
    rating: 5,
    comment: 'Modèles superbes ! Emballage solide en papier bulle de qualité. Livraison rapide en point relais. Je recommande !',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const isClient = typeof window !== 'undefined';

function getStorage<T>(key: string, defaultValue: T): T {
  if (!isClient) return defaultValue;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data);
}

function setStorage<T>(key: string, value: T): void {
  if (!isClient) return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Database Actions
export const mockDb = {
  getProfiles: () => getStorage<Profile[]>('hw_profiles', SEED_PROFILES),
  setProfiles: (profiles: Profile[]) => setStorage('hw_profiles', profiles),
  
  getProducts: () => getStorage<Product[]>('hw_products', SEED_PRODUCTS),
  setProducts: (products: Product[]) => setStorage('hw_products', products),
  
  getOrders: () => getStorage<Order[]>('hw_orders', []),
  setOrders: (orders: Order[]) => setStorage('hw_orders', orders),
  
  getMessages: () => getStorage<Message[]>('hw_messages', []),
  setMessages: (messages: Message[]) => setStorage('hw_messages', messages),
  
  getReviews: () => getStorage<Review[]>('hw_reviews', SEED_REVIEWS),
  setReviews: (reviews: Review[]) => setStorage('hw_reviews', reviews),
  
  getFavorites: () => getStorage<string[]>('hw_favorites', []),
  setFavorites: (favorites: string[]) => setStorage('hw_favorites', favorites),

  register: (user: Partial<Profile> & { id: string }) => {
    const profiles = mockDb.getProfiles();
    const newProfile: Profile = {
      id: user.id,
      username: user.username || 'new_collector',
      full_name: user.full_name || 'Collectionneur',
      avatar_url: user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      role: user.role || 'buyer',
      created_at: new Date().toISOString()
    };
    profiles.push(newProfile);
    mockDb.setProfiles(profiles);
    return newProfile;
  },

  getProfileById: (id: string) => {
    return mockDb.getProfiles().find(p => p.id === id) || null;
  },

  createProduct: (product: Omit<Product, 'id' | 'status' | 'created_at'>) => {
    const products = mockDb.getProducts();
    const newProduct: Product = {
      ...product,
      id: 'prod-' + Math.random().toString(36).substr(2, 9),
      status: 'available',
      is_pinned: false,
      created_at: new Date().toISOString()
    };
    products.push(newProduct);
    mockDb.setProducts(products);
    return newProduct;
  },

  deleteProduct: (id: string) => {
    const products = mockDb.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products.splice(index, 1);
      mockDb.setProducts(products);
      return true;
    }
    return false;
  },

  updateProductStock: (id: string, newStock: number) => {
    const products = mockDb.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index].stock = newStock;
      if (newStock <= 0) {
        products[index].status = 'sold';
      }
      mockDb.setProducts(products);
    }
  },

  createOrder: (orderData: Omit<Order, 'id' | 'created_at' | 'status'>) => {
    const orders = mockDb.getOrders();
    const newOrder: Order = {
      ...orderData,
      id: 'ord-' + Math.random().toString(36).substr(2, 9),
      status: 'paid',
      created_at: new Date().toISOString()
    };
    orders.push(newOrder);
    mockDb.setOrders(orders);
    
    mockDb.updateProductStock(orderData.product_id, 0);
    
    return newOrder;
  },

  updateOrderStatus: (orderId: string, updates: Partial<Order>) => {
    const orders = mockDb.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      mockDb.setOrders(orders);
      return orders[index];
    }
    return null;
  },

  sendMessage: (msgData: Omit<Message, 'id' | 'created_at'>) => {
    const messages = mockDb.getMessages();
    const newMessage: Message = {
      ...msgData,
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    messages.push(newMessage);
    mockDb.setMessages(messages);
    
    if (msgData.sender_id !== msgData.receiver_id && !msgData.receiver_id.startsWith('buyer')) {
      setTimeout(() => {
        const currentMessages = mockDb.getMessages();
        const autoReply: Message = {
          id: 'msg-' + Math.random().toString(36).substr(2, 9),
          sender_id: msgData.receiver_id,
          receiver_id: msgData.sender_id,
          product_id: msgData.product_id,
          content: `Bonjour ! Merci pour l'intérêt que vous portez à nos modèles miniatures de collection. Votre colis sera emballé de manière ultra-sécurisée et expédié sous 24h ouvrées. N'hésitez pas si vous avez des questions spécifiques ! 😊`,
          created_at: new Date().toISOString()
        };
        currentMessages.push(autoReply);
        mockDb.setMessages(currentMessages);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hw_new_message', { detail: autoReply }));
        }
      }, 2000);
    }
    
    return newMessage;
  },

  addReview: (reviewData: Omit<Review, 'id' | 'created_at'>) => {
    const reviews = mockDb.getReviews();
    const newReview: Review = {
      ...reviewData,
      id: 'rev-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    reviews.push(newReview);
    mockDb.setReviews(reviews);
    return newReview;
  },

  toggleFavorite: (userId: string, productId: string) => {
    const favorites = mockDb.getFavorites();
    const favKey = `${userId}:${productId}`;
    const index = favorites.indexOf(favKey);
    let active = false;
    
    if (index === -1) {
      favorites.push(favKey);
      active = true;
    } else {
      favorites.splice(index, 1);
    }
    
    mockDb.setFavorites(favorites);
    return active;
  },

  isFavorite: (userId: string, productId: string) => {
    const favorites = mockDb.getFavorites();
    return favorites.includes(`${userId}:${productId}`);
  },

  togglePinProduct: (productId: string) => {
    const products = mockDb.getProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      const currentPinned = !!products[index].is_pinned;
      // Unpin all products first
      products.forEach(p => {
        p.is_pinned = false;
      });
      // Toggle the selected product
      products[index].is_pinned = !currentPinned;
      mockDb.setProducts(products);
    }
  }
};
