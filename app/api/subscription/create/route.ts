import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { SubscriptionService } from "@/services/subscriptionService";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentMethod, billingDay, cardToken, contractLengthMonths } =
      await request.json();

    // Log the request for debugging
    console.log("Subscription creation request:", {
      paymentMethod,
      billingDay,
      contractLengthMonths,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
    });

    // Validate required fields
    if (!paymentMethod || !billingDay || !contractLengthMonths) {
      return NextResponse.json(
        {
          error:
            "Payment method, billing day, and contract length are required",
        },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!["pix", "credit_card"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Validate billing day (1-28 to avoid month-end issues)
    if (billingDay < 1 || billingDay > 28) {
      return NextResponse.json(
        { error: "Billing day must be between 1 and 28" },
        { status: 400 }
      );
    }

    // Validate contract length
    if (![6, 12].includes(contractLengthMonths)) {
      return NextResponse.json(
        { error: "Contract length must be 6 or 12 months" },
        { status: 400 }
      );
    }

    // Note: cardToken is optional for credit card payments as Mercado Pago
    // uses preapproval flow that redirects to their secure checkout page

    const subscriptionService = new SubscriptionService();
    const result = await subscriptionService.createSubscription({
      userId: session.user.id,
      userEmail: session.user.email!,
      userRole: session.user.role!,
      paymentMethod,
      billingDay: parseInt(billingDay),
      cardToken,
      contractLengthMonths,
    });

    console.log("Subscription creation successful:", {
      subscriptionId: result.subscription?.id,
      checkoutUrl:
        "checkoutUrl" in result && result.checkoutUrl ? "Present" : "Missing",
      paymentMethod,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Subscription creation error:", error);

    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
