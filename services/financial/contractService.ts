import {
  ContractLog,
  ContractStatus,
  SignatureFormData,
  ContractOperationResponse,
  CreateContractRequest,
  ValidateContractRequest,
  AdminSignContractRequest,
  Student,
  ContractValidationError,
  ContractRenewalRequest,
  ContractCancellationRequest,
  ContractRenewalResponse,
  ContractRenewalEmailData,
  ContractRenewalJob,
} from "@/types/contract";
import { AuditService } from "@/services/core/auditService";
import {
  userRepository,
  contractRepository,
  userAdminRepository,
} from "@/repositories";

export class ContractService {
  // TODO: Tirar essa informação do código e colocar em um arquivo de configuração
  private readonly ADMIN_DATA = {
    name: "Matheus de Souza Fernandes",
    cpf: "70625181158",
    birthDate: "1999-10-02",
  };

  /**
   * Get contract status and data for a student
   */
  async getStudentContract(userId: string): Promise<{
    student: Student | null;
    contractStatus: ContractStatus | null;
    contractLog: ContractLog | null;
  }> {
    try {
      // Get student data
      const userData = await userRepository.findById(userId);
      if (!userData) {
        throw new Error("Student not found");
      }
      const student = userData as Student;

      // Get contract status
      const contractStatus = await contractRepository.getContractStatus(userId);

      // Get contract log if exists
      let contractLog: ContractLog | null = null;
      if (contractStatus?.logId) {
        contractLog = await contractRepository.getContractLog(
          userId,
          contractStatus.logId,
        );
      }

      // If contract is cancelled, return it immediately without validity checks
      if (contractStatus?.cancelledAt) {
        return { student, contractStatus, contractLog };
      }

      // Check contract validity
      if (contractStatus && contractStatus.signed && contractStatus.signedAt) {
        const isValid = this.isContractValid(contractStatus.signedAt);
        if (!isValid && contractStatus.isValid !== false) {
          // Contract is expired, invalidate it
          await this.invalidateExpiredContract(userId);
          return {
            student,
            contractStatus: {
              signed: false,
              signedByAdmin: false,
              isValid: false,
            },
            contractLog: null,
          };
        }
      }

      return { student, contractStatus, contractLog };
    } catch (error) {
      console.error("Error getting student contract:", error);
      throw error;
    }
  }

