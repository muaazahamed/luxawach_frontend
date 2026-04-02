import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronRight, Package, Truck, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useUser } from '../UserContext';
import api from '../api';
import { Order } from '../types';
import { formatCurrency, formatDate, cn } from '../utils';
import { Button } from '../components/Button';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredToken, isTokenValid } from '../authToken';

const normalizeStatus = (status: Order['status']): Order['status'] =>
  status === 'processing' ? 'packed' : status;

const getStatusLabel = (status: Order['status']) => {
  const normalized = normalizeStatus(status);
  if (normalized === 'pending') return 'Pending';
  if (normalized === 'confirmed') return 'Confirmed';
  if (normalized === 'packed') return 'Packed';
  if (normalized === 'shipped') return 'Shipped';
  if (normalized === 'delivered') return 'Delivered';
  return 'Order cancel by owner';
};

const normalizeOrderItems = (items: any[]) => {
  if (!Array.isArray(items)) return [];
  return items.map((item: any) => {
    const name = String(item?.name || 'Timepiece');
    const parsedVariant = name.match(/\(([^)]+)\)/)?.[1]?.trim();
    return {
      productId: String(item?.productId || item?.product || 'unknown'),
      quantity: Number(item?.quantity) || 1,
      price: Number(item?.price) || 0,
      name,
      image: String(item?.image || 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=1000'),
      variantName: (typeof item?.variantName === 'string' && item.variantName.trim()) || parsedVariant || undefined,
    };
  });
};

const getLocalOrders = () => {
  try {
    const mockOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
    const legacyOrders = JSON.parse(localStorage.getItem('buyNowOrders') || '[]');
    const normalizedLegacy = Array.isArray(legacyOrders)
      ? legacyOrders.map((o: any, idx: number) => ({
          id: o?.id || `legacy-order-${Date.now()}-${idx}`,
          _id: o?.id || `legacy-order-${Date.now()}-${idx}`,
          orderId: o?.orderId || o?.id || `ORD${Date.now().toString().slice(-8)}`,
          userId: o?.shippingAddress?.email || 'guest',
          items: Array.isArray(o?.items)
            ? o.items
            : [{
                product: o?.product || 'unknown',
                name: o?.product || 'Offline Order',
                quantity: Number(o?.quantity) || 1,
                price: Number(o?.total) || 0,
                image: '',
              }],
          total: Number(o?.total) || 0,
          shippingAddress: {
            fullName: o?.shippingAddress?.fullName || '',
            email: o?.shippingAddress?.email || '',
            phone: o?.shippingAddress?.phone || '',
            address: o?.shippingAddress?.address || '',
            city: o?.shippingAddress?.city || '',
            postalCode: o?.shippingAddress?.postalCode || '',
          },
          status: o?.status || 'pending',
          createdAt: o?.createdAt || Date.now(),
          updatedAt: o?.updatedAt || o?.createdAt || Date.now(),
        }))
      : [];
    return [...(Array.isArray(mockOrders) ? mockOrders : []), ...normalizedLegacy];
  } catch {
    return [];
  }
};

const getOrderColorsLabel = (order: Order) =>
  Array.from(
    new Set(
      order.items
        .map((item) => (typeof item.variantName === 'string' ? item.variantName.trim() : ''))
        .filter(Boolean)
    )
  ).join(', ');

const StatusIcon = ({ status }: { status: Order['status'] }) => {
  switch (normalizeStatus(status)) {
    case 'pending': return <Clock size={16} className="text-gold" />;
    case 'confirmed': return <CheckCircle size={16} className="text-blue-500" />;
    case 'packed': return <Package size={16} className="text-indigo-500" />;
    case 'shipped': return <Truck size={16} className="text-purple-500" />;
    case 'delivered': return <CheckCircle size={16} className="text-green-500" />;
    case 'cancelled': return <XCircle size={16} className="text-red-500" />;
    default: return null;
  }
};

