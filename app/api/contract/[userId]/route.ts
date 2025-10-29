import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { contractService } from '@/services/contractService';

// GET /api/contract/[userId] - Get contract data for a user
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

    // Users can only access their own contract data (unless admin)
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const contractData = await contractService.getStudentContract(userId);
    const showNotification = await contractService.shouldShowContractNotification(userId);

    return NextResponse.json({
      ...contractData,
      showNotification
    });
  } catch (error) {
    console.error('Error in contract GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}