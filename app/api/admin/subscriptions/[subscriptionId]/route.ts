// app/api/admin/subscriptions/[subscriptionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SubscriptionService } from '@/services/subscriptionService';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin or manager
    if (!['admin', 'manager'].includes(session.user.role?.toLowerCase() || '')) {
      return NextResponse.json(
        { error: 'Access denied. Admin or manager role required.' },
        { status: 403 }
      );
    }

    const { subscriptionId } = await params;
    const subscriptionService = new SubscriptionService();
    const subscriptionOverview = await subscriptionService.getSubscriptionOverview(subscriptionId);

    return NextResponse.json(subscriptionOverview);
  } catch (error) {
    console.error('Subscription overview fetch error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch subscription overview' },
      { status: 500 }
    );
  }
}