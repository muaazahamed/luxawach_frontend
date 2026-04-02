import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { GeminiLiveService as GeminiLiveServiceType } from '../services/geminiLiveService';
import { cn } from '../utils';
import { Button } from './Button';
import { useSiteConfig } from '../SiteConfigContext';

export const Concierge = () => {
  const { footer } = useSiteConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ text: string; isModel: boolean }[]>([]);
  const serviceRef = useRef<GeminiLiveServiceType | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);

  useEffect(() => {
    return () => {
      serviceRef.current?.disconnect();
    };
  }, []);

  const normalizeWhatsAppLink = (raw: string) => {
    const value = String(raw || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value) || /^whatsapp:\/\//i.test(value)) return value;
    if (/^wa\.me\//i.test(value)) return `https://${value}`;
    const digits = value.replace(/[^\d]/g, '');
    if (digits.length >= 8) return `https://wa.me/${digits}`;
    return `https://${value}`;
  };

  const getConfiguredWhatsAppLink = () => {
    const fromContext = normalizeWhatsAppLink(footer?.whatsappLink || '');
    if (fromContext) return fromContext;

    try {
      const sessionRaw = sessionStorage.getItem('siteConfig_cache');
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw);
        const fromSession = normalizeWhatsAppLink(parsed?.footer?.whatsappLink || '');
        if (fromSession) return fromSession;
      }
    } catch {
      // ignore cache parse issues
    }

    try {
      const localRaw = localStorage.getItem('mockSiteConfig_footer');
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        const fromLocal = normalizeWhatsAppLink(parsed?.whatsappLink || '');
        if (fromLocal) return fromLocal;
      }
    } catch {
      // ignore cache parse issues
    }

    return '';
  };

  const handleToggle = async () => {
    const whatsappLink = getConfiguredWhatsAppLink();
    if (!isOpen && whatsappLink) {
      window.open(whatsappLink, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!isOpen) {
      setIsOpen(true);
    } else {
      if (isConnected) {
        serviceRef.current?.disconnect();
        setIsConnected(false);
      }
      setIsOpen(false);
    }
  };

  const startConversation = async () => {
    setIsConnecting(true);
    try {
      if (!serviceRef.current) {
        const { GeminiLiveService } = await import('../services/geminiLiveService');
        serviceRef.current = new GeminiLiveService();
      }
      await serviceRef.current.connect({
        onOpen: () => {
          setIsConnecting(false);
          setIsConnected(true);
          setTranscriptions([{ text: "Welcome to Luxa Wach. I am your concierge. How may I assist you today?", isModel: true }]);
        },
        onTranscription: (text, isModel) => {
          setTranscriptions(prev => [...prev, { text, isModel }]);
        },
        onClose: () => {
          setIsConnected(false);
          setIsConnecting(false);
        },
        onError: () => {
          setIsConnected(false);
          setIsConnecting(false);
        }
      });
    } catch (error) {
      setIsConnecting(false);
      console.error(error);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[60] w-14 h-14 md:w-16 md:h-16 bg-ink text-off-white rounded-full flex items-center justify-center shadow-2xl border border-gold/20"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>

      {/* Concierge Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-20 md:bottom-28 right-4 md:right-8 z-[60] w-[calc(100vw-2rem)] max-w-[400px] h-[70vh] max-h-[500px] bg-off-white shadow-2xl border border-ink/5 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-ink text-off-white flex items-center justify-between">
              <div>
                <h3 className="font-serif italic text-lg tracking-tight">Luxa Wach Concierge</h3>
                <p className="text-[10px] uppercase tracking-widest text-gold font-bold">
                  {isConnected ? 'Live Voice Assistant' : 'Bespoke AI Service'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {isConnected && (
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-off-white/60 hover:text-off-white transition-colors"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar" ref={scrollRef}>
              {!isConnected && !isConnecting ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center">
                    <Mic size={32} className="text-gold" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-serif italic text-xl">Voice Experience</h4>
                    <p className="text-xs text-ink/60 leading-relaxed max-w-[250px]">
                      Connect with our digital concierge for a bespoke horological conversation.
                    </p>
                  </div>
                  <Button onClick={startConversation} variant="primary" size="md">
                    Begin Conversation
                  </Button>
                </div>
              ) : isConnecting ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="flex space-x-2">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [8, 24, 8] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1 bg-gold"
                      />
                    ))}
                  </div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40">
                    Establishing Connection...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transcriptions.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: t.isModel ? -10 : 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "max-w-[85%] p-4 text-sm leading-relaxed",
                        t.isModel 
                          ? "bg-ink/5 text-ink rounded-r-2xl rounded-tl-2xl self-start" 
                          : "bg-gold/10 text-ink rounded-l-2xl rounded-tr-2xl self-end ml-auto"
                      )}
                    >
                      {t.text}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {isConnected && (
              <div className="p-6 border-t border-ink/5 flex items-center justify-center">
                <div className="flex items-center space-x-8">
                  <div className="flex space-x-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 12, 4] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        className="w-0.5 bg-ink/20"
                      />
                    ))}
                  </div>
                  <button 
                    onClick={() => serviceRef.current?.disconnect()}
                    className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <MicOff size={20} />
                  </button>
                  <div className="flex space-x-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 12, 4] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        className="w-0.5 bg-ink/20"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
