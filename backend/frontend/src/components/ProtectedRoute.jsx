import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PageLoader } from './ui/Spinner.jsx';

/** Guards routes by auth state and optionally by allowed (effective) roles. */
export const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;
