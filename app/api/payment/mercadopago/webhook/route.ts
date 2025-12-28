// app/api/payment/mercadopago/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { SubscriptionService } from '@/services/subscriptionService';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    
    // Get webhook signature for verification
    const xSignature = headersList.get('x-signature');
    const requestId = headersList.get('x-request-id');
    
    // Basic security check - verify webhook comes from Mercado Pago
    if (!xSignature || !requestId) {
      console.error('Missing required webhook headers');
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // Parse webhook payload
    let eventData;
    try {
      eventData = JSON.parse(body);
    } catch (parseError) {
      console.error('Invalid JSON in webhook payload:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Verify HMAC Signature
    // Format: ts=TIMESTAMP,v1=SIGNATURE
    const parts = xSignature.split(',');
    let ts;
    let hash;

    parts.forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) {
            const trimmedKey = key.trim();
            const trimmedValue = value.trim();
            if (trimmedKey === 'ts') ts = trimmedValue;
            if (trimmedKey === 'v1') hash = trimmedValue;
        }
    });

    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    
    if (!secret) {
        console.error('MERCADOPAGO_WEBHOOK_SECRET not configured');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const manifest = `id:${eventData?.data?.id};request-id:${requestId};ts:${ts};`;

    // Create HMAC SHA-256
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const sha = hmac.digest('hex');

    if (sha !== hash) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Validate required fields
    if (!eventData.type || !eventData.data?.id) {
      console.error('Invalid webhook payload structure:', eventData);
      return NextResponse.json(
        { error: 'Invalid payload structure' },
        { status: 400 }
      );
    }

    // Log webhook for debugging
    console.log('Mercado Pago webhook received:', {
      type: eventData.type,
      dataId: eventData.data.id,
      action: eventData.action,
      requestId
    });

    // Process the webhook event
    const subscriptionService = new SubscriptionService();
    await subscriptionService.processWebhookEvent(eventData);

    // Return success response to Mercado Pago
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Mercado Pago webhook processing error:', error);
    
    // Return error response but don't expose internal details
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { message: 'Mercado Pago webhook endpoint is active' },
    { status: 200 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}