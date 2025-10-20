import * as React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LoginPage } from '@/components/auth/LoginPage';
import { Navigation } from '@/components/Navigation';
import { HAS_ENV } from '@/env';
import { JobManager } from '@/components/JobManager';
import { PartsCatalogue } from '@/components/parts/PartsCatalogue';
import { ReportsManager } from '@/components/reports/ReportsManager';
import { CustomerManager } from '@/components/CustomerManager';
import { POSInterface } from '@/components/pos/POSInterface';
import { ReportsDashboard } from '@/components/reports/ReportsDashboard';
import { AccountCustomersManager } from '@/components/AccountCustomersManager';
import JobDetails from '@/pages/JobDetails';
import JobEdit from '@/pages/JobEdit';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HealthBanner } from '@/components/HealthBanner';
import { cleanupSupabase } from '@/lib/supabase';

const { useState, useEffect } = React;

function AppContent() {
  const [currentView, setCurrentView] = useState('jobs');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Cleanup realtime channels on route change
  useEffect(() => {
    return () => {
      cleanupSupabase();
    };
  }, [location.pathname]);

  // Global cleanup on window unload and component unmount
  useEffect(() => {
    const handleUnload = () => {
      cleanupSupabase();
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      cleanupSupabase();
    };
  }, []);

  // Sync navigation with route changes
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/jobs/')) {
      setCurrentView('jobs');
    }
  }, []);

  // Environment check
  if (!HAS_ENV) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground p-4 text-center z-50">
          <strong>Configuration Error:</strong> Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. 
          Set them in Project Settings → Environment and rebuild.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      <div className="container mx-auto px-4 pt-2">
        <HealthBanner />
      </div>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/jobs" replace />} />
          <Route path="/jobs" element={<div className="container mx-auto p-6"><JobManager /></div>} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/jobs/:id/edit" element={<JobEdit />} />
          <Route path="/customers" element={<div className="container mx-auto p-6"><CustomerManager /></div>} />
          <Route path="/account-customers" element={<div className="container mx-auto p-6"><AccountCustomersManager /></div>} />
          <Route path="/parts" element={<div className="container mx-auto p-6"><PartsCatalogue /></div>} />
          <Route path="/reports" element={<div className="container mx-auto p-6"><ReportsManager /></div>} />
          <Route path="/pos" element={<div className="container mx-auto p-6"><POSInterface /></div>} />
          <Route path="/analytics" element={<div className="container mx-auto p-6"><ReportsDashboard /></div>} />
          <Route path="/settings" element={
            <div className="container mx-auto p-6">
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <p className="text-muted-foreground">Settings functionality coming soon...</p>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
          <Toaster />
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
