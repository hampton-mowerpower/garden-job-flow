import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface HealthMetric {
  label: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ReactNode;
}

export function JobDataHealthMonitor() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHealthMetrics = async () => {
    setLoading(true);
    try {
      // Check for NULL overwrites in last 24 hours
      const { data: nullOverwrites } = await supabase.rpc('get_null_overwrites', { days: 1 });
      
      // Check for rapid changes (potential race conditions)
      const { data: rapidChanges } = await supabase.rpc('find_rapid_changes', { 
        minutes: 5, 
        threshold: 5 
      });
      
      // Check for failed saves (jobs with version conflicts)
      const { count: conflictCount } = await supabase
        .from('audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('operation', 'UPDATE')
        .gte('changed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const nullCount = nullOverwrites?.length || 0;
      const raceCount = rapidChanges?.length || 0;
      
      setMetrics([
        {
          label: 'NULL Overwrites (24h)',
          value: nullCount,
          status: nullCount === 0 ? 'healthy' : nullCount < 5 ? 'warning' : 'critical',
          icon: nullCount === 0 ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />
        },
        {
          label: 'Race Conditions (7d)',
          value: raceCount,
          status: raceCount === 0 ? 'healthy' : raceCount < 3 ? 'warning' : 'critical',
          icon: raceCount === 0 ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />
        },
        {
          label: 'Total Updates (24h)',
          value: conflictCount || 0,
          status: 'healthy',
          icon: <TrendingUp className="h-4 w-4" />
        }
      ]);
    } catch (error) {
      console.error('Error loading health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthMetrics();
    const interval = setInterval(loadHealthMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Health Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4">Loading metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Health Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map((metric, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={getStatusColor(metric.status)}>
                    {metric.icon}
                  </span>
                  <Badge variant={getStatusVariant(metric.status)}>
                    {metric.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-muted rounded text-sm">
          <strong>What this monitors:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>NULL overwrites: Critical fields being set to NULL unexpectedly</li>
            <li>Race conditions: Multiple rapid updates to the same record</li>
            <li>Update frequency: Overall database activity</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
