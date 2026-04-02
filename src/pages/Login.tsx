import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useUser } from '../UserContext';
import { getTokenRole, isTokenValid } from '../authToken';

export const Login = () => {
  const { login, loading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (isTokenValid()) {
      navigate(getTokenRole() === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (!normalizedEmail || !trimmedPassword) return;

    const loggedInUser = await login(normalizedEmail, trimmedPassword);
    if (loggedInUser) {
      const from = (location.state as any)?.from;
      if (from && typeof from === 'string') {
        const wantsAdminRoute = from.startsWith('/admin');
        if (wantsAdminRoute && loggedInUser.role !== 'admin') {
          navigate('/dashboard', { replace: true });
          return;
        }
        navigate(from, { replace: true });
        return;
      }
      navigate(loggedInUser.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-gold">Welcome to Luxa Wach</p>
          <h1 className="text-5xl font-serif italic tracking-tight">Sign In</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-ink/10 p-8 rounded-2xl shadow-sm">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <div className="w-full space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-ink/60 font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-ink/45 hover:text-ink transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="text-right -mt-2">
            <Link to="/forgot-password" className="text-xs text-gold hover:text-ink transition-colors">
              Forgot Password?
            </Link>
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
            Sign in with Google
          </Button>
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => navigate('/shop')} disabled={loading}>
            Continue as Guest
          </Button>
        </form>

        <div className="text-center text-sm text-ink/70">
          <span>New here? </span>
          <Link to="/signup" className="text-gold hover:text-ink transition-colors">Create Account</Link>
        </div>
      </div>
    </div>
  );
};
