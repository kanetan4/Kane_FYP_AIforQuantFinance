import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Analysis from './pages/Analysis/Analysis';
import Alerts from './pages/Alerts/Alerts';
import Chart from './pages/Chart';
import Dashboard from './pages/Preferences/Preferences';
import Profile from './pages/Profile/Profile';
import Preferences from './pages/Dashboard/Dashboard'
import Settings from './pages/Settings';
import DefaultLayout from './layout/DefaultLayout';
import { AuthProvider } from './provider/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'; // Import the ProtectedRoute component

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <AuthProvider>
      <DefaultLayout>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/auth/signin"
            element={
              <>
                <PageTitle title="Signin" />
                <SignIn />
              </>
            }
          />
          <Route
            path="/auth/signup"
            element={
              <>
                <PageTitle title="Signup" />
                <SignUp />
              </>
            }
          />

          {/* Protected Routes */}
          <Route
            index
            element={
              <ProtectedRoute>
                <>
                  <PageTitle title="Portfolio" />
                  <Preferences />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/preferences"
            element={
              <ProtectedRoute>
                <>
                  <PageTitle title="Investment Preferences" />
                  <Dashboard />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <>
                  <PageTitle title="Alerts" />
                  <Alerts />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis"
            element={
              <ProtectedRoute>
                <>
                  <PageTitle title="Analysis" />
                  <Analysis />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <>
                  <PageTitle title="Profile" />
                  <Profile />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <>
                  <PageTitle title="Settings" />
                  <Settings />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chart"
            element={
              <ProtectedRoute>
                <>
                  <PageTitle title="Basic Chart | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                  <Chart />
                </>
              </ProtectedRoute>
            }
          />
        </Routes>
      </DefaultLayout>
    </AuthProvider>
  );
}

export default App;
