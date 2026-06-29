import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AdminProvider, useAdmin } from '@/hooks/useAdmin';
import { OrgProvider } from '@/hooks/useOrganization';
import { Toaster } from '@/components/ui/sonner';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import MuawineenPage from '@/pages/MuawineenPage';
import IncomePage from '@/pages/IncomePage';
import ExpensesPage from '@/pages/ExpensesPage';
import SummaryPage from '@/pages/SummaryPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminUserDetailPage from '@/pages/admin/AdminUserDetailPage';
import AdminSuperAdminsPage from '@/pages/admin/AdminSuperAdminsPage';

// Components
import Navbar from '@/components/shared/Navbar';
import AdminLayout from '@/components/admin/AdminLayout';
import { SplashScreen } from '@/components/shared/SplashScreen';

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg shadow-primary/20"></div>
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground/40 animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Syncing Session" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, adminLoading } = useAdmin();

  if (adminLoading) {
    return <LoadingScreen message="Verifying Admin" />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/muawineen" element={<MuawineenPage />} />
          <Route path="/income" element={<IncomePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminLayoutRoutes() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="admins" element={<AdminSuperAdminsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splash-seen');
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('splash-seen', 'true');
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <AuthProvider>
        <AdminProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/admin/*"
              element={
                <AuthGuard>
                  <AdminGuard>
                    <AdminLayoutRoutes />
                  </AdminGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/*"
              element={
                <AuthGuard>
                  <OrgProvider>
                    <Layout />
                  </OrgProvider>
                </AuthGuard>
              }
            />
          </Routes>
          <Toaster position="top-right" richColors />
        </AdminProvider>
      </AuthProvider>
    </>
  );
}
