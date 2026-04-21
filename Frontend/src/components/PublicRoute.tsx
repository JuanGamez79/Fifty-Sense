import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../api/useAuth';
import Spinner from './Spinner';

// Wraps public-only routes (splash, login, register).
// Redirects to dashboard if the user is already logged in.

export default function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}