import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme, THEME_PRESETS } from '../ThemeContext';
import { useUser } from '../UserContext';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../api';
import { Product, Order, Inquiry, ColorVariant } from '../types';
import { 
  Plus, 
  Package, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Search, 
  Filter, 
  MoreVertical,
  Edit2,
  Trash2,
  X,
  LayoutDashboard,
  CheckCircle,
  Box,
  ClipboardList,
  Loader2,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Upload,
  Settings,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn, formatDate } from '../utils';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { seedProducts } from '../mockData';
import { toast } from 'sonner';

type Tab = 'overview' | 'products' | 'orders' | 'inquiries' | 'siteConfig' | 'theme';

const normalizeStatus = (status: Order['status']): Order['status'] =>
  status === 'processing' ? 'packed' : status;

const getStatusLabel = (status: Order['status']) => {
  const normalized = normalizeStatus(status);
  if (normalized === 'pending') return 'Pending';
  if (normalized === 'confirmed') return 'Confirmed';
  if (normalized === 'packed') return 'Packed';
  if (normalized === 'shipped') return 'Shipped';
  if (normalized === 'delivered') return 'Delivered';
  return 'Cancelled by Owner';
};

const getOrderColorsLabel = (order: any) => {
  const sourceItems = Array.isArray(order?.items) && order.items.length > 0
    ? order.items
    : (Array.isArray(order?.orderItems) ? order.orderItems : []);

  const colors = Array.from(new Set(
    sourceItems
      .map((item: any) => {
        const variantName = typeof item?.variantName === 'string' ? item.variantName.trim() : '';
        if (variantName) return variantName;
        const colorName = typeof item?.colorName === 'string' ? item.colorName.trim() : '';
        if (colorName) return colorName;
        const name = typeof item?.name === 'string' ? item.name.trim() : '';
        const match = name.match(/\(([^)]+)\)/);
        return match?.[1]?.trim() || '';
      })
      .filter(Boolean)
  ));

  return colors.join(', ');
};

const ORDER_STEPS: Array<Order['status']> = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

const canAdvanceTo = (current: Order['status'], target: Order['status']) => {
  const currentIndex = ORDER_STEPS.indexOf(normalizeStatus(current));
  const targetIndex = ORDER_STEPS.indexOf(normalizeStatus(target));
  return targetIndex >= 0 && currentIndex >= 0 && targetIndex >= currentIndex;
};

const updateOrderInLocalStorage = (
  orderRef: string,
  status: Order['status'],
  tracking?: { carrier?: string; trackingNumber?: string; estimatedDeliveryDate?: number | null }
) => {
  const updateCollection = (key: string) => {
    let changed = false;
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(raw)) return false;

    const next = raw.map((order: any) => {
      const refCandidates = [
        String(order?.id || ''),
        String(order?._id || ''),
        String(order?.orderId || ''),
      ];
      if (!refCandidates.includes(String(orderRef))) return order;

      changed = true;
      const timeline = Array.isArray(order.timeline) ? [...order.timeline] : [];
      const normalizedTargetStatus = normalizeStatus(status);
      const lastTimelineStatus = timeline.length > 0 ? normalizeStatus(timeline[timeline.length - 1]?.status) : null;

      if (normalizedTargetStatus && lastTimelineStatus !== normalizedTargetStatus) {
        timeline.push({ status: normalizedTargetStatus, time: Date.now() });
      }

      return {
        ...order,
        status,
        timeline,
        tracking: tracking ? { ...(order.tracking || {}), ...tracking } : order.tracking,
        updatedAt: Date.now(),
      };
    });

    if (changed) {
      localStorage.setItem(key, JSON.stringify(next));
    }
    return changed;
  };

  const updatedMockOrders = updateCollection('mockOrders');
  const updatedLegacyOrders = updateCollection('buyNowOrders');
  return updatedMockOrders || updatedLegacyOrders;
};

