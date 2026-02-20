import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/core/userService";

export async function POST(request: NextRequest) {
  try {
    const { email, locale } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "O e-mail é obrigatório." },
        { status: 400 },
      );
    }

    await userService.sendPasswordResetEmail(email, locale);

    return NextResponse.json({
      success: true,
      message: "E-mail de redefinição de senha enviado com sucesso.",
    });
  } catch (error: any) {
    console.error("Erro ao enviar e-mail de redefinição de senha:", error);

    const code = error?.code || "internal";

    if (code === "auth/user-not-found") {
      return NextResponse.json(
        {
          error: "Usuário não encontrado.",
          code,
        },
        { status: 404 },
      );
    }

    if (code === "auth/invalid-email") {
      return NextResponse.json(
        {
          error: "E-mail inválido.",
          code,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno ao enviar o e-mail de redefinição de senha.",
        code,
      },
      { status: 500 },
    );
  }
}

