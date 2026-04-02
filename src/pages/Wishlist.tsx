import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../UserContext';
import { useCart } from '../CartContext';
import api from '../api';
import { Product } from '../types';
import { formatCurrency, cn } from '../utils';
import { Button } from '../components/Button';
import { toast } from 'sonner';

export const Wishlist = () => {
  const { user, toggleWishlist } = useUser();
  const { addToCart } = useCart();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (!user?.wishlist || user.wishlist.length === 0) {
        setWishlistProducts([]);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/products');
        const wishlistIds = new Set(user.wishlist);
        const products = data
          .filter((p: any) => wishlistIds.has(p._id))
          .map((p: any) => ({ ...p, id: p._id || p.id }));
        setWishlistProducts(products);
      } catch (error) {
        console.error("Error fetching wishlist products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [user?.wishlist]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 md:px-12 min-h-screen bg-off-white">
      <div className="max-w-screen-2xl mx-auto space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold">
              Your Curated Selection
            </p>
            <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight">
              The <br />
              <span className="text-gold">Wishlist</span>
            </h1>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {wishlistProducts.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {wishlistProducts.map((product) => (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group bg-white border border-ink/5 rounded-[2rem] overflow-hidden flex flex-col"
                >
                  <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden block">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </Link>

                  <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40">{product.brand}</p>
                        <button 
                          onClick={() => toggleWishlist(product.id)}
                          className="text-gold hover:text-red-500 transition-colors"
                        >
                          <Heart size={18} fill="currentColor" />
                        </button>
                      </div>
                      <h3 className="text-xl font-serif italic tracking-tight group-hover:text-gold transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-lg font-serif italic text-gold">{formatCurrency(product.price)}</p>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="flex-1 text-[10px]"
                        onClick={() => {
                          addToCart(product);
                          toast.success(`${product.name} added to cart`);
                        }}
                      >
                        <ShoppingBag size={14} className="mr-2" />
                        Add to Cart
                      </Button>
                      <Link to={`/product/${product.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-[10px]">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center space-y-8"
            >
              <div className="w-24 h-24 bg-gold/5 rounded-full flex items-center justify-center mx-auto text-gold/20">
                <Heart size={48} strokeWidth={1} />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-serif italic">Your wishlist is empty</h2>
                <p className="text-sm text-ink/40 max-w-md mx-auto uppercase tracking-widest leading-relaxed">
                  Explore our collection and curate your personal selection of the world's finest timepieces.
                </p>
              </div>
              <Link to="/collection">
                <Button variant="primary" size="lg">
                  Explore Collection
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
