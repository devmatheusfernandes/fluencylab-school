import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { contractService } from '@/services/contractService';

// GET /api/contract/notification/[userId] - Get contract notification status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Users can only check their own notifications
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const showNotification = await contractService.shouldShowContractNotification(userId);
    const contractData = await contractService.getStudentContract(userId);

    return NextResponse.json({
      userId,
      showNotification,
      contractStatus: contractData.contractStatus,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in contract notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}