import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail, MapPin, Phone } from 'lucide-react';
import { useSiteConfig } from '../SiteConfigContext';

export const Footer = () => {
  const { footer, header } = useSiteConfig();

  const normalizeExternalUrl = (url: string) => {
    const trimmed = String(url || '').trim();
    if (!trimmed) return '#';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram size={18} />;
      case 'twitter': return <Twitter size={18} />;
      case 'facebook': return <Facebook size={18} />;
      default: return null;
    }
  };

  return (
    <footer id="contact" className="bg-ink text-off-white py-20 md:py-32 px-6 md:px-12 border-t border-off-white/5">
      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20">
        {/* Brand */}
        <div className="space-y-8 md:space-y-10">
          <Link to="/" className="text-2xl md:text-3xl font-bold tracking-tighter">
            {header.logoText} {header.logoAccent}
          </Link>
          <p className="text-sm text-off-white/75 leading-relaxed max-w-xs">
            {footer.aboutText}
          </p>
          <div className="flex items-center space-x-6">
            {footer.socialLinks.map((link, idx) => (
              <a 
                key={idx} 
                href={normalizeExternalUrl(link.url)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-off-white/75 hover:text-white transition-colors cursor-pointer"
              >
                {getSocialIcon(link.platform)}
              </a>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white">Quick Links</h4>
          <nav className="flex flex-col space-y-4">
            {header.navLinks.map(link => (
              <Link key={link.name} to={link.path} className="text-sm text-off-white/75 hover:text-white transition-colors">
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* House */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white">Info</h4>
          <nav className="flex flex-col space-y-4">
            {['About Us', 'Craftsmanship', 'Bespoke Services', 'Global Concierge', 'Press'].map(item => (
              <Link key={item} to="/" className="text-sm text-off-white/75 hover:text-white transition-colors">
                {item}
              </Link>
            ))}
          </nav>
        </div>

        {/* Contact */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white">Contact</h4>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <MapPin size={18} className="text-white mt-1" />
              <p className="text-sm text-off-white/75 leading-relaxed">
                {footer.address}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Phone size={18} className="text-white" />
              <p className="text-sm text-off-white/75">{footer.phone}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Mail size={18} className="text-white" />
              <p className="text-sm text-off-white/75">{footer.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto mt-14 md:mt-20 pt-8 border-t border-off-white/10 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <p className="text-sm text-off-white/50 text-left">
          {footer.copyrightText}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
            <Link key={item} to="/" className="text-sm text-off-white/50 hover:text-white transition-colors">
              {item}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};
