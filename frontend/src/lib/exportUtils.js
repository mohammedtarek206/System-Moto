import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ==================== PDF Export ====================
export const exportToPDF = ({ title, columns, rows, filename = 'report' }) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm' });
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, doc.internal.pageSize.width / 2, 15, { align: 'center' });
  
  // Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('ar-EG')}`, 14, 22);

  autoTable(doc, {
    startY: 27,
    head: [columns.map(c => c.header)],
    body: rows.map(row => columns.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '-';
      if (c.format) return c.format(val);
      return String(val);
    })),
    headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: 10, right: 10 },
  });

  doc.save(`${filename}-${Date.now()}.pdf`);
};

// ==================== Excel Export ====================
export const exportToExcel = ({ title, columns, rows, filename = 'report' }) => {
  const headers = columns.map(c => c.header);
  const data = rows.map(row =>
    columns.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '';
      if (c.format) return c.format(val);
      return val;
    })
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
  XLSX.writeFile(wb, `${filename}-${Date.now()}.xlsx`);
};

// ==================== CSV Export ====================
export const exportToCSV = ({ columns, rows, filename = 'report' }) => {
  const headers = columns.map(c => `"${c.header}"`).join(',');
  const csvRows = rows.map(row =>
    columns.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '""';
      if (c.format) return `"${c.format(val)}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = [headers, ...csvRows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ==================== Print ====================
export const printTable = ({ title, columns, rows }) => {
  const headers = columns.map(c => `<th style="padding:8px;border:1px solid #ddd;background:#ea580c;color:#fff;text-align:center;">${c.header}</th>`).join('');
  const bodyRows = rows.map((row, i) => {
    const cells = columns.map(c => {
      const val = row[c.key];
      const display = val === null || val === undefined ? '-' : c.format ? c.format(val) : String(val);
      return `<td style="padding:7px;border:1px solid #eee;text-align:center;">${display}</td>`;
    }).join('');
    return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}">${cells}</tr>`;
  }).join('');

  const html = `
    <html dir="rtl">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #ea580c; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h2>${title}</h2>
      <p style="text-align:center;color:#666;font-size:12px;">${new Date().toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' })}</p>
      <table>
        <thead><tr>${headers}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body>
    </html>
  `;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.print(); w.close(); };
};

// ==================== Format helpers ====================
export const formatCurrency = (val, currency = 'جنيه') => 
  `${Number(val || 0).toLocaleString('ar-EG')} ${currency}`;

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const getDateRange = (period) => {
  const now = new Date();
  const from = new Date();
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  switch (period) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      break;
    case 'week':
      from.setDate(now.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      break;
    case 'month':
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      break;
    case 'year':
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
      break;
    default:
      return { from: null, to: null };
  }
  return { 
    from: from.toISOString().slice(0, 10), 
    to: to.toISOString().slice(0, 10) 
  };
};

export const PRODUCT_TYPES = [
  { value: 'spare_parts', labelAr: 'قطع غيار', labelEn: 'Spare Parts' },
  { value: 'oils', labelAr: 'زيوت', labelEn: 'Oils' },
  { value: 'motorcycles', labelAr: 'موتسيكلات', labelEn: 'Motorcycles' },
  { value: 'scooters', labelAr: 'سكوترات', labelEn: 'Scooters' },
  { value: 'batteries', labelAr: 'بطاريات', labelEn: 'Batteries' },
  { value: 'tires', labelAr: 'إطارات', labelEn: 'Tires' },
  { value: 'accessories', labelAr: 'إكسسوارات', labelEn: 'Accessories' },
  { value: 'extras', labelAr: 'كماليات', labelEn: 'Extras' },
  { value: 'other', labelAr: 'أخرى', labelEn: 'Other' },
];

export const EXPENSE_CATEGORIES = [
  { value: 'rent', labelAr: 'إيجار' },
  { value: 'electricity', labelAr: 'كهرباء' },
  { value: 'water', labelAr: 'مياه' },
  { value: 'salaries', labelAr: 'مرتبات' },
  { value: 'maintenance', labelAr: 'صيانة' },
  { value: 'purchase', labelAr: 'شراء بضاعة' },
  { value: 'transport', labelAr: 'نقل' },
  { value: 'taxes', labelAr: 'ضرائب' },
  { value: 'other', labelAr: 'أخرى' },
];
