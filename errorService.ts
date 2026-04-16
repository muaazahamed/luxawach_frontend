
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { cn } from '../utils';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['All', 'Men', 'Women', 'Sport', 'Premium', 'Luxury'];

export const Shop = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const collectionParam = searchParams.get('collection');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('best-selling');
  const [availability, setAvailability] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products');
        const productsData = data.map((p: any) => ({ ...p, id: p._id || p.id }));
        setProducts(productsData);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      let matchesCategoryParam = true;
      if (categoryParam) {
        matchesCategoryParam = p.category?.toLowerCase() === categoryParam.toLowerCase();
      }

      let matchesCollectionParam = true;
      if (collectionParam === 'hot-sellers') {
        matchesCollectionParam = p.featured === true || p.category?.toLowerCase() === 'hot sellers';
      } else if (collectionParam === 'premium') {
        matchesCollectionParam = p.price >= 50000 || p.category?.toLowerCase() === 'premium';
      }

      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.brand?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesAvailability = true;
      if (availability === 'in-stock') matchesAvailability = p.stock > 0;
      if (availability === 'out-of-stock') matchesAvailability = p.stock <= 0;

      let matchesPrice = true;
      if (priceFilter === 'under-10k') matchesPrice = p.price < 10000;
      if (priceFilter === '10k-50k') matchesPrice = p.price >= 10000 && p.price <= 50000;
      if (priceFilter === 'over-50k') matchesPrice = p.price > 50000;

      return matchesCategoryParam && matchesCollectionParam && matchesCategory && matchesSearch && matchesAvailability && matchesPrice;
    });

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'az') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'best-selling') result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    return result;
  }, [products, categoryParam, collectionParam, selectedCategory, searchQuery, availability, priceFilter, sortBy]);

  const pageTitle = collectionParam
    ? collectionParam.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : categoryParam
    ? categoryParam.replace(/\b\w/g, (c) => c.toUpperCase())
    : 'All Products';

  return (
    <div className="pt-28 pb-20 min-h-screen bg-[#f6f6f6]">
      {/* Collection Banner */}
      <div className="bg-white border-b border-ink/5 px-6 md:px-12 py-8 mb-8">
        <div className="max-w-screen-2xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40 mb-2">Collection</p>
          <h1 className="text-3xl md:text-4xl font-serif italic text-ink">{pageTitle}</h1>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
        {/* Category Pills */}
        {!categoryParam && !collectionParam && (
          <div className="flex gap-2 flex-wrap mb-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-5 py-2 text-[11px] font-bold uppercase tracking-widest rounded-full border transition-all',
                  selectedCategory === cat
                    ? 'bg-ink text-white border-ink'
                    : 'border-ink/20 text-ink hover:border-ink hover:bg-white'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Filter Bar — Shopify style */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-ink/10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-ink/20 rounded-full px-4 py-2 hover:border-ink transition-all"
            >
              <SlidersHorizontal size={14} />
              Filter
              {(availability !== 'all' || priceFilter !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-gold inline-block ml-1" />
              )}
            </button>

            {/* Inline search */}
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="hidden md:block text-xs bg-transparent border border-ink/10 rounded-full px-4 py-2 focus:outline-none focus:border-ink transition-all w-48"
            />
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-ink/50 hidden md:inline">{filteredProducts.length} products</span>
            <div className="relative flex items-center gap-1">
              <span className="text-ink/60">Sort:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="appearance-none bg-transparent text-ink font-bold pr-5 focus:outline-none cursor-pointer border-none focus:ring-0"
                >
                  <option value="best-selling">Best selling</option>
                  <option value="az">A-Z</option>
                  <option value="price-asc">Price, low to high</option>
                  <option value="price-desc">Price, high to low</option>
                </select>
                <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-ink/40" />
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Filters Drawer */}
        {filtersOpen && (
          <div className="bg-white border border-ink/10 rounded-xl p-6 mb-8 flex flex-wrap gap-8 items-start">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Availability</p>
              <div className="flex gap-2">
                {[['all', 'All'], ['in-stock', 'In stock'], ['out-of-stock', 'Out of stock']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setAvailability(val)}
                    className={cn(
                      'text-xs px-4 py-1.5 rounded-full border transition-all',
                      availability === val ? 'bg-ink text-white border-ink' : 'border-ink/20 hover:border-ink'
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Price</p>
              <div className="flex gap-2 flex-wrap">
                {[['all', 'All'], ['under-10k', 'Under Rs 10K'], ['10k-50k', 'Rs 10K – 50K'], ['over-50k', 'Over Rs 50K']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setPriceFilter(val)}
                    className={cn(
                      'text-xs px-4 py-1.5 rounded-full border transition-all',
                      priceFilter === val ? 'bg-ink text-white border-ink' : 'border-ink/20 hover:border-ink'
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>
            <button
              onClick={() => { setAvailability('all'); setPriceFilter('all'); setFiltersOpen(false); }}
              className="ml-auto text-xs text-ink/40 hover:text-ink flex items-center gap-1"
            >
              <X size={12} /> Clear all
            </button>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-ink/10 rounded-sm mb-3" />
                <div className="h-3 bg-ink/10 w-1/3 mb-2" />
                <div className="h-4 bg-ink/10 w-3/4 mb-2" />
                <div className="h-3 bg-ink/10 w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="py-32 text-center space-y-4">
            <p className="text-xl font-serif italic text-ink/40">No products found in this collection.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setAvailability('all'); setPriceFilter('all'); setSearchQuery(''); }}
              className="text-xs uppercase tracking-widest font-bold underline hover:text-ink/60 transition-colors"
            >Clear all filters</button>
          </div>
        )}
      </div>
    </div>
  );
};
