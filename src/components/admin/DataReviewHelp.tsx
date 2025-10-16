import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, HelpCircle } from 'lucide-react';

export function DataReviewHelp() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Where to Find Things</CardTitle>
        <CardDescription>Quick guide to all data review tools</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold">Changes Review</h4>
              <p className="text-sm text-muted-foreground">
                Admin → Data Review → Changes
              </p>
              <p className="text-sm mt-1">
                See every change made to jobs and customers. Accept to keep them or Reject to undo them.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold">Recovery</h4>
              <p className="text-sm text-muted-foreground">
                Admin → Data Review → Recovery
              </p>
              <p className="text-sm mt-1">
                Restore jobs to an earlier time, undo customer merges, or rebuild lost data.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold">24-Hour Monitoring</h4>
              <p className="text-sm text-muted-foreground">
                Admin → Data Review → Monitoring
              </p>
              <p className="text-sm mt-1">
                Watch for unexpected changes. Red alerts mean something changed without permission.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-semibold">Safety Mode (Stabilization)</h4>
              <p className="text-sm text-muted-foreground">
                Admin → Settings → Safety Mode
              </p>
              <p className="text-sm mt-1">
                When ON, only admins can change jobs and customers. Turn OFF after 24 hours of clean monitoring.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <h4 className="font-semibold text-sm">Quick Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• All pages have an "Export CSV" button to download data</li>
            <li>• Hover over buttons to see what they do</li>
            <li>• Changes can be undone anytime by clicking "Reject"</li>
            <li>• Recovery is safe - you'll always see a preview first</li>
          </ul>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Badge>Status Meanings</Badge>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong>Unreviewed:</strong> Change not yet checked by you</p>
            <p><strong>Accepted:</strong> You approved this change</p>
            <p><strong>Rejected:</strong> You undid this change</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
