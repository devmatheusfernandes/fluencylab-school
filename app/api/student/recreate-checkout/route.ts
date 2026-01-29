// app/api/student/recreate-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SubscriptionService } from '@/services/subscriptionService';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Credit card payments are disabled (PIX only)" },
    { status: 410 },
  );
}