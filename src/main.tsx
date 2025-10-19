import { StrictMode, useEffect } from 'react';
import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from "./App.tsx";
import "./index.css";
import { startHealthMonitoring, stopHealthMonitoring } from './lib/health';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 5,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppWithMonitoring() {
  useEffect(() => {
    startHealthMonitoring();
    return () => stopHealthMonitoring();
  }, []);
  return <App />;
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppWithMonitoring />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
