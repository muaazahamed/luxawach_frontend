import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../UserContext';
import { clearAuthStorage } from '../authToken';
import { toast } from 'sonner';

export const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { applySession } = useUser();

  React.useEffect(() => {
    const token = searchParams.get('token') || '';
    const role = searchParams.get('role') || 'user';
    const userId = searchParams.get('userId') || '';
    const name = searchParams.get('name') || '';
    const email = searchParams.get('email') || '';

    if (!token || !userId) {
      clearAuthStorage();
      toast.error('Google sign-in failed');
      navigate('/', { replace: true });
      return;
    }

    applySession({ token, role, userId, name, email });
    toast.success('Google sign-in successful');
    navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }, [applySession, navigate, searchParams]);

  return null;
};
