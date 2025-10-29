// app/api/student/achievements/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AchievementService } from '@/services/achievementService';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { StudentAchievement } from '@/types/users/achievements';

const achievementService = new AchievementService();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;
    if (session.user.id !== id) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const achievementData: StudentAchievement = await request.json();
    await achievementService.updateStudentAchievements(id, [achievementData]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao atualizar conquista do estudante:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}