"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/ui/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useFiscalYear } from "@/hooks/financial/useFiscalYear";
import { useMonthlyClose } from "@/hooks/financial/useMonthlyClose";
import { useTeacherPayments } from "@/hooks/financial/useTeacherPayments";
import {
  Shield,
  AlertTriangle,
  Download,
  Paperclip,
  Loader2,
  TrendingUp,
  Wallet,
  PieChart,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Settings,
} from "lucide-react";
import { markTeacherPaymentAsPaid } from "@/actions/financial";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FiscalConfigModal } from "@/components/financial/FiscalConfigModal";
import { IrpfRange } from "@/types/financial/financial";
import { FiscalHelpModal } from "@/components/financial/FiscalHelpModal";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function FiscalDashboardPage() {
  const t = useTranslations("FiscalDashboard");
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [irpfRanges, setIrpfRanges] = useState<IrpfRange[]>([]);

  const { data: fiscalData, loading: fiscalLoading } =
    useFiscalYear(selectedYear);
  const { closeMonth, loading: closingLoading } = useMonthlyClose();

  const [meiMetrics, setMeiMetrics] = useState({
    annualRevenue: 0,
    exemptPortion: 0,
    accountingProfit: 0,
    taxableProfit: 0,
    deductibleExpenses: 0,
    irpfDue: 0,
  });

  // Calculate IRPF based on stored ranges
  const calculateAnnualIRPF = (taxableIncome: number) => {
    if (!irpfRanges || irpfRanges.length === 0) return 0;

    // Sort by limit to be safe
    const sorted = [...irpfRanges].sort((a, b) => a.limit - b.limit);

    for (const range of sorted) {
      if (taxableIncome <= range.limit) {
        const tax = taxableIncome * range.rate - range.deduction;
        return Math.max(0, Math.round(tax));
      }
    }

    // Fallback if above all limits (though last should be infinite)
    const last = sorted[sorted.length - 1];
    const tax = taxableIncome * last.rate - last.deduction;
    return Math.max(0, Math.round(tax));
  };

  const fetchFiscalConfig = async () => {
    try {
      const res = await fetch(
        `/api/admin/finance/fiscal-config?year=${selectedYear}`,
      );
      const data = await res.json();
      if (data && data.ranges) {
        setIrpfRanges(data.ranges);
      }
    } catch (error) {
      console.error("Failed to fetch fiscal config", error);
    }
  };

  useEffect(() => {
    fetchFiscalConfig();
  }, [selectedYear]);

  useEffect(() => {
    const fetchMeiData = async () => {
      try {
        const res = await fetch(
          `/api/admin/finance/transactions?year=${selectedYear}`,
        );
        const data = await res.json();
        const txs = data.transactions || [];

        let revenue = 0;
        let expenses = 0; // deductible

        txs.forEach((t: any) => {
          if (t.type === "income") {
            revenue += t.amount || 0;
          } else if (t.type === "expense") {
            if (t.deductible) {
              expenses += t.amount || 0;
            }
          }
        });

        const exempt = Math.round(revenue * 0.32);
        const accounting = revenue - expenses;
        const taxable = Math.max(0, accounting - exempt);
        const irpf = calculateAnnualIRPF(taxable);

        setMeiMetrics({
          annualRevenue: revenue,
          exemptPortion: exempt,
          deductibleExpenses: expenses,
          accountingProfit: accounting,
          taxableProfit: taxable,
          irpfDue: irpf,
        });
      } catch (err) {
        console.error(err);
      }
    };

    // Only fetch/recalc if we have ranges loaded (or at least tried)
    // But calculateAnnualIRPF handles empty ranges gracefully (returns 0)
    // We should probably wait for ranges to be loaded?
    // Actually, fetchFiscalConfig sets state, which triggers re-render,
    // but this effect depends on [selectedYear].
    // We need to depend on [selectedYear, irpfRanges] to recalculate when config changes.
    fetchMeiData();
  }, [selectedYear, irpfRanges]);

  // Format month string for filtering payments (e.g., "2023-10")
  const competenceMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

  // We want to see payments GENERATED in this competence month (obligations)
  const { payments, loading: paymentsLoading } = useTeacherPayments({
    competenceMonth: competenceMonthStr,
  });

  const handleCloseMonth = async () => {
    try {
      await closeMonth(selectedYear, selectedMonth);
      toast.success(t("closeMonthSuccess"));
    } catch (error: any) {
      toast.error(error.message || "Error closing month");
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await markTeacherPaymentAsPaid(id);
      toast.success("Pago com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const isFutureMonth = new Date(selectedYear, selectedMonth, 1) > new Date();
  const isCurrentMonth =
    new Date(selectedYear, selectedMonth, 1).getMonth() === now.getMonth() &&
    selectedYear === now.getFullYear();

  const canClose = !isFutureMonth && !isCurrentMonth;
  const percentage = fiscalData ? Math.min(fiscalData.percentageUsed, 100) : 0;

  return (
    <div className="container-padding space-y-4 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <Header
          heading={t("title")}
          subheading={t("subtitle")}
          backHref="/hub/admin/finances"
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {new Date(2000, i, 1).toLocaleDateString("pt-BR", {
                    month: "long",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsConfigOpen(true)}
            title="Configurar IRPF"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <FiscalHelpModal />
        </div>
      </div>

      <FiscalConfigModal
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
        year={selectedYear}
        onSaved={fetchFiscalConfig}
      />

      {/* Fiscal Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Anual */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Anual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency.format(meiMetrics.annualRevenue / 100)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Limite: {currency.format(fiscalData?.limit || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Parcela Isenta */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Parcela Isenta (32%)
            </CardTitle>
            <Shield className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {currency.format(meiMetrics.exemptPortion / 100)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Livre de impostos
            </p>
          </CardContent>
        </Card>

        {/* Lucro Tributável */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lucro Tributável
            </CardTitle>
            <PieChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {currency.format(meiMetrics.taxableProfit / 100)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Base IRPF</p>
          </CardContent>
        </Card>

        {/* IRPF Estimado */}
        <Card
          className={cn(
            "shadow-sm border-l-4",
            meiMetrics.irpfDue > 0
              ? "border-l-red-500 bg-red-50/50 dark:bg-red-900/10"
              : "border-l-emerald-500",
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IRPF Estimado</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                meiMetrics.irpfDue > 0 ? "text-red-600" : "text-emerald-600",
              )}
            >
              {currency.format(meiMetrics.irpfDue / 100)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {meiMetrics.irpfDue > 0 ? "Requer atenção (DARF)" : "Isento"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Status & Progress (Takes 1/3 on large screens) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-t-4 border-t-primary/20">
            <CardHeader className="pb-4  ">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {t("status")}
                </CardTitle>
                <Badge variant="outline" className="font-normal">
                  {fiscalData?.companyType}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6 flex items-center gap-3">
                {fiscalLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <>
                    <div
                      className={cn(
                        "p-3 rounded-full",
                        fiscalData?.status === "SAFE"
                          ? "bg-emerald-100 text-emerald-600"
                          : fiscalData?.status === "WARNING"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-red-100 text-red-600",
                      )}
                    >
                      {fiscalData?.status === "SAFE" && (
                        <Shield className="w-6 h-6" />
                      )}
                      {fiscalData?.status === "WARNING" && (
                        <AlertTriangle className="w-6 h-6" />
                      )}
                      {fiscalData?.status === "CRITICAL" && (
                        <AlertTriangle className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4
                        className={cn(
                          "text-xl font-bold leading-none",
                          fiscalData?.status === "SAFE"
                            ? "text-emerald-700"
                            : fiscalData?.status === "WARNING"
                              ? "text-amber-700"
                              : "text-red-700",
                        )}
                      >
                        {fiscalData?.status
                          ? t(fiscalData.status.toLowerCase())
                          : "-"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Situação Fiscal
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Consumo do Limite
                  </span>
                  <span className="font-medium">{percentage.toFixed(1)}%</span>
                </div>
                <Progress
                  value={percentage}
                  className={cn(
                    "h-3 rounded-full",
                    percentage > 90
                      ? "[&>div]:bg-red-500 bg-red-100 dark:bg-red-950"
                      : percentage > 75
                        ? "[&>div]:bg-amber-500 bg-amber-100 dark:bg-amber-950"
                        : "[&>div]:bg-emerald-500 bg-emerald-100 dark:bg-emerald-950",
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>
                    {currency.format((fiscalData?.totalRevenue || 0) / 100)}
                  </span>
                  <span>{currency.format(fiscalData?.limit || 0)}</span>
                </div>
              </div>
            </CardContent>

            <div className="p-4   border-t flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Fechamento
              </span>
              <Button
                onClick={handleCloseMonth}
                disabled={!canClose || closingLoading}
                size="sm"
                variant={canClose ? "glass" : "secondary"}
                className={cn(!canClose && "opacity-50")}
              >
                {closingLoading && (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                )}
                {t("closeMonth")}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Payments (Takes 2/3 on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">
              {t("teachers")}
            </h3>
          </div>

          <Card>
            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>{t("teachers")}</TableHead>
                      <TableHead>{t("gross")}</TableHead>
                      <TableHead>{t("inss")}</TableHead>
                      <TableHead>{t("net")}</TableHead>
                      <TableHead>{t("statusHeader")}</TableHead>
                      <TableHead className="text-right">
                        {t("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : payments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Nenhum pagamento encontrado para este mês.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {p.teacherName}
                              </span>
                              <Badge
                                variant="outline"
                                className="w-fit text-[10px] h-5 px-1 mt-1"
                              >
                                {p.teacherType}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {currency.format(p.grossValue / 100)}
                          </TableCell>
                          <TableCell className="text-red-500 text-xs">
                            {p.inssDiscount
                              ? `-${currency.format(p.inssDiscount / 100)}`
                              : "-"}
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600">
                            {currency.format(p.netValue / 100)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={p.status} t={t} />
                          </TableCell>
                          <TableCell className="text-right">
                            <PaymentActions
                              payment={p}
                              t={t}
                              onMarkAsPaid={handleMarkAsPaid}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y">
                {paymentsLoading ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Nenhum registro.
                  </div>
                ) : (
                  payments.map((p) => (
                    <div key={p.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{p.teacherName}</div>
                          <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-5"
                            >
                              {p.teacherType}
                            </Badge>
                            <span>{p.competenceMonth}</span>
                          </div>
                        </div>
                        <StatusBadge status={p.status} t={t} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm bg-muted/30 p-2 rounded-md">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {t("gross")}
                          </span>
                          <span>{currency.format(p.grossValue / 100)}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {t("net")}
                          </span>
                          <span className="font-bold text-emerald-600">
                            {currency.format(p.netValue / 100)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <PaymentActions
                          payment={p}
                          t={t}
                          onMarkAsPaid={handleMarkAsPaid}
                          mobile
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Sub-components to clean up the main render

function StatusBadge({ status, t }: { status: string; t: any }) {
  const isPaid = status === "PAID";
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium w-fit",
        isPaid
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700",
      )}
    >
      {isPaid ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <Loader2 className="w-3 h-3" />
      )}
      {isPaid ? t("paid") : t("accrued")}
    </div>
  );
}

function PaymentActions({ payment, t, onMarkAsPaid, mobile }: any) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        mobile ? "w-full justify-between" : "justify-end",
      )}
    >
      <div className="flex gap-2">
        {payment.teacherType === "PF" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            title={t("downloadRPA")}
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
        {payment.teacherType === "PJ" && !payment.invoiceId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            title={t("attachInvoice")}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        )}
      </div>

      {payment.status !== "PAID" && (
        <Button
          size="sm"
          variant={mobile ? "glass" : "outline"}
          className={cn(mobile && "flex-1 ml-2")}
          onClick={() => payment.id && onMarkAsPaid(payment.id)}
        >
          {t("markAsPaid")}
        </Button>
      )}
    </div>
  );
}
