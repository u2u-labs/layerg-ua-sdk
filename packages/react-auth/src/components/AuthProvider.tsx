import React, { useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

export const AuthProvider = ({ 
  appId, 
  apiKey, 
  authUrl = "https://auth-api.example.com", 
  children 
}: any) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Initialize authentication on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for existing session (e.g., from localStorage or cookie)
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          // Validate token and get user data
          const userData = await fetchUserData(token);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err: any) {
        console.error('Failed to initialize auth:', err);
        setError(err.message);
        // Clear any invalid tokens
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, [appId, apiKey, authUrl]);

  // Helper function to fetch user data
  const fetchUserData = async (token: any) => {
    const response = await fetch(`${authUrl}/api/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-app-id': appId,
        'x-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    return response.json();
  };

  // Login function
  const login = async (credentials: any) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${authUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': appId,
          'x-api-key': apiKey
        },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const { token, userData } = await response.json();
      
      // Store token
      localStorage.setItem('auth_token', token);
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
      
      return userData;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        await fetch(`${authUrl}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-app-id': appId,
            'x-api-key': apiKey
          }
        });
      }
      
      // Clear token
      localStorage.removeItem('auth_token');
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Provide authentication context value
  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    appId,
    apiKey,
    authUrl
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};