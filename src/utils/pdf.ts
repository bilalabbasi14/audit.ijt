import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

type SectionData = {
  title: string;
  headers: string[];
  rows: any[][];
};

type SummaryData = {
  title: string;
  rows: [string, string][];
};

type ReportData = {
  title: string;
  organizationName: string;
  dateRange: string;
  sections: SectionData[];
  summaries: SummaryData[];
};

export function generatePDF({ title, organizationName, dateRange, sections, summaries }: ReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let currentY = 55;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text(organizationName, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(title, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Range: ${dateRange}`, pageWidth / 2, 38, { align: 'center' });
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, 44, { align: 'center' });

  // Render Sections (Tables)
  sections.forEach((section) => {
    // Section Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(section.title.toUpperCase(), 14, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [section.headers],
      body: section.rows,
      theme: 'striped',
      headStyles: { fillColor: [63, 81, 181], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Check if we need a new page
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
  });

  // Render Summaries
  summaries.forEach((summary) => {
    // Line separator if not at top
    if (currentY > 20) {
      doc.setDrawColor(200, 200, 200);
      doc.line(14, currentY - 5, pageWidth - 14, currentY - 5);
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(summary.title.toUpperCase(), 14, currentY);
    currentY += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    summary.rows.forEach((row) => {
      doc.text(row[0].toString(), 14, currentY);
      doc.text(row[1].toString(), pageWidth - 14, currentY, { align: 'right' });
      currentY += 7;

      if (currentY > 280) {
        doc.addPage();
        currentY = 20;
      }
    });

    currentY += 10;
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}
