"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Plus,
  Trash2,
  Edit,
  Download,
  Paperclip,
  Loader2,
  Calendar,
  Wallet,
  CreditCard,
  Filter,
} from "lucide-react";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalIcon,
  ModalPrimaryButton,
  ModalSecondaryButton,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";
import { Header } from "@/components/ui/header";
import { useTranslations } from "next-intl";

type FinanceTransaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  date: Date | string;
  description?: string;
  method?: string;
  source?: string;
  category?: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
  attachmentContentType?: string;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function AdminFinancesPage() {
  const t = useTranslations("AdminFinances");

  const monthLabels = [
    t("months.january"),
    t("months.february"),
    t("months.march"),
    t("months.april"),
    t("months.may"),
    t("months.june"),
    t("months.july"),
    t("months.august"),
    t("months.september"),
    t("months.october"),
    t("months.november"),
    t("months.december"),
  ];

  // --- MANTENDO TODA A LÓGICA DE ESTADO E FUNÇÕES INTACTA ---
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth());
  const [year, setYear] = useState<number>(now.getFullYear());
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edited, setEdited] = useState<Partial<FinanceTransaction>>({});
  const [newTx, setNewTx] = useState<{
    type: "income" | "expense";
    amountBRL: string;
    date: string;
    method: string;
    category: string;
    description: string;
  }>({
    type: "expense",
    amountBRL: "",
    date: new Date().toISOString().slice(0, 10),
    method: "",
    category: "",
    description: "",
  });
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [forecastIncome, setForecastIncome] = useState<number>(0);
  const [forecastExpenses, setForecastExpenses] = useState<number>(0);
  const [recurring, setRecurring] = useState<any[]>([]);
  const [monthsHorizon, setMonthsHorizon] = useState<number>(6);
  const [forecastSeries, setForecastSeries] = useState<
    Array<{ month: string; income: number; expenses: number; net: number }>
  >([]);
  const [newRecurring, setNewRecurring] = useState<{
    name: string;
    amountBRL: string;
    frequency: "monthly" | "yearly";
    nextOccurrence: string;
    category: string;
    variable: boolean;
  }>({
    name: "",
    amountBRL: "",
    frequency: "monthly",
    nextOccurrence: new Date().toISOString().slice(0, 10),
    category: "",
    variable: false,
  });
  const [showManualPayment, setShowManualPayment] = useState<boolean>(false);
  const [manualPayment, setManualPayment] = useState<{
    studentId: string;
    amountBRL: string;
    dueDate: string;
    method: string;
    description: string;
  }>({
    studentId: "",
    amountBRL: "",
    dueDate: new Date().toISOString().slice(0, 10),
    method: "cash",
    description: "",
  });
  const [studentComboOpen, setStudentComboOpen] = useState<boolean>(false);
  const [studentOptions, setStudentOptions] = useState<
    Array<{ id: string; name: string; email?: string; cpf?: string }>
  >([]);
  const [studentQuery, setStudentQuery] = useState<string>("");
  const [pendingPayments, setPendingPayments] = useState<
    Array<{
      id: string;
      description?: string;
      amount: number;
      dueDate: string;
      status: string;
    }>
  >([]);
  const [selectedPendingPaymentId, setSelectedPendingPaymentId] =
    useState<string>("");
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [detailsTx, setDetailsTx] = useState<FinanceTransaction | null>(null);
  const [allowManualAmountOverride, setAllowManualAmountOverride] =
    useState<boolean>(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState<boolean>(false);
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(
    null,
  );
  const [editedRecurring, setEditedRecurring] = useState<{
    name?: string;
    amountBRL?: string;
    frequency?: "monthly" | "yearly";
    nextOccurrence?: string;
    category?: string;
    variable?: boolean;
  }>({});
  const [instantiateDialogOpen, setInstantiateDialogOpen] =
    useState<boolean>(false);
  const [instantiateRecurringId, setInstantiateRecurringId] = useState<
    string | null
  >(null);
  const [instantiateAmountBRL, setInstantiateAmountBRL] = useState<string>("");
  const [instantiateDate, setInstantiateDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [categoryComboOpen, setCategoryComboOpen] = useState<boolean>(false);
  const [categoryQuery, setCategoryQuery] = useState<string>("");
  const [editCategoryOpen, setEditCategoryOpen] = useState<boolean>(false);
  const [editCategoryQuery, setEditCategoryQuery] = useState<string>("");

  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_v, i) => now.getFullYear() - i),
    [now],
  );

  const displayed = useMemo(() => {
    return transactions.filter((t) => {
      if (categoryFilter !== "__all__") {
        return (t.category || "") === categoryFilter;
      }
      return true;
    });
  }, [transactions, categoryFilter]);

  const totals = useMemo(() => {
    const income = displayed
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = displayed
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { income, expense };
  }, [displayed]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    recurring.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
  }, [transactions, recurring]);

  const fetchData = async () => {
    setLoading(true);
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    const url = `/api/admin/finance/transactions?month=${monthStr}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const list = (data?.transactions || []) as FinanceTransaction[];
      setTransactions(
        list.map((t) => ({
          ...t,
          date: typeof t.date === "string" ? new Date(t.date) : t.date,
        })),
      );
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchForecasts = async () => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    try {
      const [incRes, expRes] = await Promise.all([
        fetch(`/api/admin/finance/forecast/income?month=${monthStr}`),
        fetch(`/api/admin/finance/forecast/expenses?month=${monthStr}`),
      ]);
      const inc = await incRes.json();
      const exp = await expRes.json();
      setForecastIncome(Number(inc?.total || 0));
      setForecastExpenses(Number(exp?.total || 0));
    } catch {
      setForecastIncome(0);
      setForecastExpenses(0);
    }
  };

  const fetchRecurring = async () => {
    try {
      const res = await fetch(`/api/admin/finance/recurring-expenses`);
      const data = await res.json();
      setRecurring(data?.items || []);
    } catch {
      setRecurring([]);
    }
  };

  useEffect(() => {
    fetchForecasts();
    fetchRecurring();
  }, [month, year]);

  const fetchForecastSummary = async () => {
    const fromStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    try {
      const res = await fetch(
        `/api/admin/finance/forecast/summary?from=${fromStr}&months=${monthsHorizon}`,
      );
      const data = await res.json();
      setForecastSeries(data?.items || []);
    } catch {
      setForecastSeries([]);
    }
  };

  useEffect(() => {
    fetchForecastSummary();
  }, [month, year, monthsHorizon]);

  const createRecurring = async () => {
    const amount = parseAmountToCents(newRecurring.amountBRL);
    if (!newRecurring.name || amount <= 0) return;
    const body = {
      name: newRecurring.name,
      amount,
      currency: "BRL",
      frequency: newRecurring.frequency,
      nextOccurrence: newRecurring.nextOccurrence,
      category: newRecurring.category || "",
      variable: newRecurring.variable,
    };
    const res = await fetch(`/api/admin/finance/recurring-expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setNewRecurring({
        name: "",
        amountBRL: "",
        frequency: "monthly",
        nextOccurrence: new Date().toISOString().slice(0, 10),
        category: "",
        variable: false,
      });
      fetchRecurring();
      fetchForecasts();
    }
  };
  const submitManualPayment = async () => {
    const amount = parseAmountToCents(manualPayment.amountBRL);
    if (!manualPayment.studentId) return;
    if (selectedPendingPaymentId) {
      const pending = pendingPayments.find(
        (p) => p.id === selectedPendingPaymentId,
      );
      if (
        allowManualAmountOverride &&
        pending &&
        amount > 0 &&
        amount !== Number(pending.amount || 0)
      ) {
        const res = await fetch(`/api/admin/finance/payments/mark-paid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monthlyPaymentId: selectedPendingPaymentId,
            amount,
            paymentMethod: manualPayment.method,
            description: manualPayment.description || undefined,
          }),
        });
        if (res.ok) {
          setShowManualPayment(false);
          setSelectedPendingPaymentId("");
          setAllowManualAmountOverride(false);
          setManualPayment({
            studentId: "",
            amountBRL: "",
            dueDate: new Date().toISOString().slice(0, 10),
            method: "cash",
            description: "",
          });
          setPendingPayments([]);
          fetchData();
          return;
        }
      }
      const res = await fetch(`/api/admin/finance/payments/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyPaymentId: selectedPendingPaymentId }),
      });
      if (res.ok) {
        setShowManualPayment(false);
        setSelectedPendingPaymentId("");
        setAllowManualAmountOverride(false);
        setManualPayment({
          studentId: "",
          amountBRL: "",
          dueDate: new Date().toISOString().slice(0, 10),
          method: "cash",
          description: "",
        });
        setPendingPayments([]);
        fetchData();
        return;
      }
    }
    if (amount <= 0) return;
    const body = {
      studentId: manualPayment.studentId,
      amount,
      currency: "BRL",
      paymentMethod: manualPayment.method,
      dueDate: manualPayment.dueDate,
      description: manualPayment.description || undefined,
    };
    const res = await fetch(`/api/admin/finance/payments/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowManualPayment(false);
      setManualPayment({
        studentId: "",
        amountBRL: "",
        dueDate: new Date().toISOString().slice(0, 10),
        method: "cash",
        description: "",
      });
      setPendingPayments([]);
      setSelectedPendingPaymentId("");
      fetchData();
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      const q = studentQuery.trim();
      const url = q
        ? `/api/admin/users?role=student&search=${encodeURIComponent(q)}&limit=10`
        : `/api/admin/users?role=student&limit=10`;
      try {
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        const list = (data?.data || []) as Array<any>;
        setStudentOptions(
          list.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            cpf: u.cpf,
          })),
        );
      } catch {
        setStudentOptions([]);
      }
    };
    run();
    return () => controller.abort();
  }, [studentQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      const id = manualPayment.studentId;
      if (!id) {
        setPendingPayments([]);
        setSelectedPendingPaymentId("");
        setAllowManualAmountOverride(false);
        return;
      }
      try {
        const res = await fetch(`/api/admin/users/${id}/financials`, {
          signal: controller.signal,
        });
        const data = await res.json();
        const payments = (data?.payments || []) as Array<any>;
        const pendings = payments
          .filter(
            (p) =>
              p.status === "pending" ||
              p.status === "available" ||
              p.status === "overdue",
          )
          .map((p) => ({
            id: p.id,
            description: p.description,
            amount: Number(p.amount || 0),
            dueDate:
              typeof p.dueDate === "string"
                ? p.dueDate
                : new Date(p.dueDate).toISOString(),
            status: p.status,
          }))
          .sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
          );
        setPendingPayments(pendings);
      } catch {
        setPendingPayments([]);
      }
    };
    run();
    return () => controller.abort();
  }, [manualPayment.studentId, showManualPayment]);

  useEffect(() => {
    if (!selectedPendingPaymentId) {
      setAllowManualAmountOverride(false);
      return;
    }
    const p = pendingPayments.find((x) => x.id === selectedPendingPaymentId);
    if (p) {
      setManualPayment((s) => ({
        ...s,
        amountBRL: currency.format((p.amount || 0) / 100),
      }));
    }
    setAllowManualAmountOverride(false);
  }, [selectedPendingPaymentId, pendingPayments]);

  const parseAmountToCents = (v: string) => {
    const n = Number(
      v
        .replace(/[^\d.,]/g, "")
        .replace(".", "")
        .replace(",", "."),
    );
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
  };

  const openRecurringEdit = (r: any) => {
    setEditingRecurringId(r.id);
    setEditedRecurring({
      name: r.name,
      amountBRL: String((Number(r.amount || 0) / 100).toFixed(2)).replace(
        ".",
        ",",
      ),
      frequency: r.frequency,
      nextOccurrence: r.nextOccurrence
        ? new Date(r.nextOccurrence).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      category: r.category || "",
      variable: !!r.variable,
    });
  };

  const saveRecurringEdit = async () => {
    if (!editingRecurringId) return;
    const payload: any = {};
    if (editedRecurring.name !== undefined) payload.name = editedRecurring.name;
    if (editedRecurring.amountBRL !== undefined)
      payload.amount = parseAmountToCents(editedRecurring.amountBRL);
    if (editedRecurring.frequency !== undefined)
      payload.frequency = editedRecurring.frequency;
    if (editedRecurring.nextOccurrence !== undefined)
      payload.nextOccurrence = editedRecurring.nextOccurrence;
    if (editedRecurring.category !== undefined)
      payload.category = editedRecurring.category;
    if (editedRecurring.variable !== undefined)
      payload.variable = editedRecurring.variable;
    const res = await fetch(
      `/api/admin/finance/recurring-expenses/${editingRecurringId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (res.ok) {
      setEditingRecurringId(null);
      setEditedRecurring({});
      fetchRecurring();
      fetchForecasts();
    }
  };

  const cancelRecurringEdit = () => {
    setEditingRecurringId(null);
    setEditedRecurring({});
  };

  const openInstantiateDialog = (r: any) => {
    setInstantiateRecurringId(r.id);
    setInstantiateAmountBRL(
      String((Number(r.amount || 0) / 100).toFixed(2)).replace(".", ","),
    );
    setInstantiateDate(new Date().toISOString().slice(0, 10));
    setInstantiateDialogOpen(true);
  };

  const confirmInstantiate = async () => {
    if (!instantiateRecurringId) return;
    const rec = recurring.find((x) => x.id === instantiateRecurringId);
    const amount = parseAmountToCents(instantiateAmountBRL);
    if (!amount || amount <= 0) return;
    const body = {
      type: "expense",
      amount,
      currency: "BRL",
      date: instantiateDate,
      description: rec?.name || t("recurring.defaultDescription"),
      category: rec?.category || undefined,
      method: undefined,
    };

    const res = await fetch("/api/admin/finance/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setInstantiateDialogOpen(false);
      setInstantiateRecurringId(null);
      setInstantiateAmountBRL("");
      fetchData();
    }
  };

  const handleCreate = async () => {
    const amount = parseAmountToCents(newTx.amountBRL);
    if (!amount || amount <= 0) return;
    const body = {
      type: newTx.type,
      amount,
      currency: "BRL",
      date: newTx.date,
      description: newTx.description,
      method: newTx.method || undefined,
      category: newTx.category || undefined,
    };
    const res = await fetch("/api/admin/finance/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const created = await res.json();
      setNewTx({
        type: "expense",
        amountBRL: "",
        date: new Date().toISOString().slice(0, 10),
        method: "",
        category: "",
        description: "",
      });
      if (newFile) {
        const ok = await uploadAttachment(created.id, newFile);
        if (ok) setNewFile(null);
      }
      fetchData();
    }
  };

  const uploadAttachment = async (id: string, file: File) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf", "image/jpg"];
    if (!allowed.includes(file.type)) return false;
    if (file.size > 5 * 1024 * 1024) return false;
    const fd = new FormData();
    fd.append("file", file);
    setUploadingId(id);
    try {
      const res = await fetch(
        `/api/admin/finance/transactions/${id}/attachment`,
        {
          method: "POST",
          body: fd,
        },
      );
      if (res.ok) {
        await res.json();
        fetchData();
        return true;
      }
      return false;
    } finally {
      setUploadingId(null);
    }
  };

  const startEdit = (t: FinanceTransaction) => {
    setEditingId(t.id);
    setEdited({
      id: t.id,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      date:
        typeof t.date === "string"
          ? t.date
          : (t.date as Date).toISOString().slice(0, 10),
      description: t.description,
      method: t.method,
      category: t.category,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const payload: any = {};
    if (edited.type) payload.type = edited.type;
    if (edited.amount) payload.amount = edited.amount;
    if (edited.currency) payload.currency = edited.currency;
    if (edited.date) payload.date = edited.date;
    if (edited.description !== undefined)
      payload.description = edited.description;
    if (edited.method !== undefined) payload.method = edited.method;
    if (edited.category !== undefined) payload.category = edited.category;
    const res = await fetch(`/api/admin/finance/transactions/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setEditingId(null);
      setEdited({});
      fetchData();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEdited({});
  };

  const removeTx = async (id: string) => {
    const res = await fetch(`/api/admin/finance/transactions/${id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchData();
  };

  const exportCsv = () => {
    const rows = [
      [
        t("csv.headers.date"),
        t("csv.headers.description"),
        t("csv.headers.type"),
        t("csv.headers.amount"),
        t("csv.headers.method"),
        t("csv.headers.source"),
        t("csv.headers.category"),
      ],
      ...displayed.map((tx) => [
        new Date(tx.date).toLocaleDateString("pt-BR"),
        (tx.description || "").replace(/\n/g, " "),
        tx.type === "income" ? t("csv.types.income") : t("csv.types.expense"),
        currency.format((tx.amount || 0) / 100),
        tx.method || "",
        tx.source || "",
        tx.category || "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes-${String(month + 1).padStart(2, "0")}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container-padding space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <Header heading={t("title")} subheading={t("subtitle")} />

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 flex-1 md:flex-initial">
              <Select
                value={String(month)}
                onValueChange={(v) => setMonth(Number(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("filters.month")} />
                </SelectTrigger>
                <SelectContent>
                  {monthLabels.map((label, idx) => (
                    <SelectItem key={label} value={String(idx)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(year)}
                onValueChange={(v) => setYear(Number(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder={t("filters.year")} />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={loading}
              title={t("filters.update")}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
            </Button>

            <Modal open={showManualPayment} onOpenChange={setShowManualPayment}>
              <ModalTrigger asChild>
                <Button className="md:flex-initial gap-2">
                  <Wallet className="w-4 h-4 md:mr-2 mr-0" />
                  <span className="hidden md:block">
                    {t("manualPayment.title")}
                  </span>
                </Button>
              </ModalTrigger>

              <ModalContent>
                <ModalIcon type="calendar" />
                <ModalHeader>
                  <ModalTitle>{t("manualPayment.title")}</ModalTitle>
                  <ModalDescription>
                    {t("manualPayment.subtitle")}
                  </ModalDescription>
                </ModalHeader>
                <div className="grid grid-cols-1 gap-4 mt-2">
                  <Popover
                    open={studentComboOpen}
                    onOpenChange={setStudentComboOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={studentComboOpen}
                        className="w-full justify-between"
                      >
                        {manualPayment.studentId
                          ? studentOptions.find(
                              (u) => u.id === manualPayment.studentId,
                            )?.name || manualPayment.studentId
                          : t("manualPayment.selectStudent")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[360px]" align="start">
                      <Command>
                        <CommandInput
                          placeholder={t("manualPayment.searchPlaceholder")}
                          value={studentQuery}
                          onValueChange={setStudentQuery as any}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t("manualPayment.noStudentFound")}
                          </CommandEmpty>
                          <CommandGroup
                            heading={t("manualPayment.studentsGroup")}
                          >
                            {studentOptions.map((u) => (
                              <CommandItem
                                key={u.id}
                                onSelect={() => {
                                  setManualPayment((s) => ({
                                    ...s,
                                    studentId: u.id,
                                  }));
                                  setStudentComboOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    manualPayment.studentId === u.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{u.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {u.email} {u.cpf && `• CPF: ${u.cpf}`}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {pendingPayments.length > 0 && (
                    <div className="border rounded-md p-3 bg-muted/20">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">
                        {t("manualPayment.pendingTitle")}
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {pendingPayments.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border"
                          >
                            <input
                              type="radio"
                              name="pendingPayment"
                              className="accent-primary"
                              checked={selectedPendingPaymentId === p.id}
                              onChange={() => setSelectedPendingPaymentId(p.id)}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {p.description ||
                                  t("manualPayment.defaultDescription")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(p.dueDate).toLocaleDateString(
                                  "pt-BR",
                                )}
                              </div>
                            </div>
                            <div className="text-sm font-bold">
                              {currency.format((p.amount || 0) / 100)}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={manualPayment.amountBRL}
                        onChange={(e) =>
                          setManualPayment((s) => ({
                            ...s,
                            amountBRL: e.target.value,
                          }))
                        }
                        placeholder={t("manualPayment.amountPlaceholder")}
                        disabled={
                          !!selectedPendingPaymentId &&
                          !allowManualAmountOverride
                        }
                      />
                      {selectedPendingPaymentId &&
                        !allowManualAmountOverride && (
                          <Modal
                            open={overrideDialogOpen}
                            onOpenChange={setOverrideDialogOpen}
                          >
                            <ModalTrigger asChild>
                              <Button variant="outline" size="sm">
                                {t("manualPayment.changeValue")}
                              </Button>
                            </ModalTrigger>
                            <ModalContent>
                              <ModalIcon type="edit" />
                              <ModalHeader>
                                <ModalTitle>
                                  {t("manualPayment.changeValueTitle")}
                                </ModalTitle>
                                <ModalDescription>
                                  {(() => {
                                    const p = pendingPayments.find(
                                      (x) => x.id === selectedPendingPaymentId,
                                    );
                                    const original = p
                                      ? currency.format((p.amount || 0) / 100)
                                      : "-";
                                    return t("manualPayment.originalValue", {
                                      value: original,
                                    });
                                  })()}
                                </ModalDescription>
                              </ModalHeader>
                              <ModalFooter>
                                <ModalSecondaryButton
                                  onClick={() => setOverrideDialogOpen(false)}
                                >
                                  {t("deleteModal.cancel")}
                                </ModalSecondaryButton>
                                <ModalPrimaryButton
                                  onClick={() => {
                                    setAllowManualAmountOverride(true);
                                    setOverrideDialogOpen(false);
                                  }}
                                >
                                  {t("manualPayment.confirm")}
                                </ModalPrimaryButton>
                              </ModalFooter>
                            </ModalContent>
                          </Modal>
                        )}
                    </div>
                    <Input
                      type="date"
                      value={manualPayment.dueDate}
                      onChange={(e) =>
                        setManualPayment((s) => ({
                          ...s,
                          dueDate: e.target.value,
                        }))
                      }
                      disabled={!!selectedPendingPaymentId}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={manualPayment.method}
                      onValueChange={(v) =>
                        setManualPayment((s) => ({ ...s, method: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("manualPayment.method")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">
                          {t("manualPayment.methods.cash")}
                        </SelectItem>
                        <SelectItem value="bank_transfer">
                          {t("manualPayment.methods.bank_transfer")}
                        </SelectItem>
                        <SelectItem value="credit_card">
                          {t("manualPayment.methods.credit_card")}
                        </SelectItem>
                        <SelectItem value="pix">
                          {t("manualPayment.methods.pix")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={manualPayment.description}
                      onChange={(e) =>
                        setManualPayment((s) => ({
                          ...s,
                          description: e.target.value,
                        }))
                      }
                      placeholder={t("manualPayment.descriptionOptional")}
                    />
                  </div>
                </div>
                <ModalFooter>
                  <ModalSecondaryButton
                    onClick={() => setShowManualPayment(false)}
                  >
                    {t("deleteModal.cancel")}
                  </ModalSecondaryButton>
                  <ModalPrimaryButton onClick={submitManualPayment}>
                    {t("manualPayment.confirmPayment")}
                  </ModalPrimaryButton>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-emerald-100 dark:border-emerald-900/50  ">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600">
                {t("stats.income")}
              </CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {currency.format((totals.income || 0) / 100)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {t("stats.incomeDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-100 dark:border-red-900/50  ">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">
                {t("stats.expenses")}
              </CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {currency.format((totals.expense || 0) / 100)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {t("stats.expensesDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/30  ">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("stats.forecastIncome")}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 text-muted-foreground"
                onClick={fetchForecasts}
              >
                <Loader2 className={cn("h-3 w-3", loading && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-emerald-700/80">
                  {currency.format((forecastIncome || 0) / 100)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {t("stats.forecastIncomeDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/30  ">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("stats.forecastExpenses")}
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-red-700/80">
                  {currency.format((forecastExpenses || 0) / 100)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {t("stats.forecastExpensesDesc")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center card-base p-4 rounded-lg border mt-6">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("filters.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder={t("filters.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">
                  {t("filters.allCategories")}
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv} className="shrink-0">
              <Download className="w-4 h-4 mr-2" />
              {t("filters.csv")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column: Transactions List (Takes up 2/3 on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-dashed border-2 shadow-none bg-muted/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 bg-primary text-primary-foreground rounded-full p-0.5" />
                  {t("newTransaction.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Select
                    value={newTx.type}
                    onValueChange={(v) =>
                      setNewTx((s) => ({
                        ...s,
                        type: v as "income" | "expense",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("newTransaction.type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">
                        {t("newTransaction.types.income")}
                      </SelectItem>
                      <SelectItem value="expense">
                        {t("newTransaction.types.expense")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={newTx.amountBRL}
                    onChange={(e) =>
                      setNewTx((s) => ({ ...s, amountBRL: e.target.value }))
                    }
                    placeholder={t("newTransaction.amountPlaceholder")}
                  />
                  <Input
                    type="date"
                    value={newTx.date}
                    onChange={(e) =>
                      setNewTx((s) => ({ ...s, date: e.target.value }))
                    }
                  />
                  <Select
                    value={newTx.method}
                    onValueChange={(v) =>
                      setNewTx((s) => ({ ...s, method: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("newTransaction.method")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        {t("newTransaction.methods.cash")}
                      </SelectItem>
                      <SelectItem value="bank_transfer">
                        {t("newTransaction.methods.bank_transfer")}
                      </SelectItem>
                      <SelectItem value="credit_card">
                        {t("newTransaction.methods.credit_card")}
                      </SelectItem>
                      <SelectItem value="pix">
                        {t("newTransaction.methods.pix")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover
                    open={categoryComboOpen}
                    onOpenChange={setCategoryComboOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryComboOpen}
                        className="col-span-2 md:col-span-1 justify-between"
                      >
                        {newTx.category
                          ? newTx.category
                          : t("newTransaction.category")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[240px]" align="start">
                      <Command>
                        <CommandInput
                          placeholder={t("newTransaction.searchCategory")}
                          value={categoryQuery}
                          onValueChange={setCategoryQuery as any}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t("newTransaction.noCategoryFound")}
                          </CommandEmpty>
                          <CommandGroup
                            heading={t("newTransaction.categoriesGroup")}
                          >
                            {categories.map((c) => (
                              <CommandItem
                                key={c}
                                onSelect={() => {
                                  setNewTx((s) => ({ ...s, category: c }));
                                  setCategoryComboOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newTx.category === c
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {c}
                              </CommandItem>
                            ))}
                            {categoryQuery &&
                              !categories.some(
                                (c) =>
                                  c.toLowerCase() ===
                                  categoryQuery.toLowerCase(),
                              ) && (
                                <CommandItem
                                  onSelect={() => {
                                    setNewTx((s) => ({
                                      ...s,
                                      category: categoryQuery,
                                    }));
                                    setCategoryComboOpen(false);
                                  }}
                                >
                                  {t("newTransaction.createCategory", {
                                    category: categoryQuery,
                                  })}
                                </CommandItem>
                              )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={newTx.description}
                    onChange={(e) =>
                      setNewTx((s) => ({ ...s, description: e.target.value }))
                    }
                    placeholder={t("newTransaction.descriptionPlaceholder")}
                    className="col-span-2 md:col-span-2"
                  />

                  <div className="col-span-2 md:col-span-1 flex items-center">
                    <Button onClick={handleCreate} className="w-full">
                      {t("newTransaction.add")}
                    </Button>
                  </div>

                  <div className="col-span-2 md:col-span-4 flex justify-end">
                    <label className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1 hover:text-foreground transition-colors">
                      <Paperclip className="w-3 h-3" />
                      {newFile
                        ? newFile.name
                        : t("newTransaction.attachReceipt")}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) =>
                          setNewFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="overflow-hidden">
              <CardHeader className="px-6 py-4 border-b bg-muted/10 flex flex-row items-center justify-between rounded-t-md">
                <CardTitle className="text-lg">{t("table.title")}</CardTitle>
                <Badge variant="outline" className="font-normal">
                  {displayed.length}
                </Badge>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[100px]">
                        {t("table.headers.date")}
                      </TableHead>
                      <TableHead className="min-w-[150px]">
                        {t("table.headers.description")}
                      </TableHead>
                      <TableHead>{t("table.headers.category")}</TableHead>
                      <TableHead>{t("table.headers.amount")}</TableHead>
                      <TableHead className="text-right">
                        {t("table.headers.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-12" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : displayed.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          {t("table.empty")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayed.map((tx) => (
                        <TableRow
                          key={`${tx.source || "tx"}:${tx.id}`}
                          className="cursor-pointer group"
                          onClick={() => {
                            setDetailsTx(tx);
                            setDetailsOpen(true);
                          }}
                        >
                          <TableCell className="whitespace-nowrap font-medium text-xs text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm truncate max-w-[180px] sm:max-w-xs">
                              {tx.description || t("table.noDescription")}
                            </div>
                            <div className="text-xs text-muted-foreground sm:hidden">
                              {tx.category}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs">
                            <Badge variant="secondary" className="font-normal">
                              {tx.category || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "font-medium text-sm",
                                tx.type === "income"
                                  ? "text-emerald-600"
                                  : "text-red-600",
                              )}
                            >
                              {tx.type === "expense" ? "-" : "+"}{" "}
                              {currency.format((tx.amount || 0) / 100)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => startEdit(tx)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>

                              <Modal
                                open={deleteId === tx.id}
                                onOpenChange={(open) =>
                                  setDeleteId(open ? tx.id : null)
                                }
                              >
                                <ModalTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </ModalTrigger>
                                <ModalContent>
                                  <ModalIcon type="delete" />
                                  <ModalHeader>
                                    <ModalTitle>
                                      {t("table.deleteModal.title")}
                                    </ModalTitle>
                                    <ModalDescription>
                                      {t("table.deleteModal.description")}
                                    </ModalDescription>
                                  </ModalHeader>
                                  <ModalFooter>
                                    <ModalSecondaryButton
                                      onClick={() => setDeleteId(null)}
                                    >
                                      {t("table.deleteModal.cancel")}
                                    </ModalSecondaryButton>
                                    <ModalPrimaryButton
                                      variant="destructive"
                                      onClick={async () => {
                                        await removeTx(tx.id);
                                        setDeleteId(null);
                                      }}
                                    >
                                      {t("table.deleteModal.confirm")}
                                    </ModalPrimaryButton>
                                  </ModalFooter>
                                </ModalContent>
                              </Modal>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Right Column: Recurring & Projections (Sidebar on desktop) */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> {t("recurring.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid gap-2 p-3 bg-muted/20 rounded-md">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {t("recurring.newExpense")}
                  </span>
                  <Input
                    value={newRecurring.name}
                    onChange={(e) =>
                      setNewRecurring((s) => ({ ...s, name: e.target.value }))
                    }
                    placeholder={t("recurring.namePlaceholderExample")}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newRecurring.amountBRL}
                      onChange={(e) =>
                        setNewRecurring((s) => ({
                          ...s,
                          amountBRL: e.target.value,
                        }))
                      }
                      placeholder={t("recurring.amountPlaceholder")}
                    />
                    <Select
                      value={newRecurring.frequency}
                      onValueChange={(v) =>
                        setNewRecurring((s) => ({
                          ...s,
                          frequency: v as "monthly" | "yearly",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">
                          {t("recurring.frequencies.monthly")}
                        </SelectItem>
                        <SelectItem value="yearly">
                          {t("recurring.frequencies.yearly")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    size="sm"
                    onClick={createRecurring}
                    className="w-full mt-1"
                  >
                    {t("recurring.add")}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {recurring.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      {t("recurring.empty")}
                    </div>
                  ) : (
                    recurring.map((r) => (
                      <div key={r.id} className="p-2 border rounded-md text-sm">
                        {editingRecurringId === r.id ? (
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={editedRecurring.name || ""}
                              onChange={(e) =>
                                setEditedRecurring((s) => ({
                                  ...s,
                                  name: e.target.value,
                                }))
                              }
                              placeholder={t("recurring.namePlaceholder")}
                              className="h-8 text-sm col-span-2"
                            />
                            <Input
                              value={editedRecurring.amountBRL || ""}
                              onChange={(e) =>
                                setEditedRecurring((s) => ({
                                  ...s,
                                  amountBRL: e.target.value,
                                }))
                              }
                              placeholder={t("recurring.amountPlaceholder")}
                              className="h-8 text-sm"
                            />
                            <Select
                              value={editedRecurring.frequency as any}
                              onValueChange={(v) =>
                                setEditedRecurring((s) => ({
                                  ...s,
                                  frequency: v as any,
                                }))
                              }
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">
                                  {t("recurring.frequencies.monthly")}
                                </SelectItem>
                                <SelectItem value="yearly">
                                  {t("recurring.frequencies.yearly")}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={editedRecurring.nextOccurrence || ""}
                              onChange={(e) =>
                                setEditedRecurring((s) => ({
                                  ...s,
                                  nextOccurrence: e.target.value,
                                }))
                              }
                              className="h-8 text-sm"
                            />
                            <Input
                              value={editedRecurring.category || ""}
                              onChange={(e) =>
                                setEditedRecurring((s) => ({
                                  ...s,
                                  category: e.target.value,
                                }))
                              }
                              placeholder={t("recurring.categoryPlaceholder")}
                              className="h-8 text-sm"
                            />
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={!!editedRecurring.variable}
                                onChange={(e) =>
                                  setEditedRecurring((s) => ({
                                    ...s,
                                    variable: e.target.checked,
                                  }))
                                }
                              />
                              {t("recurring.variable")}
                            </label>
                            <div className="col-span-2 flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelRecurringEdit}
                              >
                                {t("recurring.cancel")}
                              </Button>
                              <Button size="sm" onClick={saveRecurringEdit}>
                                {t("recurring.save")}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{r.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {r.nextOccurrence
                                  ? new Date(
                                      r.nextOccurrence,
                                    ).toLocaleDateString("pt-BR")
                                  : "-"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-red-600">
                                {currency.format((r.amount || 0) / 100)}
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase">
                                {r.frequency === "monthly"
                                  ? t("recurring.frequencies.monthly")
                                  : t("recurring.frequencies.yearly")}
                              </div>
                            </div>
                          </div>
                        )}
                        {editingRecurringId !== r.id && (
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRecurringEdit(r)}
                            >
                              {t("recurring.edit")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openInstantiateDialog(r)}
                            >
                              {t("recurring.addAsTransaction")}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {t("projection.title")}
                </CardTitle>
                <Select
                  value={String(monthsHorizon)}
                  onValueChange={(v) => setMonthsHorizon(Number(v))}
                >
                  <SelectTrigger className="h-7 text-xs w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 M</SelectItem>
                    <SelectItem value="6">6 M</SelectItem>
                    <SelectItem value="12">12 M</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs hover:bg-transparent">
                        <TableHead className="h-8">
                          {t("projection.headers.month")}
                        </TableHead>
                        <TableHead className="h-8 text-right">
                          {t("projection.headers.balance")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forecastSeries.map((row) => (
                        <TableRow key={row.month} className="text-xs">
                          <TableCell className="font-medium py-2">
                            {new Date(`${row.month}-01`).toLocaleDateString(
                              "pt-BR",
                              { month: "short", year: "2-digit" },
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-bold py-2",
                              row.net >= 0
                                ? "text-emerald-600"
                                : "text-red-600",
                            )}
                          >
                            {currency.format((row.net || 0) / 100)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      <Modal
        open={instantiateDialogOpen}
        onOpenChange={setInstantiateDialogOpen}
      >
        <ModalContent>
          <ModalIcon type="calendar" />
          <ModalHeader>
            <ModalTitle>{t("instantiateModal.title")}</ModalTitle>
            <ModalDescription>
              {t("instantiateModal.description")}
            </ModalDescription>
          </ModalHeader>
          <div className="grid grid-cols-2 gap-3 px-1">
            <Input
              value={instantiateAmountBRL}
              onChange={(e) => setInstantiateAmountBRL(e.target.value)}
              placeholder={t("instantiateModal.amountPlaceholder")}
            />
            <Input
              type="date"
              value={instantiateDate}
              onChange={(e) => setInstantiateDate(e.target.value)}
            />
          </div>
          <ModalFooter>
            <ModalSecondaryButton
              onClick={() => setInstantiateDialogOpen(false)}
            >
              {t("instantiateModal.cancel")}
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={confirmInstantiate}>
              {t("instantiateModal.confirm")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Detail Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" className="w-[90%] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>{t("details.title")}</SheetTitle>
          </SheetHeader>
          {detailsTx && (
            <div className="mt-6 space-y-4 px-3">
              <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center text-center">
                <span className="text-sm text-muted-foreground mb-1">
                  {t("details.totalValue")}
                </span>
                <span
                  className={cn(
                    "text-3xl font-bold",
                    detailsTx.type === "income"
                      ? "text-emerald-600"
                      : "text-red-600",
                  )}
                >
                  {currency.format((detailsTx.amount || 0) / 100)}
                </span>
                <Badge variant="outline" className="mt-2 capitalize">
                  {detailsTx.type === "income"
                    ? t("details.types.income")
                    : t("details.types.expense")}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground text-sm">
                    {t("details.date")}
                  </span>
                  <span className="text-sm font-medium">
                    {new Date(detailsTx.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground text-sm">
                    {t("details.category")}
                  </span>
                  <span className="text-sm font-medium">
                    {detailsTx.category || "-"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground text-sm">
                    {t("details.method")}
                  </span>
                  <span className="text-sm font-medium capitalize">
                    {detailsTx.method?.replace("_", " ") || "-"}
                  </span>
                </div>

                <div className="py-2">
                  <span className="text-muted-foreground text-sm block mb-1">
                    {t("details.description")}
                  </span>
                  <p className="text-sm bg-muted p-2 rounded-md">
                    {detailsTx.description || t("details.noDescription")}
                  </p>
                </div>

                {detailsTx.attachmentUrl && (
                  <div className="pt-2">
                    <a
                      href={detailsTx.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="outline" className="w-full gap-2">
                        <Paperclip className="w-4 h-4" />{" "}
                        {t("details.viewReceipt")}
                      </Button>
                    </a>
                  </div>
                )}

                {!detailsTx.attachmentUrl && (
                  <div className="pt-2">
                    <label className="flex flex-col items-center gap-2 cursor-pointer border-2 border-dashed rounded-md p-4 hover:bg-muted/50 transition-colors">
                      <Paperclip className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {uploadingId === detailsTx.id
                          ? t("details.uploading")
                          : t("details.attachReceipt")}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.png,.pdf"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) await uploadAttachment(detailsTx.id, f);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-8">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => startEdit(detailsTx)}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    setDeleteId(detailsTx.id);
                    setDetailsOpen(false);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <Modal open={!!editingId} onOpenChange={(o) => !o && cancelEdit()}>
        <ModalContent>
          <ModalIcon type="edit" />
          <ModalHeader>
            <ModalTitle>{t("editModal.title")}</ModalTitle>
          </ModalHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={(edited.type as any) || ""}
                onValueChange={(v) =>
                  setEdited((s) => ({ ...s, type: v as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("editModal.typePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">
                    {t("editModal.types.income")}
                  </SelectItem>
                  <SelectItem value="expense">
                    {t("editModal.types.expense")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={String((edited.amount || 0) / 100)}
                onChange={(e) =>
                  setEdited((s) => ({
                    ...s,
                    amount: Math.round(Number(e.target.value) * 100),
                  }))
                }
              />
            </div>
            <Input
              value={edited.description || ""}
              onChange={(e) =>
                setEdited((s) => ({ ...s, description: e.target.value }))
              }
              placeholder={t("editModal.descriptionPlaceholder")}
            />
            <div className="grid grid-cols-2 gap-4">
              <Popover
                open={editCategoryOpen}
                onOpenChange={setEditCategoryOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={editCategoryOpen}
                    className="justify-between"
                  >
                    {edited.category
                      ? edited.category
                      : t("editModal.categoryPlaceholder")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[240px]" align="start">
                  <Command>
                    <CommandInput
                      placeholder={t("newTransaction.searchCategory")}
                      value={editCategoryQuery}
                      onValueChange={setEditCategoryQuery as any}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {t("newTransaction.noCategoryFound")}
                      </CommandEmpty>
                      <CommandGroup
                        heading={t("newTransaction.categoriesGroup")}
                      >
                        {categories.map((c) => (
                          <CommandItem
                            key={c}
                            onSelect={() => {
                              setEdited((s) => ({ ...s, category: c }));
                              setEditCategoryOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                (edited.category || "") === c
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {c}
                          </CommandItem>
                        ))}
                        {editCategoryQuery &&
                          !categories.some(
                            (c) =>
                              c.toLowerCase() ===
                              editCategoryQuery.toLowerCase(),
                          ) && (
                            <CommandItem
                              onSelect={() => {
                                setEdited((s) => ({
                                  ...s,
                                  category: editCategoryQuery,
                                }));
                                setEditCategoryOpen(false);
                              }}
                            >
                              {t("newTransaction.createCategory", {
                                category: editCategoryQuery,
                              })}
                            </CommandItem>
                          )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Input
                type="date"
                value={edited.date ? String(edited.date) : ""}
                onChange={(e) =>
                  setEdited((s) => ({ ...s, date: e.target.value }))
                }
              />
            </div>
          </div>
          <ModalFooter>
            <ModalSecondaryButton onClick={cancelEdit}>
              {t("editModal.cancel")}
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={saveEdit}>
              {t("editModal.save")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
