import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../api';
import { toast } from 'sonner';

export const Bespoke = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    vision: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/inquiries', {
        name: formData.name,
        email: formData.email,
        subject: 'Bespoke Consultation Request',
        message: formData.vision
      });
      setIsSubmitted(true);
      toast.success('Vision received successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit vision request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="pt-48 pb-20 px-6 md:px-12 text-center space-y-8">
        <h2 className="text-5xl font-serif italic tracking-tight">Vision Received</h2>
        <p className="text-ink/60 max-w-md mx-auto uppercase tracking-widest text-[10px] font-bold">
          Our master watchmakers are reviewing your inquiry. A dedicated consultant will reach out to schedule your private session.
        </p>
        <Button variant="outline" onClick={() => setIsSubmitted(false)}>Submit Another Vision</Button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-screen-2xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold">
                Bespoke Services
              </p>
              <h1 className="text-6xl md:text-7xl font-serif italic tracking-tight leading-tight">
                Your Vision, <br />
                <span className="text-gold">Our Mastery</span>
              </h1>
              <p className="text-ink/60 leading-relaxed max-w-md">
                Enter a world where time is personal. Our bespoke services allow you to collaborate with our master watchmakers to create a timepiece that reflects your unique legacy.
              </p>
            </div>

            <div className="space-y-10">
              {[
                { title: 'Case Customization', desc: 'Choose from rare alloys, precious metals, or advanced ceramics.' },
                { title: 'Dial Artistry', desc: 'Hand-painted, guilloché, or skeletonized dials tailored to your taste.' },
                { title: 'Movement Personalization', desc: 'Custom engravings and hand-finished complications.' },
              ].map((service, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex space-x-6"
                >
                  <span className="text-gold font-serif italic text-2xl">0{i + 1}</span>
                  <div className="space-y-1">
                    <h4 className="text-sm uppercase tracking-widest font-bold">{service.title}</h4>
                    <p className="text-xs text-ink/40">{service.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-ink/5 p-10 border border-ink/5">
              <h3 className="text-2xl font-serif italic tracking-tight">Request a Consultation</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <Input 
                  label="Full Name" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
                <Input 
                  label="Email Address" 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required 
                />
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Your Vision</label>
                  <textarea 
                    className="w-full bg-white border-none p-4 text-sm focus:ring-1 focus:ring-gold outline-none min-h-[120px]"
                    placeholder="Describe the masterpiece you envision..."
                    value={formData.vision}
                    onChange={e => setFormData({...formData, vision: e.target.value})}
                    required
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting Vision...' : 'Initiate Consultation'}
              </Button>
            </form>
          </div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5 }}
              className="aspect-[4/5] overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1000"
                alt="Bespoke Watchmaking"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-gold/5 blur-[80px] -z-10" />
          </div>
        </div>
      </div>
    </div>
  );
};
