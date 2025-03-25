import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  username: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token and get user info
      validateToken(token);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await axios.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuthState({
        user: response.data,
        token,
        isAuthenticated: true,
      });
    } catch (error) {
      // Token is invalid, clear storage
      localStorage.removeItem('token');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/api/v1/token', {
        username,
        password,
      });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      await validateToken(access_token);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      await axios.post('/api/v1/users/', {
        email,
        username,
        password,
      });
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  };

  return {
    ...authState,
    login,
    register,
    logout,
  };
} 