import { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { LoginPage } from '@/components/auth/LoginPage';
import { Navigation } from '@/components/Navigation';
import { PartsCatalogue } from '@/components/parts/PartsCatalogue';
import { ReportsManager } from '@/components/reports/ReportsManager';
import { Toaster } from '@/components/ui/toaster';

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
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Job Management</h2>
              <p className="text-muted-foreground">Job management functionality coming soon...</p>
            </div>
          </div>
        );
      case 'customers':
        return (
          <div className="container mx-auto p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Customer Management</h2>
              <p className="text-muted-foreground">Customer management functionality coming soon...</p>
            </div>
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
