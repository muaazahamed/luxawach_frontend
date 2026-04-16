import React, { useState } from 'react';
import api from '../api';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useSiteConfig } from '../SiteConfigContext';

export const Contact = () => {
  const { footer } = useSiteConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // MOCK POST FOR TESTING
      const newInquiry = {
        _id: Math.random().toString(36).substr(2, 9),
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        status: 'new',
        createdAt: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('mockInquiries') || '[]');
      localStorage.setItem('mockInquiries', JSON.stringify([newInquiry, ...existing]));
      
      toast.success('Your message has been received. (Testing Mode)');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 md:px-12 bg-[#FBFBFB] min-h-screen">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center space-y-4 mb-20">
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold">
            Get in Touch
          </p>
          <h1 className="text-4xl md:text-5xl font-serif italic tracking-tight">
            Contact <span className="text-gold">Us</span>
          </h1>
          <p className="text-ink/60 max-w-xl mx-auto leading-relaxed mt-4 text-sm font-medium">
            Whether you have a question about a timepiece, need assistance with your order, or want to explore our bespoke services, our concierges are at your service.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
          {/* Contact Form */}
          <div className="bg-white p-10 md:p-14 border border-ink/5 shadow-sm rounded-sm">
            <h2 className="text-2xl font-serif italic mb-8">Send an Inquiry</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <Input
                label="Subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Product Inquiry"
              />
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">
                  Message
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-4 bg-ink/[0.02] border border-transparent rounded-sm text-sm focus:border-gold focus:ring-1 focus:ring-gold transition-all min-h-[160px] resize-none"
                  placeholder="How can we help you today?"
                />
              </div>
              <Button type="submit" className="w-full py-4 text-sm" disabled={isSubmitting}>
                {isSubmitting ? 'Sending Message...' : 'Send Message'}
              </Button>
            </form>
          </div>

          {/* Contact Details */}
          <div className="space-y-12">
            <div className="bg-white p-10 border border-ink/5 shadow-sm rounded-sm space-y-8">
              <h2 className="text-2xl font-serif italic">Contact Details</h2>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-6 group">
                  <div className="w-12 h-12 rounded-full bg-ink/[0.03] flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                    <MapPin size={20} className="text-ink/60 group-hover:text-gold transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-ink/40 mb-2">Visit Boutique</h3>
                    <p className="text-sm font-medium leading-relaxed max-w-[200px]">{footer.address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-6 group">
                  <div className="w-12 h-12 rounded-full bg-ink/[0.03] flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                    <Phone size={20} className="text-ink/60 group-hover:text-gold transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-ink/40 mb-2">Call Us</h3>
                    <p className="text-sm font-medium leading-relaxed">{footer.phone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-6 group">
                  <div className="w-12 h-12 rounded-full bg-ink/[0.03] flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                    <Mail size={20} className="text-ink/60 group-hover:text-gold transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-ink/40 mb-2">Email Us</h3>
                    <p className="text-sm font-medium leading-relaxed">{footer.email}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-ink p-10 shadow-sm rounded-sm text-white">
               <h2 className="text-2xl font-serif italic mb-6">Business Hours</h2>
               <div className="space-y-4 text-sm text-white/75">
                 <div className="flex justify-between border-b border-white/10 pb-4">
                   <span>Monday - Friday</span>
                   <span className="font-bold text-white">10:00 AM - 7:00 PM</span>
                 </div>
                 <div className="flex justify-between border-b border-white/10 pb-4">
                   <span>Saturday</span>
                   <span className="font-bold text-white">11:00 AM - 6:00 PM</span>
                 </div>
                 <div className="flex justify-between pb-2">
                   <span>Sunday</span>
                   <span className="font-bold text-gold">Closed (By Appointment Only)</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
