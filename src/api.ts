import axios from 'axios';
import { AUTH_TOKEN_KEY, clearAuthStorage, getStoredToken } from './authToken';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create a configured Axios instance
const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to insert the JWT token into requests
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Lazily load mock data only when API is unavailable (keeps it out of the main bundle)
const getLocalProducts = async () => {
  try {
    const local = localStorage.getItem('mockProducts');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id) {
        return parsed;
      }
      localStorage.removeItem('mockProducts');
    }
  } catch {
    localStorage.removeItem('mockProducts');
  }
  // Dynamic import — only fetched on first offline fallback
  const { seedProducts } = await import('./mockData');
  localStorage.setItem('mockProducts', JSON.stringify(seedProducts));
  return seedProducts;
};

const getLocalOrders = () => {
  const mockOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
  const legacyOrders = JSON.parse(localStorage.getItem('buyNowOrders') || '[]');
  const normalizedLegacy = Array.isArray(legacyOrders)
    ? legacyOrders.map((o: any, idx: number) => ({
        id: o?.id || `legacy-order-${Date.now()}-${idx}`,
        _id: o?.id || `legacy-order-${Date.now()}-${idx}`,
        orderId: o?.orderId || o?.id || `ORD${Date.now().toString().slice(-8)}`,
        userId: o?.shippingAddress?.email || 'guest',
        items: Array.isArray(o?.items)
          ? o.items
          : [{
              product: o?.product || 'unknown',
              name: o?.product || 'Offline Order',
              quantity: Number(o?.quantity) || 1,
              price: Number(o?.total) || 0,
              image: '',
            }],
        total: Number(o?.total) || 0,
        shippingAddress: {
          fullName: o?.shippingAddress?.fullName || '',
          email: o?.shippingAddress?.email || '',
          phone: o?.shippingAddress?.phone || '',
          address: o?.shippingAddress?.address || '',
          city: o?.shippingAddress?.city || '',
          postalCode: o?.shippingAddress?.postalCode || '',
        },
        status: o?.status || 'pending',
        timeline: Array.isArray(o?.timeline) && o.timeline.length > 0
          ? o.timeline
          : [{ status: o?.status || 'pending', time: o?.createdAt || Date.now() }],
        createdAt: o?.createdAt || Date.now(),
      }))
    : [];
  return [...(Array.isArray(mockOrders) ? mockOrders : []), ...normalizedLegacy];
};

const normalizeLookupId = (value: string) => {
  const cleaned = String(value || '').trim().toUpperCase().replace(/^#/, '').replace(/\s+/g, '');
  if (!cleaned) return cleaned;
  if (cleaned.startsWith('ORD')) return cleaned;
  if (/^\d{5,}$/.test(cleaned)) return `ORD${cleaned}`;
  return cleaned;
};

// Add interceptor for offline fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      clearAuthStorage();
    }

    const url = error.config?.url || '';
    if (error.config?.method === 'get') {
      if (url.includes('/products')) return { data: await getLocalProducts() };
      if (url.includes('/orders')) {
        const orders = getLocalOrders();
        const path = String(url).split('?')[0];
        if (path.endsWith('/orders/myorders')) {
          let userInfo: any = null;
          try {
            userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
          } catch {
            userInfo = null;
          }

          const identifiers = [
            String(userInfo?.uid || '').toUpperCase(),
            String(userInfo?.email || '').toUpperCase(),
          ].filter(Boolean);

          if (identifiers.length === 0) return { data: [] };

          const myOrders = orders.filter((o: any) => {
            const orderUserId = String(o?.userId || '').toUpperCase();
            const orderEmail = String(o?.shippingAddress?.email || '').toUpperCase();
            return identifiers.includes(orderUserId) || identifiers.includes(orderEmail);
          });
          // Preview-friendly fallback: if identity matching fails, still return local orders
          // so order history remains visible in offline/demo mode.
          const effectiveOrders = myOrders.length > 0 ? myOrders : orders;
          const sortedOrders = [...effectiveOrders].sort((a: any, b: any) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
          return { data: sortedOrders };
        }

        const match = path.match(/\/orders\/([^/]+)$/);

        if (match) {
          const rawLookup = decodeURIComponent(match[1] || '');
          const lookup = normalizeLookupId(rawLookup);
          const found = orders.find((o: any) => {
            const id = String(o?.id || '').toUpperCase();
            const mongoId = String(o?._id || '').toUpperCase();
            const orderId = String(o?.orderId || '').toUpperCase();
            return (
              id === lookup ||
              mongoId === lookup ||
              orderId === lookup ||
              orderId === rawLookup.toUpperCase() ||
              orderId === normalizeLookupId(rawLookup.replace(/^ORD/i, ''))
            );
          });

          if (found) {
            return { data: found };
          }
          return Promise.reject({
            ...error,
            response: {
              ...(error.response || {}),
              status: 404,
              data: { message: 'Order not found' },
            },
          });
        }

        return { data: orders };
      }
      if (url.includes('/inquiries')) return { data: JSON.parse(localStorage.getItem('mockInquiries') || '[]') };
      if (url.includes('/siteconfig')) {
        const path = String(url).split('?')[0].toLowerCase();
        const match = path.match(/\/siteconfig\/(header|footer|home)$/);
        if (match) {
          const key = `mockSiteConfig_${match[1]}`;
          try {
            return { data: JSON.parse(localStorage.getItem(key) || 'null') };
          } catch {
            localStorage.removeItem(key);
            return { data: null };
          }
        }
        return { data: null };
      }
    }
    return Promise.reject(error);
  }
);

export default api;
