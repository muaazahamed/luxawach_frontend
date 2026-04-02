import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency, cn } from '../utils';
import { useUser } from '../UserContext';
import { useCart } from '../CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  index: number;
}

// Builds a srcSet for Unsplash images (or returns undefined for non-Unsplash URLs)
const buildSrcSet = (src: string): string | undefined => {
  if (!src || !src.includes('unsplash.com')) return undefined;
  // Strip existing w= param then add our sizes
  const base = src.replace(/[&?]w=\d+/, '');
  const sep = base.includes('?') ? '&' : '?';
  return [
    `${base}${sep}w=400 400w`,
    `${base}${sep}w=600 600w`,
    `${base}${sep}w=800 800w`,
  ].join(', ');
};

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, index }) => {
  const { user, toggleWishlist } = useUser();
  const { addToCart } = useCart();
  const isInWishlist = user?.wishlist?.includes(product.id);

  const handleWishlistClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  }, [toggleWishlist, product.id]);

  const handleQuickAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart`);
  }, [addToCart, product]);

  const imgSrc = product.images[0];
  const imgSrcSet = buildSrcSet(imgSrc);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      className="group cursor-pointer relative"
    >
      {/* Wishlist */}
      <button
        onClick={handleWishlistClick}
        className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white text-ink/50 hover:text-red-500 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-sm"
      >
        <Heart size={16} className={isInWishlist ? "fill-red-500 text-red-500" : ""} />
      </button>

      <Link to={`/product/${product.id}`} className="block relative">
        {/* Image */}
        <div className="relative overflow-hidden bg-[#f6f6f6] mb-3">
          <div className="aspect-square">
            <img
              src={imgSrc}
              srcSet={imgSrcSet}
              alt={product.name}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {product.stock <= 0 && (
              <span className="bg-ink text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                Sold out
              </span>
            )}
            {product.stock > 0 && (
              <span className="bg-[#e63946] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                Sale
              </span>
            )}
          </div>

          {/* Quick add */}
          {product.stock > 0 && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
              <button
                onClick={handleQuickAdd}
                className="w-full bg-ink text-white text-[11px] font-bold uppercase tracking-widest py-3 flex items-center justify-center gap-2 hover:bg-ink/80 transition-colors"
              >
                <ShoppingBag size={14} />
                Quick Add
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1 px-0.5">
          <p className="text-[11px] uppercase tracking-widest text-ink/40 font-medium">{product.brand || 'LUXA WACH'}</p>
          <h3 className="text-sm font-medium text-ink group-hover:text-ink/70 transition-colors leading-tight">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 pt-0.5">
            <p className="text-sm text-ink font-semibold">
              Rs {formatCurrency(product.price)}
            </p>
            <p className="text-xs text-ink/40 line-through">
              Rs {formatCurrency(product.price * 1.25)}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
