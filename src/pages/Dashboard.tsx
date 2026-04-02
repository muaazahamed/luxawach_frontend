import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Home } from './Home';
import { getTokenRole, isTokenValid } from '../authToken';

export const Dashboard = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, '/dashboard');
    }
  }, [location.search]);

  if (!isTokenValid()) {
    return <Navigate to="/" replace />;
  }

  if (getTokenRole() === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Home />;
};

export default Dashboard;
