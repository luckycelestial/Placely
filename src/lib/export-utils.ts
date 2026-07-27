import * as XLSX from "xlsx";

export function exportToExcel(data: any[], filename: string, sheetName: string = "Sheet1") {
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    
    // 1. Calculate dynamic column widths (auto-fit)
    const colWidths = headers.map(key => {
      let maxLen = key.length;
      data.forEach(row => {
        const val = row[key];
        if (val !== undefined && val !== null) {
          const str = String(val);
          if (str.length > maxLen) {
            maxLen = str.length;
          }
        }
      });
      return { wch: Math.max(maxLen + 4, 12) }; // Add padding, min width 12
    });
    worksheet['!cols'] = colWidths;

    // 2. Enable Autofilters for headers
    const totalRows = data.length + 1; // +1 for header row
    const lastColLetter = getColLetter(headers.length);
    worksheet['!autofilter'] = { ref: `A1:${lastColLetter}${totalRows}` };

    // 3. Format special cells (CGPA, Solved count, Ranks, Hires)
    headers.forEach((header, colIndex) => {
      const colLetter = getColLetter(colIndex + 1);
      const headerLower = header.toLowerCase();
      
      for (let r = 2; r <= totalRows; r++) {
        const cellRef = `${colLetter}${r}`;
        const cell = worksheet[cellRef];
        if (!cell) continue;

        if (headerLower.includes("cgpa") || headerLower.includes("gpa")) {
          const val = Number(cell.v);
          if (!isNaN(val)) {
            cell.v = val;
            cell.t = 'n';
            cell.z = '0.00'; // Decimal format
          }
        } else if (headerLower.includes("solved") || headerLower.includes("count") || headerLower.includes("rank") || headerLower.includes("hires")) {
          const val = Number(cell.v);
          if (!isNaN(val)) {
            cell.v = val;
            cell.t = 'n';
            cell.z = '#,##0'; // Integer format
          }
        }
      }
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

// Helper to map column index (1-based) to Excel letter notation
function getColLetter(colIndex: number): string {
  let letter = "";
  while (colIndex > 0) {
    let temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    colIndex = Math.floor((colIndex - temp) / 26);
  }
  return letter;
}

export async function exportToPDF(title: string, headers: string[], rows: any[][], filename: string) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Header Background
  doc.setFillColor(33, 33, 33);
  doc.rect(0, 0, pageWidth, 35, "F");

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 22);

  // Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 22, { align: "right" });

  // Draw Table
  autoTable(doc, {
    startY: 45,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [33, 33, 33], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("CareerBridge Placement Portal", 14, pageHeight - 10);
  doc.text(`Page ${doc.internal.pages.length - 1}`, pageWidth - 14, pageHeight - 10, { align: "right" });

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
