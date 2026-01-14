import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@/types/users/users";
import { MonthlyPayment } from "@/types/financial/subscription";
import { Calendar, Clock, Coins } from "lucide-react";
import { ButtonGroup } from "../ui/button-group";
import { Spinner } from "../ui/spinner";
import { useTranslations, useFormatter } from "next-intl";

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

const UserFinancialTab: React.FC<UserFinancialTabProps> = ({ user }) => {
  const t = useTranslations("UserDetails.financial");
  const format = useFormatter();
  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const nowYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => nowYear - i);

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format.dateTime(new Date(2024, i, 1), { month: "long" }).replace(/^\w/, (c) => c.toUpperCase()),
  }));

  const [loading, setLoading] = useState(false);
  const [teacherStats, setTeacherStats] = useState<TeacherClassStats[]>([]);
  const [studentFinancials, setStudentFinancials] =
    useState<StudentFinancialData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchTeacherFinancials = useCallback(async () => {
    try {
      const startOfMonth = new Date(selectedYear, selectedMonth, 1).toISOString();
      const endOfMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0,
        23,
        59,
        59,
        999
      ).toISOString();
      const response = await fetch(
        `/api/admin/teachers/${user.id}/earnings?startDate=${startOfMonth}&endDate=${endOfMonth}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch teacher earnings");
      }

      const data = await response.json();

      const stats: TeacherClassStats[] = (data.stats || []).map((s: any) => ({
        studentId: s.studentId,
        studentName: s.studentName,
        completedClasses: s.completedClasses,
        earnings: (s.earningsCents || 0) / 100,
      }));

      setTeacherStats(stats);
      setRatePerClass((data.ratePerClassCents || 0) / 100);
    } catch (error) {
      console.error("Error fetching teacher earnings:", error);
      setTeacherStats([]);
    }
  }, [user.id, selectedMonth, selectedYear]);

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
        paymentMethod: data.paymentMethod || t("paymentMethods.notAvailable"),
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

  const [ratePerClass, setRatePerClass] = useState<number>(0);
  const renderTeacherView = () => {
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
                    {t("completedClasses")}
                  </p>
                  <p className="text-2xl font-bold">{totalClasses}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("totalEarnings")}
                  </p>
                  <p className="text-2xl font-bold">
                    {currency.format(totalEarnings)}
                  </p>
                </div>
                <Coins className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("ratePerClass")}
                  </p>
                  <p className="text-2xl font-bold">{currency.format(ratePerClass)}</p>
                </div>
                <Clock className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
                {t("earnings")}
              <div className="flex flex-row gap-2">
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(v) => setSelectedMonth(Number(v))}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={t("selectMonth")} />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={String(month.value)}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(v) => setSelectedYear(Number(v))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder={t("year")} />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teacherStats.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t("noClassesThisMonth")}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("student")}</TableHead>
                    <TableHead>{t("completedClassesHeader")}</TableHead>
                    <TableHead>{t("earningsHeader")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherStats.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">
                        {student.studentName}
                      </TableCell>
                      <TableCell>{student.completedClasses}</TableCell>
                      <TableCell>{currency.format(student.earnings)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell>{t("total")}</TableCell>
                    <TableCell>{totalClasses}</TableCell>
                    <TableCell>{currency.format(totalEarnings)}</TableCell>
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
    // console.log("Rendering student view. User data:", {
    //   subscriptionPaymentMethod: user.subscriptionPaymentMethod,
    //   subscriptionStatus: user.subscriptionStatus,
    //   subscriptionBillingDay: user.subscriptionBillingDay,
    // });
    // console.log("Student financial data:", studentFinancials);

    return (
      <div className="space-y-6">
        {/* Payment Method Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              {t("paymentMethod")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mt-4">
              <div>
                <p className="font-medium">
                  {studentFinancials?.paymentMethod === "pix"
                    ? t("paymentMethods.pix")
                    : studentFinancials?.paymentMethod === "credit_card"
                    ? t("paymentMethods.credit_card")
                    : studentFinancials?.paymentMethod ||
                      t("paymentMethods.undefined")}
                </p>
                {user.subscriptionBillingDay && (
                  <p className="text-sm text-muted-foreground">
                    {t("billingDay", { day: user.subscriptionBillingDay })}
                  </p>
                )}
              </div>
              <Badge
                variant={
                  studentFinancials?.subscriptionStatus === "active"
                    ? "default"
                    : "secondary"
                }
              >
                {studentFinancials?.subscriptionStatus === "active"
                  ? t("subscriptionStatus.active")
                  : studentFinancials?.subscriptionStatus === "canceled"
                  ? t("subscriptionStatus.canceled")
                  : studentFinancials?.subscriptionStatus ||
                    t("subscriptionStatus.undefined")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              {t("paymentHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!studentFinancials?.payments ||
            studentFinancials.payments.length === 0 ? (
              <div className="text-center py-8">
                <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t("noPaymentHistory")}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.date")}</TableHead>
                    <TableHead>{t("table.description")}</TableHead>
                    <TableHead>{t("table.amount")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead>{t("table.method")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentFinancials.payments.map((payment: MonthlyPayment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {payment.description || t("defaultDescription")}
                      </TableCell>
                      <TableCell>
                        R$ {((payment.amount || 0) / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "paid" ? "success" : "secondary"
                          }
                        >
                          {payment.status === "paid"
                            ? t("paymentStatus.paid")
                            : payment.status === "pending"
                            ? t("paymentStatus.pending")
                            : payment.status === "available"
                            ? t("paymentStatus.available")
                            : payment.status === "overdue"
                            ? t("paymentStatus.overdue")
                            : payment.status === "failed"
                            ? t("paymentStatus.failed")
                            : payment.status === "canceled"
                            ? t("paymentStatus.canceled")
                            : payment.status || t("paymentStatus.undefined")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.paymentMethod === "pix"
                          ? t("paymentMethods.pix")
                          : payment.paymentMethod === "credit_card"
                          ? t("paymentMethods.credit_card")
                          : payment.paymentMethod ||
                            t("paymentMethods.undefined")}
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
        <Spinner />
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
