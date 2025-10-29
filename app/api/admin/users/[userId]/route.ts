import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserService } from '@/services/userService';
import { User } from '@/types/users/users';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const userService = new UserService();

// PATCH é usado para ATUALIZAR PARCIALMENTE qualquer dado do usuário, incluindo o status.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'manager') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { userId } = await params; 
    const userDataToUpdate = (await request.json()) as Partial<User>;

    await userService.updateUser(userId, userDataToUpdate);
    return NextResponse.json({ message: 'Usuário atualizado com sucesso.' });
    
  } catch (error: any) {
    console.error(`Erro ao atualizar usuário (PATCH):`, error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}

// DELETE continua sendo usado para DESATIVAR (soft delete) um usuário.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { userId } = await params;
    await userService.deactivateUser(userId);
    return NextResponse.json({ message: 'Usuário desativado com sucesso.' });
  } catch (error: any) {
    console.error(`Erro ao desativar usuário (DELETE):`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}