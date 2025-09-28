import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import { LoginPage } from '@/components/auth/LoginPage'
import { Navigation } from '@/components/Navigation'
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PartsCatalogue } from '@/components/parts/PartsCatalogue'
import { ReportsManager } from '@/components/reports/ReportsManager'
import { AdminSettings } from '@/components/AdminSettings'

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-64 flex-shrink-0">
        <Navigation />
      </div>
      <div className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/parts" element={<PartsCatalogue />} />
          <Route path="/reports" element={<ReportsManager />} />
          <Route path="/admin" element={<AdminSettings onClose={() => {}} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  )
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
