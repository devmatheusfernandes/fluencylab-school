// app/api/admin/users/[userId]/details/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserService } from '@/services/userService';

const userService = new UserService();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  // Apenas Admins e Managers podem aceder a esta rota
  if (!session?.user || !session.user.role || !['admin', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { userId } = await params;
    const userDetails = await userService.getFullUserDetails(userId);
    if (!userDetails) {
      return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(userDetails);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