const OrderStepper = ({ status }: { status: Order['status'] }) => {
  const steps = [
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { id: 'packed', label: 'Packed', icon: Package },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  if (status === 'cancelled') {
    return (
      <div className="flex items-center space-x-4 p-6 bg-red-50 rounded-2xl border border-red-100">
        <XCircle size={24} className="text-red-500" />
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">Acquisition Cancelled</p>
          <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold">This order has been removed from our active archives.</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex(step => step.id === normalizeStatus(status));

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="relative py-12 px-4 min-w-[560px]">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-ink/5 -translate-y-1/2" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-gold -translate-y-1/2 transition-all duration-1000 ease-out"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />
        
        <div className="relative flex justify-between items-center">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isActive = index === currentStepIndex;

            return (
              <div key={step.id} className="flex flex-col items-center space-y-4">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 z-10",
                    isCompleted ? "bg-gold text-ink" : "bg-white border-2 border-ink/5 text-ink/20",
                    isActive && "ring-4 ring-gold/20 scale-110"
                  )}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                <div className="text-center space-y-1">
                  <p className={cn(
                    "text-[9px] uppercase tracking-[0.2em] font-bold transition-colors duration-500",
                    isCompleted ? "text-ink" : "text-ink/20"
                  )}>
                    {step.label}
                  </p>
                  {isActive && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[7px] uppercase tracking-widest font-bold text-gold animate-pulse"
                    >
                      Current Stage
                    </motion.p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const OrderHistory = () => {
  const { user, loading: authLoading } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!isTokenValid()) {
      navigate('/login');
      return;
    }

    const getUserKey = () => {
      if (user?.email || user?.uid) return String(user.email || user.uid || '').toLowerCase();
      try {
        const stored = JSON.parse(localStorage.getItem('userInfo') || 'null');
        return String(stored?.email || stored?.uid || '').toLowerCase();
      } catch {
        return '';
      }
    };

    const fetchOrders = async () => {
      const normalizeOrders = (raw: any[]) =>
        raw.map((o: any, idx: number) => ({
          ...o,
          id: String(o?._id || o?.id || `order-${Date.now()}-${idx}`),
          orderId: String(o?.orderId || o?._id || o?.id || `ORD${Date.now().toString().slice(-8)}`),
          items: normalizeOrderItems(Array.isArray(o?.items) ? o.items : o?.orderItems),
          total: Number.isFinite(Number(o?.total)) ? Number(o.total) : (Number.isFinite(Number(o?.totalPrice)) ? Number(o.totalPrice) : 0),
          status: normalizeStatus(o?.status || 'pending'),
          shippingAddress: {
            fullName: o?.shippingAddress?.fullName || '',
            email: o?.shippingAddress?.email || '',
            street: o?.shippingAddress?.street || o?.shippingAddress?.address || '',
            city: o?.shippingAddress?.city || '',
            state: o?.shippingAddress?.state || '',
            zipCode: o?.shippingAddress?.zipCode || o?.shippingAddress?.postalCode || '',
            country: o?.shippingAddress?.country || '',
          },
          createdAt: o?.createdAt || Date.now(),
          updatedAt: o?.updatedAt || o?.createdAt || Date.now(),
        }));

      try {
        const token = getStoredToken();
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
        const { data } = await api.get('/orders/myorders', config);
        const rawOrders = Array.isArray(data) ? data : (Array.isArray(data?.orders) ? data.orders : []);
        const localOrders = getLocalOrders();
        const userKey = getUserKey();
        const scopedLocalOrders = localOrders.filter((o: any) => {
          const orderUser = String(o?.userId || '').toLowerCase();
          const orderEmail = String(o?.shippingAddress?.email || '').toLowerCase();
          return !userKey || orderUser === userKey || orderEmail === userKey;
        });

        const merged = [...normalizeOrders(rawOrders), ...normalizeOrders(scopedLocalOrders)];
        const uniqueByRef = new Map<string, any>();
        merged.forEach((order) => {
          const key = String(order.orderId || order.id || '').toUpperCase();
          if (!key) return;
          const existing = uniqueByRef.get(key);
          if (!existing || Number(order.createdAt) >= Number(existing.createdAt)) {
            uniqueByRef.set(key, order);
          }
        });
        setOrders(Array.from(uniqueByRef.values()).sort((a, b) => Number(b.createdAt) - Number(a.createdAt)));
      } catch (error) {
        console.error("Error fetching orders:", error);
        try {
          const localOrders = getLocalOrders();
          const userKey = getUserKey();
          const filtered = Array.isArray(localOrders)
            ? localOrders.filter((o: any) => String(o?.userId || '').toLowerCase() === userKey)
            : [];
          const effectiveOrders = filtered.length > 0
            ? filtered
            : (Array.isArray(localOrders) ? localOrders : []);
          setOrders(normalizeOrders(effectiveOrders).sort((a, b) => Number(b.createdAt) - Number(a.createdAt)));
        } catch {
          setOrders([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="flex space-x-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ height: [8, 24, 8] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-1 bg-gold"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 md:px-12 bg-off-white min-h-screen">
      <div className="max-w-screen-xl mx-auto space-y-12">
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold">
            Your Archives
          </p>
          <h1 className="text-5xl font-serif italic tracking-tight">
            Acquisition <span className="text-gold">History</span>
          </h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-ink/5 p-20 text-center space-y-8">
            <div className="w-20 h-20 bg-gold/5 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag size={32} className="text-gold/40" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-serif italic">No acquisitions yet</h3>
              <p className="text-sm text-ink/60 max-w-xs mx-auto">
                Your horological journey is just beginning. Explore our collection to find your first masterpiece.
              </p>
            </div>
            <Link to="/shop">
              <Button variant="primary">Explore Collection</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="hidden md:grid grid-cols-5 px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-ink/40 border-b border-ink/5">
              <span>Order ID</span>
              <span>Date</span>
              <span>Items</span>
              <span>Total</span>
              <span>Status</span>
            </div>
            
            <div className="space-y-4">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-ink/5 p-6 md:px-8 md:py-6 group hover:border-gold/30 transition-all duration-500 cursor-pointer"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                    <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-widest font-bold text-ink/40 md:hidden">Order ID</p>
                      <p className="text-xs font-mono text-ink/60">#{(order.orderId || order.id).toUpperCase()}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-widest font-bold text-ink/40 md:hidden">Date</p>
                      <p className="text-xs font-serif italic">{formatDate(order.createdAt)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-widest font-bold text-ink/40 md:hidden">Items</p>
                      {order.items.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {order.items.map((item, idx) => (
                              <img 
                                key={idx}
                                src={item.image} 
                                alt={item.name}
                                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ))}
                          </div>
                          {getOrderColorsLabel(order) && (
                            <p className="text-[8px] uppercase tracking-widest text-ink/40 font-bold">Color: {getOrderColorsLabel(order)}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] uppercase tracking-widest text-ink/30 font-bold">No item details</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-widest font-bold text-ink/40 md:hidden">Total</p>
                      <p className="text-sm font-bold text-gold">{formatCurrency(order.total)}</p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end space-x-4">
                      <div className="flex items-center space-x-2 px-3 py-1 bg-ink/5 rounded-full">
                        <StatusIcon status={order.status} />
                        <span className="text-[9px] uppercase tracking-widest font-bold text-ink/60">
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                        {expandedOrder === order.id ? (
                          <ChevronUp size={16} className="text-gold" />
                        ) : (
                          <ChevronDown size={16} className="text-ink/20 group-hover:text-gold group-hover:translate-y-1 transition-all" />
                        )}
                    </div>
                  </div>

                    <AnimatePresence>
                      {expandedOrder === order.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-8 pt-8 border-t border-ink/5 space-y-12">
                            {/* Visual Progress Stepper */}
                            <div className="max-w-2xl mx-auto">
                              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-ink/40 text-center mb-4">Acquisition Journey</p>
                              <OrderStepper status={order.status} />
                            </div>

                            {/* Tracking Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                              <div className="space-y-8">
                                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Logistics Details</h4>
                                {order.tracking ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                      <p className="text-[8px] uppercase tracking-[0.3em] font-bold text-ink/30">Carrier</p>
                                      <p className="text-[10px] uppercase tracking-widest font-bold text-ink/80">{order.tracking.carrier}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[8px] uppercase tracking-[0.3em] font-bold text-ink/30">Tracking Number</p>
                                      <p className="text-[10px] font-mono font-bold text-gold">{order.tracking.trackingNumber}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[8px] uppercase tracking-[0.3em] font-bold text-ink/30">Estimated Delivery</p>
                                      <p className="text-[10px] font-serif italic font-bold text-ink/80">
                                        {order.tracking.estimatedDeliveryDate ? formatDate(order.tracking.estimatedDeliveryDate) : 'Pending Dispatch'}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-3 text-ink/20 p-6 bg-ink/[0.02] rounded-2xl border border-dashed border-ink/10">
                                    <Truck size={14} />
                                    <p className="text-[8px] uppercase tracking-[0.3em] font-bold italic">
                                      Tracking information will be available once your masterpiece has been dispatched.
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-8">
                                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Itemized Summary</h4>
                                <div className="space-y-4">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shadow-sm" referrerPolicy="no-referrer" />
                                        <div className="space-y-0.5">
                                          <p className="text-[10px] font-bold uppercase tracking-widest">{item.name}</p>
                                          <p className="text-[8px] text-ink/40 uppercase font-bold tracking-wider">Qty: {item.quantity}</p>
                                        </div>
                                      </div>
                                      <p className="text-xs font-serif italic">{formatCurrency(item.price)}</p>
                                    </div>
                                  ))}
                                  <div className="pt-4 border-t border-ink/5 flex justify-between items-center">
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Total Valuation</p>
                                    <p className="text-sm font-serif italic text-gold">{formatCurrency(order.total)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-center pt-4">
                              <Link to="/track-order" state={{ orderId: order.orderId || order.id }}>
                                <Button variant="outline" size="sm">
                                  Open Detailed Tracking
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
