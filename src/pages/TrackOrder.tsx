import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Truck, Package, CheckCircle, Clock, XCircle, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../api';
import { Order } from '../types';
import { formatCurrency, formatDate, cn } from '../utils';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Link, useLocation } from 'react-router-dom';

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

const ORDER_STEPS: Array<'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered'> = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'delivered',
];

const StatusIcon = ({ status }: { status: Order['status'] }) => {
  switch (normalizeStatus(status)) {
    case 'pending': return <Clock size={24} className="text-gold" />;
    case 'confirmed': return <CheckCircle size={24} className="text-blue-500" />;
    case 'packed': return <Package size={24} className="text-indigo-500" />;
    case 'shipped': return <Truck size={24} className="text-purple-500" />;
    case 'delivered': return <CheckCircle size={24} className="text-green-500" />;
    case 'cancelled': return <XCircle size={24} className="text-red-500" />;
    default: return null;
  }
};

const OrderStepper = ({ currentStatus, timeline }: { currentStatus: Order['status']; timeline?: Order['timeline'] }) => {
  const steps = [
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { id: 'packed', label: 'Packed', icon: Package },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  if (currentStatus === 'cancelled') {
    return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-[2rem] flex items-center justify-center space-x-6 text-red-600 max-w-3xl mx-auto">
        <XCircle size={32} strokeWidth={1.5} />
        <div className="space-y-1">
          <p className="text-sm font-bold uppercase tracking-widest">Acquisition Cancelled</p>
          <p className="text-[10px] uppercase tracking-widest opacity-60">This order has been voided and will not be fulfilled.</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex(s => s.id === normalizeStatus(currentStatus));
  const completedSteps = ORDER_STEPS.map((step) => {
    const isDone = Array.isArray(timeline)
      ? timeline.some((t) => normalizeStatus(t.status as Order['status']) === step)
      : steps.findIndex((s) => s.id === step) <= currentStepIndex;
    return { step, completed: isDone };
  });

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="relative flex justify-between items-start w-full min-w-[560px] max-w-3xl mx-auto px-4 py-8">
        {/* Background Line */}
        <div className="absolute top-14 left-0 w-full h-0.5 bg-ink/5 -z-10" />
        
        {/* Progress Line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
          className="absolute top-14 left-0 h-0.5 bg-gold -z-10"
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.find((s) => s.step === step.id)?.completed || false;
          const isCurrent = index === currentStepIndex;
          const isFuture = !isCompleted && index > currentStepIndex;

          return (
            <div key={step.id} className="flex flex-col items-center space-y-6 relative">
              <motion.div 
                initial={false}
                animate={{
                  backgroundColor: isCompleted ? '#D4AF37' : isCurrent ? '#FFFFFF' : '#FFFFFF',
                  borderColor: isCompleted || isCurrent ? '#D4AF37' : 'rgba(0,0,0,0.05)',
                  scale: isCurrent ? 1.1 : 1,
                }}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-2 z-10",
                  isCompleted ? "text-white" : isCurrent ? "text-gold shadow-xl shadow-gold/20" : "text-ink/10"
                )}
              >
                <Icon size={20} strokeWidth={isCurrent ? 2 : 1.5} />
              </motion.div>
              <div className="text-center space-y-2">
                <p className={cn(
                  "text-[9px] uppercase tracking-[0.2em] font-bold transition-colors duration-500",
                  isFuture ? "text-ink/20" : "text-ink"
                )}>
                  {step.label}
                </p>
                {isCurrent && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-1 h-1 bg-gold rounded-full mb-1" />
                    <p className="text-[7px] uppercase tracking-[0.3em] font-black text-gold">Current</p>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TrackOrder = () => {
  const location = useLocation();
  const [orderId, setOrderId] = useState('');
  const [trackingToken, setTrackingToken] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prefilledId = location.state?.orderId;
    if (typeof prefilledId === 'string' && prefilledId.trim()) {
      setOrderId(prefilledId.trim().toUpperCase());
    }
    const prefilledTrackingToken = location.state?.trackingToken;
    if (typeof prefilledTrackingToken === 'string' && prefilledTrackingToken.trim()) {
      setTrackingToken(prefilledTrackingToken.trim());
    }
  }, [location.state]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    const cleaned = orderId.trim().toUpperCase().replace(/^#/, '').replace(/\s+/g, '');
    const lookupId = /^\d{5,}$/.test(cleaned) ? `ORD${cleaned}` : cleaned;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const params = trackingToken.trim() ? { trackingToken: trackingToken.trim() } : undefined;
      const { data } = await api.get(`/orders/${lookupId}`, { params });
      if (data) {
        const resolved = Array.isArray(data)
          ? data.find((o: any) =>
              [String(o?.orderId || '').toUpperCase(), String(o?.id || '').toUpperCase(), String(o?._id || '').toUpperCase()]
                .includes(lookupId)
            )
          : data;

        if (!resolved) {
          setError("We couldn't find an acquisition with that reference ID. Please verify the ID and try again.");
          return;
        }

        setOrder({ ...resolved, id: resolved._id || resolved.id } as Order);
      } else {
        setError("We couldn't find an acquisition with that reference ID. Please verify the ID and try again.");
      }
    } catch (err) {
      console.error(err);
      const status = (err as any)?.response?.status;
      if (status === 404) {
        setError("We couldn't find an acquisition with that reference ID. Please verify the ID and try again.");
      } else {
        setError("An error occurred while retrieving your acquisition details. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 md:px-12 bg-off-white min-h-screen">
      <div className="max-w-screen-xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold">
            Real-Time Logistics
          </p>
          <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight">
            Track Your <span className="text-gold">Acquisition</span>
          </h1>
          <p className="text-sm text-ink/40 max-w-lg mx-auto uppercase tracking-widest leading-relaxed">
            Enter your unique acquisition reference ID to monitor the journey of your timepiece.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
              <input 
                type="text"
                placeholder="Enter Order ID (e.g. ORD12345)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-white border border-ink/5 rounded-2xl text-sm focus:ring-1 focus:ring-gold transition-all placeholder:text-ink/20 shadow-sm"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="md:w-48 h-[60px]">
              {loading ? 'Locating...' : 'Track Now'}
            </Button>
          </form>
          <div className="mt-4">
            <Input
              label="Tracking Key (for guest orders)"
              value={trackingToken}
              onChange={(e) => setTrackingToken(e.target.value)}
              placeholder="Paste tracking key"
              autoComplete="off"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-4 text-red-600"
            >
              <AlertCircle size={20} className="flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
            </motion.div>
          )}

          {order && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto bg-white border border-ink/5 rounded-[2.5rem] shadow-xl overflow-hidden"
            >
              <div className="p-10 md:p-16 space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-ink/5 pb-12">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Reference ID</p>
                    <p className="text-xl font-mono font-bold text-ink">#{(order.orderId || order.id).toUpperCase()}</p>
                  </div>
                  <div className="flex items-center space-x-4 bg-ink/[0.02] px-6 py-3 rounded-full">
                    <StatusIcon status={order.status} />
                    <span className="text-xs uppercase tracking-[0.2em] font-bold text-ink">
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="py-8 border-b border-ink/5">
                  <OrderStepper currentStatus={order.status} timeline={order.timeline} />
                </div>

                <div className="grid md:grid-cols-2 gap-16">
                  <div className="space-y-8">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Logistics Details</h3>
                    {order.tracking ? (
                      <div className="space-y-8">
                        <div className="flex items-start space-x-6">
                          <div className="w-12 h-12 bg-gold/5 rounded-2xl flex items-center justify-center text-gold">
                            <Truck size={20} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] uppercase tracking-widest font-bold text-ink/30">Carrier</p>
                            <p className="text-sm font-bold">{order.tracking.carrier}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-6">
                          <div className="w-12 h-12 bg-gold/5 rounded-2xl flex items-center justify-center text-gold">
                            <Search size={20} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] uppercase tracking-widest font-bold text-ink/30">Tracking Number</p>
                            <p className="text-sm font-mono font-bold text-gold">{order.tracking.trackingNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-6">
                          <div className="w-12 h-12 bg-gold/5 rounded-2xl flex items-center justify-center text-gold">
                            <Clock size={20} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] uppercase tracking-widest font-bold text-ink/30">Estimated Delivery</p>
                            <p className="text-sm font-serif italic font-bold">
                              {order.tracking.estimatedDeliveryDate ? formatDate(order.tracking.estimatedDeliveryDate) : 'Pending Dispatch'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 bg-ink/[0.02] rounded-2xl border border-dashed border-ink/10 text-center space-y-4">
                        <Truck size={32} className="mx-auto text-ink/10" strokeWidth={1} />
                        <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40 leading-relaxed">
                          Your timepiece is being prepared for dispatch. Tracking details will appear here shortly.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Acquisition Summary</h3>
                    <div className="space-y-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-ink/5 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{item.name}</p>
                            <p className="text-[10px] text-ink/40 uppercase font-bold tracking-wider">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-xs font-serif italic">{formatCurrency(item.price)}</p>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-ink/5 flex justify-between items-center">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Total Valuation</p>
                        <p className="text-xl font-serif italic text-gold">{formatCurrency(order.total)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center">
          <Link to="/shop">
            <Button variant="outline" size="sm" className="group">
              Continue Exploring
              <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
