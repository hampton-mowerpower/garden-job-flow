import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  jobId: string;
  customerEmail?: string;
  customerNote?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId, customerEmail, customerNote }: ApprovalRequest = await req.json();

    console.log('Approving quotation:', { jobId, customerEmail });

    if (!jobId) {
      throw new Error('Job ID is required');
    }

    // Create Supabase client with service role to bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs_db')
      .select('*, customer:customers_db(*)')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('Job fetch error:', jobError);
      throw new Error('Job not found');
    }

    // Check if already approved
    if (job.quotation_status === 'approved') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'This quotation has already been approved',
          alreadyApproved: true 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update job to mark quotation as approved
    const { error: updateError } = await supabase
      .from('jobs_db')
      .update({
        quotation_status: 'approved',
        quotation_approved_at: new Date().toISOString(),
        additional_notes: customerNote 
          ? `${job.additional_notes || ''}\n\nCustomer Approval Note: ${customerNote}`.trim()
          : job.additional_notes
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    // Log audit entry
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        action: 'quotation_approved',
        target_type: 'jobs_db',
        target_id: jobId,
        meta: {
          job_number: job.job_number,
          customer_email: customerEmail || job.customer?.email,
          customer_note: customerNote,
          approved_via: 'email_link'
        }
      });

    if (auditError) {
      console.error('Audit log error:', auditError);
    }

    console.log('Quotation approved successfully:', jobId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Quotation approved for Job #${job.job_number}`,
        jobNumber: job.job_number
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in approve-quotation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
