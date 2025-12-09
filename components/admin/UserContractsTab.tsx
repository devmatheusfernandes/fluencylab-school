"use client";

import { useState, useEffect } from "react";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "@/types/users/users";
import { UserRoles } from "@/types/users/userRoles";
import { ContractLog, ContractStatus } from "@/types/contract";
import { Spinner } from "../ui/spinner";
import ContratoPDF from "../contract/ContratoPDF";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface UserContractsTabProps {
  user: User;
  currentUserRole: UserRoles;
}

export default function UserContractsTab({
  user,
  currentUserRole,
}: UserContractsTabProps) {
  const [contractData, setContractData] = useState<{
    status: ContractStatus | null;
    log: ContractLog | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/contract/${user.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch contract data");
        }

        const data = await response.json();
        setContractData({
          status: data.contractStatus,
          log: data.contractLog,
        });

        // Check if user can cancel contract
        if (
          data.contractStatus &&
          data.contractStatus.signed &&
          data.contractStatus.isValid
        ) {
          const cancelResponse = await fetch(`/api/contract/cancel/${user.id}`);
          if (cancelResponse.ok) {
            const cancelData = await cancelResponse.json();
            setCanCancel(cancelData.canCancel);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractData();
  }, [user.id]);

  // Handle contract printing
  const handlePrintContract = () => {
    if (!log) return;

    // Get the contract content
    const contractElement = document.querySelector(".contract-print");
    if (!contractElement) return;

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Write the HTML content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contrato - ${log.name}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              line-height: 1.5;
              color: black;
              background: white;
              margin: 0;
              padding: 20px;
            }
            .contract-print {
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              text-align: center;
              font-size: 18px;
              margin-bottom: 20px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 10px;
            }
            h2 {
              font-size: 16px;
              margin-top: 20px;
              margin-bottom: 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            p {
              margin-bottom: 10px;
              text-align: justify;
            }
            .signature-section {
              margin-top: 40px;
              page-break-inside: avoid;
            }
            .signature-line {
              border-top: 1px solid black;
              margin-top: 60px;
              padding-top: 5px;
              text-align: center;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .contract-print { max-width: none; }
            }
          </style>
        </head>
        <body>
          ${contractElement.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  // Handle contract cancellation
  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) return;
    try {
      setIsCancelling(true);
      const isAdminActor =
        currentUserRole === UserRoles.ADMIN ||
        currentUserRole === UserRoles.MANAGER;
      const response = await fetch(`/api/contract/cancel/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cancelReason.trim(),
          isAdminCancellation: isAdminActor,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setIsCancelOpen(false);
        window.location.reload();
      }
    } catch (error) {
    } finally {
      setIsCancelling(false);
    }
  };

  // Simple date formatting function
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return "Data inválida";
    }
  };

  // Short date formatting function
  const formatShortDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch (e) {
      return "N/A";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Text variant="error">
          Erro ao carregar informações do contrato: {error}
        </Text>
      </Card>
    );
  }

  if (!contractData?.status) {
    return (
      <Card className="p-6">
        <Text>Nenhum contrato encontrado para este usuário.</Text>
      </Card>
    );
  }

  const { status, log } = contractData;

  const roleAllowsCancel =
    currentUserRole === UserRoles.ADMIN || currentUserRole === UserRoles.MANAGER;

  // Check if contract is near expiration (within 30 days)
  const isNearExpiration = status.expiresAt
    ? new Date(status.expiresAt) <
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
      new Date(status.expiresAt) > new Date()
    : false;

  // Check if contract is expired
  const isExpired = status.expiresAt
    ? new Date(status.expiresAt) < new Date()
    : false;

  // For managers, only show limited information
  if (currentUserRole === UserRoles.MANAGER) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Text variant="subtitle">Status do Contrato:</Text>
              {status.cancelledAt ? (
                <Badge>Cancelado</Badge>
              ) : status.signed && status.signedByAdmin && status.isValid ? (
                <Badge>Assinado e Válido</Badge>
              ) : isExpired ? (
                <Badge>Expirado</Badge>
              ) : (
                <Badge>Pendente</Badge>
              )}
            </div>

            {isNearExpiration && !isExpired && !status.cancelledAt && (
              <div className="flex items-center gap-2">
                <Text variant="subtitle">Validade:</Text>
                <Badge>Perto de expirar</Badge>
              </div>
            )}

            {isExpired && !status.cancelledAt && (
              <div className="flex items-center gap-2">
                <Text variant="subtitle">Validade:</Text>
                <Badge>Expirado</Badge>
              </div>
            )}

            {status.expiresAt && (
              <div className="flex items-center gap-2">
                <Text variant="subtitle">Data de Expiração:</Text>
                <Text>{formatShortDate(status.expiresAt)}</Text>
              </div>
            )}

            {status.cancelledAt && (
              <div className="flex items-center gap-2">
                <Text variant="subtitle">Data de Cancelamento:</Text>
                <Text>{formatShortDate(status.cancelledAt)}</Text>
              </div>
            )}

            {status.cancellationReason && (
              <div className="flex items-center gap-2">
                <Text variant="subtitle">Motivo:</Text>
                <Text>{status.cancellationReason}</Text>
              </div>
            )}
          </div>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="primary"
            onClick={() => setShowContract(!showContract)}
          >
            {showContract ? "Ocultar Contrato" : "Visualizar Contrato"}
          </Button>

          {showContract && (
            <Button variant="secondary" onClick={handlePrintContract}>
              Imprimir Contrato
            </Button>
          )}

          <Button
            variant="destructive"
            onClick={() => {
              setCancelReason("");
              setIsCancelOpen(true);
            }}
            disabled={
              isCancelling || !((roleAllowsCancel ? true : canCancel) && !status.cancelledAt)
            }
          >
            {isCancelling ? "Cancelando..." : "Cancelar Contrato"}
          </Button>
        </div>

        {showContract && log && (
          <Card className="p-6 mt-6">
            <ContratoPDF
              alunoData={{
                id: user.id,
                name: log.name,
                cpf: log.cpf,
                email: user.email,
                birthDate: log.birthDate,
                address: log.address,
                city: log.city,
                state: log.state,
                zipCode: log.zipCode,
              }}
              contractStatus={status}
            />
          </Card>
        )}

        <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar contrato</DialogTitle>
              <DialogDescription>Informe o motivo do cancelamento.</DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Motivo do cancelamento"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setIsCancelOpen(false)}
                disabled={isCancelling}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancel}
                disabled={isCancelling || !cancelReason.trim()}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // For admins, show full contract information
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text variant="subtitle">Status do Contrato</Text>
            <div className="flex items-center gap-2 mt-1">
              {status.cancelledAt ? (
                <Badge>Cancelado</Badge>
              ) : status.signed && status.signedByAdmin && status.isValid ? (
                <Badge>Assinado e Válido</Badge>
              ) : isExpired ? (
                <Badge>Expirado</Badge>
              ) : (
                <Badge>Pendente</Badge>
              )}
            </div>
          </div>

          <div>
            <Text variant="subtitle">Assinatura do Aluno</Text>
            <div className="flex items-center gap-2 mt-1">
              {status.signed ? (
                <Badge>Assinado</Badge>
              ) : (
                <Badge>Pendente</Badge>
              )}
            </div>
          </div>

          <div>
            <Text variant="subtitle">Assinatura do Administrador</Text>
            <div className="flex items-center gap-2 mt-1">
              {status.signedByAdmin ? (
                <Badge>Assinado</Badge>
              ) : (
                <Badge>Pendente</Badge> 
              )}
            </div>
          </div>

          <div>
            <Text variant="subtitle">Validade</Text>
            <div className="flex items-center gap-2 mt-1">
              {isExpired ? (
                <Badge>Expirado</Badge>
              ) : isNearExpiration ? (
                <Badge>Perto de expirar</Badge>
              ) : (
                <Badge>Válido</Badge>
              )}
            </div>
          </div>

          {status.signedAt && (
            <div>
              <Text variant="subtitle">Data de Assinatura</Text>
              <Text className="mt-1">{formatDate(status.signedAt)}</Text>
            </div>
          )}

          {status.expiresAt && (
            <div>
              <Text variant="subtitle">Data de Expiração</Text>
              <Text className="mt-1">{formatDate(status.expiresAt)}</Text>
            </div>
          )}

          {status.adminSignedAt && (
            <div>
              <Text variant="subtitle">Data de Assinatura Admin</Text>
              <Text className="mt-1">{formatDate(status.adminSignedAt)}</Text>
            </div>
          )}

          {status.cancelledAt && (
            <div>
              <Text variant="subtitle">Data de Cancelamento</Text>
              <Text className="mt-1">{formatDate(status.cancelledAt)}</Text>
            </div>
          )}

          {status.cancellationReason && (
            <div>
              <Text variant="subtitle">Motivo do Cancelamento</Text>
              <Text className="mt-1">{status.cancellationReason}</Text>
            </div>
          )}

          {status.renewalCount && status.renewalCount > 0 && (
            <div>
              <Text variant="subtitle">Renovações</Text>
              <Text className="mt-1">{status.renewalCount}x renovado</Text>
            </div>
          )}

          {status.lastRenewalAt && (
            <div>
              <Text variant="subtitle">Última Renovação</Text>
              <Text className="mt-1">{formatDate(status.lastRenewalAt)}</Text>
            </div>
          )}
        </div>
      </Card>

      {log && (
        <Card className="p-6">
          <Text variant="title" size="lg" className="mb-4">
            Detalhes do Contrato
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text variant="subtitle">Nome Completo</Text>
              <Text>{log.name}</Text>
            </div>

            <div>
              <Text variant="subtitle">CPF</Text>
              <Text>{log.cpf}</Text>
            </div>

            <div>
              <Text variant="subtitle">Data de Nascimento</Text>
              <Text>{formatDate(log.birthDate)}</Text>
            </div>

            <div>
              <Text variant="subtitle">Endereço</Text>
              <Text>
                {log.address}, {log.city} - {log.state}, {log.zipCode}
              </Text>
            </div>

            <div>
              <Text variant="subtitle">IP do Cliente</Text>
              <Text>{log.ip}</Text>
            </div>

            <div>
              <Text variant="subtitle">Navegador</Text>
              <Text>{log.browser}</Text>
            </div>

            {log.adminName && (
              <div>
                <Text variant="subtitle">Administrador</Text>
                <Text>{log.adminName}</Text>
              </div>
            )}

            {log.adminCPF && (
              <div>
                <Text variant="subtitle">CPF do Administrador</Text>
                <Text>{log.adminCPF}</Text>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <Text variant="title" size="lg" className="mb-4">
          Ações
        </Text>
        <div className="flex gap-4">
          <Button
            variant="primary"
            onClick={() => setShowContract(!showContract)}
          >
            {showContract ? "Ocultar Contrato" : "Visualizar Contrato"}
          </Button>

      {showContract && (
        <Button variant="secondary" onClick={handlePrintContract}>
          Imprimir Contrato
        </Button>
      )}

          <Button
            onClick={() => {
              setCancelReason("");
              setIsCancelOpen(true);
            }}
            disabled={
              isCancelling || !((roleAllowsCancel ? true : canCancel) && !status.cancelledAt)
            }
          >
            {isCancelling ? "Cancelando..." : "Cancelar Contrato"}
          </Button>
        </div>
      </Card>

      {showContract && log && (
        <Card className="p-6">
          <Text variant="title" size="lg" className="mb-4">
            Contrato Completo
          </Text>
          <ContratoPDF
            alunoData={{
              id: user.id,
              name: log.name,
              cpf: log.cpf,
              email: user.email,
              birthDate: log.birthDate,
              address: log.address,
              city: log.city,
              state: log.state,
              zipCode: log.zipCode,
            }}
            contractStatus={status}
          />
        </Card>
      )}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar contrato</DialogTitle>
            <DialogDescription>Informe o motivo do cancelamento.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Motivo do cancelamento"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsCancelOpen(false)}
              disabled={isCancelling}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isCancelling || !cancelReason.trim()}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
        
