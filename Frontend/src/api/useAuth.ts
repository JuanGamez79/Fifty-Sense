import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Hook for accessing auth state and actions anywhere in the app.
// Must be used inside a component wrapped by AuthProvider.

// Returns token, user, isAuthenticated, isLoading, login, and logout.
// Throws if used outside of AuthProvider.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}