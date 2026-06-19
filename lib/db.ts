import { supabase, isSupabaseConfigured } from './supabase';
import { mockDb, Product, Order, Message, Review } from './mockDb';

export const db = {
  // --- Products ---
  getProducts: async (): Promise<Product[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'available');
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        images: Array.isArray(p.images) ? p.images : (p.images ? JSON.parse(p.images) : [])
      })) as Product[];
    }
    return mockDb.getProducts().filter(p => p.status === 'available');
  },

  getProductById: async (id: string): Promise<Product | null> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return {
        ...data,
        images: Array.isArray(data.images) ? data.images : (data.images ? JSON.parse(data.images) : [])
      } as Product;
    }
    return mockDb.getProducts().find(p => p.id === id) || null;
  },

  createProduct: async (product: Omit<Product, 'id' | 'status' | 'created_at'>): Promise<Product> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          seller_id: product.seller_id,
          title: product.title,
          description: product.description,
          price: product.price,
          year: product.year,
          series: product.series,
          condition: product.condition,
          stock: product.stock,
          images: product.images,
          date_released: product.date_released,
          status: 'available',
          is_pinned: false
        }])
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        images: Array.isArray(data.images) ? data.images : (data.images ? JSON.parse(data.images) : [])
      } as Product;
    }
    return mockDb.createProduct(product);
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) {
        if (error.code === '23503') {
          const { error: updateError } = await supabase
            .from('products')
            .update({ status: 'sold', stock: 0 })
            .eq('id', id);
          if (updateError) throw updateError;
          return true;
        }
        throw error;
      }
      return true;
    }
    return mockDb.deleteProduct(id);
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      return true;
    }
    const products = mockDb.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      mockDb.setProducts(products);
      return true;
    }
    return false;
  },

  // --- Orders ---
  getOrders: async (userId: string): Promise<Order[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, products(title, images)')
        .eq('buyer_id', userId);
      if (error) throw error;
      
      return (data || []).map((o: any) => {
        const prodImages = o.products?.images;
        const resolvedImages = Array.isArray(prodImages) ? prodImages : (prodImages ? JSON.parse(prodImages) : []);
        return {
          id: o.id,
          buyer_id: o.buyer_id,
          seller_id: o.seller_id,
          product_id: o.product_id,
          product_title: o.products?.title || 'Miniature',
          product_image: resolvedImages[0] || '',
          total_price: Number(o.total_price),
          status: o.status,
          stripe_session_id: o.stripe_session_id,
          delivery_method: o.delivery_method,
          shipping_address: o.shipping_address,
          tracking_number: o.tracking_number,
          carrier: o.carrier,
          buyer_email: o.buyer_email,
          created_at: o.created_at
        };
      });
    }
    return mockDb.getOrders().filter(o => o.buyer_id === userId);
  },

  getSales: async (userId: string): Promise<Order[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, products(title, images)')
        .eq('seller_id', userId);
      if (error) throw error;

      return (data || []).map((o: any) => {
        const prodImages = o.products?.images;
        const resolvedImages = Array.isArray(prodImages) ? prodImages : (prodImages ? JSON.parse(prodImages) : []);
        return {
          id: o.id,
          buyer_id: o.buyer_id,
          seller_id: o.seller_id,
          product_id: o.product_id,
          product_title: o.products?.title || 'Miniature',
          product_image: resolvedImages[0] || '',
          total_price: Number(o.total_price),
          status: o.status,
          stripe_session_id: o.stripe_session_id,
          delivery_method: o.delivery_method,
          shipping_address: o.shipping_address,
          tracking_number: o.tracking_number,
          carrier: o.carrier,
          buyer_email: o.buyer_email,
          created_at: o.created_at
        };
      });
    }
    return mockDb.getOrders().filter(o => o.seller_id === userId);
  },

  createOrder: async (order: Omit<Order, 'id' | 'created_at' | 'status'> & { id?: string; status?: 'pending' | 'paid' | 'shipped' | 'delivered' }): Promise<Order> => {
    const statusVal = order.status || 'paid';
    if (isSupabaseConfigured && supabase) {
      const insertData: any = {
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
        product_id: order.product_id,
        total_price: order.total_price,
        status: statusVal,
        delivery_method: order.delivery_method,
        shipping_address: order.shipping_address,
        buyer_email: order.buyer_email
      };
      if (order.id) {
        insertData.id = order.id;
      }
      const { data, error } = await supabase
        .from('orders')
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;

      // Reserve the product using the server-side API (bypassing RLS)
      try {
        await fetch('/api/products/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: [order.product_id] })
        });
      } catch (err) {
        console.error('Failed to reserve product on checkout:', err);
      }

      return {
        ...order,
        id: data.id,
        status: statusVal,
        created_at: data.created_at
      };
    }
    return mockDb.createOrder(order);
  },

  updateOrderStatus: async (
    orderId: string,
    updates: Partial<Order>
  ): Promise<Order | null> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();
      if (error) throw error;
      return data as Order;
    }
    const res = mockDb.updateOrderStatus(orderId, updates);
    return res;
  },

  // --- Messages ---
  getMessages: async (userId: string): Promise<Message[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      if (error) throw error;
      return (data || []) as Message[];
    }
    return mockDb.getMessages().filter(m => m.sender_id === userId || m.receiver_id === userId);
  },

  sendMessage: async (msg: Omit<Message, 'id' | 'created_at'>): Promise<Message> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          product_id: msg.product_id,
          content: msg.content
        }])
        .select()
        .single();
      if (error) throw error;
      return data as Message;
    }
    return mockDb.sendMessage(msg);
  },

  // --- Reviews ---
  getReviews: async (sellerId: string): Promise<Review[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles!reviews_reviewer_id_fkey(username)')
        .eq('reviewee_id', sellerId);
      if (error) throw error;
      
      return (data || []).map((r: any) => ({
        id: r.id,
        order_id: r.order_id,
        reviewer_id: r.reviewer_id,
        reviewer_name: r.profiles?.username || 'Anonyme',
        reviewee_id: r.reviewee_id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at
      }));
    }
    return mockDb.getReviews().filter(r => r.reviewee_id === sellerId);
  },

  addReview: async (review: Omit<Review, 'id' | 'created_at'>): Promise<Review> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          order_id: review.order_id,
          reviewer_id: review.reviewer_id,
          reviewee_id: review.reviewee_id,
          rating: review.rating,
          comment: review.comment
        }])
        .select()
        .single();
      if (error) throw error;
      return {
        ...review,
        id: data.id,
        created_at: data.created_at
      };
    }
    return mockDb.addReview(review);
  },

  // --- Favorites ---
  isFavorite: async (userId: string, productId: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    }
    return mockDb.isFavorite(userId, productId);
  },

  toggleFavorite: async (userId: string, productId: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const isFav = await db.isFavorite(userId, productId);
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);
        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: userId, product_id: productId }]);
        if (error) throw error;
        return true;
      }
    }
    return mockDb.toggleFavorite(userId, productId);
  },

  togglePinProduct: async (productId: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      // Get the target product to check its current pinned state
      const { data: targetProd, error: fetchErr } = await supabase
        .from('products')
        .select('is_pinned, seller_id')
        .eq('id', productId)
        .single();
      if (fetchErr) throw fetchErr;

      const newPinnedState = !targetProd.is_pinned;

      if (newPinnedState) {
        // If pinning, unpin all other products first
        const { error: unpinErr } = await supabase
          .from('products')
          .update({ is_pinned: false })
          .eq('seller_id', targetProd.seller_id);
        if (unpinErr) throw unpinErr;
      }

      // Update the target product
      const { error: updateErr } = await supabase
        .from('products')
        .update({ is_pinned: newPinnedState })
        .eq('id', productId);
      if (updateErr) throw updateErr;
      return;
    }
    mockDb.togglePinProduct(productId);
  }
};