export const AdminDashboard = () => {
  const { user, loading: authLoading, logout } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { theme: currentTheme, setThemeById } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [isSeeding, setIsSeeding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null]);
  
  // Site Config State
  const [headerConfig, setHeaderConfig] = useState({
    logoText: 'LUXA',
    logoAccent: 'WACH',
    navLinks: [
      { name: 'Home', path: '/' },
      { name: 'Men', path: '/shop?category=men' },
      { name: 'Women', path: '/shop?category=women' },
      { name: 'Hot Sellers', path: '/shop?collection=hot-sellers' },
      { name: 'Premium Watches', path: '/shop?collection=premium' },
      { name: 'About Us', path: '/contact' },
      { name: 'Track Order', path: '/track-order' },
      { name: 'Contact', path: '/contact' }
    ]
  });
  const [footerConfig, setFooterConfig] = useState({
    aboutText: '',
    address: '',
    phone: '',
    email: '',
    whatsappLink: '',
    socialLinks: [{ platform: '', url: '' }],
    copyrightText: ''
  });
  const [homeConfig, setHomeConfig] = useState({
    heroButtonText: 'Explore Collection',
    heritageButtonText: 'Watch Heritage',
    collectionsButtonText: 'View All Collections',
    bespokeButtonText: 'Consult a Master'
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    specifications: '',
    shipping: '',
    price: '',
    category: 'Classic',
    stock: '',
    images: ['', '', '', ''],
    brand: '',
    featured: false
  });
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);

  const [trackingFormData, setTrackingFormData] = useState({
    carrier: '',
    trackingNumber: '',
    estimatedDeliveryDate: '',
    status: 'pending' as Order['status']
  });
  const [updatingOrderRefs, setUpdatingOrderRefs] = useState<string[]>([]);
  const dashboardFetchInFlightRef = useRef(false);
  const dashboardLastFetchAtRef = useRef(0);

  const sortOrdersByLatest = useCallback((incoming: Order[]) => {
    return [...incoming].sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
  }, []);

  const getSocialUrl = (platform: string) =>
    footerConfig.socialLinks.find((link) => link.platform.toLowerCase() === platform.toLowerCase())?.url || '';

  const setSocialUrl = (platform: string, url: string) => {
    setFooterConfig((prev) => {
      const idx = prev.socialLinks.findIndex((link) => link.platform.toLowerCase() === platform.toLowerCase());
      if (idx >= 0) {
        const nextLinks = [...prev.socialLinks];
        nextLinks[idx] = { ...nextLinks[idx], platform, url };
        return { ...prev, socialLinks: nextLinks };
      }
      return {
        ...prev,
        socialLinks: [...prev.socialLinks, { platform, url }],
      };
    });
  };

  const fetchDashboardData = useCallback(async (options?: { force?: boolean }) => {
    if (!user || user.role !== 'admin') return;
    const force = Boolean(options?.force);
    const now = Date.now();
    const MIN_FETCH_GAP_MS = 1000;

    if (!force) {
      if (dashboardFetchInFlightRef.current) return;
      if (now - dashboardLastFetchAtRef.current < MIN_FETCH_GAP_MS) return;
    }

    dashboardFetchInFlightRef.current = true;
    dashboardLastFetchAtRef.current = now;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const [prodRes, orderRes, inqRes, headRes, footRes, homeRes] = await Promise.all([
        api.get('/products'),
        api.get('/orders', config),
        api.get('/inquiries', config),
        api.get('/siteconfig/header').catch(() => ({ data: null })),
        api.get('/siteconfig/footer').catch(() => ({ data: null })),
        api.get('/siteconfig/home').catch(() => ({ data: null }))
      ]);

      const normalizedProducts = (Array.isArray(prodRes.data) ? prodRes.data : []).map((p: any, idx: number) => ({
        ...p,
        id: String(p?._id || p?.id || `product-${Date.now()}-${idx}`),
        images: Array.isArray(p?.images) && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=1000'],
        stock: Number.isFinite(Number(p?.stock)) ? Number(p.stock) : 0,
        price: Number.isFinite(Number(p?.price)) ? Number(p.price) : 0,
      }));

      const rawOrders = Array.isArray(orderRes.data) ? orderRes.data : (Array.isArray(orderRes.data?.orders) ? orderRes.data.orders : []);
      const normalizedOrders = rawOrders.map((o: any, idx: number) => ({
        ...o,
        id: String(o?._id || o?.id || `order-${Date.now()}-${idx}`),
        total: Number.isFinite(Number(o?.total)) ? Number(o.total) : 0,
        shippingAddress: {
          fullName: o?.shippingAddress?.fullName || 'Guest Customer',
          email: o?.shippingAddress?.email || 'N/A',
          phone: o?.shippingAddress?.phone || '',
          address: o?.shippingAddress?.address || '',
          city: o?.shippingAddress?.city || '',
          postalCode: o?.shippingAddress?.postalCode || '',
        },
        status: o?.status || 'pending',
      }));

      const normalizedInquiries = (Array.isArray(inqRes.data) ? inqRes.data : []).map((i: any, idx: number) => ({
        ...i,
        id: String(i?._id || i?.id || `inquiry-${Date.now()}-${idx}`),
        name: i?.name || 'Unknown',
        email: i?.email || 'N/A',
        subject: i?.subject || 'No Subject',
        message: i?.message || '',
        status: i?.status || 'new',
      }));

      setProducts(normalizedProducts);
      setOrders(sortOrdersByLatest(normalizedOrders));
      setInquiries(normalizedInquiries);
      
      if (headRes.data) {
        setHeaderConfig({
          logoText: headRes.data.logoText || 'LUXA',
          logoAccent: headRes.data.logoAccent || 'WACH',
          navLinks: Array.isArray(headRes.data.navLinks) && headRes.data.navLinks.length > 0
            ? headRes.data.navLinks
            : [
                { name: 'Home', path: '/' },
                { name: 'Men', path: '/shop?category=men' },
                { name: 'Women', path: '/shop?category=women' },
                { name: 'About Us', path: '/contact' },
                { name: 'Track Order', path: '/track-order' },
                { name: 'Contact', path: '/contact' }
              ]
        });
      }
      if (footRes.data) {
        setFooterConfig({
          aboutText: footRes.data.aboutText || '',
          address: footRes.data.address || '',
          phone: footRes.data.phone || '',
          email: footRes.data.email || '',
          whatsappLink: footRes.data.whatsappLink || '',
          socialLinks: Array.isArray(footRes.data.socialLinks) && footRes.data.socialLinks.length > 0
            ? footRes.data.socialLinks
            : [{ platform: '', url: '' }],
          copyrightText: footRes.data.copyrightText || ''
        });
      }
      if (homeRes.data) {
        setHomeConfig({
          heroButtonText: homeRes.data.heroButtonText || 'Explore Collection',
          heritageButtonText: homeRes.data.heritageButtonText || 'Watch Heritage',
          collectionsButtonText: homeRes.data.collectionsButtonText || 'View All Collections',
          bespokeButtonText: homeRes.data.bespokeButtonText || 'Consult a Master'
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Error loading dashboard data");
      setLoading(false);
    } finally {
      dashboardFetchInFlightRef.current = false;
    }
  }, [sortOrdersByLatest, user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const intervalId = window.setInterval(() => {
      fetchDashboardData({ force: true });
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchDashboardData, user]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const handleWindowFocus = () => {
      fetchDashboardData({ force: true });
    };

    const handleStorageSync = (event: StorageEvent) => {
      if (!event.key || event.key === 'mockOrders' || event.key === 'buyNowOrders') {
        fetchDashboardData();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('storage', handleStorageSync);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [fetchDashboardData, user]);

  const handleSaveSiteConfig = async (type: 'header' | 'footer' | 'home') => {
    let data: any;
    if (type === 'header') data = headerConfig;
    else if (type === 'footer') data = footerConfig;
    else data = homeConfig;

    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      await api.put(`/siteconfig/${type}`, data, config);
      // Keep local/session cache in sync so UI uses the latest config immediately.
      localStorage.setItem(`mockSiteConfig_${type}`, JSON.stringify(data));
      const cacheRaw = sessionStorage.getItem('siteConfig_cache');
      const cacheParsed = cacheRaw ? JSON.parse(cacheRaw) : {};
      sessionStorage.setItem('siteConfig_cache', JSON.stringify({
        ...cacheParsed,
        [type]: data,
      }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} configuration saved successfully`);
    } catch (error) {
      console.error("Config save error:", error);
      try {
        localStorage.setItem(`mockSiteConfig_${type}`, JSON.stringify(data));
        const cacheRaw = sessionStorage.getItem('siteConfig_cache');
        const cacheParsed = cacheRaw ? JSON.parse(cacheRaw) : {};
        sessionStorage.setItem('siteConfig_cache', JSON.stringify({
          ...cacheParsed,
          [type]: data,
        }));
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} configuration saved locally (offline mode)`);
      } catch {
        toast.error('Failed to save configuration');
      }
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        specifications: product.specifications || '',
        shipping: product.shipping || '',
        price: product.price.toString(),
        category: product.category,
        stock: product.stock.toString(),
        images: [...product.images, '', '', '', ''].slice(0, 4),
        brand: product.brand || '',
        featured: Boolean(product.featured)
      });
      setColorVariants(product.colorVariants || []);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        specifications: '',
        shipping: '',
        price: '',
        category: 'Classic',
        stock: '',
        images: ['', '', '', ''],
        brand: '',
        featured: false
      });
      setColorVariants([]);
    }
    setImageFiles([null, null, null, null]);
    setIsModalOpen(true);
  };

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15000000) { // 15MB limit
      alert("Image is too large. Please select an image under 15MB.");
      return;
    }

    setUploadingIndex(index);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageFiles(prev => {
        const next = [...prev];
        next[index] = file;
        return next;
      });
      setFormData(prev => {
        const newImages = [...prev.images];
        newImages[index] = reader.result as string;
        return { ...prev, images: newImages };
      });
      setUploadingIndex(null);
    };
    reader.readAsDataURL(file);
  };

  const handleVariantImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    variantIndex: number,
    imageIndex: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15000000) {
      alert("Image is too large. Please select an image under 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setColorVariants((prev) => {
        const copy = [...prev];
        const imgs = [...(copy[variantIndex]?.images || ['', '', '', ''])];
        imgs[imageIndex] = reader.result as string;
        copy[variantIndex] = { ...copy[variantIndex], images: imgs };
        return copy;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('specifications', formData.specifications);
      payload.append('shipping', formData.shipping);
      payload.append('price', formData.price);
      payload.append('category', formData.category);
      payload.append('stock', formData.stock);
      payload.append('brand', formData.brand);
      payload.append('featured', String(formData.featured));

      imageFiles.forEach((file) => {
        if (file) payload.append('images', file);
      });

      // Keep already-uploaded remote images when editing and only replacing some slots.
      formData.images.forEach((img, idx) => {
        if (img && !imageFiles[idx] && /^https?:\/\//i.test(img)) {
          payload.append('existingImages', img);
        }
      });

      const endpoint = editingProduct ? `/products/${editingProduct.id}` : '/products';
      const method = editingProduct ? 'put' : 'post';
      const response = await api.request({
        url: endpoint,
        method,
        data: payload,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
      });

      const savedProduct = { ...response.data, id: response.data._id };
      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? savedProduct : p));
        toast.success('Product updated');
      } else {
        setProducts(prev => [savedProduct, ...prev]);
        toast.success('Product created');
      }
      setIsModalOpen(false);
      setImageFiles([null, null, null, null]);
    } catch (error) {
      console.error(error);
      // ── Offline / no-backend fallback: save directly to localStorage ──
      try {
        const images = formData.images.filter(img => img && img.trim() !== '');
        const now = Date.now();
        const existing: Product[] = JSON.parse(localStorage.getItem('mockProducts') || '[]');

        if (editingProduct) {
          // Update existing product in localStorage
          const updated: Product = {
            ...editingProduct,
            name: formData.name,
            description: formData.description,
            specifications: formData.specifications,
            shipping: formData.shipping,
            price: parseFloat(formData.price) || 0,
            category: formData.category,
            stock: parseInt(formData.stock) || 0,
            brand: formData.brand,
            featured: Boolean(formData.featured),
            images: images.length > 0 ? images : editingProduct.images,
            colorVariants,
            updatedAt: now,
          };
          const updatedList = existing.map((p: Product) => p.id === editingProduct.id ? updated : p);
          localStorage.setItem('mockProducts', JSON.stringify(updatedList));
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
          toast.success('Product updated locally (offline mode)');
        } else {
          // Create new product in localStorage
          const newProduct: Product = {
            id: `local-${now}`,
            name: formData.name,
            description: formData.description,
            specifications: formData.specifications,
            shipping: formData.shipping,
            price: parseFloat(formData.price) || 0,
            category: formData.category,
            stock: parseInt(formData.stock) || 0,
            brand: formData.brand,
            featured: Boolean(formData.featured),
            images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=1000'],
            colorVariants,
            createdAt: now,
            updatedAt: now,
          };
          const updatedList = [newProduct, ...existing];
          localStorage.setItem('mockProducts', JSON.stringify(updatedList));
          setProducts(prev => [newProduct, ...prev]);
          toast.success('Product added locally (offline mode)');
        }
        setIsModalOpen(false);
        setImageFiles([null, null, null, null]);
      } catch (localErr) {
        console.error('Local save also failed:', localErr);
        const backendMessage = (error as any)?.response?.data?.message;
        toast.error(backendMessage || 'Failed to save product.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this timepiece from the collection?')) {
      try {
        // MOCK DELETE FOR TESTING
        setProducts(prev => {
          const updated = prev.filter(p => p.id !== id);
          localStorage.setItem('mockProducts', JSON.stringify(updated));
          return updated;
        });
        toast.success('Product deleted locally (Testing Mode)');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete product');
      }
    }
  };

  const handleUpdateOrderStatus = async (order: Order, status: Order['status']) => {
    const primaryRef = String(order.orderId || order.id || '');
    const secondaryRef = String(order.id || '');
    const refs = [primaryRef, secondaryRef].filter(Boolean);
    if (refs.length === 0) return;
    if (refs.some((ref) => updatingOrderRefs.includes(ref))) return;

    // Optimistic UI update so the action feels immediate on first click.
    setUpdatingOrderRefs((prev) => Array.from(new Set([...prev, ...refs])));
    setOrders((prev) => prev.map((existingOrder) => {
      const isTarget =
        refs.includes(String(existingOrder.id || '')) ||
        refs.includes(String(existingOrder.orderId || ''));
      if (!isTarget) return existingOrder;

      return {
        ...existingOrder,
        status,
        timeline: [
          ...(Array.isArray(existingOrder.timeline) ? existingOrder.timeline : []),
          { status: normalizeStatus(status), time: Date.now() }
        ]
      };
    }));
    updateOrderInLocalStorage(primaryRef, status);

    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      await api.post('/orders/update-order-status', { orderId: primaryRef, status }, config);
      toast.success('Order status updated');
      fetchDashboardData({ force: true });
    } catch (error) {
      console.error(error);
      const updatedLocally = updateOrderInLocalStorage(primaryRef, status) || updateOrderInLocalStorage(secondaryRef, status);
      if (updatedLocally) {
        setOrders(prev => prev.map(existingOrder =>
          refs.includes(String(existingOrder.id || '')) || refs.includes(String(existingOrder.orderId || ''))
            ? {
                ...existingOrder,
                status,
                timeline: [
                  ...(Array.isArray(existingOrder.timeline) ? existingOrder.timeline : []),
                  { status: normalizeStatus(status), time: Date.now() }
                ]
              }
            : existingOrder
        ));
        toast.success('Order status updated locally (offline mode)');
      } else {
        toast.error('Failed to update order status');
      }
    } finally {
      setUpdatingOrderRefs((prev) => prev.filter((ref) => !refs.includes(ref)));
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, status: Inquiry['status']) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      await api.put(`/inquiries/${inquiryId}/status`, { status }, config);
      toast.success('Inquiry status updated');
      fetchDashboardData({ force: true });
    } catch (error) {
      console.error(error);
      toast.error('Failed to update inquiry status');
    }
  };

  const handleOpenTrackingModal = (order: Order) => {
    setSelectedOrderForTracking(order);
    setTrackingFormData({
      carrier: order.tracking?.carrier || '',
      trackingNumber: order.tracking?.trackingNumber || '',
      estimatedDeliveryDate: order.tracking?.estimatedDeliveryDate 
        ? new Date(order.tracking.estimatedDeliveryDate).toISOString().split('T')[0] 
        : '',
      status: order.status
    });
    setIsTrackingModalOpen(true);
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForTracking) return;
    const trackingData = {
      carrier: trackingFormData.carrier,
      trackingNumber: trackingFormData.trackingNumber,
      estimatedDeliveryDate: trackingFormData.estimatedDeliveryDate 
        ? new Date(trackingFormData.estimatedDeliveryDate).getTime() 
        : null
    };

    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      await api.put(`/orders/${selectedOrderForTracking.id}/status`, {
        status: trackingFormData.status,
        tracking: trackingData
      }, config);
      
      setIsTrackingModalOpen(false);
      toast.success('Tracking information updated successfully');
      fetchDashboardData({ force: true });
    } catch (error) {
      console.error(error);
      const updatedLocally = updateOrderInLocalStorage(
        selectedOrderForTracking.id,
        trackingFormData.status,
        trackingData
      );
      if (updatedLocally) {
        setOrders(prev => prev.map(order =>
          String(order.id) === String(selectedOrderForTracking.id) || String(order.orderId || '') === String(selectedOrderForTracking.id)
            ? {
                ...order,
                status: trackingFormData.status,
                tracking: {
                  carrier: trackingData.carrier || '',
                  trackingNumber: trackingData.trackingNumber || '',
                  estimatedDeliveryDate: trackingData.estimatedDeliveryDate || undefined
                },
                timeline: [
                  ...(Array.isArray(order.timeline) ? order.timeline : []),
                  { status: normalizeStatus(trackingFormData.status), time: Date.now() }
                ]
              }
            : order
        ));
        setIsTrackingModalOpen(false);
        toast.success('Tracking updated locally (offline mode)');
      } else {
        toast.error('Failed to update tracking');
      }
    }
  };

  const handleSeedCollection = async () => {
    toast.error('Seeding is disabled in production Node.js backend');
  };

  if (authLoading || (loading && user && user.role === 'admin')) {
    return (
      <div className="h-screen flex items-center justify-center bg-off-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">Initializing Luxa Wach</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-emerald-500', trend: '+12.5%' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-blue-500', trend: '+8.2%' },
    { label: 'Active Inventory', value: products.length, icon: Package, color: 'text-gold', trend: 'Stable' },
    { label: 'Total Customers', value: new Set(orders.map(o => o.userId)).size, icon: Users, color: 'text-purple-500', trend: '+4.1%' },
  ];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FBFBFB] pt-32 pb-20 px-6 lg:px-12">
      <div className="max-w-screen-2xl mx-auto space-y-16">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold">
              Management Console
            </p>
            <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight leading-tight">
              Luxa Wach <br />
              <span className="text-gold">Dashboard</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { logout(); navigate('/'); }}
              className="group"
            >
              <LogOut size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Logout
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSeedCollection}
              disabled={isSeeding}
              className="flex items-center space-x-2"
            >
              {isSeeding ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
              <span>Seed Collection</span>
            </Button>
            <Button 
              onClick={() => handleOpenModal()} 
              className="flex items-center space-x-2"
              size="sm"
            >
              <Plus size={16} />
              <span>New Timepiece</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="-mx-6 px-6 lg:mx-0 lg:px-0 border-b border-ink/5 overflow-x-auto">
          <div className="min-w-max flex items-center gap-6 sm:gap-8 lg:gap-12">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'products', label: 'Inventory', icon: Box },
              { id: 'orders', label: 'Orders', icon: ClipboardList },
              { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
              { id: 'siteConfig', label: 'Site Config', icon: Settings },
              { id: 'theme', label: 'Theme', icon: ImageIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center space-x-2 sm:space-x-3 pb-5 sm:pb-6 text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold transition-all relative whitespace-nowrap",
                  activeTab === tab.id ? "text-ink" : "text-ink/30 hover:text-ink"
                )}
              >
                <tab.icon size={14} className={activeTab === tab.id ? "text-gold" : ""} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-gold" 
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-16">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-10 border border-ink/5 rounded-[2rem] space-y-6 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex justify-between items-start">
                        <div className={cn("p-4 rounded-2xl bg-ink/[0.02] group-hover:bg-ink/[0.04] transition-colors", stat.color)}>
                          <stat.icon size={24} strokeWidth={1.5} />
                        </div>
                        <div className={cn(
                          "flex items-center space-x-1 text-[10px] font-bold",
                          stat.trend.startsWith('+') ? "text-emerald-500" : "text-ink/40"
                        )}>
                          <span>{stat.trend}</span>
                          {stat.trend.startsWith('+') ? <ArrowUpRight size={12} /> : null}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40">{stat.label}</p>
                        <p className="text-4xl font-serif italic mt-2 tracking-tight">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity Section */}
                <div className="grid lg:grid-cols-2 gap-12">
                  <div className="bg-white p-10 border border-ink/5 rounded-[2rem] shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-serif italic">Recent Orders</h3>
                      <button 
                        onClick={() => setActiveTab('orders')}
                        className="text-[10px] uppercase tracking-widest font-bold text-gold hover:text-ink transition-colors"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between py-6 border-b border-ink/5 last:border-0 group">
                          <div className="space-y-1">
                            <p className="text-sm font-bold uppercase tracking-tight group-hover:text-gold transition-colors">#{(order.orderId || order.id).toUpperCase()}</p>
                            <p className="text-[10px] text-ink/40 uppercase font-bold tracking-wider">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="text-right space-y-2">
                            <p className="text-lg font-serif italic">{formatCurrency(order.total)}</p>
                            <span className={cn(
                              "text-[8px] uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-full",
                              order.status === 'delivered' ? "bg-emerald-50 text-emerald-600" :
                              normalizeStatus(order.status) === 'packed' ? "bg-blue-50 text-blue-600" :
                              "bg-amber-50 text-amber-600"
                            )}>
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {orders.length === 0 && (
                        <div className="py-12 text-center space-y-4">
                          <ShoppingBag size={40} className="mx-auto text-ink/10" strokeWidth={1} />
                          <p className="text-sm text-ink/40 italic font-serif">No acquisitions recorded yet.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-10 border border-ink/5 rounded-[2rem] shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-serif italic">Inventory Health</h3>
                      <button 
                        onClick={() => setActiveTab('products')}
                        className="text-[10px] uppercase tracking-widest font-bold text-gold hover:text-ink transition-colors"
                      >
                        Manage Collection
                      </button>
                    </div>
                    <div className="space-y-2">
                      {products.filter(p => p.stock < 10).slice(0, 5).map((product) => (
                        <div key={product.id} className="flex items-center justify-between py-6 border-b border-ink/5 last:border-0">
                          <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-ink/5 rounded-2xl overflow-hidden flex-shrink-0">
                              <img src={product.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold">{product.name}</p>
                              <p className="text-[10px] text-ink/40 uppercase font-bold tracking-wider">{product.brand}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <span className={cn(
                                "text-xs font-bold",
                                product.stock === 0 ? "text-red-500" : "text-amber-500"
                              )}>
                                {product.stock}
                              </span>
                              <span className="text-[10px] text-ink/40 uppercase font-bold">Units</span>
                            </div>
                            <p className="text-[8px] uppercase tracking-widest font-bold text-ink/30 mt-1">
                              {product.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                            </p>
                          </div>
                        </div>
                      ))}
                      {products.filter(p => p.stock < 10).length === 0 && (
                        <div className="py-12 text-center space-y-4">
                          <Package size={40} className="mx-auto text-ink/10" strokeWidth={1} />
                          <p className="text-sm text-ink/40 italic font-serif">All inventory levels are healthy.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="bg-white border border-ink/5 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="p-10 border-b border-ink/5 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                    <input 
                      type="text"
                      placeholder="Search the collection..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-ink/[0.02] border-none rounded-2xl text-sm focus:ring-1 focus:ring-gold transition-all placeholder:text-ink/20"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Filter size={14} />
                      <span>Filter</span>
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-ink/[0.01] border-b border-ink/5">
                        <th className="px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40">Timepiece</th>
                        <th className="px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40">Category</th>
                        <th className="px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40">Price</th>
                        <th className="px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40">Stock</th>
                        <th className="px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-ink/[0.01] transition-colors group">
                          <td className="px-10 py-8">
                            <div className="flex items-center space-x-6">
                              <div className="w-20 h-20 bg-ink/5 rounded-2xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                                <img src={product.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-base font-bold group-hover:text-gold transition-colors">{product.name}</p>
                                <p className="text-[10px] text-ink/40 uppercase font-bold tracking-widest">{product.brand}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink/60 bg-ink/5 px-3 py-1 rounded-full">{product.category}</span>
                          </td>
                          <td className="px-10 py-8">
                            <p className="text-lg font-serif italic">{formatCurrency(product.price)}</p>
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                product.stock > 10 ? "bg-emerald-500" : 
                                product.stock > 0 ? "bg-amber-500" : "bg-red-500"
                              )} />
                              <span className="text-sm font-bold">{product.stock}</span>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleOpenModal(product)}
                                className="p-3 hover:bg-ink/5 rounded-xl transition-colors text-ink/60 hover:text-ink"
                                title="Edit Timepiece"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-3 hover:bg-red-50 rounded-xl transition-colors text-red-400 hover:text-red-600"
                                title="Remove from Collection"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white border border-ink/5 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="p-10 border-b border-ink/5 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-1">
                    <h3 className="text-xl font-serif italic">Manage Orders</h3>
                    <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold">Filter and manage customer acquisitions</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3 bg-ink/[0.02] px-6 py-3 rounded-2xl border border-ink/5">
                      <Filter size={14} className="text-gold" />
                      <select 
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                        className="bg-transparent border-none text-[10px] uppercase tracking-widest font-bold focus:ring-0 cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-ink/[0.01] border-b border-ink/5">
                        <th className="px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40">Order ID</th>
                        <th className="px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40">Customer</th>
                        <th className="px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40">Date</th>
                        <th className="px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40">Total</th>
                        <th className="px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40">Status</th>
                        <th className="px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {orders
                        .filter(order => orderStatusFilter === 'all' || normalizeStatus(order.status) === orderStatusFilter)
                        .map((order) => (
                        <tr key={order.id} className="hover:bg-ink/[0.01] transition-colors group">
                          <td className="px-10 py-8">
                            <p className="text-sm font-bold uppercase tracking-tight group-hover:text-gold transition-colors">#{(order.orderId || order.id).toUpperCase()}</p>
                          </td>
                          <td className="px-10 py-8">
                            <div className="space-y-1">
                              <p className="text-sm font-bold">{order.shippingAddress.fullName}</p>
                              <p className="text-[10px] text-ink/40 uppercase font-bold tracking-wider">{order.shippingAddress.email}</p>
                              {(order.shippingAddress as any).phone && (
                                <p className="text-[10px] text-ink/40 font-medium">{(order.shippingAddress as any).phone}</p>
                              )}
                              {(order.shippingAddress as any).address && (
                                <p className="text-[10px] text-ink/30 font-medium truncate max-w-[200px]">{(order.shippingAddress as any).address}, {(order.shippingAddress as any).city}</p>
                              )}
                              {getOrderColorsLabel(order) && (
                                <p className="text-[10px] text-ink/40 uppercase font-bold tracking-wider">Color: {getOrderColorsLabel(order)}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <p className="text-[10px] text-ink/60 uppercase font-bold tracking-widest">{formatDate(order.createdAt)}</p>
                          </td>
                          <td className="px-10 py-8">
                            <p className="text-lg font-serif italic">{formatCurrency(order.total)}</p>
                          </td>
                          <td className="px-10 py-8">
                            <span className={cn(
                              "text-[10px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-full inline-flex",
                              normalizeStatus(order.status) === 'delivered' ? "bg-emerald-50 text-emerald-600" :
                              normalizeStatus(order.status) === 'shipped' ? "bg-blue-50 text-blue-600" :
                              normalizeStatus(order.status) === 'packed' ? "bg-amber-50 text-amber-600" :
                              normalizeStatus(order.status) === 'confirmed' ? "bg-cyan-50 text-cyan-600" :
                              normalizeStatus(order.status) === 'cancelled' ? "bg-red-50 text-red-600" :
                              "bg-orange-50 text-orange-600"
                            )}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {[
                                { key: 'confirmed', label: 'Confirm' },
                                { key: 'packed', label: 'Pack' },
                                { key: 'shipped', label: 'Ship' },
                                { key: 'delivered', label: 'Deliver' },
                                { key: 'cancelled', label: 'Cancel' },
                              ].map((action) => {
                                const target = action.key as Order['status'];
                                const normalizedCurrent = normalizeStatus(order.status);
                                const isCancel = target === 'cancelled';
                                const disabled =
                                  (isCancel
                                    ? normalizedCurrent === 'cancelled' || normalizedCurrent === 'delivered'
                                    : !canAdvanceTo(order.status, target) || normalizedCurrent === target || normalizedCurrent === 'cancelled') ||
                                  updatingOrderRefs.includes(String(order.id || '')) ||
                                  updatingOrderRefs.includes(String(order.orderId || ''));
                                return (
                                  <button
                                    key={action.key}
                                    onClick={() => handleUpdateOrderStatus(order, target)}
                                    disabled={disabled}
                                    className={cn(
                                      "px-3 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-colors",
                                      disabled
                                        ? "bg-ink/5 text-ink/30 cursor-not-allowed"
                                        : isCancel
                                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                                          : "bg-gold/10 text-gold hover:bg-gold/20"
                                    )}
                                  >
                                    {action.label}
                                  </button>
                                );
                              })}
                              <button 
                                onClick={() => handleOpenTrackingModal(order)}
                                className="p-3 hover:bg-gold/10 rounded-xl transition-colors text-gold"
                                title="Update Tracking"
                              >
                                <Truck size={16} />
                              </button>
                              <button className="p-3 hover:bg-ink/5 rounded-xl transition-colors text-ink/60 hover:text-ink">
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'inquiries' && (
              <div className="bg-white border border-ink/5 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="p-10 border-b border-ink/5">
                  <h3 className="text-xl font-serif italic">Customer Inquiries</h3>
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mt-1">Manage and respond to contact form submissions</p>
                </div>
                <div className="divide-y divide-ink/5">
                  {inquiries.length === 0 ? (
                    <div className="p-12 text-center text-ink/40 font-serif italic">No inquiries found.</div>
                  ) : (
                    inquiries.map((inquiry) => (
                      <div key={inquiry.id} className="p-8 hover:bg-ink/[0.01] transition-colors group">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                          <div className="space-y-4 flex-1">
                            <div className="flex items-center space-x-4">
                              <h4 className="font-bold text-lg">{inquiry.subject}</h4>
                              <span className={cn(
                                "text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-full",
                                inquiry.status === 'new' ? "bg-red-50 text-red-600" :
                                inquiry.status === 'read' ? "bg-amber-50 text-amber-600" :
                                "bg-emerald-50 text-emerald-600"
                              )}>
                                {inquiry.status}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">{inquiry.name}</span>
                              <span className="text-ink/40 mx-2">|</span>
                              <a href={`mailto:${inquiry.email}`} className="text-gold hover:underline">{inquiry.email}</a>
                            </div>
                            <p className="text-sm text-ink/80 leading-relaxed bg-ink/[0.02] p-4 rounded-xl border border-ink/5">
                              {inquiry.message}
                            </p>
                            <div className="text-[10px] text-ink/40 uppercase tracking-widest font-bold">
                              {formatDate(inquiry.createdAt)}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-3 min-w-[140px]">
                            <select
                              value={inquiry.status}
                              onChange={(e) => handleUpdateInquiryStatus(inquiry.id, e.target.value as Inquiry['status'])}
                              className="w-full text-[10px] uppercase tracking-[0.2em] font-bold px-4 py-2.5 rounded-xl border border-ink/10 focus:ring-1 focus:ring-gold focus:border-gold cursor-pointer transition-colors"
                            >
                              <option value="new">Mark Unread</option>
                              <option value="read">Mark Read</option>
                              <option value="replied">Mark Replied</option>
                            </select>
                            <a
                              href={`mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject)}`}
                              className="w-full text-center text-[10px] uppercase tracking-[0.2em] font-bold px-4 py-2.5 rounded-xl bg-ink text-white hover:bg-ink/90 transition-colors"
                            >
                              Reply via Email
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {activeTab === 'siteConfig' && (
              <div className="space-y-12">
                {/* Header Config */}
                <div className="bg-white p-10 border border-ink/5 rounded-[2rem] shadow-sm space-y-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-serif italic">Header Configuration</h3>
                    <Button onClick={() => handleSaveSiteConfig('header')} size="sm">Save Header</Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Logo Text</label>
                      <Input 
                        value={headerConfig.logoText}
                        onChange={(e) => setHeaderConfig({...headerConfig, logoText: e.target.value})}
                        placeholder="e.g. Luxa"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Logo Accent</label>
                      <Input 
                        value={headerConfig.logoAccent}
                        onChange={(e) => setHeaderConfig({...headerConfig, logoAccent: e.target.value})}
                        placeholder="e.g. Wach"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Navigation Links</label>
                      <button 
                        onClick={() => setHeaderConfig({
                          ...headerConfig, 
                          navLinks: [...headerConfig.navLinks, { name: '', path: '' }]
                        })}
                        className="text-[10px] uppercase tracking-widest font-bold text-gold hover:text-ink transition-colors flex items-center space-x-2"
                      >
                        <Plus size={12} />
                        <span>Add Link</span>
                      </button>
                    </div>
                    <div className="space-y-4">
                      {headerConfig.navLinks.map((link, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <Input 
                            value={link.name}
                            onChange={(e) => {
                              const newLinks = [...headerConfig.navLinks];
                              newLinks[index].name = e.target.value;
                              setHeaderConfig({...headerConfig, navLinks: newLinks});
                            }}
                            placeholder="Link Name"
                            className="flex-1"
                          />
                          <Input 
                            value={link.path}
                            onChange={(e) => {
                              const newLinks = [...headerConfig.navLinks];
                              newLinks[index].path = e.target.value;
                              setHeaderConfig({...headerConfig, navLinks: newLinks});
                            }}
                            placeholder="Path (e.g. /shop)"
                            className="flex-1"
                          />
                          <button 
                            onClick={() => {
                              const newLinks = headerConfig.navLinks.filter((_, i) => i !== index);
                              setHeaderConfig({...headerConfig, navLinks: newLinks});
                            }}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Config */}
                <div className="bg-white p-10 border border-ink/5 rounded-[2rem] shadow-sm space-y-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-serif italic">Footer Configuration</h3>
                    <Button onClick={() => handleSaveSiteConfig('footer')} size="sm">Save Footer</Button>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">About Text</label>
                    <textarea 
                      value={footerConfig.aboutText}
                      onChange={(e) => setFooterConfig({...footerConfig, aboutText: e.target.value})}
                      className="w-full p-6 bg-ink/[0.02] border-none rounded-2xl text-sm focus:ring-1 focus:ring-gold transition-all min-h-[120px]"
                      placeholder="Brief description of the brand..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Address</label>
                      <Input 
                        value={footerConfig.address}
                        onChange={(e) => setFooterConfig({...footerConfig, address: e.target.value})}
                        placeholder="Store Address"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Phone</label>
                      <Input 
                        value={footerConfig.phone}
                        onChange={(e) => setFooterConfig({...footerConfig, phone: e.target.value})}
                        placeholder="Contact Phone"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Email</label>
                      <Input 
                        value={footerConfig.email}
                        onChange={(e) => setFooterConfig({...footerConfig, email: e.target.value})}
                        placeholder="Contact Email"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">WhatsApp Chat Link</label>
                    <Input
                      value={footerConfig.whatsappLink}
                      onChange={(e) => setFooterConfig({ ...footerConfig, whatsappLink: e.target.value })}
                      placeholder="e.g. https://wa.me/923001234567"
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Quick Social URLs</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          value={getSocialUrl('Instagram')}
                          onChange={(e) => setSocialUrl('Instagram', e.target.value)}
                          placeholder="Instagram URL"
                        />
                        <Input
                          value={getSocialUrl('Twitter')}
                          onChange={(e) => setSocialUrl('Twitter', e.target.value)}
                          placeholder="Twitter URL"
                        />
                        <Input
                          value={getSocialUrl('Facebook')}
                          onChange={(e) => setSocialUrl('Facebook', e.target.value)}
                          placeholder="Facebook URL"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Social Links</label>
                      <button 
                        onClick={() => setFooterConfig({
                          ...footerConfig, 
                          socialLinks: [...footerConfig.socialLinks, { platform: '', url: '' }]
                        })}
                        className="text-[10px] uppercase tracking-widest font-bold text-gold hover:text-ink transition-colors flex items-center space-x-2"
                      >
                        <Plus size={12} />
                        <span>Add Social</span>
                      </button>
                    </div>
                    <div className="space-y-4">
                      {footerConfig.socialLinks.map((link, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <select 
                            value={link.platform}
                            onChange={(e) => {
                              const newLinks = [...footerConfig.socialLinks];
                              newLinks[index].platform = e.target.value;
                              setFooterConfig({...footerConfig, socialLinks: newLinks});
                            }}
                            className="flex-1 p-5 bg-ink/[0.02] border-none rounded-2xl text-sm focus:ring-1 focus:ring-gold transition-all"
                          >
                            <option value="">Select Platform</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Twitter">Twitter</option>
                            <option value="Facebook">Facebook</option>
                          </select>
                          <Input 
                            value={link.url}
                            onChange={(e) => {
                              const newLinks = [...footerConfig.socialLinks];
                              newLinks[index].url = e.target.value;
                              setFooterConfig({...footerConfig, socialLinks: newLinks});
                            }}
                            placeholder="URL (e.g. https://instagram.com/...)"
                            className="flex-[2]"
                          />
                          <button 
                            onClick={() => {
                              const newLinks = footerConfig.socialLinks.filter((_, i) => i !== index);
                              setFooterConfig({...footerConfig, socialLinks: newLinks});
                            }}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Copyright Text</label>
                    <Input 
                      value={footerConfig.copyrightText}
                      onChange={(e) => setFooterConfig({...footerConfig, copyrightText: e.target.value})}
                      placeholder="e.g. © 2026 Luxa Wach. All Rights Reserved."
                    />
                  </div>
                </div>

                {/* Home Page Config */}
                <div className="bg-white p-10 border border-ink/5 rounded-[2rem] shadow-sm space-y-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-serif italic">Home Page Configuration</h3>
                    <Button onClick={() => handleSaveSiteConfig('home')} size="sm">Save Home Config</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Hero Button Text</label>
                      <Input 
                        value={homeConfig.heroButtonText}
                        onChange={(e) => setHomeConfig({...homeConfig, heroButtonText: e.target.value})}
                        placeholder="e.g. Explore Collection"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">About Us Button Text</label>
                      <Input 
                        value={homeConfig.heritageButtonText}
                        onChange={(e) => setHomeConfig({...homeConfig, heritageButtonText: e.target.value})}
                        placeholder="e.g. About Us"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Collections Button Text</label>
                      <Input 
                        value={homeConfig.collectionsButtonText}
                        onChange={(e) => setHomeConfig({...homeConfig, collectionsButtonText: e.target.value})}
                        placeholder="e.g. View All Collections"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Bespoke Button Text</label>
                      <Input 
                        value={homeConfig.bespokeButtonText}
                        onChange={(e) => setHomeConfig({...homeConfig, bespokeButtonText: e.target.value})}
                        placeholder="e.g. Consult a Master"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-10 py-12">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40 mb-2">Appearance</p>
                  <h2 className="text-3xl font-serif italic">Theme & Colors</h2>
                  <p className="text-sm text-ink/60 mt-2">Choose a color theme for your entire store. Changes apply instantly, site-wide.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setThemeById(preset.id)}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all text-left space-y-3 group',
                        currentTheme.id === preset.id
                          ? 'border-ink shadow-md'
                          : 'border-ink/10 hover:border-ink/30'
                      )}
                    >
                      {/* Color preview chips */}
                      <div className="flex gap-1.5">
                        <div className="w-8 h-8 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: preset.gold }} />
                        <div className="w-8 h-8 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: preset.ink }} />
                        <div className="w-8 h-8 rounded-full border border-ink/10 shadow-sm" style={{ backgroundColor: preset.offWhite }} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink">{preset.name}</p>
                        <p className="text-[10px] text-ink/40 mt-0.5 font-mono">{preset.gold}</p>
                      </div>
                      {currentTheme.id === preset.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-ink rounded-full flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 12 10" fill="white"><path d="M1 5l3 4L11 1" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="bg-ink/[0.02] border border-ink/10 rounded-xl p-8 space-y-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Live Preview</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-12 h-12 rounded-full" style={{ backgroundColor: currentTheme.gold }} />
                    <span className="text-sm font-bold" style={{ color: currentTheme.gold }}>Accent — {currentTheme.gold}</span>
                    <div className="w-12 h-12 rounded-full" style={{ backgroundColor: currentTheme.ink }} />
                    <span className="text-sm font-bold" style={{ color: currentTheme.ink }}>Text — {currentTheme.ink}</span>
                    <div className="w-12 h-12 rounded-full border border-ink/10" style={{ backgroundColor: currentTheme.offWhite }} />
                    <span className="text-sm font-bold text-ink/60">Background — {currentTheme.offWhite}</span>
                  </div>
                  <p className="text-xs text-ink/40 mt-2">Theme is saved in your browser and automatically applied every time you visit.</p>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-12 border-b border-ink/5 flex items-center justify-between bg-[#FBFBFB]">
                <div>
                  <h2 className="text-4xl font-serif italic">{editingProduct ? 'Refine Timepiece' : 'New Acquisition'}</h2>
                  <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold mt-2">Curating the Collection</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-4 hover:bg-ink/5 rounded-full transition-colors group"
                >
                  <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-12 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <Input 
                    label="Product Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Royal Oak"
                  />
                  <Input 
                    label="Brand / Manufacturer"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                    placeholder="e.g. Audemars Piguet"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">Narrative & Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-6 bg-ink/[0.02] border-none rounded-2xl text-sm focus:ring-1 focus:ring-gold min-h-[160px] resize-none leading-relaxed placeholder:text-ink/20"
                    required
                    placeholder="Describe the heritage and craftsmanship of this timepiece..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">Specifications Details</label>
                  <textarea 
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    className="w-full p-6 bg-ink/[0.02] border-none rounded-2xl text-sm focus:ring-1 focus:ring-gold min-h-[120px] resize-none leading-relaxed placeholder:text-ink/20"
                    placeholder="Enter technical specifications (e.g. Case Size: 41mm, Movement: Automatic)..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">Shipping Options</label>
                  <textarea 
                    value={formData.shipping}
                    onChange={(e) => setFormData({ ...formData, shipping: e.target.value })}
                    className="w-full p-6 bg-ink/[0.02] border-none rounded-2xl text-sm focus:ring-1 focus:ring-gold min-h-[100px] resize-none leading-relaxed placeholder:text-ink/20"
                    placeholder="Enter shipping details or options..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <Input 
                    label="Valuation (Rs)"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">Classification</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-5 bg-ink/[0.02] border-none rounded-2xl text-sm focus:ring-1 focus:ring-gold cursor-pointer appearance-none"
                    >
                      <option value="Classic">Classic</option>
                      <option value="Sport">Sport</option>
                      <option value="Complication">Complication</option>
                      <option value="Heritage">Heritage</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Premium">Premium</option>
                      <option value="Hot Sellers">Hot Sellers</option>
                    </select>
                  </div>
                  <Input 
                    label="Inventory Count"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center justify-between p-5 bg-ink/[0.02] rounded-2xl border border-ink/10">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">Homepage Visibility</p>
                    <p className="text-xs text-ink/50 mt-1">Show this product in the home page featured section.</p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.featured)}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 accent-gold"
                    />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-ink/70">Show on Home</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">Product Images (Up to 4)</label>
                  <p className="text-[8px] uppercase tracking-widest text-ink/30 leading-relaxed max-w-lg mb-6">
                    Click or drag &amp; drop to upload. Max 15MB per image. The first image is used as the primary thumbnail.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[0, 1, 2, 3].map(index => (
                      <div key={index}>
                        <div
                          className={cn(
                            "relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group overflow-hidden bg-ink/[0.01] cursor-pointer",
                            formData.images[index]
                              ? "border-solid border-gold/30"
                              : "border-ink/10 hover:border-gold/40"
                          )}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleImageUpload({ target: { files: [file] } } as any, index);
                          }}
                        >
                          {formData.images[index] ? (
                            <>
                              <img
                                src={formData.images[index]}
                                alt={`Image ${index + 1}`}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const imgs = [...formData.images];
                                    imgs[index] = '';
                                    const files = [...imageFiles];
                                    files[index] = null;
                                    setImageFiles(files);
                                    setFormData({ ...formData, images: imgs });
                                  }}
                                  className="bg-white text-ink text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-gold/5 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                                {uploadingIndex === index
                                  ? <Loader2 size={18} className="animate-spin" />
                                  : <Upload size={18} />
                                }
                              </div>
                              <p className="text-[9px] uppercase tracking-widest font-bold text-ink/30 text-center px-2 whitespace-pre-line">
                                {uploadingIndex === index ? 'Uploading...' : `Click or drop\nImage ${index + 1}`}
                              </p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, index)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* ── Color Variants ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">
                      Color Variants <span className="text-ink/20 normal-case">(optional — each color gets its own photos)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setColorVariants(prev => [...prev, { colorName: '', colorHex: '#000000', images: ['', '', '', ''] }])}
                      className="text-[10px] font-bold uppercase tracking-widest text-gold hover:text-gold/70 flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} /> Add color
                    </button>
                  </div>

                  {colorVariants.map((variant, vi) => (
                    <div key={vi} className="border border-ink/10 rounded-2xl p-5 space-y-4 relative">
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => setColorVariants(prev => prev.filter((_, i) => i !== vi))}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-ink/5 hover:bg-red-50 flex items-center justify-center text-ink/40 hover:text-red-500 transition-all"
                      >
                        <X size={12} />
                      </button>

                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Color swatch preview */}
                        <div className="w-10 h-10 rounded-full border border-ink/10 shadow-inner flex-shrink-0" style={{ backgroundColor: variant.colorHex }} />

                        {/* Color name */}
                        <div className="flex-1 min-w-[120px]">
                          <Input
                            label="Color name"
                            placeholder="e.g. Midnight Black"
                            value={variant.colorName}
                            onChange={(e) => setColorVariants(prev => {
                              const copy = [...prev];
                              copy[vi] = { ...copy[vi], colorName: e.target.value };
                              return copy;
                            })}
                          />
                        </div>

                        {/* Hex color picker */}
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40 block">Color</label>
                          <input
                            type="color"
                            value={variant.colorHex}
                            onChange={(e) => setColorVariants(prev => {
                              const copy = [...prev];
                              copy[vi] = { ...copy[vi], colorHex: e.target.value };
                              return copy;
                            })}
                            className="w-12 h-12 rounded-lg border border-ink/10 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Images for this color */}
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-ink/30 mb-3">Photos for this color</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[0, 1, 2, 3].map(imgIdx => (
                            <div key={imgIdx} className="space-y-2">
                              <Input
                                placeholder={`Image ${imgIdx + 1} URL`}
                                value={variant.images[imgIdx] || ''}
                                onChange={(e) => setColorVariants(prev => {
                                  const copy = [...prev];
                                  const imgs = [...copy[vi].images];
                                  imgs[imgIdx] = e.target.value;
                                  copy[vi] = { ...copy[vi], images: imgs };
                                  return copy;
                                })}
                                className="text-xs py-2 px-3 h-auto"
                              />
                              <label className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gold hover:text-gold/70 cursor-pointer">
                                <Upload size={12} />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleVariantImageUpload(e, vi, imgIdx)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colorVariants.length === 0 && (
                    <p className="text-xs text-ink/30 italic py-4 text-center border border-dashed border-ink/10 rounded-2xl">
                      No colors added yet. Click "Add color" to give customers a color choice.
                    </p>
                  )}
                </div>

                <div className="pt-8 flex gap-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsModalOpen(false)}
                    size="lg"
                  >
                    Discard
                  </Button>
                  <Button type="submit" className="flex-1" size="lg">
                    {editingProduct ? 'Save Refinements' : 'Add to Collection'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tracking Modal */}
      <AnimatePresence>
        {isTrackingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrackingModalOpen(false)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-ink/5 flex items-center justify-between bg-[#FBFBFB]">
                <div>
                  <h2 className="text-3xl font-serif italic">Update Tracking</h2>
                  <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold mt-2">Order #{(selectedOrderForTracking?.orderId || selectedOrderForTracking?.id || '').toUpperCase()}</p>
                </div>
                <button 
                  onClick={() => setIsTrackingModalOpen(false)}
                  className="p-4 hover:bg-ink/5 rounded-full transition-colors group"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              <form onSubmit={handleSaveTracking} className="p-10 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">Status Milestones</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'pending', label: 'Pending' },
                      { id: 'confirmed', label: 'Confirmed' },
                      { id: 'packed', label: 'Packed' },
                      { id: 'shipped', label: 'Shipped' },
                      { id: 'delivered', label: 'Delivered' }
                    ].map((step) => (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setTrackingFormData({ ...trackingFormData, status: step.id as Order['status'] })}
                        className={cn(
                          "flex items-center space-x-3 p-4 rounded-2xl border transition-all text-left",
                          trackingFormData.status === step.id 
                            ? "bg-gold/10 border-gold text-gold" 
                            : "bg-ink/[0.02] border-transparent text-ink/40 hover:bg-ink/[0.04]"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          trackingFormData.status === step.id ? "border-gold bg-gold" : "border-ink/10"
                        )}>
                          {trackingFormData.status === step.id && <CheckCircle size={12} className="text-white" />}
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-bold">{step.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Carrier"
                    value={trackingFormData.carrier}
                    onChange={(e) => setTrackingFormData({ ...trackingFormData, carrier: e.target.value })}
                    placeholder="e.g. FedEx, DHL"
                  />
                  <Input 
                    label="Tracking Number"
                    value={trackingFormData.trackingNumber}
                    onChange={(e) => setTrackingFormData({ ...trackingFormData, trackingNumber: e.target.value })}
                    placeholder="Enter ID"
                  />
                </div>
                <Input 
                  label="Estimated Delivery Date"
                  type="date"
                  value={trackingFormData.estimatedDeliveryDate}
                  onChange={(e) => setTrackingFormData({ ...trackingFormData, estimatedDeliveryDate: e.target.value })}
                  placeholder="Select date"
                />

                <div className="pt-4 flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsTrackingModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Update Tracking
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}} />
    </div>
  );
};
