import { PaymentManagementClient } from "@/components/student/PaymentManagementClient";
import { Container } from "@/components/ui/container";

export default function PaymentsPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 mt-2">
            Gerencie sua assinatura, métodos de pagamento e histórico de
            transações
          </p>
        </div>

        <PaymentManagementClient />
      </div>
    </Container>
  );
}
