import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { Product, CustomerReview } from '../types';
import { motion } from 'motion/react';
import { Minus, Plus, Shield, Truck, RotateCcw, Star, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, cn } from '../utils';
import { useCart } from '../CartContext';
import { toast } from 'sonner';
import { BuyNowModal } from '../components/BuyNowModal';

const hasSpamPattern = (value: string) => /(https?:\/\/|www\.)/i.test(value) || /(.)\1{7,}/i.test(value);

export const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    rating: 5,
    review: '',
  });

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const local = localStorage.getItem('mockProducts');
        if (local) {
          const all = JSON.parse(local);
          const found = all.find((p: any) => p._id === id || p.id === id);
          if (found) { setProduct({ ...found, id: found._id || found.id }); setLoading(false); return; }
        }
        const { data } = await api.get(`/products/${id}`);
        setProduct({ ...data, id: data._id || data.id });
      } catch (error) {
        console.error(error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get('/reviews?limit=20');
      const incoming = Array.isArray(data) ? data : [];
      const normalized: CustomerReview[] = incoming.map((r: any, idx: number) => ({
        id: String(r?._id || r?.id || `review-${Date.now()}-${idx}`),
        name: String(r?.name || 'Anonymous'),
        rating: Number(r?.rating) || 5,
        review: String(r?.review || r?.comment || ''),
        createdAt: Number(new Date(r?.createdAt || Date.now())),
      }));
      setReviews(
        normalized
          .filter((r) => r.review.trim().length > 0 && r.rating >= 1 && r.rating <= 5)
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 20)
      );
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // auto-rotate testimonials
  useEffect(() => {
    if (reviews.length <= 1) return;
    const t = setInterval(() => setTestimonialIdx((i) => (i + 1) % reviews.length), 4000);
    return () => clearInterval(t);
  }, [reviews.length]);

  useEffect(() => {
    if (testimonialIdx > Math.max(reviews.length - 1, 0)) {
      setTestimonialIdx(0);
    }
  }, [testimonialIdx, reviews.length]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-white">
        <h2 className="text-2xl font-serif italic">Timepiece not found</h2>
        <Link to="/shop" className="text-xs uppercase tracking-widest font-bold underline hover:opacity-60">Back to Collection</Link>
      </div>
    );
  }

  const hasVariants = product.colorVariants && product.colorVariants.length > 0;
  const activeVariant = hasVariants ? product.colorVariants![selectedColorIdx] : null;
  const images = (activeVariant ? activeVariant.images : product.images).filter(img => img);
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 5;

  const handleReviewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = reviewForm.name.trim();
    const email = reviewForm.email.trim().toLowerCase();
    const reviewText = reviewForm.review.trim();
    const rating = Number(reviewForm.rating);
    const hasToken = Boolean(localStorage.getItem('token'));

    if (!name || !reviewText || !Number.isFinite(rating)) {
      toast.error('All fields are required');
      return;
    }
    if (!hasToken && !email) {
      toast.error('Email is required for guest review');
      return;
    }
    if (!hasToken && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error('Rating must be between 1 and 5');
      return;
    }
    if (name.length < 2 || name.length > 60) {
      toast.error('Name must be between 2 and 60 characters');
      return;
    }
    if (reviewText.length < 10 || reviewText.length > 1000) {
      toast.error('Review must be between 10 and 1000 characters');
      return;
    }
    if (hasSpamPattern(name) || hasSpamPattern(reviewText)) {
      toast.error('Please remove links or spam-like text');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const { data } = await api.post('/reviews', { name, email, rating, review: reviewText });
      const createdReview: CustomerReview = {
        id: String(data?._id || data?.id || `review-${Date.now()}`),
        name: String(data?.name || name),
        rating: Number(data?.rating || rating),
        review: String(data?.review || data?.comment || reviewText),
        createdAt: Number(new Date(data?.createdAt || Date.now())),
      };
      setReviews((prev) => [createdReview, ...prev].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20));
      setReviewForm({ name: '', email: '', rating: 5, review: '' });
      setTestimonialIdx(0);
      toast.success('Review submitted successfully');
    } catch (error: any) {
      const status = Number(error?.response?.status || 0);
      const serverMessage =
        typeof error?.response?.data === 'string'
          ? error.response.data
          : error?.response?.data?.message;

      if (!error?.response) {
        toast.error('Server is offline. Please try again in a moment.');
      } else if (status === 503) {
        toast.error(serverMessage || 'Reviews are temporarily unavailable (database disconnected).');
      } else if (status === 429) {
        toast.error(serverMessage || 'Too many submissions. Please try again shortly.');
      } else {
        toast.error(serverMessage || 'Failed to submit review');
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleColorChange = (idx: number) => {
    setSelectedColorIdx(idx);
    setActiveImageIndex(0); // reset to first photo when colour changes
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="pt-28 pb-4 px-6 md:px-12 max-w-screen-xl mx-auto">
        <nav className="text-xs text-ink/40 flex items-center gap-1.5">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-ink transition-colors">Collections</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link to={`/shop?category=${product.category.toLowerCase()}`} className="hover:text-ink transition-colors capitalize">{product.category}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </nav>
      </div>

      {/* Main Product Area */}
      <div className="px-6 md:px-12 pb-20 max-w-screen-xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_480px] gap-10 lg:gap-16 items-start">

          {/* ── Left: Images ── */}
          <div className="flex gap-4">
            {/* Vertical Thumbnails */}
            {images.length > 1 && (
              <div className="hidden md:flex flex-col gap-3 w-[72px] flex-shrink-0">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={cn(
                      'aspect-square border-2 overflow-hidden rounded-sm transition-all',
                      activeImageIndex === i ? 'border-ink' : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 relative">
              <motion.div
                key={activeImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="aspect-square bg-[#f6f6f6] overflow-hidden rounded-sm sticky top-28"
              >
                <img
                  src={images[activeImageIndex] || images[0]}
                  alt={product.name}
                  loading={activeImageIndex === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Nav arrows on mobile */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((activeImageIndex - 1 + images.length) % images.length)}
                      className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center"
                    ><ChevronLeft size={18} /></button>
                    <button
                      onClick={() => setActiveImageIndex((activeImageIndex + 1) % images.length)}
                      className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center"
                    ><ChevronRight size={18} /></button>
                  </>
                )}
              </motion.div>

              {/* Mobile thumbnail dots */}
              {images.length > 1 && (
                <div className="flex md:hidden justify-center gap-1.5 mt-3">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setActiveImageIndex(i)}
                      className={cn('w-1.5 h-1.5 rounded-full transition-all', activeImageIndex === i ? 'bg-ink w-4' : 'bg-ink/20')}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Details ── */}
          <div className="lg:sticky lg:top-28 space-y-6 pb-12">
            {/* Brand */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink/40 mb-1">{product.brand || 'LUXA WACH'}</p>
              <h1 className="text-2xl md:text-3xl font-medium text-ink leading-tight">{product.name}</h1>
            </div>

            {/* Review summary */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={cn(
                      s <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-ink/20'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-ink/40">
                {totalReviews > 0 ? `${totalReviews} Review${totalReviews > 1 ? 's' : ''}` : 'No reviews yet'}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 pt-1">
              <p className="text-2xl font-semibold text-ink">Rs {formatCurrency(product.price)}</p>
              <p className="text-lg text-ink/40 line-through">Rs {formatCurrency(product.price * 1.25)}</p>
              <span className="text-[10px] bg-[#e63946] text-white font-bold uppercase tracking-widest px-2.5 py-1">Sale</span>
            </div>
            <p className="text-xs text-ink/50">Tax included. Shipping calculated at checkout.</p>

            {/* Stock indicator */}
            {product.stock > 0 && product.stock <= 5 && (
              <p className="text-xs font-bold text-[#e63946] uppercase tracking-widest">
                Only {product.stock} left — order soon!
              </p>
            )}

            {/* Color Variant Picker */}
            {hasVariants && product.colorVariants!.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-widest font-bold text-ink/50">
                  Band color: <span className="text-ink">{product.colorVariants![selectedColorIdx].colorName}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {product.colorVariants!.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleColorChange(idx)}
                      title={variant.colorName}
                      className={cn(
                        'w-9 h-9 rounded-full border-2 transition-all relative',
                        selectedColorIdx === idx
                          ? 'border-ink scale-110 shadow-md'
                          : 'border-transparent hover:border-ink/40'
                      )}
                      style={{ backgroundColor: variant.colorHex }}
                    >
                      {/* Diagonal slash for sold-out colors can be added here later */}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest font-bold text-ink/50">Quantity</p>
              <div className={cn('w-32 flex items-center border border-ink/20 h-11 rounded-sm', product.stock <= 0 && 'opacity-40 pointer-events-none')}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-11 h-full flex items-center justify-center text-ink/60 hover:text-ink">
                  <Minus size={14} />
                </button>
                <span className="flex-1 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock} className="w-11 h-full flex items-center justify-center text-ink/60 hover:text-ink disabled:opacity-30">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  addToCart(
                    product,
                    quantity,
                    activeVariant
                      ? {
                          colorName: activeVariant.colorName,
                          colorHex: activeVariant.colorHex,
                          image: activeVariant.images?.[0] || product.images[0],
                        }
                      : undefined
                  );
                  toast.success('Added to cart!');
                }}
                disabled={product.stock <= 0}
                className="w-full h-14 border-2 border-ink text-ink font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-ink hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {product.stock <= 0 ? 'Sold Out' : 'Add to cart'}
              </button>
              <button
                onClick={() => setIsBuyNowOpen(true)}
                disabled={product.stock <= 0}
                className="w-full h-14 bg-ink text-white font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-ink/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {product.stock <= 0 ? 'Sold Out' : 'Buy it now'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 py-6 border-y border-ink/10">
              {[
                { icon: Shield, label: 'Secure\nCheckout' },
                { icon: Truck, label: 'Nationwide\nDelivery' },
                { icon: RotateCcw, label: 'COD\nDelivery' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center justify-center gap-2 text-center">
                  <Icon size={20} className="text-ink/50" strokeWidth={1.5} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-ink/50 leading-tight whitespace-pre-line">{label}</span>
                </div>
              ))}
            </div>

            {/* Collapsible accordions */}
            <div className="divide-y divide-ink/10 border-b border-ink/10">
              {[
                { title: 'Description', content: product.description },
                product.specifications ? { title: 'Specifications', content: product.specifications } : null,
                product.shipping ? { title: 'Shipping & Returns', content: product.shipping } : null,
              ].filter(Boolean).map((item: any) => (
                <details key={item.title} className="group" open={item.title === 'Description'}>
                  <summary className="flex justify-between items-center cursor-pointer list-none py-5">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-bold">{item.title}</span>
                    <svg className="w-5 h-5 transition-transform duration-300 group-open:rotate-180 text-ink/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                  </summary>
                  <div className="text-sm text-ink/60 leading-relaxed pb-6 whitespace-pre-wrap">{item.content}</div>
                </details>
              ))}
            </div>

            {/* Share */}
            <button className="flex items-center gap-2 text-xs text-ink/40 hover:text-ink transition-colors">
              <Share2 size={14} />
              Share this product
            </button>
          </div>
        </div>
      </div>

      {/* Testimonials Banner */}
      <div className="bg-[#f6f6f6] py-16 px-6 text-center border-t border-ink/5">
        <h2 className="text-xl md:text-2xl font-bold flex items-center justify-center gap-3 mb-8">
          {totalReviews > 0 ? `${totalReviews}+ Happy Customers` : 'Customer Reviews'}
          <span className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={20}
                className={cn(
                  i <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-ink/20'
                )}
              />
            ))}
          </span>
        </h2>
        <div className="max-w-lg mx-auto space-y-8">
          {reviewsLoading ? (
            <div className="bg-white p-8 rounded-sm border border-ink/5 shadow-sm">
              <p className="text-sm text-ink/40">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white p-8 rounded-sm border border-ink/5 shadow-sm">
              <p className="text-ink text-base leading-relaxed">Be the first to write a review.</p>
            </div>
          ) : (
            <>
              <motion.div
                key={reviews[testimonialIdx]?.id || testimonialIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white p-8 rounded-sm border border-ink/5 shadow-sm"
              >
                <div className="flex justify-center mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      className={cn(
                        i <= Number(reviews[testimonialIdx]?.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-transparent text-ink/20'
                      )}
                    />
                  ))}
                </div>
                <p className="text-ink text-base leading-relaxed mb-4">{reviews[testimonialIdx]?.review}</p>
                <p className="text-xs font-bold text-ink/50">
                  - {reviews[testimonialIdx]?.name}, {new Date(reviews[testimonialIdx]?.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </motion.div>
              <div className="flex justify-center gap-1.5 mt-5">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIdx(i)}
                    className={cn('w-1.5 h-1.5 rounded-full transition-all', i === testimonialIdx ? 'bg-ink w-4' : 'bg-ink/20')}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="max-w-xl mx-auto mt-12 text-left bg-white p-8 rounded-sm border border-ink/5 shadow-sm">
          <h3 className="text-lg font-bold mb-5">Write a Review</h3>
          <form className="space-y-4" onSubmit={handleSubmitReview}>
            <div>
              <label htmlFor="review-name" className="block text-[11px] uppercase tracking-widest font-bold text-ink/50 mb-2">
                Name
              </label>
              <input
                id="review-name"
                name="name"
                type="text"
                maxLength={60}
                value={reviewForm.name}
                onChange={handleReviewInputChange}
                required
                className="w-full h-11 px-4 border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ink"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="review-email" className="block text-[11px] uppercase tracking-widest font-bold text-ink/50 mb-2">
                Email
              </label>
              <input
                id="review-email"
                name="email"
                type="email"
                maxLength={120}
                value={reviewForm.email}
                onChange={handleReviewInputChange}
                required={!localStorage.getItem('token')}
                className="w-full h-11 px-4 border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ink"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold text-ink/50 mb-2">
                Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                    className="p-1"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={20}
                      className={cn(
                        star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-ink/25'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="review-message" className="block text-[11px] uppercase tracking-widest font-bold text-ink/50 mb-2">
                Review
              </label>
              <textarea
                id="review-message"
                name="review"
                maxLength={1000}
                minLength={10}
                value={reviewForm.review}
                onChange={handleReviewInputChange}
                required
                rows={5}
                className="w-full px-4 py-3 border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ink resize-y"
                placeholder="Share your experience..."
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="h-11 px-6 bg-ink text-white text-xs uppercase tracking-widest font-bold rounded-sm hover:bg-ink/85 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>

      {/* Buy Now Modal */}
      <BuyNowModal
        isOpen={isBuyNowOpen}
        onClose={() => setIsBuyNowOpen(false)}
        product={product}
        quantity={quantity}
        selectedColorIdx={selectedColorIdx}
      />
    </div>
  );
};
