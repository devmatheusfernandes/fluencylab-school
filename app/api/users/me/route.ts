import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserService } from '@/services/userService';
import { authOptions } from '../../auth/[...nextauth]/route';

const userService = new UserService();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    // O método getFullUserDetails é perfeito para isto
    const user = await userService.getFullUserDetails(userId);

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 });
    }

    // Retorna o perfil completo do utilizador
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Erro ao buscar dados do utilizador atual:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}