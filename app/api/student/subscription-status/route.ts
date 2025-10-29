// app/api/student/subscription-status/route.ts
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
    
    return NextResponse.json({
      hasActiveSubscription: !!subscription,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        paymentMethod: subscription.paymentMethod.type,
        contractLengthMonths: subscription.contractLengthMonths,
        contractStartDate: subscription.contractStartDate,
        contractEndDate: subscription.contractEndDate,
        paymentsCompleted: subscription.paymentsCompleted,
        totalPayments: subscription.totalPayments
      } : null
    });

  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}