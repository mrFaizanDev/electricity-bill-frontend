import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import CalculatorPage from './pages/CalculatorPage';
import RecordsPage from './pages/RecordsPage';
import RecordDetailPage from './pages/RecordDetailPage';
import UserManagementPage from './pages/UserManagementPage';
import api from './api/api';
import './App.css';

// Main Layout with persistent Navbar when authenticated
function MainLayout({ children }) {
  const { isAuthenticated } = useAuth();
  return (
    <div className="app-layout">
      {isAuthenticated && <Navbar />}
      <main className="main-content">{children}</main>
    </div>
  );
}

// Redirect root to appropriate page depending on role
function RootRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return isAdmin ? <CalculatorPage /> : <Navigate to="/records" replace />;
}

export default function App() {
  useEffect(() => {
    // Fire light health check ping on app launch to wake up Render backend if sleeping
    api.health().catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <Router>
        <MainLayout>
          <Routes>
            {/* Public Login Route (No signup) */}
            <Route path="/login" element={<LoginPage />} />

            {/* Root Route: Admin gets Calculator, Normal User gets redirected to Records */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Records List (Admin and Normal Users) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/records" element={<RecordsPage />} />
              <Route path="/records/:id" element={<RecordDetailPage />} />
            </Route>

            {/* Admin-Only Routes */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/users" element={<UserManagementPage />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </Router>
    </AuthProvider>
  );
}
