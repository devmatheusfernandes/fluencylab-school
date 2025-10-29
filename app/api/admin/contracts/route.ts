import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { contractService } from '@/services/contractService';

// GET /api/admin/contracts - Get all contracts for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const contracts = await contractService.getAllContracts();

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error in admin contracts GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}