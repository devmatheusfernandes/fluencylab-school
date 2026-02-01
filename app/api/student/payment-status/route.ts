// app/api/student/payment-status/route.ts
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
    const paymentStatus = await subscriptionService.getPaymentStatus(session.user.id);

    // Fetch user to get active status
    const { userRepository } = await import('@/repositories');
    const user = await userRepository.findById(session.user.id);

    if (user) {
      paymentStatus.userIsActive = user.isActive;
    }

    return NextResponse.json(paymentStatus);
  } catch (error) {
    console.error('Payment status fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}