import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useHealthStore } from '@/lib/health';

export function HealthBanner() {
  const { apiMode } = useHealthStore();
  const [dismissed, setDismissed] = React.useState(false);

  if (apiMode !== 'edge-fallback' || dismissed) {
    return null;
  }

  return (
    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950 mb-4">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-yellow-800 dark:text-yellow-200">
          <strong>Fallback Mode:</strong> Using Edge Functions while API recovers. 
          Some features may be slower than usual.
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
