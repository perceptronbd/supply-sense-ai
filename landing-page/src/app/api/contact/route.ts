import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

interface ContactFormBody {
  name: string;
  email: string;
  company?: string;
  message: string;
}

const MY_EMAIL = process.env.NEXT_PUBLIC_EMAIL || 'info@perceptron.site';

export async function POST(req: NextRequest) {
  try {
    const body: ContactFormBody = await req.json();
    const { name, email, company, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    // Validate API key is available
    const apiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'Email service not configured.' },
        { status: 500 }
      );
    }

    // Initialize Resend client at runtime
    const resend = new Resend(apiKey);

    const data = await resend.emails.send({
      from: 'Contact Form <onboarding@resend.dev>', //internal sender (we can replace it with our domain email)
      to: MY_EMAIL,
      replyTo: email, //user email
      subject: `Supply Sense Contact Request from ${name}`,
      html: `
        <h2>New Supply Sense Contact Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'N/A'}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    console.error('Resend Error:', error);

    return NextResponse.json({ success: false, error: 'Failed to send email.' }, { status: 500 });
  }
}
