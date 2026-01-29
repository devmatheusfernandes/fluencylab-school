import { NextRequest, NextResponse } from "next/server";
import { SubscriptionService } from "@/services/subscriptionService";
import {
  verifyAbacatePaySignature,
  verifyAbacatePayWebhookSecret,
} from "@/lib/abacatepay/config";

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = request.nextUrl.searchParams.get("webhookSecret");
    if (!verifyAbacatePayWebhookSecret(webhookSecret)) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }

    const signature = request.headers.get("x-webhook-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing X-Webhook-Signature header" },
        { status: 400 },
      );
    }

    // IMPORTANT: signature requires the raw request body
    const rawBody = await request.text();

    if (!verifyAbacatePaySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let eventData: any;
    try {
      eventData = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const subscriptionService = new SubscriptionService();
    await subscriptionService.processWebhookEvent(eventData);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("AbacatePay webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "AbacatePay webhook endpoint is active" },
    { status: 200 },
  );
}

