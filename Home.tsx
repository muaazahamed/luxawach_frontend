import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, CreditCard, Truck } from 'lucide-react';
import { useCart } from '../CartContext';
import { useUser } from '../UserContext';
import { formatCurrency } from '../utils';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../api';
import { toast } from 'sonner';

export const Checkout = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useUser();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const orderData = {
        userId: user?.uid || user?.email || formData.email || 'guest',
        orderItems: cart,
        totalPrice: totalPrice,
        shippingAddress: formData
      };

      const { data } = await api.post('/orders', orderData);
      
      setIsProcessing(false);
      clearCart();
      navigate('/order-success', {
        state: {
          orderId: data.orderId || data._id,
          trackingToken: data.trackingToken || '',
        },
      });
    } catch (error) {
      console.error(error);
      try {
        const fallbackId = `ORD${Date.now().toString().slice(-8)}`;
        const existingOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');

        existingOrders.push({
          id: fallbackId,
          _id: fallbackId,
          orderId: fallbackId,
          userId: user?.uid || user?.email || formData.email || 'guest',
          items: cart.map((item) => ({
            product: item.productId,
            productId: item.productId,
            name: item.name,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            image: item.image || '',
          })),
          total: Number(totalPrice) || 0,
          shippingAddress: {
            fullName: formData.fullName,
            email: formData.email,
            address: formData.street,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            postalCode: formData.zipCode,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          status: 'pending',
          timeline: [{ status: 'pending', time: Date.now() }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        localStorage.setItem('mockOrders', JSON.stringify(existingOrders));
        setIsProcessing(false);
        clearCart();
        toast.success('Order placed (offline mode)');
        navigate('/order-success', { state: { orderId: fallbackId } });
      } catch {
        setIsProcessing(false);
        toast.error('Failed to place order');
      }
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 space-y-8 md:space-y-0">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold">
              Secure Checkout
            </p>
            <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight">
              Final <br />
              <span className="text-gold">Acquisition</span>
            </h1>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-3 gap-20">
          <div className="lg:col-span-2 space-y-16">
            {/* Shipping */}
            <section className="space-y-10">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center text-gold font-serif italic">1</div>
                <h3 className="text-2xl font-serif italic tracking-tight">Shipping Information</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <Input 
                  label="Full Name" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Johnathan Doe" 
                  required 
                />
                <Input 
                  label="Email Address" 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@heritage.com" 
                  required 
                />
                <div className="md:col-span-2">
                  <Input 
                    label="Street Address" 
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="123 Luxa Wach Way" 
                    required 
                  />
                </div>
                <Input 
                  label="City" 
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Geneva" 
                  required 
                />
                <Input 
                  label="State / Province" 
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="GE" 
                  required 
                />
                <Input 
                  label="Zip / Postal Code" 
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="1201" 
                  required 
                />
                <Input 
                  label="Country" 
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Switzerland" 
                  required 
                />
              </div>
            </section>

            {/* Payment */}
            <section className="space-y-10">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center text-gold font-serif italic">2</div>
                <h3 className="text-2xl font-serif italic tracking-tight">Payment Method</h3>
              </div>
              <div className="space-y-8">
                <div className="p-8 border border-gold bg-gold/5 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <CreditCard className="text-gold" />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold">Secure Bank Transfer</p>
                      <p className="text-[8px] uppercase tracking-widest text-ink/40">Preferred for high-value acquisitions</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 border-gold flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gold" />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Input label="Card Number" placeholder="•••• •••• •••• ••••" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Expiry" placeholder="MM/YY" />
                    <Input label="CVC" placeholder="•••" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-ink text-off-white p-10 space-y-10 sticky top-32">
              <h3 className="text-2xl font-serif italic tracking-tight">Acquisition Details</h3>
              
              <div className="space-y-6">
                {cart.map(item => (
                  <div key={item.cartKey || item.productId} className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest">{item.name}</p>
                      {item.variantName && (
                        <p className="text-[8px] uppercase tracking-widest text-off-white/50">Color: {item.variantName}</p>
                      )}
                      <p className="text-[8px] uppercase tracking-widest text-off-white/40">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-[10px] font-bold text-gold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-off-white/10 space-y-4">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                  <span>Total Investment</span>
                  <span className="text-2xl font-serif italic text-gold">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="secondary" 
                size="lg" 
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing Acquisition...' : 'Complete Acquisition'}
              </Button>

              <div className="space-y-6 pt-6">
                <div className="flex items-center space-x-3 text-[8px] uppercase tracking-widest text-off-white/40">
                  <ShieldCheck size={14} className="text-gold" />
                  <span>256-bit Encrypted Transaction</span>
                </div>
                <div className="flex items-center space-x-3 text-[8px] uppercase tracking-widest text-off-white/40">
                  <Truck size={14} className="text-gold" />
                  <span>Insured Global Courier Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
