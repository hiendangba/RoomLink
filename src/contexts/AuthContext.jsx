import React, { createContext, useContext, useState, useEffect } from 'react';
import { setTokenGetter } from '../api/axiosClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    // Setup token getter for axiosClient
    setTokenGetter(() => localStorage.getItem('token'));
    
    if (savedUser && savedToken && isLoggedIn === 'true') {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        setTokenGetter(() => null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    setTokenGetter(() => null);
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isStudent = () => {
    return user && user.role === 'student';
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isStudent,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
