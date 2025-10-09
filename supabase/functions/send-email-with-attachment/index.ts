import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateInvoicePDF } from "./pdf-generator.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailTemplate = 'quotation' | 'service-reminder' | 'completion-reminder' | 'completion';

interface EmailRequest {
  jobId: string;
  jobNumber: string;
  template: EmailTemplate;
  recipient: string;
  cc?: string;
  bcc?: string;
  subject: string;
  message: string;
  jobData: {
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    customerAddress: string;
    companyName?: string;
    companyAbn?: string;
    machineBrand: string;
    machineModel: string;
    machineSerial?: string;
    machineCategory?: string;
    status: string;
    grandTotal: number;
    serviceDeposit: number;
    balanceDue: number;
    parts?: any[];
    labourHours: number;
    labourRate: number;
    gst: number;
    transportTotalCharge?: number;
    transportBreakdown?: string;
    sharpenTotalCharge?: number;
    sharpenBreakdown?: string;
    smallRepairTotal?: number;
    smallRepairDetails?: string;
    problemDescription?: string;
    additionalNotes?: string;
    requestedFinishDate?: string;
  };
}

// Remove old HTML generation function - now using PDF generator

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      jobNumber,
      template,
      recipient,
      cc,
      bcc,
      subject,
      message,
      jobData
    }: EmailRequest = await req.json();

    console.log('Sending email with attachment:', { jobNumber, template, recipient });

    // Determine if this template needs a PDF attachment
    const needsAttachment = template === 'quotation' || template === 'completion';
    
    let attachmentBase64: string | undefined;
    let attachmentFilename: string | undefined;

    if (needsAttachment) {
      console.log('Generating PDF attachment...');
      
      try {
        // Generate proper PDF using pdfmake
        const pdfBuffer = await generateInvoicePDF(
          jobData,
          jobNumber,
          template === 'quotation'
        );
        
        // Convert to base64
        attachmentBase64 = btoa(String.fromCharCode(...pdfBuffer));
        
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        attachmentFilename = template === 'quotation' 
          ? `QUOTE_${jobNumber}_${dateStr}.pdf`
          : `INVOICE_${jobNumber}_${dateStr}.pdf`;
        
        console.log(`PDF generated successfully: ${attachmentFilename}`);
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown error';
        throw new Error(`PDF generation failed: ${errorMessage}`);
      }
    }

    // Format email HTML with logo (user will need to upload logo to Supabase Storage)
    // Logo URL will be: https://kyiuojjaownbvouffqbm.supabase.co/storage/v1/object/public/email-assets/hampton-logo-email.png
    const logoUrl = 'https://kyiuojjaownbvouffqbm.supabase.co/storage/v1/object/public/email-assets/hampton-logo-email.png';
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-bottom: 3px solid #2563eb;">
          <div style="margin-bottom: 10px;">
            <img src="${logoUrl}" alt="Hampton Mowerpower" style="max-width: 300px; height: auto;" />
          </div>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Garden Equipment Sales & Service</p>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <div style="white-space: pre-line; line-height: 1.6; color: #1f2937;">${message}</div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px; font-size: 16px;">Job Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Job Number:</td>
                <td style="padding: 8px 0; color: #1f2937;">${jobNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Equipment:</td>
                <td style="padding: 8px 0; color: #1f2937;">${jobData.machineBrand} ${jobData.machineModel}</td>
              </tr>
              ${jobData.grandTotal > 0 ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Total:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 700;">$${jobData.grandTotal.toFixed(2)} (inc. GST)</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 10px 0; font-size: 14px;">If you have any questions, please contact us:</p>
            <table style="color: #1f2937; line-height: 1.8; font-size: 14px; margin-top: 10px;">
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">📞</td>
                <td style="padding: 4px 0; padding-left: 10px;"><strong>(03) 9598 6741</strong></td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">📧</td>
                <td style="padding: 4px 0; padding-left: 10px;"><a href="mailto:hamptonmowerpower@gmail.com" style="color: #2563eb; text-decoration: none;"><strong>hamptonmowerpower@gmail.com</strong></a></td>
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
          <p style="margin: 5px 0; font-weight: 600;">Hampton Mowerpower</p>
          <p style="margin: 5px 0; color: #9ca3af;">ABN: 97 161 289 069</p>
          <p style="margin: 5px 0;"><a href="https://www.hamptonmowerpower.com.au" style="color: #60a5fa; text-decoration: none;">www.hamptonmowerpower.com.au</a></p>
        </div>
      </div>
    `;

    // Prepare email payload
    const emailPayload: any = {
      from: 'Hampton Mowerpower <onboarding@resend.dev>',
      to: [recipient],
      subject: subject,
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

    // Send email via Resend
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
      console.error('Resend API error:', errorText);
      throw new Error(`Email sending failed: ${errorText}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email-with-attachment function:", error);
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
