import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date; // Add dueDate field
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  console.log('Tasks API - Session info:', {
    userId: session?.user?.id,
    userRole: session?.user?.role,
    hasSession: !!session
  });
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Allow teachers, admins, and students to access this endpoint
  if (!session?.user?.role || !['teacher', 'admin', 'student'].includes(session.user.role)) {
    console.log('Invalid role detected:', session.user.role);
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { studentId } = await params;
    
    // Permission checks based on user role
    if (session.user.role === 'student') {
      // Students can only access their own tasks
      if (session.user.id !== studentId) {
        return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
      }
    } else if (session.user.role === 'teacher') {
      // Teachers can only access tasks of their students
      const teacherId = session.user.id;
      const studentDoc = await adminDb.doc(`users/${studentId}`).get();
      
      console.log('Teacher access check:', {
        teacherId,
        studentId,
        studentExists: studentDoc.exists
      });
      
      if (!studentDoc.exists) {
        return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
      }
      
      const studentData = studentDoc.data();
      const studentTeachers = studentData?.teachersIds || [];
      
      console.log('Teacher-student relationship check:', {
        teacherId,
        studentId,
        studentTeachers,
        hasAccess: studentTeachers.includes(teacherId)
      });
      
      if (!studentTeachers.includes(teacherId)) {
        return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
      }
    }
    // Admins have access to all tasks (no additional check needed)
    
    // Fetch tasks from Firestore (excluding deleted tasks)
    const tasksSnapshot = await adminDb
      .collection('users')
      .doc(studentId)
      .collection('Tasks')
      .where('isDeleted', '!=', true)
      .orderBy('createdAt', 'desc')
      .get();

    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate ? doc.data().dueDate.toDate() : undefined, // Handle dueDate
    }));

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Check if the current user is a teacher
  if (session.user.role !== 'teacher') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { studentId } = await params;
    const body = await request.json();
    
    // Verify that this student belongs to the teacher
    const teacherId = session.user.id;
    const studentDoc = await adminDb.doc(`users/${studentId}`).get();
    
    if (!studentDoc.exists) {
      return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
    }
    
    const studentData = studentDoc.data();
    const studentTeachers = studentData?.teachersIds || [];
    
    if (!studentTeachers.includes(teacherId)) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }
    
    // Create task in Firestore
    const taskData = {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : null, // Handle dueDate
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection(`users/${studentId}/Tasks`).add(taskData);
    
    const newTask = {
      id: docRef.id,
      ...taskData,
    };

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar a tarefa do aluno:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Check if the current user is a teacher
  if (session.user.role !== 'teacher') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { studentId } = await params;
    
    // Verify that this student belongs to the teacher
    const teacherId = session.user.id;
    const studentDoc = await adminDb.doc(`users/${studentId}`).get();
    
    if (!studentDoc.exists) {
      return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
    }
    
    const studentData = studentDoc.data();
    const studentTeachers = studentData?.teachersIds || [];
    
    if (!studentTeachers.includes(teacherId)) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }
    
    // Get all tasks for this student
    const tasksSnapshot = await adminDb
      .collection('users')
      .doc(studentId)
      .collection('Tasks')
      .where('isDeleted', '!=', true)
      .get();
    
    // Soft delete all tasks (set isDeleted flag to true)
    const batch = adminDb.batch();
    tasksSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      });
    });
    
    await batch.commit();

    return NextResponse.json({ message: 'Todas as tarefas foram marcadas como deletadas com sucesso.' });
  } catch (error: any) {
    console.error("Erro ao deletar todas as tarefas do aluno:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}










