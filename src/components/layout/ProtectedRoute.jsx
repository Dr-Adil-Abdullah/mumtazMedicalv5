import { useLocation } from 'react-router-dom';
import usePermissions from '../../hooks/usePermissions';
import UnauthorizedPage from '../../pages/UnauthorizedPage';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { canAccessPath } = usePermissions();

  if (!canAccessPath(location.pathname)) {
    return <UnauthorizedPage path={location.pathname} />;
  }

  return children;
}
