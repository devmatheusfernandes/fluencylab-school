// app/api/student/achievements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AchievementService } from '@/services/achievementService';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const achievementService = new AchievementService();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Get user ID from query params or session
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id') || session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'User ID not provided.' }, { status: 400 });
  }

  // If user is not requesting their own achievements, check if they have permission
  if (session?.user?.id && session.user.id !== userId) {
    // For now, users can only access their own achievements
    // In the future, teachers/admins might be able to view student achievements
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  }

  try {
    const achievements = await achievementService.getStudentAchievements(userId);

    return NextResponse.json(achievements);
  } catch (error: any) {
    console.error("Erro ao buscar conquistas do estudante:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}