"use client";

import { useState, useEffect, useCallback } from "react";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractStatus } from "@/types/contract";
import { Spinner } from "../ui/spinner";

interface ContractWithUser {
  userId: string;
  userName: string;
  userEmail: string;
  contractStatus: ContractStatus;
  canCancel: boolean;
}

export default function AdminContractsClient() {
  const [contracts, setContracts] = useState<ContractWithUser[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<
    ContractWithUser[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(
    new Set()
  );
  const [isBulkCancelling, setIsBulkCancelling] = useState(false);

  const filterContracts = useCallback(() => {
    let filtered = contracts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (contract) =>
          contract.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((contract) => {
        switch (statusFilter) {
          case "active":
            return (
              contract.contractStatus.signed &&
              contract.contractStatus.signedByAdmin &&
              contract.contractStatus.isValid &&
              !contract.contractStatus.cancelledAt
            );
          case "pending":
            return (
              contract.contractStatus.signed &&
              !contract.contractStatus.signedByAdmin
            );
          case "expired":
            return (
              contract.contractStatus.expiresAt &&
              new Date(contract.contractStatus.expiresAt) < new Date() &&
              !contract.contractStatus.cancelledAt
            );
          case "cancelled":
            return !!contract.contractStatus.cancelledAt;
          case "cancellable":
            return contract.canCancel && !contract.contractStatus.cancelledAt;
          default:
            return true;
        }
      });
    }

    setFilteredContracts(filtered);
  }, [contracts, searchTerm, statusFilter]);

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [filterContracts]);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all users with contracts
      const response = await fetch("/api/admin/contracts/all");

      if (!response.ok) {
        throw new Error("Failed to fetch contracts");
      }

      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectContract = (userId: string) => {
    const newSelected = new Set(selectedContracts);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedContracts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContracts.size === filteredContracts.length) {
      setSelectedContracts(new Set());
    } else {
      setSelectedContracts(new Set(filteredContracts.map((c) => c.userId)));
    }
  };

  const handleBulkCancel = async () => {
    if (selectedContracts.size === 0) {
      alert("Selecione pelo menos um contrato para cancelar");
      return;
    }

    const reason = prompt("Digite o motivo do cancelamento em massa:");
    if (!reason) return;

    const confirmMessage = `Tem certeza que deseja cancelar ${selectedContracts.size} contrato(s)?\n\nMotivo: ${reason}`;
    if (!confirm(confirmMessage)) return;

    setIsBulkCancelling(true);

    try {
      const promises = Array.from(selectedContracts).map((userId) =>
        fetch(`/api/contract/cancel/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason,
            isAdminCancellation: true,
          }),
        })
      );

      const results = await Promise.allSettled(promises);

      const successful = results.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failed = results.length - successful;

      if (failed > 0) {
        alert(
          `${successful} contratos cancelados com sucesso. ${failed} falharam.`
        );
      } else {
        alert(`${successful} contratos cancelados com sucesso!`);
      }

      setSelectedContracts(new Set());
      await fetchContracts();
    } catch (error) {
      alert("Erro ao cancelar contratos em massa");
    } finally {
      setIsBulkCancelling(false);
    }
  };

  const handleSingleCancel = async (userId: string, userName: string) => {
    const reason = prompt(
      `Digite o motivo do cancelamento do contrato de ${userName}:`
    );
    if (!reason) return;

    const confirmMessage = `Tem certeza que deseja cancelar o contrato de ${userName}?\n\nMotivo: ${reason}`;
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/contract/cancel/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason,
          isAdminCancellation: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Contrato cancelado com sucesso!");
        await fetchContracts();
      } else {
        alert(`Erro: ${result.message}`);
      }
    } catch (error) {
      alert("Erro ao cancelar contrato");
    }
  };

  const getStatusBadge = (contract: ContractWithUser) => {
    if (contract.contractStatus.cancelledAt) {
      return <Badge >Cancelado</Badge>;
    }
    if (
      contract.contractStatus.signed &&
      contract.contractStatus.signedByAdmin &&
      contract.contractStatus.isValid
    ) {
      return <Badge >Ativo</Badge>;
    }
    if (
      contract.contractStatus.signed &&
      !contract.contractStatus.signedByAdmin
    ) {
      return <Badge >Pendente Admin</Badge>;
    }
    if (
      contract.contractStatus.expiresAt &&
      new Date(contract.contractStatus.expiresAt) < new Date()
    ) {
      return <Badge >Expirado</Badge>;
    }
    return <Badge >Pendente</Badge>;  
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Text className="text-red-600">
          Erro ao carregar contratos: {error}
        </Text>
        <Button onClick={fetchContracts} className="mt-4">
          Tentar Novamente
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-80"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="pending">Pendente Admin</option>
              <option value="expired">Expirados</option>
              <option value="cancelled">Cancelados</option>
              <option value="cancellable">Canceláveis</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchContracts} variant="outline">
              Atualizar
            </Button>
            {selectedContracts.size > 0 && (
              <Button
                onClick={handleBulkCancel}
                disabled={isBulkCancelling}
              >
                {isBulkCancelling
                  ? "Cancelando..."
                  : `Cancelar ${selectedContracts.size} Selecionados`}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Contracts Table */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <Text variant="title" size="lg">
            Contratos ({filteredContracts.length})
          </Text>
          {filteredContracts.length > 0 && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedContracts.size === filteredContracts.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <Text>Selecionar Todos</Text>
            </label>
          )}
        </div>

        {filteredContracts.length === 0 ? (
          <div className="text-center py-8">
            <Text className="text-gray-500">Nenhum contrato encontrado</Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Selecionar</th>
                  <th className="text-left py-3 px-2">Estudante</th>
                  <th className="text-left py-3 px-2">Email</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Data de Expiração</th>
                  <th className="text-left py-3 px-2">Renovações</th>
                  <th className="text-left py-3 px-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr
                    key={contract.userId}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={selectedContracts.has(contract.userId)}
                        onChange={() => handleSelectContract(contract.userId)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Text className="font-medium">{contract.userName}</Text>
                    </td>
                    <td className="py-3 px-2">
                      <Text className="text-gray-600">
                        {contract.userEmail}
                      </Text>
                    </td>
                    <td className="py-3 px-2">{getStatusBadge(contract)}</td>
                    <td className="py-3 px-2">
                      <Text>
                        {contract.contractStatus.expiresAt
                          ? formatDate(contract.contractStatus.expiresAt)
                          : "N/A"}
                      </Text>
                    </td>
                    <td className="py-3 px-2">
                      <Text>{contract.contractStatus.renewalCount || 0}</Text>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        {contract.canCancel &&
                          !contract.contractStatus.cancelledAt && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleSingleCancel(
                                  contract.userId,
                                  contract.userName
                                )
                              }
                            >
                              Cancelar
                            </Button>
                          )}
                        {contract.contractStatus.signed &&
                          !contract.contractStatus.signedByAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Navigate to user details or handle admin signing
                                window.open(
                                  `/hub/plataforma/admin/users/${contract.userId}`,
                                  "_blank"
                                );
                              }}
                            >
                              Assinar
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
