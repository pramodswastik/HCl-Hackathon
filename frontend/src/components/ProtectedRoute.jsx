import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getProfile, logout } from '@/store/slices/authSlice';
import { Spinner } from '@/components/ui';

const ProtectedRoute = ({ children, requireEmailVerification = false }) => {
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
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Optional: Check if email verification is required
  if (requireEmailVerification && user && !user.isEmailVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Email Verification Required
          </h2>
          <p className="text-yellow-700">
            Please verify your email address to access this page. 
            Check your inbox for the verification link.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
