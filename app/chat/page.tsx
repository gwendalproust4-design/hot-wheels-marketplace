'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { db } from '@/lib/db';
import { mockDb, Message, Product, Profile, Order } from '@/lib/mockDb';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Send, MessageSquare, Bookmark } from 'lucide-react';

interface ChatChannel {
  productId: string;
  otherUserId: string;
  product: Product;
  otherProfile: Profile;
  lastMessage: Message;
}

function BasketQuoteBubble({ 
  msg, 
  isSentByMe, 
  userOrders, 
  loadUserOrders, 
  activeChannel 
}: { 
  msg: Message; 
  isSentByMe: boolean; 
  userOrders: Order[]; 
  loadUserOrders: () => void; 
  activeChannel: any; 
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [shippingInput, setShippingInput] = useState('');
  const [validating, setValidating] = useState(false);

  // Parse quote data
  let quoteData: any = null;
  try {
    quoteData = JSON.parse(msg.content.substring('[BASKET_QUOTE]:'.length));
  } catch (e) {
    console.error('Failed to parse basket quote message:', e);
  }

  if (!quoteData || !user) {
    return (
      <div className="card card-glass" style={{ padding: '1rem', color: 'var(--error)' }}>
        Erreur de chargement du devis.
      </div>
    );
  }

  const order = userOrders.find(o => o.id === quoteData.orderId);
  const isPaid = order?.status === 'paid';
  const isCancelled = order?.status === 'cancelled';
  const hasShipping = order && !order.delivery_method.startsWith('DEVIS_PENDING|');
  const finalShippingPrice = order && hasShipping ? (order.total_price - quoteData.subtotal) : 0;
  const finalTotalPrice = order && hasShipping ? order.total_price : quoteData.subtotal;

  const handleValidateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.role !== 'seller') return;
    const shippingPrice = parseFloat(shippingInput);
    if (isNaN(shippingPrice) || shippingPrice < 0) {
      showToast('Veuillez saisir un montant de frais de port valide', 'error');
      return;
    }

    setValidating(true);
    try {
      // 1. Update the order in database with total_price and new delivery_method
      await db.updateOrderStatus(quoteData.orderId, {
        total_price: quoteData.subtotal + shippingPrice,
        delivery_method: 'Livraison Personnalisée'
      });

      // 2. Send notice message
      await db.sendMessage({
        sender_id: user.id,
        receiver_id: msg.sender_id, // sender of the quote was the buyer
        product_id: msg.product_id,
        content: `Frais de port validés à ${shippingPrice.toFixed(2)} € pour votre commande multi-produits. Vous pouvez procéder au paiement.`
      });

      showToast('Frais de port enregistrés et validés !', 'success');
      loadUserOrders();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erreur lors de la validation', 'error');
    } finally {
      setValidating(false);
    }
  };

  const handlePay = async () => {
    if (!order) return;
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: order.product_id,
          buyerId: user.id,
          sellerId: order.seller_id,
          title: order.product_title,
          image: order.product_image,
          price: quoteData.subtotal,
          deliveryMethod: order.delivery_method,
          shippingAddress: order.shipping_address,
          totalPrice: order.total_price,
          orderId: order.id
        })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Payment redirect failed:', err);
      showToast('Impossible de rediriger vers Stripe', 'error');
    }
  };

  const [cancelling, setCancelling] = useState(false);

  const handleCancelQuote = async () => {
    if (!order) return;
    if (!window.confirm("Êtes-vous sûr de vouloir annuler ce devis et remettre les voitures en vente ?")) {
      return;
    }

    setCancelling(true);
    try {
      // 1. Update order status to 'cancelled' in DB
      await db.updateOrderStatus(quoteData.orderId, {
        status: 'cancelled' as any
      });

      // 2. Call server API to release products back to stock
      const productIds = quoteData.items.map((item: any) => item.id);
      await fetch('/api/products/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds })
      });

      // 3. Send cancellation message in the chat
      const senderRoleName = user.role === 'seller' ? 'le vendeur' : "l'acheteur";
      await db.sendMessage({
        sender_id: user.id,
        receiver_id: msg.sender_id === user.id ? msg.receiver_id : msg.sender_id,
        product_id: msg.product_id,
        content: `❌ Le devis a été annulé par ${senderRoleName}. Les articles ont été remis en stock.`
      });

      showToast('Devis annulé. Les articles ont été remis en stock.', 'success');
      loadUserOrders();
    } catch (err: any) {
      console.error('Failed to cancel devis:', err);
      showToast(err.message || 'Erreur lors de l\'annulation', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="card card-glass" style={{
      width: '100%',
      maxWidth: '420px',
      padding: '1.25rem',
      borderRadius: 'var(--radius-md)',
      border: isPaid ? '1px solid var(--success)' : isCancelled ? '1px solid rgba(255, 0, 0, 0.3)' : '1px solid var(--border-color)',
      background: 'rgba(26, 25, 83, 0.5)',
      boxShadow: 'var(--shadow-md)',
      textAlign: 'left'
    }}>
      {/* Title */}
      <div className="flex justify-between items-center" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          📦 Devis Multi-modèles
        </span>
        {isPaid ? (
          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Payé ✓</span>
        ) : isCancelled ? (
          <span className="badge" style={{ fontSize: '0.65rem', backgroundColor: 'rgba(255, 0, 0, 0.12)', color: '#ff0055', borderColor: 'rgba(255, 0, 85, 0.3)', border: '1px solid' }}>Annulé ❌</span>
        ) : hasShipping ? (
          <span className="badge badge-blister" style={{ fontSize: '0.65rem', backgroundColor: 'rgba(255,179,0,0.12)', color: 'var(--warning)', borderColor: 'rgba(255,179,0,0.3)' }}>Frais Validés</span>
        ) : (
          <span className="badge badge-blister" style={{ fontSize: '0.65rem' }}>En attente</span>
        )}
      </div>

      {/* Items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {quoteData.items.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between" style={{ fontSize: '0.82rem', color: '#fff' }}>
            <span>• {item.title}</span>
            <span style={{ fontWeight: 700 }}>{item.price.toFixed(2)} €</span>
          </div>
        ))}
      </div>

      {/* Adresse de livraison */}
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.65rem',
        marginBottom: '1rem',
        borderLeft: '2px solid var(--color-cyan)'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--color-cyan)', marginBottom: '0.35rem', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
          Adresse de Livraison :
        </div>
        <div><strong>{quoteData.shippingAddress?.fullName}</strong></div>
        <div>{quoteData.shippingAddress?.addressLine1}</div>
        <div>{quoteData.shippingAddress?.postalCode} {quoteData.shippingAddress?.city}</div>
        <div>{quoteData.shippingAddress?.country}</div>
        {quoteData.shippingAddress?.phone && (
          <div style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}>Tél : {quoteData.shippingAddress.phone}</div>
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-secondary)' }}>Sous-total</span>
          <span style={{ fontWeight: 700 }}>{quoteData.subtotal.toFixed(2)} €</span>
        </div>

        {hasShipping ? (
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Frais de port</span>
            <span style={{ fontWeight: 700, color: 'var(--color-cyan)' }}>{finalShippingPrice.toFixed(2)} €</span>
          </div>
        ) : null}

        <div className="flex justify-between" style={{ fontSize: '0.95rem', fontWeight: 800, borderTop: '1px dotted rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
          <span>Total</span>
          <span className="neon-gradient-text">{finalTotalPrice.toFixed(2)} €</span>
        </div>
      </div>

      {/* Actions / Form */}
      {isPaid ? (
        <div style={{
          backgroundColor: 'rgba(0, 255, 102, 0.05)',
          border: '1px solid rgba(0, 255, 102, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'var(--success)'
        }}>
          Le paiement a été validé ! Commande enregistrée.
        </div>
      ) : isCancelled ? (
        <div style={{
          backgroundColor: 'rgba(255, 0, 0, 0.05)',
          border: '1px solid rgba(255, 0, 0, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#ff0055'
        }}>
          Ce devis a été annulé. Les articles sont de nouveau en vente.
        </div>
      ) : (
        <>
          {hasShipping ? (
            user.role === 'buyer' ? (
              <button
                onClick={handlePay}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.8rem', fontWeight: 800 }}
              >
                Procéder au paiement ({finalTotalPrice.toFixed(2)} €)
              </button>
            ) : (
              <div style={{
                backgroundColor: 'rgba(255, 179, 0, 0.05)',
                border: '1px solid rgba(255, 179, 0, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'var(--warning)',
                fontWeight: 600
              }}>
                Frais de port validés. En attente de paiement par l'acheteur.
              </div>
            )
          ) : (
            user.role === 'seller' ? (
              <form onSubmit={handleValidateShipping} className="flex gap-2" style={{ marginTop: '0.5rem' }}>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Frais de port (€)"
                  value={shippingInput}
                  onChange={(e) => setShippingInput(e.target.value)}
                  className="form-input"
                  style={{ padding: '0.5rem', fontSize: '0.8rem', flex: 1, backgroundColor: 'rgba(4, 5, 10, 0.8)' }}
                  disabled={validating}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem', fontWeight: 800 }}
                  disabled={validating}
                >
                  {validating ? 'Validation...' : 'Valider'}
                </button>
              </form>
            ) : (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem',
                textAlign: 'center',
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}>
                En attente de l'évaluation des frais de port par le vendeur...
              </div>
            )
          )}

          {/* Cancellation Trigger */}
          <button
            onClick={handleCancelQuote}
            className="btn btn-secondary"
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              backgroundColor: 'rgba(255, 0, 0, 0.05)', 
              color: '#ff0055',
              border: '1px solid rgba(255, 0, 85, 0.15)',
              marginTop: '0.75rem'
            }}
            disabled={cancelling}
          >
            {cancelling ? 'Annulation...' : 'Annuler le devis'}
          </button>
        </>
      )}
    </div>
  );
}

function ChatPageContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<{ productId: string; otherUserId: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  const loadUserOrders = async () => {
    if (!user) return;
    try {
      const ords = user.role === 'seller' ? await db.getSales(user.id) : await db.getOrders(user.id);
      setUserOrders(ords);
    } catch (err) {
      console.error('Error loading user orders in chat:', err);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSelected = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChannels = async () => {
    if (!user) return;
    try {
      const allMessages = await db.getMessages(user.id);
      
      const channelMap = new Map<string, Message[]>();
      allMessages.forEach((msg) => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const key = `${msg.product_id}:${otherId}`;
        const existing = channelMap.get(key) || [];
        existing.push(msg);
        channelMap.set(key, existing);
      });

      const loadedChannels: ChatChannel[] = [];
      const allProducts = await db.getAllProducts();
      
      // profiles query
      const allProfiles = mockDb.getProfiles(); // mock profiles fallback

      for (const [key, msgs] of Array.from(channelMap.entries())) {
        const [productId, otherUserId] = key.split(':');
        const product = allProducts.find(p => p.id === productId) || mockDb.getProducts().find(p => p.id === productId);
        const otherProfile = allProfiles.find(p => p.id === otherUserId) || {
          id: otherUserId,
          username: 'collector_club',
          full_name: 'Collectionneur',
          avatar_url: '',
          role: 'buyer',
          created_at: ''
        } as Profile;
        
        const sortedMsgs = msgs.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const lastMessage = sortedMsgs[sortedMsgs.length - 1];

        if (product) {
          loadedChannels.push({
            productId,
            otherUserId,
            product,
            otherProfile,
            lastMessage
          });
        }
      }

      loadedChannels.sort((a,b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());
      setChannels(loadedChannels);
      
      const queryProductId = searchParams.get('productId');
      const queryRecipientId = searchParams.get('recipientId');
      if (queryProductId && queryRecipientId && !activeChannel) {
        setActiveChannel({ productId: queryProductId, otherUserId: queryRecipientId });
        hasAutoSelected.current = true;
      } else if (loadedChannels.length > 0 && !activeChannel && !hasAutoSelected.current && typeof window !== 'undefined' && window.innerWidth > 768) {
        setActiveChannel({ productId: loadedChannels[0].productId, otherUserId: loadedChannels[0].otherUserId });
        hasAutoSelected.current = true;
      }
    } catch (err) {
      console.error('Error loading chat channels:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!user || !activeChannel) return;
    try {
      const allMessages = await db.getMessages(user.id);
      const activeMsgs = allMessages.filter(
        m => m.product_id === activeChannel.productId &&
        ((m.sender_id === user.id && m.receiver_id === activeChannel.otherUserId) ||
         (m.sender_id === activeChannel.otherUserId && m.receiver_id === user.id))
      );
      const sorted = activeMsgs.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadChannels();
  }, [user, searchParams]);

  useEffect(() => {
    loadMessages();
    setTimeout(scrollToBottom, 100);
    loadUserOrders();
  }, [activeChannel, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
      loadChannels();
      loadUserOrders();
    }, 2000);

    const handleNewMessage = () => {
      loadMessages();
      loadChannels();
      loadUserOrders();
      setTimeout(scrollToBottom, 100);
    };

    window.addEventListener('hw_new_message', handleNewMessage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('hw_new_message', handleNewMessage);
    };
  }, [activeChannel, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeChannel || !inputText.trim()) return;

    setSending(true);
    try {
      await db.sendMessage({
        sender_id: user.id,
        receiver_id: activeChannel.otherUserId,
        product_id: activeChannel.productId,
        content: inputText.trim()
      });
      
      setInputText('');
      await loadMessages();
      await loadChannels();
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de l'envoi", 'error');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card card-glass" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <MessageSquare size={48} className="logo-cyan" />
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Messagerie indisponible</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Vous devez vous connecter à votre compte pour discuter avec les autres membres.</p>
          <Link href="/profile" className="btn btn-primary">Se Connecter</Link>
        </div>
      </div>
    );
  }

  const currentChannelDetail = channels.find(
    c => c.productId === activeChannel?.productId && c.otherUserId === activeChannel?.otherUserId
  );

  return (
    <div className="container">
      <h1 className="page-title" style={{ marginBottom: '2rem' }}>
        Messagerie <span className="neon-gradient-text">Live</span>
      </h1>

      <div className={`chat-grid ${activeChannel ? 'channel-active' : ''}`} style={{
        height: 'calc(100vh - 200px)',
        minHeight: '500px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Sidebar: Conversations List */}
        <div className="chat-sidebar" style={{
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-primary)',
          height: '100%',
          maxHeight: '100%',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem', color: 'var(--color-cyan)' }}>
            Discussions
          </div>
          
          <div className="chat-channels-list" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {channels.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Aucune conversation active.
              </div>
            ) : (
              channels.map((chan) => {
                const isActive = activeChannel?.productId === chan.productId && activeChannel?.otherUserId === chan.otherUserId;
                return (
                  <button
                    key={`${chan.productId}:${chan.otherUserId}`}
                    onClick={() => setActiveChannel({ productId: chan.productId, otherUserId: chan.otherUserId })}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isActive ? 'rgba(0, 240, 255, 0.06)' : 'transparent',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-cyan)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      <span style={{ fontSize: '0.85rem' }}>{chan.otherProfile.username.substring(0, 2).toUpperCase()}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex justify-between items-baseline">
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: isActive ? 'var(--color-cyan)' : '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          @{chan.otherProfile.username}
                        </h4>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {new Date(chan.lastMessage.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 600, marginTop: '0.1rem' }}>
                        {chan.product.title}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {chan.lastMessage.sender_id === user.id ? 'Vous: ' : ''}{chan.lastMessage.content}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        {activeChannel && currentChannelDetail ? (
          <div className="chat-area" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: '100%',
            minHeight: 0,
            backgroundColor: 'var(--bg-secondary)',
            overflow: 'hidden'
          }}>
            {/* Header: Chat partner and product badge */}
            <div className="flex justify-between items-center" style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <button 
                  onClick={() => setActiveChannel(null)} 
                  className="mobile-back-button"
                >
                  ← Discussions
                </button>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>@{currentChannelDetail.otherProfile.username}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Annonce : <strong>{currentChannelDetail.product.title}</strong></p>
              </div>

              {/* Mini product link */}
              <Link href={`/products/${currentChannelDetail.product.id}`} className="card-glass flex items-center gap-2" style={{
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem'
              }}>
                <Bookmark size={12} className="logo-cyan" />
                <span style={{ fontWeight: 700, color: 'var(--color-magenta)' }}>{currentChannelDetail.product.price.toFixed(2)} €</span>
              </Link>
            </div>

            {/* Message History bubble grid */}
            <div 
              className="chat-messages-container"
              style={{
                flex: 1,
                overflowY: 'auto',
                minHeight: 0,
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {messages.map((msg) => {
                const isSentByMe = msg.sender_id === user.id;
                const isBasketQuote = msg.content.startsWith('[BASKET_QUOTE]:');
                const senderUsername = isSentByMe ? user.username : (currentChannelDetail?.otherProfile.username || 'collector_club');
                
                if (isBasketQuote) {
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSentByMe ? 'flex-end' : 'flex-start', margin: '1rem 0', gap: '0.35rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--color-cyan)',
                        opacity: 0.85,
                        marginRight: isSentByMe ? '0.5rem' : '0',
                        marginLeft: isSentByMe ? '0' : '0.5rem'
                      }}>
                        @{senderUsername}
                      </span>
                      <BasketQuoteBubble msg={msg} isSentByMe={isSentByMe} userOrders={userOrders} loadUserOrders={loadUserOrders} activeChannel={activeChannel} />
                    </div>
                  );
                }

                return (
                  <div 
                    key={msg.id} 
                    className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}
                  >
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isSentByMe ? '#a0cfff' : '#ffd700',
                      marginBottom: '0.35rem',
                      opacity: 0.95,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      paddingBottom: '0.25rem'
                    }}>
                      @{senderUsername}
                    </div>
                    <p style={{ fontSize: '0.9rem' }}>{msg.content}</p>
                    <span style={{
                      display: 'block',
                      textAlign: 'right',
                      fontSize: '0.6rem',
                      color: 'rgba(255,255,255,0.6)',
                      marginTop: '0.35rem',
                      fontWeight: 600
                    }}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input footer */}
            <form onSubmit={handleSendMessage} style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)'
            }}>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Écrivez votre message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  required
                  disabled={sending}
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
                
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.25rem' }}
                  disabled={sending || !inputText.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, color: 'var(--text-muted)' }}>
            <MessageSquare size={44} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.9rem' }}>Sélectionnez une discussion pour commencer à chatter.</p>
          </div>
        )}
      </div>
      <style>{`
        .chat-messages-container::-webkit-scrollbar {
          width: 6px !important;
        }
        .chat-messages-container::-webkit-scrollbar-track {
          background: rgba(4, 5, 10, 0.35) !important;
          border-radius: 9999px !important;
        }
        .chat-messages-container::-webkit-scrollbar-thumb {
          background: var(--color-cyan) !important;
          border-radius: 9999px !important;
          box-shadow: 0 0 6px var(--color-cyan-glow) !important;
        }
        .chat-messages-container::-webkit-scrollbar-thumb:hover {
          background: #ffffff !important;
          box-shadow: 0 0 10px #ffffff !important;
        }

        .chat-channels-list::-webkit-scrollbar {
          width: 5px !important;
        }
        .chat-channels-list::-webkit-scrollbar-track {
          background: rgba(4, 5, 10, 0.2) !important;
          border-radius: 9999px !important;
        }
        .chat-channels-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15) !important;
          border-radius: 9999px !important;
        }
        .chat-channels-list::-webkit-scrollbar-thumb:hover {
          background: var(--color-cyan) !important;
          box-shadow: 0 0 6px var(--color-cyan-glow) !important;
        }
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Chargement des conversations...</p>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
