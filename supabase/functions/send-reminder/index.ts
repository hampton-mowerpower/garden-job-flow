import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderRequest {
  reminderId: string;
  customerEmail: string;
  customerName: string;
  reminderType: 'service_due' | 'collection_ready';
  message?: string;
  machineBrand?: string;
  machineModel?: string;
  machineCategory?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }

    const { 
      reminderId, 
      customerEmail, 
      customerName, 
      reminderType, 
      message,
      machineBrand,
      machineModel,
      machineCategory
    }: ReminderRequest = await req.json();

    console.log('Sending reminder:', { reminderId, customerEmail, reminderType });

    // Customize email based on reminder type
    const subject = reminderType === 'service_due' 
      ? `Service Reminder: ${machineBrand} ${machineModel}`
      : 'Your Equipment is Ready for Collection';

    const htmlContent = reminderType === 'service_due'
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Service Reminder from Hampton Mowerpower</h2>
          <p>Hi ${customerName},</p>
          <p>This is a friendly reminder that your <strong>${machineCategory || ''} ${machineBrand} ${machineModel}</strong> is due for its scheduled service.</p>
          ${message ? `<p>${message}</p>` : ''}
          <p>Regular servicing helps maintain optimal performance and extends the life of your equipment.</p>
          <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
            <h3 style="margin-top: 0;">Contact Us Today</h3>
            <p style="margin: 5px 0;"><strong>Phone:</strong> 03 9598 1244</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> hamptonmowerpower@gmail.com</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> 87 Ludstone Street, Hampton VIC 3188</p>
          </div>
          <p>We look forward to servicing your equipment soon.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>Hampton Mowerpower Team</strong></p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Collection Ready</h2>
          <p>Hi ${customerName},</p>
          <p>Great news! Your <strong>${machineBrand} ${machineModel}</strong> has been serviced and is ready for collection.</p>
          ${message ? `<p>${message}</p>` : ''}
          <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
            <h3 style="margin-top: 0;">Collection Details</h3>
            <p style="margin: 5px 0;"><strong>Location:</strong> 87 Ludstone Street, Hampton VIC 3188</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> 03 9598 1244</p>
            <p style="margin: 5px 0;"><strong>Hours:</strong> Mon-Fri 8:30am-5pm, Sat 9am-1pm</p>
          </div>
          <p>Please bring your service receipt when collecting.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>Hampton Mowerpower Team</strong></p>
        </div>
      `;

    // Send email via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Hampton Mowerpower <onboarding@resend.dev>',
        to: [customerEmail],
        subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Email sending failed: ${errorText}`);
    }

    const emailData = await emailResponse.json();
    console.log('Email sent successfully:', emailData);

    // Update reminder status in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      const supabaseClient = createClient(supabaseUrl, supabaseKey);
      await supabaseClient
        .from('service_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reminderId);
    }

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error sending reminder:', error);
    
    // Try to update reminder with error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const bodyText = await req.text();
      const body = JSON.parse(bodyText);
      
      if (supabaseUrl && supabaseKey && body.reminderId) {
        const supabaseClient = createClient(supabaseUrl, supabaseKey);
        await supabaseClient
          .from('service_reminders')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', body.reminderId);
      }
    } catch (updateError) {
      console.error('Error updating reminder status:', updateError);
    }
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
