
import 'dotenv/config';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { subscriptionService } from '@/services/subscriptionService';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('❌ Por favor, forneça um e-mail como argumento.');
    console.error('Uso: npx tsx scripts/simulate-payment.ts email@exemplo.com');
    process.exit(1);
  }

  try {
    console.log(`🔍 Buscando usuário com e-mail: ${email}`);
    const userRecord = await adminAuth.getUserByEmail(email);
    const userId = userRecord.uid;
    console.log(`✅ Usuário encontrado: ${userId}`);

    // Buscar pagamentos pendentes
    const paymentsSnapshot = await adminDb
      .collection('monthlyPayments')
      .where('userId', '==', userId)
      .get();

    const payments = paymentsSnapshot.docs.map(d => d.data());
    
    // Filtrar pagamentos pendentes/disponíveis que tenham providerPaymentId (PIX gerado)
    const pendingPayment = payments
      .filter(p => (p.status === 'pending' || p.status === 'available') && p.providerPaymentId)
      .sort((a, b) => {
        // Ordenar por data de criação (mais recente primeiro)
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })[0];

    if (!pendingPayment) {
      console.error('❌ Nenhum pagamento pendente com PIX gerado encontrado para este usuário.');
      console.error('Dica: Gere o PIX na interface do usuário antes de rodar este script.');
      process.exit(1);
    }

    const providerPaymentId = pendingPayment.providerPaymentId;
    console.log(`💰 Pagamento encontrado: ${pendingPayment.description}`);
    console.log(`🆔 ID do Provider (AbacatePay): ${providerPaymentId}`);
    console.log(`🔄 Simulando pagamento...`);

    // Mock Webhook Payload
    const eventData = {
      event: 'billing.paid',
      data: {
        pixQrCode: {
          id: providerPaymentId,
        },
      },
    };

    await subscriptionService.processWebhookEvent(eventData);

    console.log('✅ Pagamento simulado com sucesso!');
    console.log('➡️ Verifique se o status da assinatura foi atualizado e se os créditos foram concedidos.');
    process.exit(0);

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.error('Usuário não encontrado no Firebase Auth.');
    }
    process.exit(1);
  }
}

main();
