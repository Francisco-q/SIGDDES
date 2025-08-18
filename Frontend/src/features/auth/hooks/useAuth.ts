import { useState, useCallback } from 'react';
import { useAsyncOperation } from '../../../shared/hooks';
import axiosInstance from '../../../services/axiosInstance';
import API_CONFIG from '../../../config/api';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('access_token')
  );
  const { loading, error, execute } = useAsyncOperation<any>();

  const login = useCallback(async (username: string, password: string) => {
    const response = await execute(() =>
      axiosInstance.post(API_CONFIG.ENDPOINTS.AUTH, { username, password })
    );
    
    if (response) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setIsAuthenticated(true);
    }
    
    return response;
  }, [execute]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    loading,
    error,
    login,
    logout
  };
};
