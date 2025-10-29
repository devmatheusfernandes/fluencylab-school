// app/api/onboarding/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { withValidation } from "@/lib/validation";
import { z } from "zod";

// Schema de validação para dados de onboarding
const onboardingSchema = z.object({
  nickname: z.string().min(2).max(50).optional(),
  interfaceLanguage: z.enum(["pt", "en", "es"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  emailVerified: z.boolean().optional(),
  contractLengthMonths: z.number().int().min(1).max(24).optional(),
  contractSigned: z.boolean().optional(),
  paymentMethod: z.string().max(50).nullable().optional(),
  paymentCompleted: z.boolean().optional(),
  subscriptionId: z.string().max(100).optional(),
});

export const POST = withValidation(
  async (
    request: NextRequest,
    validatedData: { body: z.infer<typeof onboardingSchema> }
  ) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const {
        nickname,
        interfaceLanguage,
        theme,
        emailVerified,
        contractLengthMonths,
        contractSigned,
        paymentMethod,
        paymentCompleted,
        subscriptionId,
      } = validatedData.body;

      // Update user document with onboarding completion data
      const userRef = adminDb.collection("users").doc(session.user.id);

      const updates: any = {
        tutorialCompleted: true,
        onboardingCompletedAt: new Date(),
      };

      // Update basic info if provided
      if (nickname) updates.nickname = nickname;
      if (interfaceLanguage) updates.interfaceLanguage = interfaceLanguage;
      if (theme) updates.theme = theme;

      // Update contract info if completed
      if (contractLengthMonths) {
        updates.contractLengthMonths = contractLengthMonths;
        updates.contractStartDate = new Date();
      }

      // Update subscription info if completed
      if (subscriptionId) {
        updates.mercadoPagoSubscriptionId = subscriptionId;
        if (paymentMethod) {
          updates.subscriptionPaymentMethod = paymentMethod;
        }
      }

      await userRef.update(updates);

      // Update Firebase Auth custom claims if role was changed
      if (updates.role) {
        await adminAuth.setCustomUserClaims(session.user.id, {
          role: updates.role,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Onboarding completed successfully",
        // Include updated user data to help with session refresh
        user: {
          tutorialCompleted: true,
          ...updates,
        },
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
  {
    bodySchema: onboardingSchema,
    logAttacks: true,
    blockAttacks: true,
  }
);
