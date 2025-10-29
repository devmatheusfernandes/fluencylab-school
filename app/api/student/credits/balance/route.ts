// app/api/student/credits/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { creditService } from '@/services/creditService';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { RegularCreditType } from '@/types/credits/regularClassCredits';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Check if the current user is a student
  if (session.user.role !== 'student') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const studentId = session.user.id;
    
    // Get the student's credit balance
    const balance = await creditService.getStudentCreditsBalance(studentId);
    
    // Return only the relevant credit counts
    return NextResponse.json({
      totalCredits: balance.totalCredits,
      bonusCredits: balance.bonusCredits,
      lateStudentCredits: balance.lateStudentCredits,
      teacherCancellationCredits: balance.credits
        .filter(c => c.type === RegularCreditType.TEACHER_CANCELLATION && c.amount > 0)
        .reduce((sum, c) => sum + c.amount, 0),
      expiredCredits: balance.expiredCredits,
      usedCredits: balance.usedCredits,
    });
  } catch (error: any) {
    console.error('Error fetching credit balance:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch credit balance' }, { status: 500 });
  }
}