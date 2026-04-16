export interface ColorVariant {
  colorName: string;   // e.g. "Red", "Green"
  colorHex: string;   // e.g. "#ef4444"
  images: string[];   // up to 4 photos for this color
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  description: string;
  specifications?: string;
  shipping?: string;
  images: string[];         // default / first-color images
  colorVariants?: ColorVariant[];  // optional multi-color variants
  category: string;
  stock: number;
  featured?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Order {
  id: string;
  orderId?: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'processing' | 'cancelled';
  timeline?: Array<{
    status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
    time: string | number;
  }>;
  shippingAddress: Address;
  tracking?: {
    carrier: string;
    trackingNumber: string;
    estimatedDeliveryDate?: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface CartItem {
  cartKey?: string;
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image: string;
  variantName?: string;
  variantHex?: string;
}

export interface Address {
  fullName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user' | 'customer';
  wishlist?: string[];
  createdAt: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: number;
}

export interface CustomerReview {
  id: string;
  name: string;
  rating: number;
  review: string;
  createdAt: number;
}
