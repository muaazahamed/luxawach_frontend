import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Truck, Package, CheckCircle, Loader2, Phone, MapPin, Mail, User } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency, cn } from '../utils';
import api from '../api';
import { toast } from 'sonner';
import { useUser } from '../UserContext';

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  quantity: number;
  selectedColorIdx?: number;
}

export const BuyNowModal: React.FC<BuyNowModalProps> = ({
  isOpen,
  onClose,
  product,
  quantity,
  selectedColorIdx = 0
}) => {
  const { user } = useUser();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [trackingToken, setTrackingToken] = useState('');
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(selectedColorIdx);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const totalPrice = product.price * quantity;

  const hasVariants = product.colorVariants && product.colorVariants.length > 0;
  const activeVariant = hasVariants ? product.colorVariants![selectedVariantIdx] : null;
  const productImage = activeVariant?.images?.[0] || product.images[0];

  useEffect(() => {
    if (isOpen) {
      setSelectedVariantIdx(selectedColorIdx);
    }
  }, [isOpen, selectedColorIdx]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderPayload = {
        userId: user?.uid || user?.email || formData.email || 'guest',
        orderItems: [{
          productId: product.id,
          product: product.id,
          name: product.name + (activeVariant ? ` (${activeVariant.colorName})` : ''),
          quantity,
          price: product.price,
          image: productImage
        }],
        shippingAddress: {
          fullName: formData.fullName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          phone: formData.phone
        },
        totalPrice
      };

      const { data } = await api.post('/orders', orderPayload);
      setOrderId(data.orderId || data._id || 'BN-' + Date.now());
      setTrackingToken(String(data.trackingToken || ''));
      setStep('success');
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error(error);
      // Offline fallback
      const fallbackId = `ORD${Date.now().toString().slice(-8)}`;
      try {
        const existingOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
        existingOrders.push({
          id: fallbackId,
          _id: fallbackId,
          orderId: fallbackId,
          userId: user?.uid || user?.email || formData.email || 'guest',
          items: [{
            product: product.id,
            name: product.name + (activeVariant ? ` (${activeVariant.colorName})` : ''),
            quantity,
            price: product.price,
            image: productImage
          }],
          total: totalPrice,
          shippingAddress: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode
          },
          status: 'pending',
          timeline: [{ status: 'pending', time: Date.now() }],
          createdAt: Date.now()
        });
        localStorage.setItem('mockOrders', JSON.stringify(existingOrders));
        setOrderId(fallbackId);
        setStep('success');
        toast.success('Order placed (offline mode)');
      } catch {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setSelectedVariantIdx(selectedColorIdx);
    setFormData({ fullName: '', email: '', phone: '', address: '', city: '', postalCode: '' });
    setOrderId('');
    setTrackingToken('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none"
          >
            <div className="bg-white w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl pointer-events-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-ink/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Quick Checkout</p>
                    <h2 className="text-xl font-serif italic mt-0.5">Buy It Now</h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center hover:bg-ink/10 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step === 'form' && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Product Summary */}
                    <div className="px-6 py-5 bg-[#fafafa] border-b border-ink/5">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-ink/5 flex-shrink-0">
                          <img
                            src={productImage}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40">{product.brand || 'LUXA WACH'}</p>
                          <h3 className="font-bold text-sm truncate">{product.name}</h3>
                          {activeVariant && (
                            <p className="text-[10px] text-ink/50 mt-0.5">Color: {activeVariant.colorName}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-semibold">Rs {formatCurrency(product.price)}</span>
                            <span className="text-xs text-ink/40 line-through">Rs {formatCurrency(product.price * 1.25)}</span>
                            <span className="text-[9px] bg-[#e63946] text-white font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">Sale</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Total */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-ink/10">
                        <span className="text-xs text-ink/50">Qty: <strong className="text-ink">{quantity}</strong></span>
                        <div className="text-right">
                          <p className="text-[9px] uppercase tracking-widest text-ink/40 font-bold">Total</p>
                          <p className="text-lg font-bold text-ink">Rs {formatCurrency(totalPrice)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40 mb-2">Delivery Information</p>

                      {hasVariants && (
                        <select
                          value={selectedVariantIdx}
                          onChange={(e) => setSelectedVariantIdx(Number(e.target.value))}
                          className="w-full px-4 py-3.5 bg-ink/[0.03] border border-ink/10 rounded-xl text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                        >
                          {product.colorVariants!.map((variant, idx) => (
                            <option key={`${variant.colorName}-${idx}`} value={idx}>
                              Color: {variant.colorName}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Full Name"
                          required
                          className="w-full pl-12 pr-4 py-3.5 bg-ink/[0.03] border border-ink/10 rounded-xl text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all placeholder:text-ink/30"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email"
                            required
                            className="w-full pl-12 pr-4 py-3.5 bg-ink/[0.03] border border-ink/10 rounded-xl text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all placeholder:text-ink/30"
                          />
                        </div>
                        <div className="relative">
                          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Phone Number"
                            required
                            className="w-full pl-12 pr-4 py-3.5 bg-ink/[0.03] border border-ink/10 rounded-xl text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all placeholder:text-ink/30"
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Full Address"
                          required
                          className="w-full pl-12 pr-4 py-3.5 bg-ink/[0.03] border border-ink/10 rounded-xl text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all placeholder:text-ink/30"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="City"
                          required
                          className="w-full px-4 py-3.5 bg-ink/[0.03] border border-ink/10 rounded-xl text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all placeholder:text-ink/30"
                        />
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                          placeholder="Postal Code"
                          required
                          className="w-full px-4 py-3.5 bg-ink/[0.03] border border-ink/10 rounded-xl text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all placeholder:text-ink/30"
                        />
                      </div>

                      {/* Trust Badges */}
                      <div className="flex items-center justify-center gap-6 py-3 border-y border-ink/5 my-2">
                        {[
                          { icon: ShieldCheck, text: 'Secure' },
                          { icon: Truck, text: 'Free COD' },
                          { icon: Package, text: 'Nationwide' },
                        ].map(({ icon: Icon, text }) => (
                          <div key={text} className="flex items-center gap-1.5 text-ink/40">
                            <Icon size={14} strokeWidth={1.5} />
                            <span className="text-[9px] uppercase tracking-wider font-bold">{text}</span>
                          </div>
                        ))}
                      </div>

                      {/* Submit Button */}
                      {trackingToken && (
                        <p className="text-[10px] text-ink/45 font-mono break-all">
                          Tracking Key: {trackingToken}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                          "w-full h-14 bg-ink text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all relative overflow-hidden",
                          isSubmitting
                            ? "opacity-80 cursor-wait"
                            : "hover:bg-ink/90 hover:shadow-lg hover:shadow-ink/20 active:scale-[0.98]"
                        )}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            Placing Order...
                          </span>
                        ) : (
                          <span>Confirm Order • Rs {formatCurrency(totalPrice)}</span>
                        )}
                      </button>

                      <p className="text-[9px] text-center text-ink/30 leading-relaxed">
                        Cash on Delivery • Admin will confirm your order shortly
                      </p>
                    </form>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="px-6 py-12 text-center space-y-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
                      className="w-20 h-20 mx-auto bg-emerald-50 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle size={40} className="text-emerald-500" />
                    </motion.div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-serif italic">Order Received!</h3>
                      <p className="text-sm text-ink/50">
                        Your order has been placed successfully. Our team will confirm it shortly.
                      </p>
                    </div>

                    <div className="bg-[#fafafa] rounded-xl p-5 space-y-3 text-left">
                      <div className="flex justify-between text-xs">
                        <span className="text-ink/40 uppercase tracking-wider font-bold">Order ID</span>
                        <span className="font-bold font-mono text-ink">#{orderId.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-ink/40 uppercase tracking-wider font-bold">Product</span>
                        <span className="font-bold text-ink">{product.name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-ink/40 uppercase tracking-wider font-bold">Total</span>
                        <span className="font-bold text-ink">Rs {formatCurrency(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-ink/40 uppercase tracking-wider font-bold">Status</span>
                        <span className="bg-amber-50 text-amber-600 font-bold uppercase tracking-wider text-[10px] px-3 py-1 rounded-full">
                          Awaiting Confirmation
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-ink/40">
                        📱 You'll receive a confirmation call/message soon
                      </p>
                      <button
                        onClick={handleClose}
                        className="w-full h-12 bg-ink text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-ink/90 transition-all"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
