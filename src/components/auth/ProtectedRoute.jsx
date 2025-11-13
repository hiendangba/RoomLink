import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const publicRoutes = ['/change-password'];

  useEffect(() => {
    if (user && user.status === 'APPROVED_NOT_CHANGED') {
      const isPublicRoute = publicRoutes.includes(location.pathname);
      if (!isPublicRoute) {
        window.location.href = '/change-password';
      }
    }
  }, [user, location.pathname]);

  return <>{children}</>;
};

export default ProtectedRoute;

