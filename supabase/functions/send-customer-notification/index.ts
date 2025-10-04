import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  jobId: string;
  jobNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notificationType: 'email' | 'sms';
  message: string;
  jobStatus: string;
  machineBrand: string;
  machineModel: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      jobNumber,
      customerName,
      customerEmail,
      notificationType,
      message,
      jobStatus,
      machineBrand,
      machineModel
    }: NotificationRequest = await req.json();

    console.log('Sending customer notification:', { jobNumber, customerName, notificationType, jobStatus });

    if (notificationType === 'email') {
      if (!customerEmail) {
        throw new Error('Customer email is required for email notifications');
      }

      const subject = `Job Update - ${jobNumber} | Hampton Mowerpower`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">HAMPTON MOWERPOWER</h1>
            <p style="margin: 5px 0;">Your One-Stop Shop for Outdoor Power Equipment</p>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${customerName},</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <p style="margin: 0; line-height: 1.6;">${message}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Job Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Job Number:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937;">${jobNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Equipment:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937;">${machineBrand} ${machineModel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Status:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; text-transform: capitalize;">${jobStatus}</td>
                </tr>
              </table>
            </div>
            
            ${jobStatus === 'completed' ? `
              <div style="background: #dcfce7; border: 2px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #15803d; font-weight: 600;">
                  ✅ Your equipment is ready for collection!
                </p>
              </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 5px 0;">If you have any questions, please don't hesitate to contact us:</p>
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

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Hampton Mowerpower <onboarding@resend.dev>',
          to: [customerEmail],
          subject: subject,
          html: htmlContent,
        }),
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
    } else if (notificationType === 'sms') {
      // SMS functionality can be added here in the future (Twilio, etc.)
      throw new Error('SMS notifications are not yet implemented');
    } else {
      throw new Error('Invalid notification type');
    }
  } catch (error: any) {
    console.error("Error in send-customer-notification function:", error);
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
