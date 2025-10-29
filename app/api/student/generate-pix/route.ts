// app/api/student/generate-pix/route.ts
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

    // Verify user is a student
    if (!['student', 'guarded_student'].includes(session.user.role?.toLowerCase() || '')) {
      return NextResponse.json(
        { error: 'Access denied. Student role required.' },
        { status: 403 }
      );
    }

    const { subscriptionId, paymentNumber } = await request.json();
    
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();
    
    // Verify subscription belongs to user and is PIX-based
    const subscription = await subscriptionService.getSubscription(subscriptionId);
    if (!subscription || subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Subscription not found or unauthorized' },
        { status: 404 }
      );
    }

    if (subscription.planType !== 'pix') {
      return NextResponse.json(
        { error: 'PIX generation is only available for PIX subscriptions' },
        { status: 400 }
      );
    }

    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Cannot generate PIX for canceled subscription' },
        { status: 400 }
      );
    }

    const pixPayment = await subscriptionService.generateMonthlyPixPayment(subscriptionId, paymentNumber);

    return NextResponse.json(pixPayment);
  } catch (error) {
    console.error('PIX generation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate PIX payment' },
      { status: 500 }
    );
  }
}