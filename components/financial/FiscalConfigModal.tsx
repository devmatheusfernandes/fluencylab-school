"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalBody,
  ModalIcon,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { IrpfRange } from "@/types/financial/financial";
import { Loader2, Plus, Trash2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FiscalConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  onSaved: () => void;
}

const DEFAULT_RANGES: IrpfRange[] = [
  { limit: 225920, rate: 0, deduction: 0 },
  { limit: 282665, rate: 0.075, deduction: 16944 },
  { limit: 375105, rate: 0.15, deduction: 38144 },
  { limit: 466468, rate: 0.225, deduction: 66277 },
  { limit: 999999999999, rate: 0.275, deduction: 89600 },
];

export function FiscalConfigModal({
  open,
  onOpenChange,
  year,
  onSaved,
}: FiscalConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [ranges, setRanges] = useState<IrpfRange[]>([]);

  useEffect(() => {
    if (open) {
      fetchConfig();
    }
  }, [open, year]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/finance/fiscal-config?year=${year}`);
      const data = await res.json();

      if (data && data.ranges && data.ranges.length > 0) {
        setRanges(data.ranges);
      } else {
        // Fallback to defaults if no config exists for this year
        setRanges(DEFAULT_RANGES);
      }
    } catch (error) {
      toast.error("Erro ao carregar configurações");
      setRanges(DEFAULT_RANGES); // Fallback on error too
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance/fiscal-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, ranges }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }

      toast.success("Configuração salva com sucesso!");
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRange = (
    index: number,
    field: keyof IrpfRange,
    value: string,
  ) => {
    const newRanges = [...ranges];
    let parsedValue = 0;

    if (field === "rate") {
      // Input: "7,5" -> Store: 0.075
      parsedValue = parseFloat(value.replace(",", ".")) / 100;
      if (isNaN(parsedValue)) parsedValue = 0;
    } else {
      // Input: "27110,40" -> Store: 2711040 (cents)
      const clean = value.replace(/[^\d.,]/g, "").replace(",", ".");
      parsedValue = Math.round(parseFloat(clean) * 100);
      if (isNaN(parsedValue)) parsedValue = 0;
    }

    newRanges[index] = { ...newRanges[index], [field]: parsedValue };
    setRanges(newRanges);
  };

  const formatMoneyInput = (cents: number) => {
    if (isNaN(cents)) return "0,00";
    return (cents / 100).toFixed(2).replace(".", ",");
  };

  const formatRateInput = (rate: number) => {
    if (isNaN(rate)) return "0,00";
    return (rate * 100).toFixed(2).replace(".", ",");
  };

  const addNewRange = () => {
    setRanges([...ranges, { limit: 0, rate: 0, deduction: 0 }]);
  };

  const removeRange = (index: number) => {
    const newRanges = ranges.filter((_, i) => i !== index);
    setRanges(newRanges);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <ModalHeader>
          <ModalIcon type="settings" />
          <ModalTitle>Configuração IRPF - {year}</ModalTitle>
          <ModalDescription>
            Ajuste as faixas da tabela progressiva anual do IRPF. Valores
            monetários em Reais (R$) e alíquotas em Porcentagem (%).
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="flex-1 overflow-y-auto pr-2">
          {loading && ranges.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground mb-2 px-2">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-4">Limite Anual (R$)</div>
                <div className="col-span-3">Alíquota (%)</div>
                <div className="col-span-3">Dedução (R$)</div>
                <div className="col-span-1"></div>
              </div>

              {ranges.map((range, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 items-center bg-card p-2 rounded-md border"
                >
                  <div className="col-span-1 text-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="col-span-4">
                    <Input
                      placeholder="0,00"
                      // Using defaultValue with key to force re-render when data changes initially
                      // But strictly speaking, for editing, controlled is better if we want to format on fly.
                      // Here we use onBlur to update state, so defaultValue is safer for typing
                      key={`limit-${index}-${range.limit}`}
                      defaultValue={formatMoneyInput(range.limit)}
                      onBlur={(e) =>
                        updateRange(index, "limit", e.target.value)
                      }
                      className="h-9"
                    />
                    <div className="text-[10px] text-muted-foreground mt-1 truncate">
                      {range.limit > 100000000000
                        ? "Sem limite"
                        : `Até R$ ${formatMoneyInput(range.limit)}`}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Input
                      placeholder="0,00"
                      key={`rate-${index}-${range.rate}`}
                      defaultValue={formatRateInput(range.rate)}
                      onBlur={(e) => updateRange(index, "rate", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      placeholder="0,00"
                      key={`deduction-${index}-${range.deduction}`}
                      defaultValue={formatMoneyInput(range.deduction)}
                      onBlur={(e) =>
                        updateRange(index, "deduction", e.target.value)
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeRange(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addNewRange}
                className="w-full border-dashed mt-4"
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Faixa
              </Button>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <ModalSecondaryButton onClick={() => onOpenChange(false)}>
            Cancelar
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </ModalPrimaryButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
