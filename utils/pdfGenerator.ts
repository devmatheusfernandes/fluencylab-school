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

/**
 * Generates and downloads a PDF from multiple notebooks
 * @param notebooks - Array of notebook objects to convert to PDF
 * @param title - Title for the combined PDF document
 * @returns Promise<boolean> - Returns true if successful, false otherwise
 */
export const generateMultipleNotebooksPDF = (
  notebooks: Notebook[],
  title: string = "Cadernos"
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