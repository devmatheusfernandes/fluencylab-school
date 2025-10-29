// app/api/admin/users/[userId]/financials/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    !session.user.role ||
    !["admin", "manager"].includes(session.user.role)
  ) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403 }
    );
  }

  try {
    const { userId } = await params;
    
    // 1. Buscar o usuário para obter o mercadoPagoSubscriptionId
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const mercadoPagoSubscriptionId = userData?.mercadoPagoSubscriptionId;
    
    if (!mercadoPagoSubscriptionId) {
      // Retorna dados vazios se não há subscription
      return NextResponse.json({
        paymentMethod: userData?.paymentMethod || 'Não definido',
        subscriptionStatus: userData?.subscriptionStatus || 'inactive',
        payments: []
      });
    }
    
    // 2. Buscar a subscription usando o mercadoPagoSubscriptionId como documento ID
    const subscriptionDoc = await adminDb.collection('subscriptions').doc(mercadoPagoSubscriptionId).get();
    
    if (!subscriptionDoc.exists) {
      return NextResponse.json({
        paymentMethod: userData?.paymentMethod || 'Não definido',
        subscriptionStatus: userData?.subscriptionStatus || 'inactive',
        payments: []
      });
    }
    
    const subscriptionData = subscriptionDoc.data();
    
    // 3. Buscar os pagamentos da subscription na coleção monthlyPayments
    const paymentsSnapshot = await adminDb.collection('monthlyPayments')
      .where('subscriptionId', '==', mercadoPagoSubscriptionId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const payments = paymentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        amount: data.amount,
        status: data.status,
        paymentMethod: subscriptionData?.paymentMethod?.type || 'Não definido',
        description: data.description || 'Pagamento mensal',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        paidAt: data.paidAt?.toDate ? data.paidAt.toDate() : (data.paidAt ? new Date(data.paidAt) : null),
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate),
      };
    });
    
    // 4. Retornar os dados formatados
    return NextResponse.json({
      paymentMethod: subscriptionData?.paymentMethod?.type || 'Não definido',
      subscriptionStatus: subscriptionData?.status || 'inactive',
      payments: payments
    });
    
  } catch (error: any) {
    console.error('Error fetching student financials:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
