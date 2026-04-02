import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import api from '../api';
import { Product } from '../types';

import { useSiteConfig } from '../SiteConfigContext';

export const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { home } = useSiteConfig();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get('/products?featured=true&limit=4');
        setFeaturedProducts(data.map((p: any) => ({ ...p, id: p._id || p.id })));
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <div className="pt-24 md:pt-20 font-manrope">
      {/* Hero Section */}
      <section className="relative min-h-[92svh] md:h-[90vh] flex items-start md:items-center pt-12 md:pt-0 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=2000"
            alt="Hero Watch"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-off-white via-off-white/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-screen-2xl mx-auto w-full grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div className="space-y-8 md:space-y-10">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold">
                Est. 1892 · Geneva
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-8xl font-serif italic tracking-tighter leading-[0.92] text-ink">
                The Art of <br />
                <span className="text-gold">Eternal</span> Time
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-sm md:text-base text-ink/60 max-w-md leading-relaxed"
            >
              Discover our curated collection of masterfully engineered timepieces, where heritage meets the pinnacle of modern horology.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="flex flex-wrap items-center gap-4 md:gap-6"
            >
              <Link to="/shop">
                <Button variant="primary" size="lg">
                  {home.heroButtonText}
                </Button>
              </Link>
              <button className="flex items-center space-x-3 group">
                <div className="w-12 h-12 rounded-full border border-ink/10 flex items-center justify-center group-hover:border-gold transition-colors">
                  <Play size={16} className="text-ink group-hover:text-gold transition-colors ml-1" />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold">{home.heritageButtonText}</span>
              </button>
            </motion.div>
          </div>

          <div className="hidden md:block relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 aspect-square w-full max-w-md mx-auto"
            >
              <img
                src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1000"
                alt="Featured Watch"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.2)]"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gold/5 rounded-full blur-[100px] -z-10" />
          </div>
        </div>
      </section>

      {/* Collections Directory */}
      <section className="py-20 px-6 md:px-12 bg-[#FBFBFB]">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-4 mb-16">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Explore</p>
            <h2 className="text-3xl md:text-4xl font-serif italic tracking-tight">Shop by Category</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/shop?category=men">
              <button className="px-8 py-4 border border-ink/10 rounded-full hover:border-ink hover:bg-ink hover:text-white transition-all text-xs uppercase tracking-widest font-bold">
                Men
              </button>
            </Link>
            <Link to="/shop?category=women">
              <button className="px-8 py-4 border border-ink/10 rounded-full hover:border-ink hover:bg-ink hover:text-white transition-all text-xs uppercase tracking-widest font-bold">
                Women
              </button>
            </Link>
            <Link to="/shop?category=sport">
              <button className="px-8 py-4 border border-ink/10 rounded-full hover:border-ink hover:bg-ink hover:text-white transition-all text-xs uppercase tracking-widest font-bold">
                Sport
              </button>
            </Link>
            <Link to="/shop?collection=premium">
              <button className="px-8 py-4 border border-gold text-gold rounded-full hover:bg-gold hover:text-white transition-all text-xs uppercase tracking-widest font-bold">
                Premium
              </button>
            </Link>
            <Link to="/shop?collection=hot-sellers">
              <button className="px-8 py-4 bg-ink/5 border border-transparent rounded-full hover:bg-ink hover:text-white transition-all text-xs uppercase tracking-widest font-bold">
                Hot Sellers
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Collection */}

      <section className="py-32 px-6 md:px-12 bg-white">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 space-y-8 md:space-y-0">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">
                Curated Selection
              </p>
              <h2 className="text-4xl md:text-5xl font-serif italic tracking-tight">
                The Masterpiece <br /> Collection
              </h2>
            </div>
            <Link to="/shop" className="flex items-center space-x-2 text-ink/60 hover:text-ink transition-colors group">
              <span className="text-[10px] uppercase tracking-widest font-bold">{home.collectionsButtonText}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-ink/5 animate-pulse rounded-2xl" />
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4">
                <p className="text-xl font-serif italic text-ink/40">No featured timepieces at the moment.</p>
                <Link to="/shop">
                  <Button variant="outline">Explore Full Collection</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bespoke Section */}
      <section className="py-32 px-6 md:px-12 bg-ink text-off-white overflow-hidden">
        <div className="max-w-screen-2xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="aspect-[4/5] overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1508685096489-7aac291ba597?auto=format&fit=crop&q=80&w=1000"
                alt="Bespoke Craftsmanship"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gold/10 blur-[80px]" />
          </div>

          <div className="space-y-12">
            <div className="space-y-6">
              <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold">
                Bespoke Services
              </p>
              <h2 className="text-5xl md:text-6xl font-serif italic tracking-tight leading-tight">
                Crafting Your <br />
                <span className="text-gold">Legacy</span>
              </h2>
              <p className="text-off-white/60 leading-relaxed max-w-md">
                Our master watchmakers offer unparalleled customization services, allowing you to create a timepiece that is truly unique to your story.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <h4 className="text-gold font-serif italic text-2xl">01</h4>
                <p className="text-[10px] uppercase tracking-widest font-bold">Material Selection</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-gold font-serif italic text-2xl">02</h4>
                <p className="text-[10px] uppercase tracking-widest font-bold">Movement Tuning</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-gold font-serif italic text-2xl">03</h4>
                <p className="text-[10px] uppercase tracking-widest font-bold">Dial Artistry</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-gold font-serif italic text-2xl">04</h4>
                <p className="text-[10px] uppercase tracking-widest font-bold">Engraving</p>
              </div>
            </div>

            <Link to="/bespoke">
              <Button variant="secondary" size="lg">
                {home.bespokeButtonText}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
