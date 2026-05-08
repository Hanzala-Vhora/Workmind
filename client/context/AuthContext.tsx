import React from 'react';
import * as Sentry from '@sentry/react';
import { AuthUser, clearAuthSession, getStoredAccessToken, getStoredUser, storeAuthSession } from '../lib/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<AuthUser | null>(getStoredUser());
  const [isLoaded, setIsLoaded] = React.useState(false);

  const refreshSession = React.useCallback(async () => {
    try {
      const token = getStoredAccessToken();
      if (!token) {
        setUser(null);
        setIsLoaded(true);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        clearAuthSession();
        setUser(null);
        return;
      }

      const data = await response.json();
      storeAuthSession(token, data.user);
      setUser(data.user);
    } catch {
      clearAuthSession();
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  React.useEffect(() => {
    if (user) {
      Sentry.setUser({ email: user.email, id: user.id });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign in.');
    }

    storeAuthSession(data.accessToken, data.user);
    setUser(data.user);
    setIsLoaded(true);
  }, []);

  const signOut = React.useCallback(async () => {
    const token = getStoredAccessToken();
    clearAuthSession();
    setUser(null);

    try {
      if (token) {
        await fetch(`${API_URL}/api/auth/sign-out`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Ignore transport errors after local cleanup.
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded,
        isSignedIn: !!user,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
