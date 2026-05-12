import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('moto_token');
    const savedUser = localStorage.getItem('moto_user');
    
    const initAuth = async () => {
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          const res = await api.get('/auth/me');
          setUser(res.data.data);
          localStorage.setItem('moto_user', JSON.stringify(res.data.data));
        } catch (err) {
          console.error('Auth verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('moto_token', token);
    localStorage.setItem('moto_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('moto_token');
    localStorage.removeItem('moto_user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('moto_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading, isAdmin: user?.role === 'admin', isCashier: user?.role === 'cashier', isWarehouse: user?.role === 'warehouse' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
