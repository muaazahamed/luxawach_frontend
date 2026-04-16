export const AUTH_TOKEN_KEY = 'token';

type JwtPayload = {
  exp?: number;
  role?: string;
};

const decodePayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, '=');
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

export const clearAuthStorage = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem('userInfo');
};

export const getStoredToken = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;
  return token.trim() || null;
};

export const getTokenRole = (): string | null => {
  const token = getStoredToken();
  if (!token) return null;
  const payload = decodePayload(token);
  return payload?.role || null;
};

export const isTokenValid = (): boolean => {
  const token = getStoredToken();
  if (!token) return false;

  const payload = decodePayload(token);
  if (!payload) {
    clearAuthStorage();
    return false;
  }

  if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
    clearAuthStorage();
    return false;
  }

  return true;
};
