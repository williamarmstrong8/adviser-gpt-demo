import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export interface ExportItem {
  id: string;
  title: string;
  answer: string;
  question: string;
  fileName: string;
  lastEdited: string;
  lastEditor: string;
  tags: string[];
  strategy: string;
  type: string;
}

export const exportToPDF = async (
  items: ExportItem[],
  title: string,
  filename: string
): Promise<void> => {
  const pdf = new jsPDF();
  const pageHeight = pdf.internal.pageSize.height;
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin, yPosition);
  yPosition += 15;

  // Export info
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Exported on: ${new Date().toLocaleDateString()}`, margin, yPosition);
  pdf.text(`Total items: ${items.length}`, pageWidth - margin - 50, yPosition);
  yPosition += 20;

  items.forEach((item, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    // Question title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const questionLines = pdf.splitTextToSize(item.title, pageWidth - 2 * margin);
    pdf.text(questionLines, margin, yPosition);
    yPosition += questionLines.length * 7;

    // File name (only for search results)
    if (title.includes('Search Results')) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`File: ${item.fileName}`, margin, yPosition);
      yPosition += 10;
    }

    // Answer
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const answerLines = pdf.splitTextToSize(item.answer, pageWidth - 2 * margin);
    pdf.text(answerLines, margin, yPosition);
    yPosition += answerLines.length * 5 + 5;

    // Tags
    if (item.tags.length > 0) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Tags: ${item.tags.join(', ')}`, margin, yPosition);
      yPosition += 10;
    }

    // Last edited info
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Last edited: ${item.lastEdited} by ${item.lastEditor}`, margin, yPosition);
    yPosition += 15;

    // Separator line
    if (index < items.length - 1) {
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }
  });

  pdf.save(filename);
};

export const exportToCSV = (
  items: ExportItem[],
  filename: string
): void => {
  const data = items.map(item => ({
    'Question Title': item.title,
    'Answer': item.answer,
    'Question Details': item.question,
    'File Name': item.fileName,
    'Last Edited': item.lastEdited,
    'Last Editor': item.lastEditor,
    'Tags': item.tags.join('; '),
    'Strategy': item.strategy,
    'Type': item.type
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions');
  XLSX.writeFile(wb, filename);
};

export const exportToDocx = async (
  items: ExportItem[],
  title: string,
  filename: string
): Promise<void> => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Exported on: ${new Date().toLocaleDateString()}`,
              size: 20,
            }),
            new TextRun({
              text: ` | Total items: ${items.length}`,
              size: 20,
            }),
          ],
        }),
        new Paragraph({ text: "" }), // Empty line
        ...items.flatMap((item, index) => [
          new Paragraph({
            text: item.title,
            heading: HeadingLevel.HEADING_2,
          }),
          ...(title.includes('Search Results') ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `File: ${item.fileName}`,
                  italics: true,
                  size: 20,
                }),
              ],
            })
          ] : []),
          new Paragraph({
            text: item.answer,
          }),
          ...(item.tags.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Tags: ${item.tags.join(', ')}`,
                  italics: true,
                  size: 20,
                }),
              ],
            })
          ] : []),
          new Paragraph({
            children: [
              new TextRun({
                text: `Last edited: ${item.lastEdited} by ${item.lastEditor}`,
                size: 18,
              }),
            ],
          }),
          new Paragraph({ text: "" }), // Empty line between items
        ]),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const getExportFilename = (type: 'pdf' | 'csv' | 'docx', context: string): string => {
  const date = new Date().toISOString().split('T')[0];
  const sanitizedContext = context.replace(/[^a-zA-Z0-9]/g, '_');
  return `${sanitizedContext}_${date}.${type}`;
};