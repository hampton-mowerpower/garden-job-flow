import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailStats {
  queued: number;
  sending: number;
  sent: number;
  failed: number;
  recentErrors: Array<{
    id: string;
    template: string;
    to_email: string;
    error_message: string;
    created_at: string;
    attempts: number;
  }>;
}

export function EmailHealthMonitor() {
  const [stats, setStats] = useState<EmailStats>({
    queued: 0,
    sending: 0,
    sent: 0,
    failed: 0,
    recentErrors: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get counts by status
      const { data: outboxData, error: outboxError } = await supabase
        .from("email_outbox")
        .select("status");

      if (outboxError) throw outboxError;

      const statusCounts = (outboxData || []).reduce(
        (acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get recent errors
      const { data: failedEmails, error: failedError } = await supabase
        .from("email_outbox")
        .select("id, template, to_email, error_message, created_at, attempts")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(5);

      if (failedError) throw failedError;

      setStats({
        queued: statusCounts.queued || 0,
        sending: statusCounts.sending || 0,
        sent: statusCounts.sent || 0,
        failed: statusCounts.failed || 0,
        recentErrors: failedEmails || [],
      });
    } catch (error: any) {
      console.error("Error fetching email stats:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch email statistics",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up realtime subscription
    const channel = supabase
      .channel("email-health")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "email_outbox",
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRetry = async (emailId: string) => {
    try {
      // Update status to queued to trigger retry
      const { error } = await supabase
        .from("email_outbox")
        .update({ status: "queued", attempts: 0 })
        .eq("id", emailId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email queued for retry",
      });

      fetchStats();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to retry email",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Health Monitor</h2>
          <p className="text-muted-foreground">
            Real-time email delivery status and error tracking
          </p>
        </div>
        <Button onClick={fetchStats} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Queued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queued}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              Sending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {stats.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Recent Failures
            </CardTitle>
            <CardDescription>Last 5 failed email deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentErrors.map((error) => (
                <div
                  key={error.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{error.template}</Badge>
                      <span className="text-sm font-medium">{error.to_email}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {error.error_message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(error.created_at).toLocaleString()} • {error.attempts}{" "}
                      attempts
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetry(error.id)}
                  >
                    Retry
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}