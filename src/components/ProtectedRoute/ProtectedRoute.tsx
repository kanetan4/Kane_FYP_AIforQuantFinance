import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Assume this provides user authentication context

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth(); // `user` is fetched from your authentication context/provider

  if (!user) {
    // Redirect to login page if the user is not authenticated
    return <Navigate to="/auth/signup" replace />;
  }

  // Render the protected component if the user is authenticated
  return children;
};

export default ProtectedRoute;
