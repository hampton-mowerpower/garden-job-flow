import * as React from 'react';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LoginPage } from '@/components/auth/LoginPage';
import { Navigation } from '@/components/Navigation';
import { JobManager } from '@/components/JobManager';
import { PartsCatalogue } from '@/components/parts/PartsCatalogue';
import { ReportsManager } from '@/components/reports/ReportsManager';
import { CustomerManager } from '@/components/CustomerManager';
import { POSInterface } from '@/components/pos/POSInterface';
import { ReportsDashboard } from '@/components/reports/ReportsDashboard';
import { AccountCustomersManager } from '@/components/AccountCustomersManager';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const { useState } = React;

function AppContent() {
  const [currentView, setCurrentView] = useState('jobs');
  const { user, loading } = useAuth();

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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'jobs':
        return (
          <div className="container mx-auto p-6">
            <JobManager />
          </div>
        );
      case 'customers':
        return (
          <div className="container mx-auto p-6">
            <CustomerManager />
          </div>
        );
      case 'account-customers':
        return (
          <div className="container mx-auto p-6">
            <AccountCustomersManager />
          </div>
        );
      case 'parts':
        return (
          <div className="container mx-auto p-6">
            <PartsCatalogue />
          </div>
        );
      case 'reports':
        return (
          <div className="container mx-auto p-6">
            <ReportsManager />
          </div>
        );
      case 'pos':
        return (
          <div className="container mx-auto p-6">
            <POSInterface />
          </div>
        );
      case 'analytics':
        return (
          <div className="container mx-auto p-6">
            <ReportsDashboard />
          </div>
        );
      case 'settings':
        return (
          <div className="container mx-auto p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Settings</h2>
              <p className="text-muted-foreground">Settings functionality coming soon...</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="container mx-auto p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Welcome to Job Manager</h2>
              <p className="text-muted-foreground">Select an option from the navigation menu.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      <main>
        {renderCurrentView()}
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
