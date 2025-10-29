import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { UserAdminRepository } from '@/repositories/user.admin.repository';

const userAdminRepository = new UserAdminRepository();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month'); // Format: "YYYY-MM"
    
    if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
      return NextResponse.json({ error: 'Formato de mês inválido. Use YYYY-MM.' }, { status: 400 });
    }

    const studentId = session.user.id;
    const student = await userAdminRepository.findUserById(studentId);
    
    if (!student) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const limit = 2; // Standard limit of 2 reschedules per month
    const monthlyData = student.monthlyReschedules?.find(
      (m) => m.month === monthStr
    );
    const count = monthlyData?.count || 0;

    return NextResponse.json({
      month: monthStr,
      count,
      limit,
      allowed: count < limit
    });
  } catch (error: any) {
    console.error("Erro ao buscar dados mensais de reagendamento:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}