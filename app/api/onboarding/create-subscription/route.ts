// app/api/onboarding/create-subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SubscriptionService } from "@/services/financial/subscriptionService";
import { UserRoles } from "@/types/users/userRoles";

export async function POST(request: NextRequest) {
  //TODO: MESMO COM ERRO ELE ESTAVA SALVANDO NO FIREBASE O MONTHLY PAYMENT E SUBSCRIPTION, MAS NAO TAVA SALVANDO. PRECISO VERIFICAR
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      paymentMethod,
      billingDay,
      contractLengthMonths,
      contractStartDate,
      initialPaymentAmount,
      lateCreditsAmount,
      addLateCredits,
      cellPhone,
      taxId,
    } = body;

    // Validate input
    if (!paymentMethod || !billingDay || !contractLengthMonths) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validação extra opcional para garantir que o telefone existe
    if (!cellPhone) {
      return NextResponse.json(
        { error: "Cellphone is required for Pix payments" },
        { status: 400 },
      );
    }

    if (billingDay < 1 || billingDay > 28) {
      // Allow legacy check but we prefer 1, 5, 10, 12
      // keeping validation generic for safety
    }

    if (![6, 12].includes(contractLengthMonths)) {
      return NextResponse.json(
        { error: "Contract length must be 6 or 12 months" },
        { status: 400 },
      );
    }

    if (paymentMethod !== "pix") {
      return NextResponse.json(
        { error: "Only PIX is supported" },
        { status: 400 },
      );
    }

    // Determine user role for pricing
    const userRole = (session.user.role as UserRoles) || UserRoles.STUDENT;

    // Create subscription using the subscription service
    const subscriptionService = new SubscriptionService();

    const result = await subscriptionService.createSubscription({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole,
      cellPhone,
      taxId,
      paymentMethod: "pix",
      billingDay,
      contractLengthMonths: contractLengthMonths as 6 | 12,
      contractStartDate,
      initialPaymentAmount,
      lateCreditsAmount,
      addLateCredits,
    });

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      firstPayment: "firstPayment" in result ? result.firstPayment : undefined,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to create subscription",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
