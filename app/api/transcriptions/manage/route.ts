import { NextRequest, NextResponse } from 'next/server';
import { TranscriptionService } from '@/services/learning/transcriptionService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { adminDb } from "@/lib/firebase/admin";

async function canAccessStudent(studentId: string, session: any) {
  const role = session?.user?.role as string | undefined;
  const userId = session?.user?.id as string | undefined;
  if (!role || !userId) return false;

  if (["admin", "manager"].includes(role)) return true;
  if (["student", "guarded_student"].includes(role)) return userId === studentId;
  if (role !== "teacher") return false;

  const studentDoc = await adminDb.doc(`users/${studentId}`).get();
  if (!studentDoc.exists) return false;
  const studentData = studentDoc.data();
  const teachersIds = Array.isArray(studentData?.teachersIds)
    ? studentData.teachersIds
    : [];
  return teachersIds.includes(userId);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, callId, studentId, notebookId, text, transcriptionId } = body;

    if (!callId || !studentId || !notebookId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!(await canAccessStudent(String(studentId), session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const service = new TranscriptionService();

    if (action === 'check') {
      const result = await service.checkTranscriptionAvailability(callId);
      
      if (result.available) {
        await service.updateTranscription(studentId, notebookId, callId, {
          content: result.text,
          status: 'available'
        }, transcriptionId);
        return NextResponse.json({ status: 'available', content: result.text });
      } else {
        return NextResponse.json({ status: 'pending' });
      }
    } else if (action === 'summarize') {
      // If text is provided, use it. Otherwise, we might need to fetch it from DB (not implemented here for simplicity, assuming client sends it or it was just checked)
      // But for security/reliability, let's assume the text is passed or we could fetch it.
      // To keep it simple: assume client sends text if available, or we check availability again.
      
      let transcriptText = text;
      if (!transcriptText) {
          // Try to get it from check (re-check)
          const check = await service.checkTranscriptionAvailability(callId);
          if (check.available) {
              transcriptText = check.text;
          } else {
              return NextResponse.json({ error: 'Transcription not available for summary' }, { status: 400 });
          }
      }

      const summary = await service.generateSummary(transcriptText);
      
      await service.updateTranscription(studentId, notebookId, callId, {
        summary: summary,
        updatedAt: new Date()
      }, transcriptionId);

      return NextResponse.json({ summary });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error in transcription manage:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
