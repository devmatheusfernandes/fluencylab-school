// app/api/student/recreate-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SubscriptionService } from '@/services/subscriptionService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Recreate checkout request: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a student
    if (!['student', 'guarded_student'].includes(session.user.role?.toLowerCase() || '')) {
      console.log('Recreate checkout request: Invalid role:', session.user.role);
      return NextResponse.json(
        { error: 'Access denied. Student role required.' },
        { status: 403 }
      );
    }

    const { subscriptionId } = await request.json();
    
    console.log('Recreate checkout request:', {
      userId: session.user.id,
      userRole: session.user.role,
      subscriptionId
    });
    
    if (!subscriptionId) {
      console.log('Recreate checkout request: Missing subscription ID');
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();
    
    // Verify subscription belongs to user
    console.log('Fetching subscription for recreation:', subscriptionId);
    const subscription = await subscriptionService.getSubscription(subscriptionId);
    
    if (!subscription) {
      console.log('Subscription not found for recreation:', subscriptionId);
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    if (subscription.userId !== session.user.id) {
      console.log('Subscription ownership mismatch for recreation:', {
        subscriptionUserId: subscription.userId,
        sessionUserId: session.user.id
      });
      return NextResponse.json(
        { error: 'Unauthorized access to subscription' },
        { status: 404 }
      );
    }

    // Recreate checkout URL
    console.log('Recreating checkout for subscription:', subscriptionId);
    const checkoutUrl = await subscriptionService.recreateCreditCardSubscription(subscriptionId);
    
    if (!checkoutUrl) {
      console.log('Failed to recreate checkout URL for subscription:', {
        subscriptionId,
        planType: subscription.planType,
        status: subscription.status
      });
      
      return NextResponse.json(
        { error: 'Unable to recreate checkout session. Please contact support or create a new subscription.' },
        { status: 400 }
      );
    }

    console.log('Checkout URL recreated successfully');
    return NextResponse.json({ checkoutUrl });

  } catch (error) {
    console.error('Error in recreate checkout endpoint:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}