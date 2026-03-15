import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../api/useAuth';
import Spinner from './Spinner';

// Wraps protected routes — redirects to login if the user is not authenticated.
// Shows a loading state while auth is being verified on mount.

export default function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}