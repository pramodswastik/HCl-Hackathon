import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getProfile, logout } from '@/store/slices/authSlice';
import { Spinner } from '@/components/ui';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  // Validate token and fetch user profile on mount if authenticated but no user data
  useEffect(() => {
    if (isAuthenticated && token && !user) {
      dispatch(getProfile()).unwrap().catch(() => {
        // If profile fetch fails, token is likely invalid
        dispatch(logout());
      });
    }
  }, [isAuthenticated, token, user, dispatch]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not an admin - redirect to home
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
