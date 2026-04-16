import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

interface NavLink {
  name: string;
  path: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface HeaderConfig {
  logoText: string;
  logoAccent: string;
  navLinks: NavLink[];
}

interface FooterConfig {
  aboutText: string;
  address: string;
  phone: string;
  email: string;
  whatsappLink?: string;
  socialLinks: SocialLink[];
  copyrightText: string;
}

interface HomeConfig {
  heroButtonText: string;
  heritageButtonText: string;
  collectionsButtonText: string;
  bespokeButtonText: string;
}

interface SiteConfigContextType {
  header: HeaderConfig;
  footer: FooterConfig;
  home: HomeConfig;
  loading: boolean;
}

const defaultHeader: HeaderConfig = {
  logoText: 'Luxa',
  logoAccent: 'Wach',
  navLinks: [
    { name: 'Home', path: '/' },
    { name: 'Collections', path: '/shop' },
    { name: 'Bespoke', path: '/bespoke' },
    { name: 'About Us', path: '/contact' },
    { name: 'Track Order', path: '/track-order' },
    { name: 'Contact Us', path: '/contact' },
  ],
};

const defaultFooter: FooterConfig = {
  aboutText: "Curating the world's most exquisite timepieces since 1892. A legacy of precision, artistry, and bespoke service.",
  address: 'Rue du Rhône 12, 1204 Geneva, Switzerland',
  phone: '+41 22 123 45 67',
  email: 'concierge@luxawach.com',
  whatsappLink: '',
  socialLinks: [
    { platform: 'Instagram', url: 'https://instagram.com' },
    { platform: 'Twitter', url: 'https://twitter.com' },
    { platform: 'Facebook', url: 'https://facebook.com' },
  ],
  copyrightText: '© 2026 Luxa Wach. All Rights Reserved.',
};

const defaultHome: HomeConfig = {
  heroButtonText: 'Explore Collection',
  heritageButtonText: 'About Us',
  collectionsButtonText: 'View All Collections',
  bespokeButtonText: 'Consult a Master',
};

const REQUIRED_NAV_LINKS: NavLink[] = [
  { name: 'Home', path: '/' },
  { name: 'About Us', path: '/contact' },
  { name: 'Track Order', path: '/track-order' },
];

const sanitizeNavLinks = (links: unknown): NavLink[] => {
  if (!Array.isArray(links)) return defaultHeader.navLinks;

  const clean = links
    .map((item) => {
      const link = item as Partial<NavLink>;
      if (!link?.name || !link?.path) return null;
      return { name: String(link.name), path: String(link.path) };
    })
    .filter(Boolean) as NavLink[];

  const base = clean.length ? clean : defaultHeader.navLinks;
  const merged = [...base];

  // Keep critical navigation links even if admin saves a partial menu.
  REQUIRED_NAV_LINKS.forEach((requiredLink) => {
    const exists = merged.some((link) =>
      link.name.toLowerCase() === requiredLink.name.toLowerCase() ||
      link.path.toLowerCase() === requiredLink.path.toLowerCase()
    );
    if (!exists) merged.push(requiredLink);
  });

  return merged;
};

const sanitizeSocialLinks = (links: unknown): SocialLink[] => {
  if (!Array.isArray(links)) return defaultFooter.socialLinks;

  const clean = links
    .map((item) => {
      const link = item as Partial<SocialLink>;
      if (!link?.platform || !link?.url) return null;
      return { platform: String(link.platform), url: String(link.url) };
    })
    .filter(Boolean) as SocialLink[];

  return clean.length ? clean : defaultFooter.socialLinks;
};

const sanitizeHeader = (data: unknown): HeaderConfig => {
  if (!data || typeof data !== 'object') return defaultHeader;
  const incoming = data as Partial<HeaderConfig>;

  return {
    logoText: typeof incoming.logoText === 'string' && incoming.logoText.trim()
      ? incoming.logoText
      : defaultHeader.logoText,
    logoAccent: typeof incoming.logoAccent === 'string' && incoming.logoAccent.trim()
      ? incoming.logoAccent
      : defaultHeader.logoAccent,
    navLinks: sanitizeNavLinks(incoming.navLinks),
  };
};

const sanitizeFooter = (data: unknown): FooterConfig => {
  if (!data || typeof data !== 'object') return defaultFooter;
  const incoming = data as Partial<FooterConfig>;

  return {
    aboutText: typeof incoming.aboutText === 'string' && incoming.aboutText.trim()
      ? incoming.aboutText
      : defaultFooter.aboutText,
    address: typeof incoming.address === 'string' && incoming.address.trim()
      ? incoming.address
      : defaultFooter.address,
    phone: typeof incoming.phone === 'string' && incoming.phone.trim()
      ? incoming.phone
      : defaultFooter.phone,
    email: typeof incoming.email === 'string' && incoming.email.trim()
      ? incoming.email
      : defaultFooter.email,
    whatsappLink: typeof incoming.whatsappLink === 'string'
      ? incoming.whatsappLink
      : (defaultFooter.whatsappLink || ''),
    socialLinks: sanitizeSocialLinks(incoming.socialLinks),
    copyrightText:
      typeof incoming.copyrightText === 'string' && incoming.copyrightText.trim()
        ? incoming.copyrightText
        : defaultFooter.copyrightText,
  };
};

const sanitizeHome = (data: unknown): HomeConfig => {
  if (!data || typeof data !== 'object') return defaultHome;
  const incoming = data as Partial<HomeConfig>;

  return {
    heroButtonText:
      typeof incoming.heroButtonText === 'string' && incoming.heroButtonText.trim()
        ? incoming.heroButtonText
        : defaultHome.heroButtonText,
    heritageButtonText:
      typeof incoming.heritageButtonText === 'string' && incoming.heritageButtonText.trim()
        ? incoming.heritageButtonText
        : defaultHome.heritageButtonText,
    collectionsButtonText:
      typeof incoming.collectionsButtonText === 'string' && incoming.collectionsButtonText.trim()
        ? incoming.collectionsButtonText
        : defaultHome.collectionsButtonText,
    bespokeButtonText:
      typeof incoming.bespokeButtonText === 'string' && incoming.bespokeButtonText.trim()
        ? incoming.bespokeButtonText
        : defaultHome.bespokeButtonText,
  };
};

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [header, setHeader] = useState<HeaderConfig>(defaultHeader);
  const [footer, setFooter] = useState<FooterConfig>(defaultFooter);
  const [home, setHome] = useState<HomeConfig>(defaultHome);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const CACHE_KEY = 'siteConfig_cache';

    // Try sessionStorage first to avoid network calls on in-tab navigation
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setHeader(sanitizeHeader(parsed.header));
        setFooter(sanitizeFooter(parsed.footer));
        setHome(sanitizeHome(parsed.home));
        setLoading(false);
        return; // Skip network fetch
      }
    } catch {
      sessionStorage.removeItem(CACHE_KEY);
    }

    const fetchConfig = async () => {
      try {
        const [headRes, footRes, homeRes] = await Promise.all([
          api.get('/siteconfig/header').catch(() => ({ data: null })),
          api.get('/siteconfig/footer').catch(() => ({ data: null })),
          api.get('/siteconfig/home').catch(() => ({ data: null }))
        ]);

        const h = sanitizeHeader(headRes.data);
        const f = sanitizeFooter(footRes.data);
        const ho = sanitizeHome(homeRes.data);

        setHeader(h);
        setFooter(f);
        setHome(ho);

        // Persist to sessionStorage for subsequent navigations
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            header: headRes.data,
            footer: footRes.data,
            home: homeRes.data,
          }));
        } catch { /* storage full — ignore */ }
      } catch (error) {
        console.error("Failed to load site config:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return (
    <SiteConfigContext.Provider value={{ header, footer, home, loading }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
};
