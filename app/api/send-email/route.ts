import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend SDK if API key is present
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required parameters (to, subject, html)' }, { status: 400 });
    }

    if (resend) {
      try {
        const data = await resend.emails.send({
          from: `Classicbug <${fromEmail}>`,
          to: [to],
          subject: subject,
          html: html,
        });

        console.log(`[Email System] Email sent via Resend:`, data);
        return NextResponse.json({ success: true, resendId: data.data?.id });
      } catch (err: any) {
        console.error('[Email System] Resend SDK failed, fallback to console log:', err);
      }
    }

    // Fallback/Demo Mode: Output details to Node console log
    console.log('\n================================================================');
    console.log('[EMAIL SIMULATOR] TRANSACTIONAL EMAIL TRIGGERED');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('----------------------------------------------------------------');
    console.log(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500) + '...');
    console.log('================================================================\n');

    return NextResponse.json({ 
      success: true, 
      mock: true, 
      message: 'Email logged to server console (Resend not configured or API key missing)' 
    });
  } catch (error: any) {
    console.error('Send email API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
