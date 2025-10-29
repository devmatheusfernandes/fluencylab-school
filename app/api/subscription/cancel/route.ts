// app/api/subscription/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SubscriptionService } from '@/services/subscriptionService';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId, reason, immediate } = await request.json();
    
    // Validate required fields
    if (!subscriptionId || !reason) {
      return NextResponse.json(
        { error: 'Subscription ID and reason are required' },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();
    
    // Verify subscription belongs to user
    const subscription = await subscriptionService.getSubscription(subscriptionId);
    if (!subscription || subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Subscription not found or unauthorized' },
        { status: 404 }
      );
    }

    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription is already canceled' },
        { status: 400 }
      );
    }

    const result = await subscriptionService.cancelSubscription({
      subscriptionId,
      reason,
      immediate: immediate === true
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}