  /**
   * Create and sign a contract
   */
  async createContract(
    request: CreateContractRequest,
  ): Promise<ContractOperationResponse> {
    try {
      const { studentId, signatureData } = request;

      // Validate signature data
      const validationErrors = this.validateSignatureData(signatureData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: "Dados de assinatura inválidos",
          errors: validationErrors,
        };
      }

      // Check if student already has a valid contract
      const existingStatus =
        await contractRepository.getContractStatus(studentId);
      if (
        existingStatus?.signed &&
        existingStatus?.signedByAdmin &&
        this.isContractValid(existingStatus.signedAt)
      ) {
        return {
          success: false,
          message: "Contrato já assinado e válido",
        };
      }

      // Get client IP and browser info
      const clientInfo = await this.getClientInfo();

      // Prepare contract log data
      const contractLogData: Omit<ContractLog, "logID"> = {
        name: signatureData.name,
        cpf: signatureData.cpf,
        birthDate: signatureData.birthDate,
        address: signatureData.address,
        city: signatureData.city,
        state: signatureData.state,
        zipCode: signatureData.zipCode,
        ip: signatureData.ip || clientInfo.ip,
        browser: signatureData.browser || clientInfo.browser,
        viewedAt: new Date().toISOString(),
        signedAt: new Date().toISOString(),
        agreedToTerms: signatureData.agreedToTerms,
        // Auto-sign as admin
        adminSigned: true,
        adminName: this.ADMIN_DATA.name,
        adminCPF: this.ADMIN_DATA.cpf,
        adminIP: clientInfo.ip,
        adminBrowser: clientInfo.browser,
        adminSignedAt: new Date().toISOString(),
      };

      // Create contract log
      const logId = await contractRepository.createContractLog(
        studentId,
        contractLogData,
      );

      // Update contract status
      const contractStatus: ContractStatus = {
        signed: true,
        signedByAdmin: true,
        logId,
        signedAt: contractLogData.signedAt,
        adminSignedAt: contractLogData.adminSignedAt,
        isValid: true,
        expiresAt: this.calculateExpirationDate(contractLogData.signedAt),
        contractVersion: "1.0",
      };

      await contractRepository.updateContractStatus(studentId, contractStatus);

      // Log the contract signing event
      await AuditService.logEvent(studentId, "CONTRACT_SIGNED", "contract", {
        contractId: logId,
        ipAddress: clientInfo.ip,
      });

      return {
        success: true,
        message: "Contrato assinado com sucesso",
        data: contractStatus,
      };
    } catch (error) {
      console.error("Error creating contract:", error);
      return {
        success: false,
        message: "Erro interno do servidor",
      };
    }
  }

  /**
   * Validate contract status
   */
  async validateContract(
    request: ValidateContractRequest,
  ): Promise<ContractOperationResponse> {
    try {
      const { studentId, contractId } = request;

      const contractStatus =
        await contractRepository.getContractStatus(studentId);

      if (!contractStatus) {
        return {
          success: false,
          message: "Contrato não encontrado",
        };
      }

      const isValid = this.isContractValid(contractStatus.signedAt);

      if (!isValid) {
        await this.invalidateExpiredContract(studentId);
        return {
          success: false,
          message: "Contrato expirado",
        };
      }

      return {
        success: true,
        message: "Contrato válido",
        data: contractStatus,
      };
    } catch (error) {
      console.error("Error validating contract:", error);
      return {
        success: false,
        message: "Erro ao validar contrato",
      };
    }
  }

  /**
   * Admin sign contract (if needed separately)
   */
  async adminSignContract(
    request: AdminSignContractRequest,
  ): Promise<ContractOperationResponse> {
    try {
      const { studentId, contractId, adminData } = request;

      await contractRepository.signContractAsAdmin(
        studentId,
        contractId,
        adminData,
      );

      const updatedStatus =
        await contractRepository.getContractStatus(studentId);

      // Log the admin contract signing event
      await AuditService.logEvent(
        "admin", // Using a generic admin identifier since we don't have the specific admin ID
        "CONTRACT_ADMIN_SIGNED",
        "contract",
        {
          studentId,
          contractId,
          ipAddress: adminData.ip,
        },
      );

      return {
        success: true,
        message: "Contrato assinado pelo administrador",
        data: updatedStatus || undefined,
      };
    } catch (error) {
      console.error("Error admin signing contract:", error);
      return {
        success: false,
        message: "Erro ao assinar contrato como administrador",
      };
    }
  }

  /**
   * Get all contracts for admin view
   */
  async getAllContracts(): Promise<{
    signed: any[];
    pending: any[];
    expired: any[];
  }> {
    try {
      const pendingContracts =
        await contractRepository.getUsersWithPendingContracts();

      // For now, return pending contracts and empty arrays for others
      // This can be expanded to include more comprehensive contract data
      return {
        signed: [],
        pending: pendingContracts,
        expired: [],
      };
    } catch (error) {
      console.error("Error getting all contracts:", error);
      throw error;
    }
  }

  /**
   * Invalidate expired contract
   */
  private async invalidateExpiredContract(userId: string): Promise<void> {
    try {
      await contractRepository.invalidateContract(userId);
      console.log("Contract expired and invalidated for user:", userId);

      // Log the contract invalidation event
      await AuditService.logEvent("system", "CONTRACT_EXPIRED", "contract", {
        userId,
      });
    } catch (error) {
      console.error("Error invalidating expired contract:", error);
      throw error;
    }
  }

  /**
   * Update user contract length in user document
   */
  async updateUserContractLength(
    userId: string,
    contractLengthMonths: number,
  ): Promise<void> {
    try {
      // This should be handled by the user repository or contract repository
      // For now, we'll leave this to be handled in the API route directly
      // since it's not part of the core contract functionality
    } catch (error) {
      console.error("Error updating user contract length:", error);
      throw error;
    }
  }

  /**
   * Check if contract is still valid (6 months)
   */
  private isContractValid(signedAt?: string): boolean {
    if (!signedAt) return false;

    const signedDate = new Date(signedAt);
    const currentDate = new Date();
    const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 60 * 1000;

    return currentDate.getTime() - signedDate.getTime() < sixMonthsInMs;
  }

  /**
   * Calculate contract expiration date (6 months from signature)
   */
  private calculateExpirationDate(signedAt: string): string {
    const signedDate = new Date(signedAt);
    const expirationDate = new Date(signedDate);
    expirationDate.setMonth(expirationDate.getMonth() + 6);
    return expirationDate.toISOString();
  }

  /**
   * Validate signature form data
   */
  private validateSignatureData(
    data: SignatureFormData,
  ): ContractValidationError[] {
    return contractRepository.validateContractData(data);
  }

  /**
   * Get client IP and browser information
   */
  private async getClientInfo(): Promise<{ ip: string; browser: string }> {
    let ip = "N/A";
    let browser = "N/A";

    try {
      // Try to get IP from external service
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        ip = ipData.ip;
      }
    } catch (error) {
      console.warn("Could not fetch IP address:", error);
    }

    // Browser info would typically come from client
    if (typeof window !== "undefined") {
      browser = navigator.userAgent;
    }

    return { ip, browser };
  }

  /**
   * Check if user needs to sign contract
   */
  async shouldShowContractNotification(userId: string): Promise<boolean> {
    try {
      const contractStatus = await contractRepository.getContractStatus(userId);

      if (!contractStatus) return true;
      if (!contractStatus.signed) return true;
      if (!this.isContractValid(contractStatus.signedAt)) return true;

      return false;
    } catch (error) {
      console.error("Error checking contract notification status:", error);
      return true; // Show notification on error to be safe
    }
  }

  /**
   * Generate contract PDF data
   */
  async getContractPDFData(userId: string): Promise<{
    student: Student;
    contractStatus: ContractStatus | null;
    contractLog: ContractLog | null;
  }> {
    try {
      const result = await this.getStudentContract(userId);

      if (!result.student) {
        throw new Error("Student data not found");
      }

      return {
        student: result.student,
        contractStatus: result.contractStatus,
        contractLog: result.contractLog,
      };
    } catch (error) {
      console.error("Error getting contract PDF data:", error);
      throw error;
    }
  }

  /**
   * Renew a contract automatically or manually
   */
  async renewContract(
    request: ContractRenewalRequest,
  ): Promise<ContractRenewalResponse> {
    try {
      const { studentId, renewalType, adminId } = request;

      // Get current contract status
      const contractStatus =
        await contractRepository.getContractStatus(studentId);

      if (!contractStatus) {
        return {
          success: false,
          message: "Contrato não encontrado",
        };
      }

      if (!contractStatus.signed || !contractStatus.signedByAdmin) {
        return {
          success: false,
          message: "Contrato não está totalmente assinado",
        };
      }

      // If contract was cancelled, we allow renewal but reset cancellation status
      // if (contractStatus.cancelledAt) {
      //   return {
      //     success: false,
      //     message: "Contrato foi cancelado e não pode ser renovado",
      //   };
      // }

      const currentExpirationDate = contractStatus.expiresAt;

      // Calculate new expiration date
      // If cancelled or expired, start 6 months from now
      // If active, add 6 months to current expiration
      let newExpirationDate: string;
      const now = new Date();
      const isExpired = currentExpirationDate
        ? new Date(currentExpirationDate) < now
        : true;

      if (contractStatus.cancelledAt || isExpired || !currentExpirationDate) {
        const next = new Date();
        next.setMonth(next.getMonth() + 6);
        newExpirationDate = next.toISOString();
      } else {
        newExpirationDate = this.calculateRenewalExpirationDate(
          currentExpirationDate,
        );
      }

      const renewalCount = (contractStatus.renewalCount || 0) + 1;

      // Remove cancellation fields from base status
      const { cancelledAt, cancelledBy, cancellationReason, ...baseStatus } =
        contractStatus;

      // Update contract status with renewal information
      const updatedStatus: ContractStatus = {
        ...baseStatus,
        expiresAt: newExpirationDate,
        isValid: true,
        renewalCount,
        lastRenewalAt: new Date().toISOString(),
        autoRenewal: renewalType === "automatic",
      };

      await contractRepository.updateContractStatus(studentId, updatedStatus);

      // Log the renewal event
      await AuditService.logEvent(
        adminId || "system",
        "CONTRACT_RENEWED",
        "contract",
        {
          studentId,
          renewalType,
          previousExpirationDate: currentExpirationDate || "N/A",
          newExpirationDate,
          renewalCount,
        },
      );

      // Send renewal email notification
      const userData = await userRepository.findById(studentId);
      if (userData) {
        const emailData: ContractRenewalEmailData = {
          studentName: userData.name || "Estudante",
          studentEmail: userData.email,
          previousExpirationDate: currentExpirationDate || "N/A",
          newExpirationDate,
          renewalCount,
          contractId: contractStatus.logId || studentId,
        };

        await this.sendRenewalEmail(emailData);
      }

      return {
        success: true,
        message: "Contrato renovado com sucesso",
        data: updatedStatus,
        renewalData: {
          previousExpirationDate: currentExpirationDate || "N/A",
          newExpirationDate,
          renewalCount,
          renewalType,
        },
      };
    } catch (error) {
      console.error("Error renewing contract:", error);
      return {
        success: false,
        message: "Erro ao renovar contrato",
      };
    }
  }

  /**
   * Cancel a contract
   */
  async cancelContract(
    request: ContractCancellationRequest,
  ): Promise<ContractOperationResponse> {
    try {
      const { studentId, cancelledBy, reason, isAdminCancellation } = request;

      // Get current contract status
      const contractStatus =
        await contractRepository.getContractStatus(studentId);

      if (!contractStatus) {
        return {
          success: false,
          message: "Contrato não encontrado",
        };
      }

      if (contractStatus.cancelledAt) {
        return {
          success: false,
          message: "Contrato já foi cancelado",
        };
      }

      // Update contract status with cancellation information
      const updatedStatus: ContractStatus = {
        ...contractStatus,
        cancelledAt: new Date().toISOString(),
        cancelledBy,
        cancellationReason: reason,
        isValid: false,
        autoRenewal: false,
      };

      await contractRepository.updateContractStatus(studentId, updatedStatus);

      // Log the cancellation event
      await AuditService.logEvent(
        cancelledBy,
        "CONTRACT_CANCELLED",
        "contract",
        {
          studentId,
          reason,
          isAdminCancellation,
          cancelledAt: updatedStatus.cancelledAt,
        },
      );

      return {
        success: true,
        message: "Contrato cancelado com sucesso",
        data: updatedStatus,
      };
    } catch (error) {
      console.error("Error cancelling contract:", error);
      return {
        success: false,
        message: "Erro ao cancelar contrato",
      };
    }
  }

  /**
   * Toggle auto-renewal status
   */
  async toggleAutoRenewal(
    studentId: string,
    enabled: boolean,
  ): Promise<ContractOperationResponse> {
    try {
      // Get current contract status
      const contractStatus =
        await contractRepository.getContractStatus(studentId);

      if (!contractStatus) {
        return {
          success: false,
          message: "Contrato não encontrado",
        };
      }

      if (!contractStatus.signed) {
        return {
          success: false,
          message: "Contrato não assinado",
        };
      }

      if (contractStatus.cancelledAt) {
        return {
          success: false,
          message: "Contrato cancelado",
        };
      }

      // Update contract status
      const updatedStatus: ContractStatus = {
        ...contractStatus,
        autoRenewal: enabled,
      };

      await contractRepository.updateContractStatus(studentId, updatedStatus);

      // Log the event
      await AuditService.logEvent(
        studentId,
        "CONTRACT_AUTO_RENEWAL_TOGGLED",
        "contract",
        {
          studentId,
          enabled,
        },
      );

      return {
        success: true,
        message: `Renovação automática ${enabled ? "ativada" : "desativada"} com sucesso`,
        data: updatedStatus,
      };
    } catch (error) {
      console.error("Error toggling auto-renewal:", error);
      return {
        success: false,
        message: "Erro ao alterar status da renovação automática",
      };
    }
  }

  /**
   * Process contracts for automatic renewal (called by cron job)
   */
  async processContractRenewals(): Promise<ContractRenewalJob[]> {
    try {
      // Get all users by fetching from all roles
      const studentUsers = await userAdminRepository.findUsersByRole("student");
      const guardedStudentUsers =
        await userAdminRepository.findUsersByRole("guarded_student");
      const teacherUsers = await userAdminRepository.findUsersByRole("teacher");
      const managerUsers = await userAdminRepository.findUsersByRole("manager");
      const adminUsers = await userAdminRepository.findUsersByRole("admin");
      const materialManagerUsers =
        await userAdminRepository.findUsersByRole("material_manager");

      const allUsers = [
        ...studentUsers,
        ...guardedStudentUsers,
        ...teacherUsers,
        ...managerUsers,
        ...adminUsers,
        ...materialManagerUsers,
      ];

      const renewalJobs: ContractRenewalJob[] = [];

      for (const user of allUsers) {
        const contractStatus = await contractRepository.getContractStatus(
          user.id,
        );

        if (
          !contractStatus ||
          !contractStatus.expiresAt ||
          contractStatus.cancelledAt
        ) {
          continue;
        }

        const daysUntilExpiration = this.getDaysUntilExpiration(
          contractStatus.expiresAt,
        );

        // Check if contract should be renewed (expires in 7 days or less)
        const shouldRenew =
          daysUntilExpiration <= 7 &&
          daysUntilExpiration >= 0 &&
          contractStatus.signed &&
          contractStatus.signedByAdmin &&
          contractStatus.autoRenewal !== false;

        // Check if cancel button should be shown (30 days before expiration)
        const shouldShowCancelButton =
          daysUntilExpiration <= 30 && daysUntilExpiration > 0;

        const job: ContractRenewalJob = {
          userId: user.id,
          contractStatus,
          daysUntilExpiration,
          shouldRenew,
          shouldShowCancelButton,
        };

        renewalJobs.push(job);

        // Automatically renew if conditions are met
        if (shouldRenew) {
          await this.renewContract({
            studentId: user.id,
            renewalType: "automatic",
          });
        }
      }

      return renewalJobs;
    } catch (error) {
      console.error("Error processing contract renewals:", error);
      throw error;
    }
  }

  /**
   * Check if user can cancel their contract (30 days before expiration)
   */
  async canUserCancelContract(userId: string): Promise<boolean> {
    try {
      const contractStatus = await contractRepository.getContractStatus(userId);

      if (
        !contractStatus ||
        !contractStatus.expiresAt ||
        contractStatus.cancelledAt
      ) {
        return false;
      }

      const daysUntilExpiration = this.getDaysUntilExpiration(
        contractStatus.expiresAt,
      );
      return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
    } catch (error) {
      console.error("Error checking if user can cancel contract:", error);
      return false;
    }
  }

  /**
   * Calculate renewal expiration date (6 months from current expiration)
   */
  private calculateRenewalExpirationDate(
    currentExpirationDate: string,
  ): string {
    const currentExpiration = new Date(currentExpirationDate);
    const newExpiration = new Date(currentExpiration);
    newExpiration.setMonth(newExpiration.getMonth() + 6);
    return newExpiration.toISOString();
  }

  /**
   * Get days until contract expiration
   */
  private getDaysUntilExpiration(expirationDate: string): number {
    const expiration = new Date(expirationDate);
    const now = new Date();
    const diffTime = expiration.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Send contract renewal email notification
   */
  private async sendRenewalEmail(
    emailData: ContractRenewalEmailData,
  ): Promise<void> {
    try {
      const { EmailService } = await import("../communication/emailService");
      const emailService = new EmailService();

      await emailService.sendContractRenewalEmail({
        email: emailData.studentEmail,
        studentName: emailData.studentName,
        previousExpirationDate: emailData.previousExpirationDate,
        newExpirationDate: emailData.newExpirationDate,
        renewalCount: emailData.renewalCount,
        contractId: emailData.contractId,
        platformLink: "https://app.fluencylab.com",
      });

      console.log(
        "Renewal email sent successfully to:",
        emailData.studentEmail,
      );
    } catch (error) {
      console.error("Error sending renewal email:", error);
      // Don't throw error here as email failure shouldn't stop the renewal process
    }
  }
}

export const contractService = new ContractService();
