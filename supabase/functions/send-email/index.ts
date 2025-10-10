import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { generateInvoicePDF } from "./pdf-generator.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  job_id: string;
  template: 'quotation' | 'service-reminder' | 'completion-reminder' | 'completion' | 'notify-customer';
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  message?: string;
  idempotency_key?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: EmailRequest = await req.json();
    const { job_id, template, to, cc, bcc, subject, message, idempotency_key } = requestData;

    console.log('Email request received:', { job_id, template, to });

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate idempotency key if not provided
    const idempotencyKey = idempotency_key || `${job_id}-${template}-${Date.now()}`;

    // Check for existing outbox entry (idempotency)
    const { data: existingEmail } = await supabase
      .from('email_outbox')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingEmail) {
      console.log('Email already queued/sent:', idempotencyKey);
      return new Response(
        JSON.stringify({
          ok: true,
          outbox_id: existingEmail.id,
          message: 'Email already processed',
          already_sent: true
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Fetch fresh job data from database
    const { data: job, error: jobError } = await supabase
      .from('jobs_db')
      .select(`
        *,
        customer:customers_db!jobs_db_customer_id_fkey(*),
        account_customer:account_customers!jobs_db_account_customer_id_fkey(*)
      `)
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      console.error('Job fetch error:', jobError);
      throw new Error('Job not found');
    }

    // Determine recipient
    const recipientEmail = to || job.customer?.email;
    if (!recipientEmail) {
      throw new Error('No recipient email found');
    }

    // Generate subject if not provided
    const emailSubject = subject || getDefaultSubject(template, job.job_number);

    // Generate message body
    const emailMessage = message || getDefaultMessage(template, job);

    // Create outbox entry
    const { data: outboxEntry, error: outboxError } = await supabase
      .from('email_outbox')
      .insert({
        job_id,
        template,
        to_email: recipientEmail,
        cc_email: cc,
        bcc_email: bcc,
        subject: emailSubject,
        payload_json: { job_data: job, custom_message: message },
        idempotency_key: idempotencyKey,
        status: 'sending'
      })
      .select()
      .single();

    if (outboxError) {
      console.error('Outbox creation error:', outboxError);
      throw outboxError;
    }

    // Log attempt
    await supabase.from('email_logs').insert({
      outbox_id: outboxEntry.id,
      status: 'attempt',
      meta_json: { template, recipient: recipientEmail }
    });

    // Generate PDFs if needed
    let attachmentBase64: string | undefined;
    let attachmentFilename: string | undefined;

    const needsAttachment = template === 'quotation' || template === 'completion';
    
    if (needsAttachment) {
      console.log('Generating PDF attachment...');
      
      try {
        const pdfBuffer = await generateInvoicePDF(
          {
            customerName: job.customer?.name || '',
            customerEmail: job.customer?.email,
            customerPhone: job.customer?.phone || '',
            customerAddress: job.customer?.address || '',
            companyName: job.job_company_name || job.customer?.company_name,
            companyAbn: job.customer?.company_abn,
            machineBrand: job.machine_brand,
            machineModel: job.machine_model,
            machineSerial: job.machine_serial,
            machineCategory: job.machine_category,
            status: job.status,
            grandTotal: job.grand_total || 0,
            serviceDeposit: job.service_deposit || 0,
            balanceDue: job.balance_due || 0,
            quotationAmount: job.quotation_amount,
            labourHours: job.labour_hours || 0,
            labourRate: job.labour_rate || 0,
            gst: job.gst || 0,
            transportTotalCharge: job.transport_total_charge,
            transportBreakdown: job.transport_breakdown,
            sharpenTotalCharge: job.sharpen_total_charge,
            sharpenBreakdown: job.sharpen_breakdown,
            smallRepairTotal: job.small_repair_total,
            smallRepairDetails: job.small_repair_details,
            problemDescription: job.problem_description,
            additionalNotes: job.additional_notes,
            requestedFinishDate: job.requested_finish_date,
          },
          job.job_number,
          template === 'quotation'
        );
        
        attachmentBase64 = btoa(String.fromCharCode(...pdfBuffer));
        
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        attachmentFilename = template === 'quotation' 
          ? `QUOTE_${job.job_number}_${dateStr}.pdf`
          : `INVOICE_${job.job_number}_${dateStr}.pdf`;
        
        console.log(`PDF generated successfully: ${attachmentFilename}`);
      } catch (pdfError: any) {
        console.error('PDF generation error:', pdfError);
        throw new Error(`PDF generation failed: ${pdfError.message}`);
      }
    }

    // Generate approve URL for quotations
    const approveUrl = template === 'quotation' && recipientEmail
      ? `https://dbf3f430-ba0b-4367-a8eb-b3b04d093b9f.lovableproject.com/approve-quotation.html?job=${encodeURIComponent(job_id)}&email=${encodeURIComponent(recipientEmail)}`
      : null;

    // Build email HTML
    const emailHtml = buildEmailHtml(job, emailMessage, approveUrl);

    // Prepare email payload
    const emailPayload: any = {
      from: 'Hampton Mowerpower <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: emailSubject,
      html: emailHtml,
    };

    if (cc) emailPayload.cc = [cc];
    if (bcc) emailPayload.bcc = [bcc];

    if (needsAttachment && attachmentBase64 && attachmentFilename) {
      emailPayload.attachments = [{
        filename: attachmentFilename,
        content: attachmentBase64,
      }];
    }

    // Send email via Resend with retry logic
    let emailData;
    let lastError;
    const maxAttempts = 3;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          throw new Error(errorText);
        }

        emailData = await emailResponse.json();
        console.log("Email sent successfully:", emailData);
        
        // Success! Update outbox
        await supabase
          .from('email_outbox')
          .update({
            status: 'sent',
            provider_id: emailData.id,
            sent_at: new Date().toISOString(),
            attempts: attempt
          })
          .eq('id', outboxEntry.id);

        // Log success
        await supabase.from('email_logs').insert({
          outbox_id: outboxEntry.id,
          provider_id: emailData.id,
          status: 'success',
          meta_json: { attempt, email_id: emailData.id }
        });

        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        console.error(`Email attempt ${attempt} failed:`, error.message);
        
        // Log failure attempt
        await supabase.from('email_logs').insert({
          outbox_id: outboxEntry.id,
          status: 'failure',
          error_message: error.message,
          meta_json: { attempt }
        });

        if (attempt < maxAttempts) {
          // Exponential backoff: wait 2^attempt seconds
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // Check if all attempts failed
    if (!emailData && lastError) {
      await supabase
        .from('email_outbox')
        .update({
          status: 'failed',
          error_message: lastError.message,
          attempts: maxAttempts
        })
        .eq('id', outboxEntry.id);

      throw lastError;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        outbox_id: outboxEntry.id,
        provider_id: emailData?.id,
        message: 'Email sent successfully'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getDefaultSubject(template: string, jobNumber: string): string {
  switch (template) {
    case 'quotation':
      return `Quotation for Service - Job #${jobNumber}`;
    case 'service-reminder':
      return `Service Reminder - Job #${jobNumber}`;
    case 'completion-reminder':
      return `Your Equipment is Ready - Job #${jobNumber}`;
    case 'completion':
      return `Service Completed - Invoice for Job #${jobNumber}`;
    case 'notify-customer':
      return `Update on Your Service - Job #${jobNumber}`;
    default:
      return `Hampton Mowerpower - Job #${jobNumber}`;
  }
}

function getDefaultMessage(template: string, job: any): string {
  const customerName = job.customer?.name || 'Valued Customer';
  const machineDesc = `${job.machine_brand} ${job.machine_model}${job.machine_serial ? ` (SN: ${job.machine_serial})` : ''}`;
  
  switch (template) {
    case 'quotation':
      return `Dear ${customerName},\n\nPlease find attached the quotation for your ${machineDesc}.\n\nYou can approve this quotation by clicking the button below.\n\nPlease do not reply to this email. If you have any questions, call us on 03-9598 6741.`;
    case 'service-reminder':
      return `Dear ${customerName},\n\nThis is a reminder that your ${machineDesc} is due for service.\n\nPlease do not reply to this email. If you have any questions, call us on 03-9598 6741.`;
    case 'completion-reminder':
      return `Dear ${customerName},\n\nGreat news — we've completed the service/repair on your ${machineDesc}.\n\nPickup\nFrom: Hampton Mowerpower, 87 Ludstone Street, Hampton VIC 3188\nHours: Monday-Friday 8:00 AM - 5:00 PM, Saturday 8:00 AM - 12:00 PM\n\nPlease do not reply to this email. If you have any questions, call us on 03-9598 6741.`;
    case 'completion':
      return `Dear ${customerName},\n\nYour ${machineDesc} service has been completed. Please find the invoice attached.\n\nPlease do not reply to this email. If you have any questions, call us on 03-9598 6741.`;
    case 'notify-customer':
      return `Dear ${customerName},\n\nYour service job (#${job.job_number}) — ${machineDesc} — has been received and is pending review.\n\n${job.problem_description ? `Reported problems:\n${job.problem_description}\n\n` : ''}Please do not reply to this email. If you have any questions, call us on 03-9598 6741.`;
    default:
      return `Dear ${customerName},\n\nThank you for choosing Hampton Mowerpower.\n\nPlease do not reply to this email. If you have any questions, call us on 03-9598 6741.`;
  }
}

function buildEmailHtml(job: any, message: string, approveUrl: string | null): string {
  const customerType = job.customer_type === 'commercial' ? 'Commercial' : 'Domestic';
  const companyDisplay = job.job_company_name || job.customer?.company_name || '';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f9fafb; padding: 20px; text-align: center; border-bottom: 3px solid #2563eb;">
        <div style="margin-bottom: 10px;">
          <img src="https://dbf3f430-ba0b-4367-a8eb-b3b04d093b9f.lovableproject.com/hampton-logo-email.png" 
               alt="Hampton Mowerpower" 
               width="300" 
               height="auto"
               style="max-width: 300px; height: auto; display: block; margin: 0 auto;" />
        </div>
        <p style="margin: 5px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Garden Equipment Sales & Service</p>
      </div>
      
      <div style="padding: 30px; background: #ffffff;">
        <div style="white-space: pre-line; line-height: 1.6; color: #1f2937; margin-bottom: 20px;">${message}</div>
        
        ${approveUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${approveUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Approve Quotation
          </a>
          <p style="margin-top: 10px; color: #6b7280; font-size: 13px;">Click the button above to approve this quotation</p>
        </div>
        ` : ''}
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px; font-size: 16px;">Customer & Machine Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Customer Name:</td>
              <td style="padding: 8px 0; color: #1f2937;">${job.customer?.name || 'N/A'}</td>
            </tr>
            ${companyDisplay ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Company Name:</td>
              <td style="padding: 8px 0; color: #1f2937;">${companyDisplay}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Customer Type:</td>
              <td style="padding: 8px 0; color: #1f2937;">${customerType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Job Number:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 700;">${job.job_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Machine Category:</td>
              <td style="padding: 8px 0; color: #1f2937;">${job.machine_category}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Brand & Model:</td>
              <td style="padding: 8px 0; color: #1f2937;">${job.machine_brand} ${job.machine_model}</td>
            </tr>
            ${job.machine_serial ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Serial Number:</td>
              <td style="padding: 8px 0; color: #1f2937;">${job.machine_serial}</td>
            </tr>
            ` : ''}
            ${job.grand_total > 0 ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Total:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 700;">$${job.grand_total.toFixed(2)} (inc. GST)</td>
            </tr>
            ${job.quotation_amount && job.quotation_amount > 0 ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Quotation Fee (deducted):</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 700;">-$${job.quotation_amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Amount Payable:</td>
              <td style="padding: 8px 0; color: #16a34a; font-weight: 700;">$${(job.grand_total - job.quotation_amount).toFixed(2)} (inc. GST)</td>
            </tr>
            ` : ''}
            ` : ''}
          </table>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #d97706; margin: 10px 0; font-size: 14px; font-weight: 600; background: #fef3c7; padding: 12px; border-radius: 6px; border-left: 4px solid #d97706;">
            ⚠️ Please do not reply to this email. If you have any questions, call us on 03-9598 6741.
          </p>
          <p style="color: #6b7280; margin: 15px 0 10px 0; font-size: 14px;">Contact Information:</p>
          <table style="color: #1f2937; line-height: 1.8; font-size: 14px; margin-top: 10px;">
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">📞</td>
              <td style="padding: 4px 0; padding-left: 10px;"><strong>03-9598 6741</strong></td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">📍</td>
              <td style="padding: 4px 0; padding-left: 10px;"><strong>87 Ludstone Street, Hampton VIC 3188</strong></td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">🌐</td>
              <td style="padding: 4px 0; padding-left: 10px;"><a href="https://www.hamptonmowerpower.com.au" style="color: #2563eb; text-decoration: none;"><strong>www.hamptonmowerpower.com.au</strong></a></td>
            </tr>
          </table>
        </div>
      </div>
      
      <div style="background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 5px 0; font-weight: 600;">HAMPTON MOWERPOWER</p>
        <p style="margin: 5px 0; color: #9ca3af;">Garden Equipment Sales & Service</p>
        <p style="margin: 5px 0; color: #9ca3af;">ABN: 97 161 289 069</p>
        <p style="margin: 5px 0;"><a href="https://www.hamptonmowerpower.com.au" style="color: #60a5fa; text-decoration: none;">www.hamptonmowerpower.com.au</a></p>
      </div>
    </div>
  `;
}

serve(handler);