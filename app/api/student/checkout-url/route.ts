// app/api/student/checkout-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SubscriptionService } from '@/services/subscriptionService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Checkout URL request: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a student
    if (!['student', 'guarded_student'].includes(session.user.role?.toLowerCase() || '')) {
      console.log('Checkout URL request: Invalid role:', session.user.role);
      return NextResponse.json(
        { error: 'Access denied. Student role required.' },
        { status: 403 }
      );
    }

    const { subscriptionId } = await request.json();
    
    console.log('Checkout URL request:', {
      userId: session.user.id,
      userRole: session.user.role,
      subscriptionId
    });
    
    if (!subscriptionId) {
      console.log('Checkout URL request: Missing subscription ID');
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();
    
    // Verify subscription belongs to user
    console.log('Fetching subscription:', subscriptionId);
    const subscription = await subscriptionService.getSubscription(subscriptionId);
    
    if (!subscription) {
      console.log('Subscription not found:', subscriptionId);
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    if (subscription.userId !== session.user.id) {
      console.log('Subscription ownership mismatch:', {
        subscriptionUserId: subscription.userId,
        sessionUserId: session.user.id
      });
      return NextResponse.json(
        { error: 'Unauthorized access to subscription' },
        { status: 404 }
      );
    }

    // Get checkout URL
    console.log('Getting checkout URL for subscription:', subscriptionId);
    const checkoutUrl = await subscriptionService.getCheckoutUrl(subscriptionId);
    
    if (!checkoutUrl) {
      console.log('No checkout URL available for subscription:', {
        subscriptionId,
        planType: subscription.planType,
        status: subscription.status,
        mercadoPagoId: subscription.mercadoPagoSubscriptionId
      });
      
      // Provide more specific error messages
      if (subscription.planType !== 'credit_card') {
        return NextResponse.json(
          { error: 'Checkout URL is only available for credit card subscriptions' },
          { status: 400 }
        );
      }
      
      if (subscription.status !== 'pending') {
        return NextResponse.json(
          { error: `Checkout URL not available for ${subscription.status} subscriptions` },
          { status: 400 }
        );
      }
      
      if (!subscription.mercadoPagoSubscriptionId) {
        return NextResponse.json(
          { error: 'Subscription not properly linked to payment provider' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Checkout URL not available - the payment session may have expired. Please create a new subscription.' },
        { status: 404 }
      );
    }

    console.log('Checkout URL retrieved successfully');
    return NextResponse.json({ checkoutUrl });

  } catch (error) {
    console.error('Error in checkout URL endpoint:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}