import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { adminDb } from '@/lib/firebase/admin';

// GET /api/admin/contracts/all - Get all contracts with user information for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all users with contract information
    const usersRef = adminDb.collection('users');
    const querySnapshot = await usersRef.get();

    const contracts = [];

    for (const doc of querySnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;

      // Skip if user doesn't have contract data
      if (!userData.ContratosAssinados) {
        continue;
      }

      const contractStatus = userData.ContratosAssinados;

      // Check if user can cancel contract (30 days before expiration)
      let canCancel = false;
      if (contractStatus.signed && contractStatus.isValid && contractStatus.expiresAt && !contractStatus.cancelledAt) {
        const expirationDate = new Date(contractStatus.expiresAt);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        canCancel = expirationDate <= thirtyDaysFromNow;
      }

      contracts.push({
        userId,
        userName: userData.name || 'Nome não disponível',
        userEmail: userData.email || 'Email não disponível',
        contractStatus,
        canCancel,
      });
    }

    // Sort contracts by status priority (active first, then pending, etc.)
    contracts.sort((a, b) => {
      const getStatusPriority = (contract: any) => {
        if (contract.contractStatus.cancelledAt) return 4;
        if (contract.contractStatus.signed && contract.contractStatus.signedByAdmin && contract.contractStatus.isValid) return 1;
        if (contract.contractStatus.signed && !contract.contractStatus.signedByAdmin) return 2;
        if (contract.contractStatus.expiresAt && new Date(contract.contractStatus.expiresAt) < new Date()) return 3;
        return 5;
      };

      return getStatusPriority(a) - getStatusPriority(b);
    });

    return NextResponse.json({
      success: true,
      contracts,
      total: contracts.length,
    });
  } catch (error) {
    console.error('Error in admin contracts all GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}