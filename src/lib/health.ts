import { supabase } from './supabase';
import { create } from 'zustand';

export type ApiMode = 'rest' | 'edge-fallback';

interface HealthState {
  apiMode: ApiMode;
  lastCheck: Date | null;
  failureCount: number;
  isChecking: boolean;
  setApiMode: (mode: ApiMode) => void;
  incrementFailure: () => void;
  resetFailures: () => void;
  setChecking: (checking: boolean) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  apiMode: 'rest',
  lastCheck: null,
  failureCount: 0,
  isChecking: false,
  setApiMode: (mode) => set({ apiMode: mode, lastCheck: new Date() }),
  incrementFailure: () => set((state) => ({ failureCount: state.failureCount + 1 })),
  resetFailures: () => set({ failureCount: 0 }),
  setChecking: (checking) => set({ isChecking: checking }),
}));

let healthCheckTimer: number | null = null;
let lastFailureTime = 0;

/**
 * Check if PostgREST API is healthy
 */
export async function checkApiHealth(): Promise<boolean> {
  const { setChecking, incrementFailure, resetFailures, setApiMode } = useHealthStore.getState();
  
  setChecking(true);
  
  try {
    // Simple timeout implementation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const { data, error } = await supabase.rpc('api_health_check' as any);
    clearTimeout(timeoutId);

    if (error || !data || data.length === 0) {
      throw new Error('Health check failed');
    }

    // Success - reset failures and switch to REST if needed
    resetFailures();
    if (useHealthStore.getState().apiMode === 'edge-fallback') {
      console.log('✅ API recovered, switching back to REST mode');
      setApiMode('rest');
    }
    
    return true;
  } catch (error) {
    console.error('Health check failed:', error);
    incrementFailure();
    
    const now = Date.now();
    const { failureCount } = useHealthStore.getState();
    
    // If we've had 2+ failures within 5 seconds, switch to fallback
    if (failureCount >= 2 && (now - lastFailureTime) < 5000) {
      console.warn('⚠️ Multiple API failures detected, switching to Edge Function fallback');
      setApiMode('edge-fallback');
    }
    
    lastFailureTime = now;
    return false;
  } finally {
    setChecking(false);
  }
}

/**
 * Start continuous health monitoring
 */
export function startHealthMonitoring(intervalMs = 30000) {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
  }
  
  // Initial check
  checkApiHealth();
  
  // Periodic checks
  healthCheckTimer = window.setInterval(() => {
    checkApiHealth();
  }, intervalMs);
}

/**
 * Stop health monitoring
 */
export function stopHealthMonitoring() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
}

/**
 * Manually trigger health check
 */
export async function manualHealthCheck() {
  return await checkApiHealth();
}
