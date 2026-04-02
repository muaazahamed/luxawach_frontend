import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearAuthStorage, getTokenRole, isTokenValid } from '../authToken';

export const PrivateRoute = ({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) => {
  const location = useLocation();

  if (!isTokenValid()) {
    clearAuthStorage();
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && getTokenRole() !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
