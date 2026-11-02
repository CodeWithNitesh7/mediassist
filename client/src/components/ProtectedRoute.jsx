import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// <ProtectedRoute roles={['admin']}> ... </ProtectedRoute>
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center text-sm text-ink/60">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
