import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL, TOKEN_EXPIRED_EVENT } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  stripeAccountId?: string | null;
  entitlements?: {
    saasPlan?: string | null;
    setupEligible?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signup: (email: string, password: string, name: string, company?: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => void;
  getAuthToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signout = () => {
    setUser(null);
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  // Listen for token expiration events from API calls
  useEffect(() => {
    const handleTokenExpired = () => {
      console.log('🔒 Token expired event received. Logging out user...');
      // Clear user state and tokens
      setUser(null);
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      // Redirect to signin page
      window.location.href = '/signin';
    };

    window.addEventListener(TOKEN_EXPIRED_EVENT, handleTokenExpired);

    return () => {
      window.removeEventListener(TOKEN_EXPIRED_EVENT, handleTokenExpired);
    };
  }, []);

  // Load user and token from sessionStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        if (token) {
          // Verify token and get user data from API
          try {
            const response = await fetch(`${API_URL}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              setUser(data.user);
            } else {
              // Token invalid or expired (401), clear it
              if (response.status === 401) {
                console.log('🔒 Token expired on initial load. Clearing session...');
              }
              sessionStorage.removeItem('authToken');
              localStorage.removeItem('authUser');
            }
          } catch (error) {
            // Token verification failed, clear invalid token
            if (process.env.NODE_ENV === 'development') {
              console.error('Error verifying token:', error);
            }
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
          }
        } else {
          // Fallback to localStorage for backward compatibility
          const storedUser = localStorage.getItem('authUser');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        // Error loading user, clear invalid data
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading user:', error);
        }
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const signup = async (email: string, password: string, name: string, company?: string) => {
    try {
      // Call backend API to create user
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
      }

      const data = await response.json();
      
      // Store JWT token in sessionStorage (NOT password!)
      sessionStorage.setItem('authToken', data.token);
      
      // Store user data (without password)
      const newUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        entitlements: data.user.entitlements,
        company, // Store company separately if needed
        stripeAccountId: data.user.stripeAccountId,
      };
      
      localStorage.setItem('authUser', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Signup error:', error);
      }
      throw error;
    }
  };

  const signin = async (email: string, password: string) => {
    try {
      // Call backend API to sign in
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid email or password');
      }

      const data = await response.json();
      
      // Store JWT token in sessionStorage (NOT password!)
      sessionStorage.setItem('authToken', data.token);
      
      // Store user data
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        entitlements: data.user.entitlements,
        stripeAccountId: data.user.stripeAccountId,
      };
      
      localStorage.setItem('authUser', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Signin error:', error);
      }
      throw error;
    }
  };

  const getAuthToken = () => {
    return sessionStorage.getItem('authToken');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signup,
    signin,
    signout,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

