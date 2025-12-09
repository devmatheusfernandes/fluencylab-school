import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@/types/users/users";
import { Payment } from "@/types/financial/payments";
import { MonthlyPayment } from "@/types/financial/subscription";
import { StudentClass, ClassStatus } from "@/types/classes/class";
import { Calendar, Clock, Coins } from "lucide-react";

interface UserFinancialTabProps {
  user: User;
}

interface TeacherClassStats {
  studentId: string;
  studentName: string;
  completedClasses: number;
  earnings: number;
}

interface StudentFinancialData {
  paymentMethod: string;
  subscriptionStatus: string;
  payments: MonthlyPayment[];
}

const RATE_PER_CLASS = 25; // 25 reais per class

const UserFinancialTab: React.FC<UserFinancialTabProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [teacherStats, setTeacherStats] = useState<TeacherClassStats[]>([]);
  const [studentFinancials, setStudentFinancials] =
    useState<StudentFinancialData | null>(null);

  const fetchTeacherFinancials = useCallback(async () => {
    try {
      // Fetch real data from the API
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const endOfMonth = new Date(
        currentYear,
        currentMonth + 1,
        0,
        23,
        59,
        59,
        999
      ).toISOString();

      const response = await fetch(
        `/api/admin/teachers/${user.id}/classes?startDate=${startOfMonth}&endDate=${endOfMonth}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch teacher classes");
      }

      const classes = await response.json();

      // Process the classes to calculate earnings per student
      const statsMap = new Map<
        string,
        { studentName: string; completedClasses: number; earnings: number }
      >();

      classes.forEach((cls: any) => {
        if (cls.status !== "completed" || !cls.completedAt) return;

        const studentId = cls.studentId;
        const existing = statsMap.get(studentId) || {
          studentName: cls.studentName || `Aluno ${studentId}`,
          completedClasses: 0,
          earnings: 0,
        };

        existing.completedClasses++;
        existing.earnings = existing.completedClasses * RATE_PER_CLASS;

        statsMap.set(studentId, existing);
      });

      // Convert to array format
      const stats: TeacherClassStats[] = Array.from(statsMap.entries()).map(
        ([studentId, data]) => ({
          studentId,
          ...data,
        })
      );

      setTeacherStats(stats);
    } catch (error) {
      console.error("Error fetching teacher earnings:", error);
      setTeacherStats([]);
    }
  }, [user.id]);

  const fetchStudentFinancials = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/financials`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch financial data");
      }

      const data = await response.json();

      // Map the API response to MonthlyPayment objects
      const payments: MonthlyPayment[] = data.payments.map((payment: any) => ({
        id: payment.id,
        subscriptionId: payment.subscriptionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
        dueDate: new Date(payment.dueDate),
        createdAt: new Date(payment.createdAt),
        updatedAt: new Date(payment.updatedAt),
        metadata: payment.metadata || {},
      }));

      setStudentFinancials({
        paymentMethod: data.paymentMethod || "N/A",
        subscriptionStatus: data.subscriptionStatus || "inactive",
        payments,
      });
    } catch (error) {
      console.error("Error fetching student financials:", error);
      setStudentFinancials(null);
    }
  }, [user.id]);

  const fetchFinancialData = useCallback(async () => {
    try {
      setLoading(true);

      if (user.role === "teacher") {
        await fetchTeacherFinancials();
      } else {
        await fetchStudentFinancials();
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  }, [user.role, fetchTeacherFinancials, fetchStudentFinancials]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const renderTeacherView = () => {
    const currentMonth = new Date().toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    const totalClasses = teacherStats.reduce(
      (sum, student) => sum + student.completedClasses,
      0
    );
    const totalEarnings = teacherStats.reduce(
      (sum, student) => sum + student.earnings,
      0
    );

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Aulas Concluídas
                  </p>
                  <p className="text-2xl font-bold">{totalClasses}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Ganhos Totais
                  </p>
                  <p className="text-2xl font-bold">
                    R$ {totalEarnings.toFixed(2)}
                  </p>
                </div>
                <Coins className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Valor por Aula
                  </p>
                  <p className="text-2xl font-bold">R$ 25,00</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Ganhos por Aluno - {currentMonth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teacherStats.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma aula concluída neste mês.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Aulas Concluídas</TableHead>
                    <TableHead>Ganhos (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherStats.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">
                        {student.studentName}
                      </TableCell>
                      <TableCell>{student.completedClasses}</TableCell>
                      <TableCell>R$ {student.earnings.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell>{totalClasses}</TableCell>
                    <TableCell>R$ {totalEarnings.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStudentView = () => {
    console.log("Rendering student view. User data:", {
      subscriptionPaymentMethod: user.subscriptionPaymentMethod,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionBillingDay: user.subscriptionBillingDay,
    });
    console.log("Student financial data:", studentFinancials);

    return (
      <div className="space-y-6">
        {/* Payment Method Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Método de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">
                  {studentFinancials?.paymentMethod === "pix"
                    ? "PIX"
                    : studentFinancials?.paymentMethod === "credit_card"
                      ? "Cartão de Crédito"
                      : studentFinancials?.paymentMethod || "Não definido"}
                </p>
                {user.subscriptionBillingDay && (
                  <p className="text-sm text-muted-foreground">
                    Cobrança no dia {user.subscriptionBillingDay} de cada mês
                  </p>
                )}
              </div>
              <Badge
                // variant={
                //   studentFinancials?.subscriptionStatus === "active"
                //     ? "success"
                //     : "secondary"
                // }
              >
                {studentFinancials?.subscriptionStatus === "active"
                  ? "Ativo"
                  : studentFinancials?.subscriptionStatus === "canceled"
                    ? "Cancelado"
                    : studentFinancials?.subscriptionStatus || "Indefinido"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Histórico de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!studentFinancials?.payments ||
            studentFinancials.payments.length === 0 ? (
              <div className="text-center py-8">
                <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum histórico de pagamentos disponível.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentFinancials.payments.map((payment: MonthlyPayment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.createdAt).toLocaleDateString(
                          "pt-BR"
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.description || "Pagamento mensal"}
                      </TableCell>
                      <TableCell>
                        R$ {((payment.amount || 0) / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          // variant={
                          //   payment.status === "paid" ? "success" : "secondary"
                          // }
                        >
                          {payment.status === "paid"
                            ? "Pago"
                            : payment.status === "pending"
                              ? "Pendente"
                              : payment.status === "available"
                                ? "Disponível"
                                : payment.status === "overdue"
                                  ? "Vencido"
                                  : payment.status === "failed"
                                    ? "Falhou"
                                    : payment.status === "canceled"
                                      ? "Cancelado"
                                      : payment.status || "Indefinido"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.paymentMethod === "pix"
                          ? "PIX"
                          : payment.paymentMethod === "credit_card"
                            ? "Cartão de Crédito"
                            : payment.paymentMethod || "Não definido"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {user.role === "teacher" ? renderTeacherView() : renderStudentView()}
    </div>
  );
};

export default UserFinancialTab;
