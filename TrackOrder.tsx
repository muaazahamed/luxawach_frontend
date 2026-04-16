import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, Copy } from 'lucide-react';
import { Button } from '../components/Button';
import { toast } from 'sonner';

export const OrderSuccess = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const trackingToken = location.state?.trackingToken;

  const copyToClipboard = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      toast.success('Reference ID copied to clipboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-off-white text-ink text-center space-y-12">
      <div className="space-y-6">
        <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={48} className="text-gold" />
        </div>
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold">Acquisition Confirmed</p>
          <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight">A Legacy <br /> <span className="text-gold">Secured</span></h1>
          <p className="text-sm text-ink/60 max-w-md mx-auto leading-relaxed">
            Your acquisition has been recorded in our archives. A dedicated concierge will contact you shortly to arrange secure global courier delivery.
          </p>
        </div>
      </div>

      {orderId && (
        <div className="max-w-md w-full p-8 bg-white border border-ink/5 rounded-3xl space-y-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Acquisition Reference ID</p>
          <div className="flex items-center justify-center space-x-4">
            <p className="text-xl font-mono font-bold text-ink">#{orderId.toUpperCase()}</p>
            <button 
              onClick={copyToClipboard}
              className="p-2 hover:bg-gold/10 rounded-full transition-colors text-gold"
              title="Copy to clipboard"
            >
              <Copy size={16} />
            </button>
          </div>
          {trackingToken && (
            <p className="text-[9px] font-mono text-ink/45 break-all">
              Tracking Key: {trackingToken}
            </p>
          )}
          <p className="text-[8px] uppercase tracking-widest text-ink/30">Save this ID to track your timepiece journey.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        <Link to="/order-history">
          <Button variant="primary">
            View Order History
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
        <Link to="/track-order" state={{ orderId, trackingToken }}>
          <Button variant="outline">Track Acquisition</Button>
        </Link>
      </div>
    </div>
  );
};
