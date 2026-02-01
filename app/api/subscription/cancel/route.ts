// app/api/subscription/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SubscriptionService } from '@/services/financial/subscriptionService';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId, reason, immediate } = await request.json();
    const reasonText = typeof reason === 'string' ? reason.trim() : '';
    
    // Validate required fields
    if (!subscriptionId && !reasonText) {
      return NextResponse.json(
        { error: 'Subscription ID and reason are required', message: 'Subscription ID and reason are required' },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();
    
    // Resolve subscription: use provided ID or fallback to active subscription
    const subscription =
      (subscriptionId && await subscriptionService.getSubscription(subscriptionId)) ||
      (!subscriptionId && await subscriptionService.getActiveSubscription(session.user.id));

    if (!subscription || subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Subscription not found or unauthorized', message: 'Subscription not found or unauthorized' },
        { status: 404 }
      );
    }

    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription is already canceled', message: 'Subscription is already canceled' },
        { status: 400 }
      );
    }

    const result = await subscriptionService.cancelSubscription({
      subscriptionId,
      reason: reasonText || 'User requested cancellation',
      immediate: immediate === true
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message, message: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to cancel subscription', message: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
