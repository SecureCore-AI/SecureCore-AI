import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { PerformAction } from './pages/PerformAction';
import { AuditLogs } from './pages/AuditLogs';
import { Alerts } from './pages/Alerts';
import { LockedAccounts } from './pages/LockedAccounts';
import { AuditIntegrity } from './pages/AuditIntegrity';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/Errors';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Anonymous Route Guard (Redirect logged-in users away from Login/Register)
const AnonymousRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <AnonymousRoute>
                <Login />
              </AnonymousRoute>
            }
          />
          <Route
            path="/register"
            element={
              <AnonymousRoute>
                <Register />
              </AnonymousRoute>
            }
          />

          {/* Protected Dashboard Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Index redirect to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            
            {/* Perform Action page restricted to non-Auditors */}
            <Route
              path="action"
              element={
                <ProtectedRoute allowedRoles={['Employee', 'Contractor', 'Vendor', 'Admin', 'Super Admin']}>
                  <PerformAction />
                </ProtectedRoute>
              }
            />
            
            {/* Logs & Auditor pages */}
            <Route
              path="logs"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Auditor', 'Super Admin']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="alerts"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Auditor', 'Super Admin']}>
                  <Alerts />
                </ProtectedRoute>
              }
            />
            <Route
              path="integrity"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Auditor', 'Super Admin']}>
                  <AuditIntegrity />
                </ProtectedRoute>
              }
            />
            <Route
              path="locked-accounts"
              element={
                <ProtectedRoute allowedRoles={['Super Admin']}>
                  <LockedAccounts />
                </ProtectedRoute>
              }
            />
            
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>

      {/* Cyber Security styled toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#fff',
            border: '1px solid #1f2937',
            fontFamily: 'monospace',
            fontSize: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#111827',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#111827',
            },
          },
        }}
      />
    </AuthProvider>
  );
}
