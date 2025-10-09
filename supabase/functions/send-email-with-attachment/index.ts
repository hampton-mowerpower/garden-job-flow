import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    machineBrand: string;
    machineModel: string;
    machineSerial?: string;
    status: string;
    grandTotal: number;
    serviceDeposit: number;
    balanceDue: number;
    parts?: any[];
    labourHours: number;
    labourRate: number;
    gst: number;
  };
}

const generatePdfContent = (jobData: EmailRequest['jobData'], jobNumber: string, template: EmailTemplate): string => {
  const isQuotation = template === 'quotation';
  const title = isQuotation ? 'QUOTATION' : 'INVOICE';
  const date = new Date().toLocaleDateString('en-AU');
  
  let itemsHtml = '';
  let subtotal = 0;
  
  // Add parts
  if (jobData.parts && jobData.parts.length > 0) {
    jobData.parts.forEach((part: any) => {
      const lineTotal = part.unitPrice * part.quantity;
      subtotal += lineTotal;
      itemsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${part.description || 'Part'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${part.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${part.unitPrice.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    });
  }
  
  // Add labour
  if (jobData.labourHours > 0) {
    const labourTotal = jobData.labourHours * jobData.labourRate;
    subtotal += labourTotal;
    itemsHtml += `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Labour</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${jobData.labourHours.toFixed(2)} hrs</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${jobData.labourRate.toFixed(2)}/hr</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${labourTotal.toFixed(2)}</td>
      </tr>
    `;
  }

  return `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
        .document-title { font-size: 20px; font-weight: bold; margin: 20px 0; }
        .info-section { margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db; }
        .totals { margin-top: 20px; float: right; min-width: 300px; }
        .totals tr td { padding: 8px; }
        .total-row { font-weight: bold; font-size: 16px; border-top: 2px solid #000; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">HAMPTON MOWERPOWER</div>
        <p>87 Ludstone Street, Hampton VIC 3188</p>
        <p>Phone: 03-9598-6741 | Email: hamptonmowerpower@gmail.com</p>
        <p>ABN: 97 161 289 069</p>
      </div>

      <div class="document-title">${title}</div>

      <div class="info-section">
        <div class="info-row">
          <div><strong>${isQuotation ? 'Quote' : 'Invoice'} #:</strong> ${jobNumber}</div>
          <div><strong>Date:</strong> ${date}</div>
        </div>
        <div class="info-row">
          <div>
            <strong>Customer:</strong><br>
            ${jobData.customerName}<br>
            ${jobData.customerAddress}<br>
            ${jobData.customerPhone}
            ${jobData.customerEmail ? `<br>${jobData.customerEmail}` : ''}
          </div>
          <div>
            <strong>Equipment:</strong><br>
            ${jobData.machineBrand} ${jobData.machineModel}
            ${jobData.machineSerial ? `<br>Serial: ${jobData.machineSerial}` : ''}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <table class="totals">
        <tr>
          <td>Subtotal:</td>
          <td style="text-align: right;">$${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td>GST (10%):</td>
          <td style="text-align: right;">$${jobData.gst.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>Total (inc. GST):</td>
          <td style="text-align: right;">$${jobData.grandTotal.toFixed(2)}</td>
        </tr>
        ${!isQuotation && jobData.serviceDeposit > 0 ? `
        <tr>
          <td>Deposit Paid:</td>
          <td style="text-align: right;">-$${jobData.serviceDeposit.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>Balance Due:</td>
          <td style="text-align: right;">$${jobData.balanceDue.toFixed(2)}</td>
        </tr>
        ` : ''}
      </table>

      <div style="clear: both; margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="text-align: center; color: #6b7280; font-size: 12px;">
          Thank you for your business!<br>
          ${isQuotation ? 'This quotation is valid for 30 days.' : 'Payment is due upon collection.'}
        </p>
      </div>
    </body>
    </html>
  `;
};

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
      
      // Generate PDF HTML content
      const pdfHtml = generatePdfContent(jobData, jobNumber, template);
      
      // For simplicity, we're sending HTML as attachment
      // In production, you'd want to use a proper PDF generation library
      attachmentBase64 = btoa(unescape(encodeURIComponent(pdfHtml)));
      
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      attachmentFilename = template === 'quotation' 
        ? `QUOTE_${jobNumber}_${dateStr}.html`
        : `INVOICE_${jobNumber}_${dateStr}.html`;
    }

    // Format email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">HAMPTON MOWERPOWER</h1>
          <p style="margin: 5px 0;">Your One-Stop Shop for Outdoor Power Equipment</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <div style="white-space: pre-line; line-height: 1.6;">${message}</div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Job Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Job Number:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${jobNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Equipment:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${jobData.machineBrand} ${jobData.machineModel}</td>
              </tr>
              ${jobData.grandTotal > 0 ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Total:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">$${jobData.grandTotal.toFixed(2)} (inc. GST)</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 5px 0;">If you have any questions, please contact us:</p>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>📞 Phone: <strong style="color: #1f2937;">03-9598-6741</strong></li>
              <li>📧 Email: <strong style="color: #1f2937;">hamptonmowerpower@gmail.com</strong></li>
              <li>📍 Address: <strong style="color: #1f2937;">87 Ludstone Street, Hampton VIC 3188</strong></li>
            </ul>
          </div>
        </div>
        
        <div style="background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 5px 0;">Hampton Mowerpower</p>
          <p style="margin: 5px 0;">ABN: 97 161 289 069</p>
          <p style="margin: 5px 0;">www.hamptonmowerpower.com.au</p>
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
