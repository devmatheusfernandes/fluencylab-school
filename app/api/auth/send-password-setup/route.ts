import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { userService } from "@/services/core/userService";

type RequestBody = {
  locale?: string;
} | null;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as RequestBody;
    const locale = body?.locale;

    await userService.sendPasswordSetupEmail(session.user.email, locale);

    return NextResponse.json({
      success: true,
      message: "E-mail para definir senha enviado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail para definir senha:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao enviar o e-mail para definir senha.",
      },
      { status: 500 },
    );
  }
}

