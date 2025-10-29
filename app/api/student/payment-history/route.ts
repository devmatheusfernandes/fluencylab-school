// app/api/student/payment-history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SubscriptionService } from '@/services/subscriptionService';

export async function GET(request: NextRequest) {
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

    const subscriptionService = new SubscriptionService();
    
    // Get user's active subscription
    const subscription = await subscriptionService.getActiveSubscription(session.user.id);
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Get payment history for the subscription
    const payments = await subscriptionService.getSubscriptionPayments(subscription.id);

    // Sort payments by payment number (newest first for display purposes)
    const sortedPayments = payments.sort((a, b) => b.paymentNumber - a.paymentNumber);

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      payments: sortedPayments
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}