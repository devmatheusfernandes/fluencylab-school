import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SubscriptionService } from '@/services/financial/subscriptionService';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
    
    // Get user's active subscription to find the subscription ID
    // We can also get all payments for the user directly if we want history across subscriptions
    // But typically we want the current subscription's history first
    const subscription = await subscriptionService.getActiveSubscription(session.user.id);
    
    if (!subscription) {
      return NextResponse.json({ payments: [] });
    }

    const payments = await subscriptionService.getSubscriptionPayments(subscription.id);

    // Sort by due date descending (newest first)
    payments.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
