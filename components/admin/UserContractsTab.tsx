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
import { TeacherContractPDF } from "@/components/onboarding/steps/teacher/TeacherContractPDF";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslations, useFormatter } from "next-intl";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalIcon,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/ui/modal";

interface UserContractsTabProps {
  user: User;
  currentUserRole: UserRoles;
}

export default function UserContractsTab({
  user,
  currentUserRole,
}: UserContractsTabProps) {
  const t = useTranslations("UserDetails.contracts");
  const format = useFormatter();
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
  const [isRenewing, setIsRenewing] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);

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

  // Handle contract renewal
  const handleConfirmRenew = async () => {
    try {
      setIsRenewing(true);
      const response = await fetch(`/api/contract/renew/${user.id}`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        setIsRenewOpen(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error renewing contract:", error);
    } finally {
      setIsRenewing(false);
    }
  };

  // Simple date formatting function
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return t("notAvailable");
    try {
      const date = new Date(dateString);
      return format.dateTime(date, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return t("invalidDate");
    }
  };

  // Short date formatting function
  const formatShortDate = (dateString: string | undefined): string => {
    if (!dateString) return t("notAvailable");
    try {
      const date = new Date(dateString);
      return format.dateTime(date, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return t("notAvailable");
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
          {t("errorLoading", { error })}
        </Text>
      </Card>
    );
  }

  if (!contractData?.status) {
    return (
      <Card className="p-6">
        <Text>{t("noContractFound")}</Text>
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
              <Text variant="subtitle">{t("contractStatus")}:</Text>
              {status.cancelledAt ? (
                <Badge>{t("statusCanceled")}</Badge>
              ) : status.signed && status.signedByAdmin && status.isValid ? (
                <Badge>{t("statusSignedAndValid")}</Badge>
              ) : isExpired ? (
                <Badge>{t("statusExpired")}</Badge>
              ) : (
                <Badge>{t("statusPending")}</Badge>
              )}
            </div>

            {isNearExpiration && !isExpired && !status.cancelledAt && (
              <div className="flex items-center gap-2">
                <Text variant="subtitle">{t("validity")}:</Text>
                <Badge>{t("nearExpiration")}</Badge>
              </div>
            )}

            {isExpired && !status.cancelledAt && (
              <div className="flex items-center gap-2">
                <Text variant="subtitle">{t("validity")}:</Text>
                <Badge>{t("statusExpired")}</Badge>
              </div>
            )}

            {status.expiresAt && (
              <div className="flex items-center gap-2">
                <Text variant="subtitle">{t("expirationDate")}:</Text>
                <Text>{formatShortDate(status.expiresAt)}</Text>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Text variant="subtitle">{t("autoRenewal")}:</Text>
              {status.autoRenewal ? (
                <Badge variant="success">{t("autoRenewalEnabled")}</Badge>
              ) : (
                <Badge variant="secondary">{t("autoRenewalDisabled")}</Badge>
              )}
            </div>

            {status.cancelledAt && (
              <div className="flex items-center gap-2">
                <Text variant="subtitle">{t("cancellationDate")}:</Text>
                <Text>{formatShortDate(status.cancelledAt)}</Text>
              </div>
            )}

            {status.cancellationReason && (
              <div className="flex items-center gap-2">
                <Text variant="subtitle">{t("reason")}:</Text>
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
            {showContract ? t("hideContract") : t("viewContract")}
          </Button>

          {showContract && (
            <Button variant="secondary" onClick={handlePrintContract}>
              {t("printContract")}
            </Button>
          )}

          {(status.cancelledAt || isExpired) && (
            <Button
              variant="primary"
              onClick={() => setIsRenewOpen(true)}
              disabled={isRenewing}
            >
              {isRenewing ? t("renewing") : t("renewContract")}
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
            {isCancelling ? t("cancelling") : t("cancelContract")}
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
              <DialogTitle>{t("cancelContractDialogTitle")}</DialogTitle>
              <DialogDescription>{t("cancelContractDialogDescription")}</DialogDescription>
            </DialogHeader>
            <Input
              placeholder={t("cancelReasonPlaceholder")}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setIsCancelOpen(false)}
                disabled={isCancelling}
              >
                {t("back")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancel}
                disabled={isCancelling || !cancelReason.trim()}
              >
                {t("confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Modal open={isRenewOpen} onOpenChange={setIsRenewOpen}>
          <ModalContent>
            <ModalIcon type="calendar" />
            <ModalHeader>
              <ModalTitle>{t("renewContractDialogTitle")}</ModalTitle>
              <ModalDescription>{t("renewContractDialogDescription")}</ModalDescription>
            </ModalHeader>
            <ModalFooter>
              <ModalSecondaryButton onClick={() => setIsRenewOpen(false)}>
                {t("back")}
              </ModalSecondaryButton>
              <ModalPrimaryButton onClick={handleConfirmRenew} disabled={isRenewing}>
                {t("confirm")}
              </ModalPrimaryButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    );
  }

  // For admins, show full contract information
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text variant="subtitle">{t("contractStatus")}</Text>
            <div className="flex items-center gap-2 mt-1">
              {status.cancelledAt ? (
                <Badge>{t("statusCanceled")}</Badge>
              ) : status.signed && status.signedByAdmin && status.isValid ? (
                <Badge>{t("statusSignedAndValid")}</Badge>
              ) : isExpired ? (
                <Badge>{t("statusExpired")}</Badge>
              ) : (
                <Badge>{t("statusPending")}</Badge>
              )}
            </div>
          </div>

          <div>
            <Text variant="subtitle">{t("studentSignature")}</Text>
            <div className="flex items-center gap-2 mt-1">
              {status.signed ? (
                <Badge>{t("signed")}</Badge>
              ) : (
                <Badge>{t("statusPending")}</Badge>
              )}
            </div>
          </div>

          <div>
            <Text variant="subtitle">{t("adminSignature")}</Text>
            <div className="flex items-center gap-2 mt-1">
              {status.signedByAdmin ? (
                <Badge>{t("signed")}</Badge>
              ) : (
                <Badge>{t("statusPending")}</Badge> 
              )}
            </div>
          </div>

          <div>
            <Text variant="subtitle">{t("validity")}</Text>
            <div className="flex items-center gap-2 mt-1">
              {isExpired ? (
                <Badge>{t("statusExpired")}</Badge>
              ) : isNearExpiration ? (
                <Badge>{t("nearExpiration")}</Badge>
              ) : (
                <Badge>{t("statusValid")}</Badge>
              )}
            </div>
          </div>

          <div>
            <Text variant="subtitle">{t("autoRenewal")}</Text>
            <div className="flex items-center gap-2 mt-1">
              {status.autoRenewal ? (
                <Badge variant="success">{t("autoRenewalEnabled")}</Badge>
              ) : (
                <Badge variant="secondary">{t("autoRenewalDisabled")}</Badge>
              )}
            </div>
          </div>

          {status.signedAt && (
            <div>
              <Text variant="subtitle">{t("signedAt")}</Text>
              <Text className="mt-1">{formatDate(status.signedAt)}</Text>
            </div>
          )}

          {status.expiresAt && (
            <div>
              <Text variant="subtitle">{t("expirationDate")}</Text>
              <Text className="mt-1">{formatDate(status.expiresAt)}</Text>
            </div>
          )}

          {status.adminSignedAt && (
            <div>
              <Text variant="subtitle">{t("adminSignedAt")}</Text>
              <Text className="mt-1">{formatDate(status.adminSignedAt)}</Text>
            </div>
          )}

          {status.cancelledAt && (
            <div>
              <Text variant="subtitle">{t("cancellationDate")}</Text>
              <Text className="mt-1">{formatDate(status.cancelledAt)}</Text>
            </div>
          )}

          {status.cancellationReason && (
            <div>
              <Text variant="subtitle">{t("cancellationReason")}</Text>
              <Text className="mt-1">{status.cancellationReason}</Text>
            </div>
          )}

          {status.renewalCount && status.renewalCount > 0 && (
            <div>
              <Text variant="subtitle">{t("renewals")}</Text>
              <Text className="mt-1">{t("renewedCount", { count: status.renewalCount })}</Text>
            </div>
          )}

          {status.lastRenewalAt && (
            <div>
              <Text variant="subtitle">{t("lastRenewal")}</Text>
              <Text className="mt-1">{formatDate(status.lastRenewalAt)}</Text>
            </div>
          )}
        </div>
      </Card>

      {log && (
        <Card className="p-6">
          <Text variant="title" size="lg" className="mb-4">
            {t("contractDetails")}
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text variant="subtitle">{t("fullName")}</Text>
              <Text>{log.name}</Text>
            </div>

            <div>
              <Text variant="subtitle">{t("cpf")}</Text>
              <Text>{log.cpf}</Text>
            </div>

            <div>
              <Text variant="subtitle">{t("birthDate")}</Text>
              <Text>{formatDate(log.birthDate)}</Text>
            </div>

            <div>
              <Text variant="subtitle">{t("address")}</Text>
              <Text>
                {log.address}, {log.city} - {log.state}, {log.zipCode}
              </Text>
            </div>

            <div>
              <Text variant="subtitle">{t("clientIP")}</Text>
              <Text>{log.ip}</Text>
            </div>

            <div>
              <Text variant="subtitle">{t("browser")}</Text>
              <Text>{log.browser}</Text>
            </div>

            {log.adminName && (
              <div>
                <Text variant="subtitle">{t("admin")}</Text>
                <Text>{log.adminName}</Text>
              </div>
            )}

            {log.adminCPF && (
              <div>
                <Text variant="subtitle">{t("adminCPF")}</Text>
                <Text>{log.adminCPF}</Text>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <Text variant="title" size="lg" className="mb-4">
          {t("actions")}
        </Text>
        <div className="flex gap-4">
          <Button
            variant="primary"
            onClick={() => setShowContract(!showContract)}
          >
            {showContract ? t("hideContract") : t("viewContract")}
          </Button>

      {showContract && (
        <Button variant="secondary" onClick={handlePrintContract}>
          {t("printContract")}
        </Button>
      )}

          {(status.cancelledAt || isExpired) && (
            <Button
              variant="primary"
              onClick={() => setIsRenewOpen(true)}
              disabled={isRenewing}
            >
              {isRenewing ? t("renewing") : t("renewContract")}
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
            {isCancelling ? t("cancelling") : t("cancelContract")}
          </Button>
        </div>
      </Card>

      {showContract && log && (
        <Card className="p-6">
          <Text variant="title" size="lg" className="mb-4">
            {t("fullContract")}
          </Text>
          {user.role === UserRoles.TEACHER ? (
            <TeacherContractPDF
              teacherName={log.name}
              teacherCnpj={log.cpf}
              teacherAddress={log.address}
              teacherCity={log.city}
              teacherState={log.state}
              teacherZipCode={log.zipCode}
              signedDate={status.signedAt}
            />
          ) : (
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
          )}
        </Card>
      )}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancelContractDialogTitle")}</DialogTitle>
            <DialogDescription>{t("cancelContractDialogDescription")}</DialogDescription>
          </DialogHeader>
          <Input
            placeholder={t("cancelReasonPlaceholder")}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsCancelOpen(false)}
              disabled={isCancelling}
            >
              {t("back")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isCancelling || !cancelReason.trim()}
            >
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Modal open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <ModalContent>
          <ModalIcon type="calendar" />
          <ModalHeader>
            <ModalTitle>{t("renewContractDialogTitle")}</ModalTitle>
            <ModalDescription>{t("renewContractDialogDescription")}</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton onClick={() => setIsRenewOpen(false)}>
              {t("back")}
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={handleConfirmRenew} disabled={isRenewing}>
              {t("confirm")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
        
