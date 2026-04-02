import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../api';
import { toast } from 'sonner';
import { isTokenValid } from '../authToken';

const OTP_EXPIRY_SECONDS_DEFAULT = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 45;

const formatSeconds = (seconds: number) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<'request' | 'reset'>('request');
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [resettingPassword, setResettingPassword] = React.useState(false);
  const [expirySecondsLeft, setExpirySecondsLeft] = React.useState(OTP_EXPIRY_SECONDS_DEFAULT);
  const [resendCooldownLeft, setResendCooldownLeft] = React.useState(0);

  React.useEffect(() => {
    if (isTokenValid()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  React.useEffect(() => {
    if (step !== 'reset' || expirySecondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setExpirySecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, expirySecondsLeft]);

  React.useEffect(() => {
    if (step !== 'reset' || resendCooldownLeft <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldownLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, resendCooldownLeft]);

  const requestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error('Email is required');
      return;
    }

    setSendingOtp(true);
    try {
      const { data } = await api.post('/auth/forgot-password/send-otp', {
        email: normalizedEmail,
      });
      const expiresIn = Number(data?.expiresInSeconds) || OTP_EXPIRY_SECONDS_DEFAULT;
      setStep('reset');
      setOtp('');
      setExpirySecondsLeft(expiresIn);
      setResendCooldownLeft(RESEND_COOLDOWN_SECONDS);
      toast.success('OTP sent to your email');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const cleanedOtp = otp.trim();

    if (!normalizedEmail || !cleanedOtp || !newPassword) {
      toast.error('Email, OTP, and new password are required');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setResettingPassword(true);
    try {
      await api.post('/auth/forgot-password/reset', {
        email: normalizedEmail,
        otp: cleanedOtp,
        newPassword,
      });
      toast.success('Password reset successful. Please sign in.');
      navigate('/login', { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Password reset failed');
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold">Account Recovery</p>
          <h1 className="text-5xl font-serif italic tracking-tight">Forgot Password</h1>
        </div>

        {step === 'request' ? (
          <form onSubmit={requestOtp} className="space-y-6 bg-white border border-ink/10 p-8 rounded-2xl shadow-sm">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={sendingOtp}>
              {sendingOtp ? 'Sending OTP...' : 'Send Reset OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-6 bg-white border border-ink/10 p-8 rounded-2xl shadow-sm">
            <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/50">OTP expires in</p>
              <p className="text-lg font-bold text-gold">{formatSeconds(expirySecondsLeft)}</p>
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter 6-digit OTP"
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => requestOtp()}
              disabled={sendingOtp || resendCooldownLeft > 0}
            >
              {sendingOtp
                ? 'Resending OTP...'
                : resendCooldownLeft > 0
                  ? `Resend OTP in ${formatSeconds(resendCooldownLeft)}`
                  : 'Resend OTP'}
            </Button>
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={resettingPassword}>
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => setStep('request')}>
              Back
            </Button>
          </form>
        )}

        <div className="text-center text-sm text-ink/70">
          <span>Remembered your password? </span>
          <Link to="/login" className="text-gold hover:text-ink transition-colors">Sign In</Link>
        </div>
      </div>
    </div>
  );
};
