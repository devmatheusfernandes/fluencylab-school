import jsPDF from "jspdf";
import { Notebook } from "@/types/notebooks/notebooks";

/**
 * Generates and downloads a PDF from a notebook object
 * @param notebook - The notebook object to convert to PDF
 * @returns Promise<boolean> - Returns true if successful, false otherwise
 */
export const generateNotebookPDF = (notebook: Notebook): boolean => {
  try {
    // Create a new jsPDF instance
    const doc = new jsPDF();

    // Set document properties
    doc.setProperties({
      title: notebook.title,
    });

    // Add title
    doc.setFontSize(22);
    doc.text(notebook.title, 10, 20);

    // Add creation date
    doc.setFontSize(12);
    const createdAtText = `Criado em: ${
      notebook.createdAt
        ? new Date(notebook.createdAt).toLocaleDateString("pt-BR")
        : "N/A"
    }`;
    doc.text(createdAtText, 10, 30);

    // Add description if available
    let yPos: number;
    if (notebook.description) {
      doc.setFontSize(14);
      doc.text("Descrição:", 10, 45);
      doc.setFontSize(12);
      const splitDescription = doc.splitTextToSize(notebook.description, 180);
      doc.text(splitDescription, 10, 55);

      // Update y position based on description height
      const descriptionHeight = splitDescription.length * 5;
      yPos = 60 + descriptionHeight;
    } else {
      yPos = 45;
    }

    // Add content
    doc.setFontSize(14);
    doc.text("Conteúdo:", 10, yPos);
    yPos += 10;

    doc.setFontSize(12);
    const content = notebook.content || "Nenhum conteúdo disponível";
    const splitContent = doc.splitTextToSize(content, 180);
    doc.text(splitContent, 10, yPos);

    // Save the PDF
    doc.save(`${notebook.title.replace(/\s+/g, "_")}.pdf`);

    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};

export interface ReceiptPayment {
  id: string;
  amount: number;
  paymentDate: Date | string;
  paymentMethod: string;
  description: string;
  studentName: string;
  studentEmail: string;
  guardianName: string;
  birthDate: string;
  payerDocument?: string;
  receiverDocument?: string;
}

/**
 * Generates and downloads a receipt PDF
 * @param payment - The payment object
 * @returns boolean - Returns true if successful
 */
export const generateReceiptPDF = (payment: ReceiptPayment): boolean => {
  try {
    const doc = new jsPDF();

    // Helper to calculate if minor
    const calculateIsMinor = (birthDateString: string) => {
      if (!birthDateString) return false;
      const birthDate = new Date(birthDateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age < 18;
    };

    const isMinor = calculateIsMinor(payment.birthDate);
    const payerName = !isMinor ? payment.studentName : payment.guardianName;
    const displayPayerDoc = payment.payerDocument || "706.***.811-**";
    const displayReceiverDoc = payment.receiverDocument || "XX.XXX.XXX/0001-XX";

    // Formatter
    const formattedAmount = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(payment.amount / 100);

    const dateObj = new Date(payment.paymentDate);
    const formattedDate = dateObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formattedTime = dateObj.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const fullDateTime = `${formattedDate} às ${formattedTime}`;

    // Header Background
    doc.setFillColor(163, 230, 53); // #a3e635
    doc.rect(0, 0, 210, 40, "F");

    // Title
    doc.setTextColor(20, 83, 45); // #14532d
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Comprovante de transferência", 10, 25);

    // Body Setup
    doc.setTextColor(55, 65, 81); // #374151
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    let y = 60;
    const lineHeight = 8;
    const labelX = 10;
    const valueX = 200; // Align right

    const addRow = (label: string, value: string, boldValue = true) => {
      doc.setFont("helvetica", "normal");
      doc.text(label, labelX, y);

      doc.setFont("helvetica", boldValue ? "bold" : "normal");
      doc.text(value, valueX, y, { align: "right" });
      y += lineHeight;
    };

    const addSectionHeader = (title: string) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39); // #111827
      doc.text(title, labelX, y);
      y += lineHeight + 2;
      doc.setTextColor(55, 65, 81); // Reset color
    };

    const addDivider = () => {
      y += 2;
      doc.setDrawColor(229, 231, 235); // #e5e7eb
      doc.line(labelX, y, valueX, y);
      y += lineHeight + 2;
    };

    // Payer Data
    addSectionHeader("Dados do Pagador");
    addRow("Nome", payerName);
    addRow("CPF/CNPJ", displayPayerDoc);

    addDivider();

    // Receiver Data
    addSectionHeader("Dados do recebedor");
    addRow("Nome", "Fluency Lab School");
    addRow("CPF/CNPJ", displayReceiverDoc);

    addDivider();

    // Description
    addSectionHeader("Descrição");
    addRow("Forma de pagamento", payment.paymentMethod.toUpperCase());
    addRow("Data de vencimento", fullDateTime);
    addRow("Data de pagamento", fullDateTime);
    addRow("ID Transação", payment.id);

    // Disclaimer
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // #4b5563
    const disclaimer =
      "Este documento e cobrança não possuem valor fiscal e são de responsabilidade única e exclusiva de Fluency Lab School";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 190);
    doc.text(splitDisclaimer, 10, y);
    y += splitDisclaimer.length * 5 + 10;

    // Footer / Amount
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39); // #111827
    doc.text("VALOR PAGO", 10, y);

    doc.setTextColor(5, 150, 105); // #059669
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(formattedAmount, 200, y, { align: "right" });

    doc.save(`comprovante-${payment.id}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating Receipt PDF:", error);
    return false;
  }
};

/**
 * Generates and downloads a PDF from multiple notebooks
 * @param notebooks - Array of notebook objects to convert to PDF
 * @param title - Title for the combined PDF document
 * @returns Promise<boolean> - Returns true if successful, false otherwise
 */
export const generateMultipleNotebooksPDF = (
  notebooks: Notebook[],
  title: string = "Cadernos",
): boolean => {
  try {
    if (notebooks.length === 0) {
      throw new Error("No notebooks provided");
    }

    const doc = new jsPDF();

    // Set document properties
    doc.setProperties({
      title: title,
    });

    // Add main title
    doc.setFontSize(24);
    doc.text(title, 10, 20);

    let currentY = 40;

    notebooks.forEach((notebook, index) => {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Add notebook title
      doc.setFontSize(18);
      doc.text(`${index + 1}. ${notebook.title}`, 10, currentY);
      currentY += 10;

      // Add creation date
      doc.setFontSize(10);
      const createdAtText = `Criado em: ${
        notebook.createdAt
          ? new Date(notebook.createdAt).toLocaleDateString("pt-BR")
          : "N/A"
      }`;
      doc.text(createdAtText, 10, currentY);
      currentY += 10;

      // Add description if available
      if (notebook.description) {
        doc.setFontSize(12);
        doc.text("Descrição:", 10, currentY);
        currentY += 5;
        doc.setFontSize(10);
        const splitDescription = doc.splitTextToSize(notebook.description, 180);
        doc.text(splitDescription, 10, currentY);
        currentY += splitDescription.length * 4 + 5;
      }

      // Add content
      doc.setFontSize(12);
      doc.text("Conteúdo:", 10, currentY);
      currentY += 5;
      doc.setFontSize(10);
      const content = notebook.content || "Nenhum conteúdo disponível";
      const splitContent = doc.splitTextToSize(content, 180);
      doc.text(splitContent, 10, currentY);
      currentY += splitContent.length * 4 + 15;
    });

    // Save the PDF
    doc.save(`${title.replace(/\s+/g, "_")}.pdf`);

    return true;
  } catch (error) {
    console.error("Error generating multiple notebooks PDF:", error);
    return false;
  }
};
