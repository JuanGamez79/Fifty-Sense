import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProfile, type AuthUser as User } from '../api/auth';

// Provides global auth state (user, token) and actions (login, logout).
// Wraps the app in AuthProvider and validates the session on mount.

type AuthContextType = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: (message?: string) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const AUTH_MESSAGE_KEY = 'authMessage';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback((message?: string) => {
    if (message) {
      sessionStorage.setItem(AUTH_MESSAGE_KEY, message);
    }
    clearAuth();
  }, [clearAuth]);

  useEffect(() => {
    async function validateSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profileUser = await fetchProfile(token);

        if (profileUser) {
          localStorage.setItem(USER_KEY, JSON.stringify(profileUser));
          setUser(profileUser);
        }
      } catch (error) {
        // Use clearAuth() directly to avoid re-triggering this effect via logout()
        console.error('Session validation failed:', error);
        sessionStorage.setItem(AUTH_MESSAGE_KEY, 'Session expired. Please log in again.');
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    }

    validateSession();
  }, [token, clearAuth]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
    }),
    [token, user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

