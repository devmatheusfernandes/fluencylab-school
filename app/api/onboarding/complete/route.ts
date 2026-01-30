import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

// Mantemos o force-dynamic por segurança
export const dynamic = 'force-dynamic';

// Seu Schema original
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

// EXPORTAÇÃO DIRETA (Sem o withValidation)
export async function POST(request: NextRequest) {
  try {
    // 1. Validação Manual (Substituindo o Wrapper)
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const validationResult = onboardingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation Error", 
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      );
    }

    // Dados validados
    const {
      nickname,
      interfaceLanguage,
      theme,
      contractLengthMonths,
      paymentMethod,
      subscriptionId,
    } = validationResult.data;

    // 2. Autenticação e Lógica (Igual ao anterior)
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRef = adminDb.collection("users").doc(session.user.id);

    const updates: any = {
      tutorialCompleted: true,
      onboardingCompletedAt: new Date(),
    };

    if (nickname) updates.nickname = nickname;
    if (interfaceLanguage) updates.interfaceLanguage = interfaceLanguage;
    if (theme) updates.theme = theme;

    if (contractLengthMonths) {
      updates.contractLengthMonths = contractLengthMonths;
      updates.contractStartDate = new Date();
    }

    if (subscriptionId) {
      updates.currentSubscriptionId = subscriptionId;
      if (paymentMethod) {
        updates.subscriptionPaymentMethod = paymentMethod;
      }
    }

    await userRef.update(updates);

    // Se houver update de role (embora não esteja no schema acima, mantive sua lógica original)
    if (updates.role) {
      await adminAuth.setCustomUserClaims(session.user.id, {
        role: updates.role,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
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
}