import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ContractLog,
  ContractStatus,
  SignatureFormData,
  ContractOperationResponse,
  Student,
  ContractNotification,
} from "@/types/contract";

interface UseContractState {
  student: Student | null;
  contractStatus: ContractStatus | null;
  contractLog: ContractLog | null;
  isLoading: boolean;
  isSigning: boolean;
  error: string | null;
  showNotification: boolean;
}

interface UseContractActions {
  signContract: (
    signatureData: SignatureFormData
  ) => Promise<ContractOperationResponse>;
  validateContract: () => Promise<ContractOperationResponse>;
  renewContract: (
    renewalType: "automatic" | "manual"
  ) => Promise<ContractOperationResponse>;
  cancelContract: (reason: string) => Promise<ContractOperationResponse>;
  checkCancellationEligibility: () => Promise<{
    canCancel: boolean;
    message: string;
  }>;
  toggleAutoRenewal: (enabled: boolean) => Promise<ContractOperationResponse>;
  refreshContract: () => Promise<void>;
  dismissNotification: () => void;
}

export interface UseContractReturn
  extends UseContractState,
    UseContractActions {}

export const useContract = (): UseContractReturn => {
  const { data: session, status } = useSession();
  const [state, setState] = useState<UseContractState>({
    student: null,
    contractStatus: null,
    contractLog: null,
    isLoading: true,
    isSigning: false,
    error: null,
    showNotification: false,
  });

  /**
   * Fetch contract data for current user
   */
  const fetchContractData = useCallback(async () => {
    if (!session?.user?.id || status !== "authenticated") {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/contract/${encodeURIComponent(session.user.id)}`);

      if (response.status === 404) {
        // Handle 404 gracefully - treat as no contract data found
        setState((prev) => ({
          ...prev,
          student: null,
          contractStatus: null,
          contractLog: null,
          showNotification: false,
          isLoading: false,
          error: null,
        }));
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch contract data: ${response.status}`);
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        student: data.student,
        contractStatus: data.contractStatus,
        contractLog: data.contractLog,
        showNotification: data.showNotification || false,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching contract data:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      }));
    }
  }, [session?.user?.id, status]);

  /**
   * Sign contract with provided signature data
   */
  const signContract = useCallback(
    async (
      signatureData: SignatureFormData
    ): Promise<ContractOperationResponse> => {
      if (!session?.user?.id) {
        return {
          success: false,
          message: "User not authenticated",
        };
      }

      try {
        setState((prev) => ({ ...prev, isSigning: true, error: null }));

        const response = await fetch("/api/contract/sign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: session.user.id,
            signatureData,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Refresh contract data after successful signing
          await fetchContractData();
        } else {
          setState((prev) => ({
            ...prev,
            error: result.message || "Failed to sign contract",
            isSigning: false,
          }));
        }

        return result;
      } catch (error) {
        console.error("Error signing contract:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isSigning: false,
        }));

        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setState((prev) => ({ ...prev, isSigning: false }));
      }
    },
    [session?.user?.id, fetchContractData]
  );

  /**
   * Validate current contract
   */
  const validateContract =
    useCallback(async (): Promise<ContractOperationResponse> => {
      if (!session?.user?.id) {
        return {
          success: false,
          message: "User not authenticated",
        };
      }

      try {
        const response = await fetch(
          `/api/contract/validate/${session.user.id}`,
          {
            method: "POST",
          }
        );

        const result = await response.json();

        if (result.success) {
          setState((prev) => ({
            ...prev,
            contractStatus: result.data,
          }));
        }

        return result;
      } catch (error) {
        console.error("Error validating contract:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }, [session?.user?.id]);

  /**
   * Renew contract
   */
  const renewContract = useCallback(
    async (
      renewalType: "automatic" | "manual"
    ): Promise<ContractOperationResponse> => {
      if (!session?.user?.id) {
        return {
          success: false,
          message: "User not authenticated",
        };
      }

      try {
        const response = await fetch("/api/teacher/contract/renew", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: session.user.id,
            renewalType,
          }),
        });

        const result = await response.json();

        if (result.success) {
          await fetchContractData();
        }

        return result;
      } catch (error) {
        console.error("Error renewing contract:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [session?.user?.id, fetchContractData]
  );

  /**
   * Check if user can cancel contract
   */
  const checkCancellationEligibility = useCallback(async (): Promise<{
    canCancel: boolean;
    message: string;
  }> => {
    if (!session?.user?.id) {
      return {
        canCancel: false,
        message: "User not authenticated",
      };
    }

    try {
      const response = await fetch(`/api/contract/cancel/${session.user.id}`);
      const data = await response.json();
      return {
        canCancel: data.canCancel || false,
        message: data.message || "",
      };
    } catch (error) {
      console.error("Error checking cancellation eligibility:", error);
      return {
        canCancel: false,
        message: "Error checking eligibility",
      };
    }
  }, [session?.user?.id]);

  /**
   * Cancel contract
   */
  const cancelContract = useCallback(
    async (reason: string): Promise<ContractOperationResponse> => {
      if (!session?.user?.id) {
        return {
          success: false,
          message: "User not authenticated",
        };
      }

      try {
        const response = await fetch(
          `/api/contract/cancel/${session.user.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reason,
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          await fetchContractData();
        }

        return result;
      } catch (error) {
        console.error("Error cancelling contract:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [session?.user?.id, fetchContractData]
  );

  /**
   * Toggle auto renewal
   */
  const toggleAutoRenewal = useCallback(
    async (enabled: boolean): Promise<ContractOperationResponse> => {
      if (!session?.user?.id) {
        return {
          success: false,
          message: "User not authenticated",
        };
      }

      try {
        const response = await fetch(
          "/api/contract/auto-renewal/toggle",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              enabled,
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          await fetchContractData();
        }

        return result;
      } catch (error) {
        console.error("Error toggling auto renewal:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [session?.user?.id, fetchContractData]
  );

  /**
   * Refresh contract data
   */
  const refreshContract = useCallback(async (): Promise<void> => {
    await fetchContractData();
  }, [fetchContractData]);

  /**
   * Dismiss contract notification
   */
  const dismissNotification = useCallback(() => {
    setState((prev) => ({ ...prev, showNotification: false }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (status !== "loading") {
      fetchContractData();
    }
  }, [fetchContractData, status]);

  // Return the hook interface
  return {
    // State
    student: state.student,
    contractStatus: state.contractStatus,
    contractLog: state.contractLog,
    isLoading: state.isLoading,
    isSigning: state.isSigning,
    error: state.error,
    showNotification: state.showNotification,

    // Actions
    signContract,
    validateContract,
    renewContract,
    cancelContract,
    checkCancellationEligibility,
    toggleAutoRenewal,
    refreshContract,
    dismissNotification,
  };
};

/**
 * Hook for contract notifications
 */
export const useContractNotification = () => {
  const { data: session } = useSession();
  const [notification, setNotification] = useState<ContractNotification | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const checkNotification = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/contract/notification/${session.user.id}`
      );

      if (response.ok) {
        const data = await response.json();
        setNotification(data);
      }
    } catch (error) {
      console.error("Error checking contract notification:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    checkNotification();
  }, [checkNotification]);

  return {
    notification,
    isLoading,
    shouldShow: notification?.showNotification || false,
    refresh: checkNotification,
  };
};

/**
 * Hook specifically for admin contract management
 */
export const useAdminContracts = () => {
  const [contracts, setContracts] = useState({
    signed: [],
    pending: [],
    expired: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllContracts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/contracts");

      if (!response.ok) {
        throw new Error("Failed to fetch contracts");
      }

      const data = await response.json();
      setContracts(data);
    } catch (error) {
      console.error("Error fetching admin contracts:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const adminSignContract = useCallback(
    async (studentId: string, contractId: string) => {
      try {
        const response = await fetch("/api/admin/contracts/sign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId,
            contractId,
            adminData: {
              name: "Matheus de Souza Fernandes",
              cpf: "70625181158",
            },
          }),
        });

        const result = await response.json();

        if (result.success) {
          await fetchAllContracts(); // Refresh data
        }

        return result;
      } catch (error) {
        console.error("Error admin signing contract:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [fetchAllContracts]
  );

  useEffect(() => {
    fetchAllContracts();
  }, [fetchAllContracts]);

  return {
    contracts,
    isLoading,
    error,
    adminSignContract,
    refreshContracts: fetchAllContracts,
  };
};
