import { Product } from './types';


export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'The Celestial Tourbillon',
    brand: 'Aethelgard',
    price: 125000,
    description: 'A masterpiece of horological engineering, featuring a hand-finished tourbillon movement and a dial crafted from genuine meteorite.',
    images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=1000'],
    category: 'Grand Complications',
    stock: 3,
    featured: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2',
    name: 'Oceanic Chronometer',
    brand: 'Marinus',
    price: 18500,
    description: 'Precision timing for the modern explorer. Water-resistant to 300 meters with a robust titanium case.',
    images: ['https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1000'],
    category: 'Sport',
    stock: 12,
    featured: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '3',
    name: 'Minimalist Moonphase',
    brand: 'Lumina',
    price: 42000,
    description: 'Elegant simplicity meets celestial tracking. A slim profile watch with a stunning moonphase complication.',
    images: ['https://images.unsplash.com/photo-1508685096489-7aac291ba597?auto=format&fit=crop&q=80&w=1000'],
    category: 'Dress',
    stock: 5,
    featured: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '4',
    name: 'Heritage Skeleton',
    brand: 'Vanguard',
    price: 68000,
    description: 'Revealing the inner soul of time. A fully skeletonized movement housed in an 18k rose gold case.',
    images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&q=80&w=1000'],
    category: 'Heritage',
    stock: 2,
    featured: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// seedProducts must be a plain array (not a function) so api.ts offline fallback can JSON.stringify it correctly
export const seedProducts: Product[] = MOCK_PRODUCTS;

