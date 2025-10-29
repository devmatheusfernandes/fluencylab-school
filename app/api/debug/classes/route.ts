import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { adminDb } from '@/lib/firebase/admin';
import { ClassRepository } from '@/repositories/classRepository';

const classRepository = new ClassRepository();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  
  if (!studentId) {
    return NextResponse.json({ error: 'studentId parameter is required' }, { status: 400 });
  }

  try {
    
    console.log(`[DEBUG] Fetching classes for student ${studentId}`);
    
    // Buscar todas as aulas do estudante
    const classes = await classRepository.findAllClassesByStudentId(studentId);
    
    console.log(`[DEBUG] Found ${classes.length} classes for student ${studentId}`);
    
    // Filtrar aulas de setembro de 2025
    const septemberClasses = classes.filter(cls => {
      const classDate = cls.scheduledAt;
      return classDate.getFullYear() === 2025 && classDate.getMonth() === 8; // September is month 8 (0-indexed)
    });
    
    console.log(`[DEBUG] Found ${septemberClasses.length} classes in September 2025`);
    
    // Mapear dados relevantes para debug
    const debugData = septemberClasses.map(cls => ({
      id: cls.id,
      scheduledAt: cls.scheduledAt,
      formattedDate: cls.scheduledAt.toLocaleDateString('pt-BR'),
      formattedTime: cls.scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: cls.status,
      teacherId: cls.teacherId,
      language: cls.language,
      classType: cls.classType,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,
      rescheduledFrom: cls.rescheduledFrom,
      canceledAt: cls.canceledAt
    }));
    
    // Verificar se há IDs duplicados
    const idCounts: Record<string, number> = {};
    debugData.forEach(cls => {
      idCounts[cls.id] = (idCounts[cls.id] || 0) + 1;
    });
    
    const duplicateIds = Object.keys(idCounts).filter(id => idCounts[id] > 1);
    
    console.log(`[DEBUG] Duplicate IDs found:`, duplicateIds);
    
    return NextResponse.json({
      studentId,
      totalClasses: classes.length,
      septemberClasses: septemberClasses.length,
      duplicateIds,
      classes: debugData
    });
  } catch (error: any) {
    console.error('[DEBUG] Error fetching classes:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch classes' }, { status: 500 });
  }
}