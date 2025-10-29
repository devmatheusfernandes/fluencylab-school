import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminDb } from "@/lib/firebase/admin";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has an active subscription
    const userDoc = await adminDb
      .collection("users")
      .doc(session.user.id)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { hasActiveSubscription: false },
        { status: 200 }
      );
    }

    const userData = userDoc.data();
    const hasActiveSubscription = !!(
      userData?.subscriptionStatus === "active" ||
      userData?.mercadoPagoSubscriptionId ||
      userData?.paymentCompleted ||
      userData?.subscription?.status === "active" ||
      userData?.subscription?.id
    );

    return NextResponse.json({
      hasActiveSubscription,
      subscriptionData: hasActiveSubscription ? {
        status: userData?.subscriptionStatus,
        id: userData?.mercadoPagoSubscriptionId,
        ...userData?.subscription
      } : null,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}