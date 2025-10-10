import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { COMPANY_DETAILS } from '@/constants/company';

export default function ApproveQuotation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyApproved, setAlreadyApproved] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [jobNumber, setJobNumber] = useState('');

  const jobId = searchParams.get('job');
  const email = searchParams.get('email');

  useEffect(() => {
    // Verify job exists
    if (!jobId) {
      setError('Invalid approval link');
    }
  }, [jobId]);

  const handleApprove = async () => {
    if (!jobId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: approvalError } = await supabase.functions.invoke('approve-quotation', {
        body: {
          jobId,
          customerEmail: email,
          customerNote: customerNote.trim() || undefined
        }
      });

      if (approvalError) throw approvalError;

      if (data?.alreadyApproved) {
        setAlreadyApproved(true);
        setJobNumber(data.jobNumber || '');
      } else if (data?.success) {
        setApproved(true);
        setJobNumber(data.jobNumber || '');
      } else {
        throw new Error(data?.message || 'Failed to approve quotation');
      }
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.message || 'Failed to approve quotation');
    } finally {
      setLoading(false);
    }
  };

  if (!jobId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-8 w-8 text-destructive" />
              <CardTitle>Invalid Link</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This approval link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (approved || alreadyApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <CardTitle>
                {alreadyApproved ? 'Already Approved' : 'Quotation Approved!'}
              </CardTitle>
            </div>
            <CardDescription>
              {alreadyApproved 
                ? `This quotation was already approved previously.`
                : `Your quotation has been successfully approved.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobNumber && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-semibold text-blue-900">Job #{jobNumber}</p>
                <p className="text-sm text-blue-700 mt-1">
                  We'll contact you shortly to arrange the repair work.
                </p>
              </div>
            )}
            
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900">{COMPANY_DETAILS.name}</p>
              <p className="text-sm text-gray-600">{COMPANY_DETAILS.tagline}</p>
              <p className="text-sm text-gray-600">
                {COMPANY_DETAILS.address.street}, {COMPANY_DETAILS.address.suburb} {COMPANY_DETAILS.address.postcode}
              </p>
              <p className="text-sm text-gray-600">{COMPANY_DETAILS.contact.phone}</p>
              <p className="text-sm text-gray-600">
                <a href={`mailto:${COMPANY_DETAILS.contact.email}`} className="text-blue-600 hover:underline">
                  {COMPANY_DETAILS.contact.email}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Approve Quotation</CardTitle>
          <CardDescription>
            Click the button below to approve this quotation and proceed with the repair work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
              <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="customer-note">Add a note (optional)</Label>
            <Textarea
              id="customer-note"
              placeholder="Any additional comments or requirements..."
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleApprove}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              'Approve Quotation'
            )}
          </Button>

          <div className="border-t pt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-900">{COMPANY_DETAILS.name}</p>
            <p className="text-xs text-gray-600">
              {COMPANY_DETAILS.address.street}, {COMPANY_DETAILS.address.suburb} {COMPANY_DETAILS.address.postcode}
            </p>
            <p className="text-xs text-gray-600">{COMPANY_DETAILS.contact.phone}</p>
            <p className="text-xs text-gray-600">
              <a href={`mailto:${COMPANY_DETAILS.contact.email}`} className="text-blue-600 hover:underline">
                {COMPANY_DETAILS.contact.email}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
