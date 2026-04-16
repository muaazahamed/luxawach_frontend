/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './ThemeContext';

const Home = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Shop = React.lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const Cart = React.lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const Checkout = React.lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Signup = React.lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const OAuthSuccess = React.lazy(() => import('./pages/OAuthSuccess').then(m => ({ default: m.OAuthSuccess })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Bespoke = React.lazy(() => import('./pages/Bespoke').then(m => ({ default: m.Bespoke })));
const OrderSuccess = React.lazy(() => import('./pages/OrderSuccess').then(m => ({ default: m.OrderSuccess })));
const OrderHistory = React.lazy(() => import('./pages/OrderHistory').then(m => ({ default: m.OrderHistory })));
const Wishlist = React.lazy(() => import('./pages/Wishlist').then(m => ({ default: m.Wishlist })));
const TrackOrder = React.lazy(() => import('./pages/TrackOrder').then(m => ({ default: m.TrackOrder })));
const Contact = React.lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Concierge = React.lazy(() => import('./components/Concierge').then(m => ({ default: m.Concierge })));

import { CartProvider } from './CartContext';
import { UserProvider } from './UserContext';
import { SiteConfigProvider } from './SiteConfigContext';
import { Toaster } from 'sonner';
import { PrivateRoute } from './components/PrivateRoute';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const GlobalBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/admin') return null;

  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed left-4 bottom-4 md:left-6 md:bottom-24 z-50 w-11 h-11 md:w-12 md:h-12 bg-white border border-ink/10 shadow-sm rounded-full flex items-center justify-center text-ink hover:bg-ink hover:text-white transition-all group"
      aria-label="Go Back"
    >
      <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
    </button>
  );
};

export default function App() {
  const [showConcierge, setShowConcierge] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowConcierge(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
      <UserProvider>
        <SiteConfigProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <div className="min-h-screen flex flex-col relative">
                <GlobalBackButton />
                <Toaster position="top-center" richColors />
                <Navbar />
                <main className="flex-grow">
                  <React.Suspense fallback={
                    <div className="h-screen flex items-center justify-center bg-white">
                      <div className="w-10 h-10 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                    </div>
                  }>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/auth" element={<Navigate to="/login" replace />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/oauth-success" element={<OAuthSuccess />} />
                      <Route
                        path="/dashboard"
                        element={
                          <PrivateRoute>
                            <Dashboard />
                          </PrivateRoute>
                        }
                      />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/bespoke" element={<Bespoke />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/order-success" element={<OrderSuccess />} />
                      <Route 
                        path="/order-history" 
                        element={
                          <PrivateRoute>
                            <OrderHistory />
                          </PrivateRoute>
                        } 
                      />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/track-order" element={<TrackOrder />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route 
                        path="/admin" 
                        element={
                          <PrivateRoute adminOnly>
                            <AdminDashboard />
                          </PrivateRoute>
                        } 
                      />
                      <Route path="*" element={<Navigate to="/shop" replace />} />
                    </Routes>
                  </React.Suspense>
                </main>
                <Footer />
                <React.Suspense fallback={null}>
                  {showConcierge ? <Concierge /> : null}
                </React.Suspense>
              </div>
            </Router>
          </CartProvider>
        </SiteConfigProvider>
      </UserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
