// app/api/onboarding/create-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SubscriptionService } from '@/services/subscriptionService';
import { UserRoles } from '@/types/users/userRoles';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentMethod, billingDay, contractLengthMonths, cardToken } = body;

    // Validate input
    if (!paymentMethod || !billingDay || !contractLengthMonths) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (billingDay < 1 || billingDay > 28) {
      return NextResponse.json(
        { error: 'Billing day must be between 1 and 28' },
        { status: 400 }
      );
    }

    if (![6, 12].includes(contractLengthMonths)) {
      return NextResponse.json(
        { error: 'Contract length must be 6 or 12 months' },
        { status: 400 }
      );
    }

    // Determine user role for pricing
    const userRole = session.user.role as UserRoles || UserRoles.STUDENT;
    
    // Create subscription using the subscription service
    const subscriptionService = new SubscriptionService();
    
    const result = await subscriptionService.createSubscription({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole,
      paymentMethod: paymentMethod as 'pix' | 'credit_card',
      billingDay,
      cardToken,
      contractLengthMonths: contractLengthMonths as 6 | 12
    });

    if (paymentMethod === 'credit_card' && 'checkoutUrl' in result && result.checkoutUrl) {
      return NextResponse.json({
        success: true,
        checkoutUrl: result.checkoutUrl,
        subscription: result.subscription
      });
    }

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      firstPayment: 'firstPayment' in result ? result.firstPayment : undefined
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}