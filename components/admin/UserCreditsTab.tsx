// components/admin/UserCreditsTab.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  RegularCreditsBalance,
  RegularCreditType,
  CreditTransaction,
} from "@/types/credits/regularClassCredits";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, CardSimIcon, FileWarning, Gift, User, X } from "lucide-react";
import { Spinner } from "../ui/spinner";

interface UserCreditsTabProps {
  studentId: string;
}

export default function UserCreditsTab({ studentId }: UserCreditsTabProps) {
  const [balance, setBalance] = useState<RegularCreditsBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Grant credits form state
  const [grantForm, setGrantForm] = useState({
    type: RegularCreditType.BONUS,
    amount: 1,
    expiresAt: "",
    reason: "",
  });

  const loadCreditData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load balance
      const balanceResponse = await fetch(
        `/api/admin/credits/balance/${studentId}`
      );

      if (!balanceResponse.ok) {
        const errorData = await balanceResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Falha ao carregar saldo de créditos: ${balanceResponse.status}`
        );
      }

      const balanceData = await balanceResponse.json();
      setBalance(balanceData.balance);

      // Load transactions
      const transactionsResponse = await fetch(
        `/api/admin/credits/history/${studentId}`
      );

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.history || []);
      }
    } catch (err: any) {
      console.error("Error loading credit data:", err);
      setError(err.message || "Erro desconhecido ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadCreditData();
  }, [loadCreditData]);

  const handleGrantCredits = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!grantForm.expiresAt) {
      setError("Data de expiração é obrigatória");
      return;
    }

    try {
      setGranting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/admin/credits/grant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          ...grantForm,
          expiresAt: new Date(grantForm.expiresAt).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao conceder créditos");
      }

      setSuccess("Créditos concedidos com sucesso!");
      setGrantForm({
        type: RegularCreditType.BONUS,
        amount: 1,
        expiresAt: "",
        reason: "",
      });

      // Reload data
      await loadCreditData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGranting(false);
    }
  };
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credit Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Créditos
            </CardTitle>
            <CardSimIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance?.totalCredits || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Créditos Bônus
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {balance?.bonusCredits || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alunos Tardios
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {balance?.lateStudentCredits || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aulas Canceladas
            </CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {balance?.credits?.filter(
                (credit) =>
                  credit.type === RegularCreditType.TEACHER_CANCELLATION &&
                  !credit.usedAt
              ).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Créditos Expirados
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {balance?.expiredCredits || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grant Credits Form */}
      <Card>
        <CardHeader>
          <CardTitle className="mb-3">Conceder Créditos</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <FileWarning className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <FileWarning className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleGrantCredits} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span>Tipo de Crédito</span>
                <Select
                  value={grantForm.type}
                  onValueChange={(value) =>
                    setGrantForm((prev) => ({
                      ...prev,
                      type: value as RegularCreditType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RegularCreditType.BONUS}>
                      Bônus
                    </SelectItem>
                    <SelectItem value={RegularCreditType.LATE_STUDENTS}>
                      Alunos Tardios
                    </SelectItem>
                    <SelectItem
                      value={RegularCreditType.TEACHER_CANCELLATION}
                    >
                      Aulas Canceladas
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span>Quantidade</span>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={grantForm.amount}
                  onChange={(e) =>
                    setGrantForm((prev) => ({
                      ...prev,
                      amount: parseInt(e.target.value),
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <span>Data e Horário de Expiração</span>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={grantForm.expiresAt}
                  onChange={(e) =>
                    setGrantForm((prev) => ({
                      ...prev,
                      expiresAt: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <span>Motivo (opcional)</span>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo para conceder estes créditos..."
                value={grantForm.reason}
                onChange={(e) =>
                  setGrantForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                rows={3}
              />
            </div>

            <Button type="submit" disabled={granting}>
              {granting ? "Concedendo..." : "Conceder Créditos"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            Histórico de créditos concedidos e utilizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma transação encontrada
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge
                      // variant={
                      //   transaction.action === "granted" ? "warning" : "success"
                      // }
                    >
                      {transaction.action === "granted"
                        ? "Concedido"
                        : "Utilizado"}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {transaction.amount} crédito(s)
                      </p>
                      {transaction.reason && (
                        <p className="text-sm text-muted-foreground">
                          {transaction.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.performedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
