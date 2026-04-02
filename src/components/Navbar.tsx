import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Search, History, LogOut, ShieldCheck, Heart } from 'lucide-react';
import { cn } from '../utils';
import { Button } from './Button';
import { useUser } from '../UserContext';
import { useCart } from '../CartContext';
import { useSiteConfig } from '../SiteConfigContext';
import { getTokenRole, isTokenValid } from '../authToken';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useUser();
  const { cart } = useCart();
  const { header } = useSiteConfig();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const hasToken = isTokenValid();
  const tokenRole = getTokenRole();
  const effectiveRole = user?.role || tokenRole;
  const isAdmin = effectiveRole === 'admin';
  const dashboardPath = isAdmin ? '/admin' : '/dashboard';
  const dashboardLabel = isAdmin ? 'Admin Dashboard' : 'Dashboard';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const configuredLinks = header?.navLinks?.filter((l: any) => l.name && l.path) || [];
  const canonicalNav = [
    { name: 'Home', path: '/' },
    { name: 'Collections', path: '/shop' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'About Us', path: '/#contact' },
    { name: 'Track Order', path: '/track-order' },
  ];
  const navLinks = canonicalNav.map((item) => {
    const itemName = item.name.toLowerCase();
    const matchByName = configuredLinks.find((link: any) =>
      String(link?.name || '').trim().toLowerCase() === itemName
    );

    // About Us should open footer section directly.
    if (itemName === 'about us') {
      return { name: 'About Us', path: '/#contact' };
    }

    // Keep "Contact Us" working even when older config saved it as "Contact".
    if (!matchByName && itemName === 'contact us') {
      const legacyContact = configuredLinks.find((link: any) =>
        String(link?.name || '').trim().toLowerCase() === 'contact'
      );
      if (legacyContact) return { name: 'Contact Us', path: String(legacyContact.path || '/contact') };
    }

    return matchByName ? { name: String(matchByName.name), path: String(matchByName.path) } : item;
  });

  const isHome = location.pathname === '/';

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 w-full z-50 transition-all duration-500 px-6 md:px-12',
        isScrolled || !isHome ? 'bg-white py-4 border-b border-ink/5' : 'bg-transparent py-6'
      )}
    >
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-ink"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8 lg:space-x-12 z-20">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-sm font-medium text-ink/75 hover:text-ink transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <Link
          to={hasToken ? dashboardPath : '/'}
          className={cn(
            "relative md:absolute md:left-1/2 md:-translate-x-1/2 text-xl md:text-3xl font-bold tracking-tighter text-ink whitespace-nowrap z-10 px-2",
            isHome ? "font-serif italic" : "font-sans",
            "md:whitespace-normal"
          )}
        >
          {header.logoText} <span className="text-gold">{header.logoAccent}</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center space-x-3 md:space-x-6 lg:space-x-8 z-20">
          {isAdmin && (
            <Link 
              to="/admin" 
              className="hidden sm:flex items-center space-x-2 text-gold hover:text-gold/80 transition-colors"
              title="Admin Dashboard"
            >
              <ShieldCheck size={18} strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Admin</span>
            </Link>
          )}
          
          <button className="hidden sm:inline-flex text-ink/60 hover:text-ink transition-colors">
            <Search size={18} strokeWidth={1.5} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="text-ink/60 hover:text-ink transition-colors"
            >
              <User size={18} strokeWidth={1.5} className={cn(isProfileOpen && "text-gold")} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-4 w-48 bg-white border border-ink/5 shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-ink/5 mb-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Account</p>
                  <p className="text-xs font-serif italic truncate">{user?.displayName || (hasToken ? 'User' : 'Guest')}</p>
                </div>

                {!hasToken && (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center space-x-3 px-4 py-2 text-xs hover:bg-gold/5 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User size={14} className="text-gold" />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      to="/signup"
                      className="flex items-center space-x-3 px-4 py-2 text-xs hover:bg-gold/5 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Heart size={14} className="text-gold" />
                      <span>Create Account</span>
                    </Link>
                  </>
                )}

                {hasToken && (
                  <Link
                    to={dashboardPath}
                    className="flex items-center space-x-3 px-4 py-2 text-xs hover:bg-gold/5 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <ShieldCheck size={14} className="text-gold" />
                    <span>{dashboardLabel}</span>
                  </Link>
                )}

                {hasToken && (
                  <>
                    <Link 
                      to="/order-history" 
                      className="flex items-center space-x-3 px-4 py-2 text-xs hover:bg-gold/5 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <History size={14} className="text-gold" />
                      <span>Order History</span>
                    </Link>

                    <Link 
                      to="/wishlist" 
                      className="flex items-center space-x-3 px-4 py-2 text-xs hover:bg-gold/5 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Heart size={14} className="text-gold" />
                      <span>Wishlist</span>
                    </Link>
                    
                    <button 
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <Link to="/cart" className="relative text-ink/75 hover:text-ink transition-colors">
            <ShoppingBag size={18} strokeWidth={1.5} />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-ink rounded-full text-[9px] flex items-center justify-center text-white font-medium">
                {cart.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-off-white z-[60] flex flex-col items-center justify-center space-y-12 transition-all duration-700 md:hidden',
          isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        )}
      >
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            onClick={() => setIsMenuOpen(false)}
            className="text-2xl font-serif italic tracking-tight text-ink"
          >
            {link.name}
          </Link>
        ))}
        {hasToken ? (
          <>
            <Link
              to={dashboardPath}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                'text-2xl font-serif italic tracking-tight',
                isAdmin ? 'text-gold' : 'text-ink'
              )}
            >
              {dashboardLabel}
            </Link>
            <Link
              to="/order-history"
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl font-serif italic tracking-tight text-ink"
            >
              Order History
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl font-serif italic tracking-tight text-ink"
            >
              Wishlist
            </Link>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                logout();
              }}
              className="text-2xl font-serif italic tracking-tight text-red-500"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl font-serif italic tracking-tight text-ink"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl font-serif italic tracking-tight text-ink"
            >
              Create Account
            </Link>
          </>
        )}
        <Button
          variant="outline"
          className="mt-8"
          onClick={() => setIsMenuOpen(false)}
        >
          Close
        </Button>
      </div>
    </nav>
  );
};
