import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  reminderId: string;
  customerEmail: string;
  customerName: string;
  reminderType: 'service_due' | 'collection_ready';
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reminderId, customerEmail, customerName, reminderType, message }: ReminderRequest = await req.json();

    console.log('Sending reminder:', { reminderId, customerEmail, reminderType });

    const subject = reminderType === 'service_due' 
      ? '🔧 Service Reminder - Hampton Mower Power'
      : '✅ Collection Ready - Hampton Mower Power';

    const htmlContent = reminderType === 'service_due'
      ? `
        <h2>Hello ${customerName},</h2>
        <p>This is a friendly reminder that your equipment service is due.</p>
        ${message ? `<p><strong>Note:</strong> ${message}</p>` : ''}
        <p>Please contact us to schedule your service appointment:</p>
        <ul>
          <li>📞 Phone: [Your Phone Number]</li>
          <li>📧 Email: hamptonmowerpower@gmail.com</li>
        </ul>
        <p>Thank you for choosing Hampton Mower Power!</p>
        <p>Best regards,<br>The Hampton Mower Power Team</p>
      `
      : `
        <h2>Hello ${customerName},</h2>
        <p>Great news! Your equipment is ready for collection.</p>
        ${message ? `<p><strong>Note:</strong> ${message}</p>` : ''}
        <p>You can pick up your equipment during our business hours:</p>
        <ul>
          <li>📍 Address: [Your Address]</li>
          <li>🕐 Hours: [Your Business Hours]</li>
        </ul>
        <p>Please bring your job receipt when collecting.</p>
        <p>Thank you for your business!</p>
        <p>Best regards,<br>The Hampton Mower Power Team</p>
      `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Hampton Mower Power <onboarding@resend.dev>',
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
  } catch (error: any) {
    console.error("Error in send-reminder function:", error);
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
