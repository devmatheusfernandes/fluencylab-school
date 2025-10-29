import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ClassStatus } from '@/types/classes/class';
import { FieldPath } from 'firebase-admin/firestore';

interface Class {
  id: string;
  scheduledAt: Date;
  teacherId: string;
  teacherName: string;
  language: string;
  status: ClassStatus;
  feedback?: string;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const studentId = session.user.id;
    
    // Fetch classes from Firestore
    const classesSnapshot = await adminDb
      .collection('classes')
      .where('studentId', '==', studentId)
      .orderBy('scheduledAt', 'desc')
      .get();

    // Get teacher names
    const teacherIds = [...new Set(classesSnapshot.docs.map(doc => doc.data().teacherId).filter(id => id))];
    
    let teacherMap = new Map();
    if (teacherIds.length > 0) {
      const teachers = await adminDb.collection('users').where(FieldPath.documentId(), 'in', teacherIds).get();
      teacherMap = new Map(teachers.docs.map(doc => [doc.id, doc.data().name]));
    }

    const classes = classesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        scheduledAt: data.scheduledAt.toDate().toISOString(), // Convert to ISO string for proper serialization
        teacherId: data.teacherId,
        teacherName: data.teacherId ? (teacherMap.get(data.teacherId) || 'Professor não encontrado') : 'Professor não atribuído',
        language: data.language || 'Não especificado',
        status: data.status || ClassStatus.SCHEDULED,
        feedback: data.feedback || undefined,
        classType: data.classType,
        durationMinutes: data.durationMinutes,
        studentId: data.studentId,
        rescheduledFrom: data.rescheduledFrom,
        rescheduleReason: data.rescheduleReason,
        createdAt: data.createdAt?.toDate()?.toISOString(),
        updatedAt: data.updatedAt?.toDate()?.toISOString(),
        availabilitySlotId: data.availabilitySlotId,
        createdBy: data.createdBy
      };
    });

    return NextResponse.json(classes);
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}