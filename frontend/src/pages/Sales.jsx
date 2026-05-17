import { useState, useEffect, useRef } from 'react';
import { 
  Search, Eye, XCircle, Download, 
  CreditCard, Banknote, RefreshCw, X, Printer, Package, FileDown
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import OfficialInvoice from '../components/OfficialInvoice';

export default function Sales() {
  const { t, isRTL, lang } = useLang();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentMethod: '',
    from_date: '',
    to_date: ''
  });

  const invoiceRef = useRef();
  
  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
  });

  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${selectedSale.invoiceNumber}.pdf`);
  };

  useEffect(() => {
    fetchSales();
  }, [filters]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await api.get(`/sales?${query}`);
      setSales(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      toast.error(isRTL ? 'فشل تحميل المبيعات' : 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = sales.map(s => ({
      [isRTL ? 'رقم الفاتورة' : 'Invoice No']: s.invoiceNumber,
      [isRTL ? 'التاريخ' : 'Date']: new Date(s.createdAt).toLocaleString(),
      [isRTL ? 'العميل' : 'Customer']: s.customer?.name || (isRTL ? 'عميل نقدي' : 'Cash'),
      [isRTL ? 'طريقة الدفع' : 'Payment']: s.paymentMethod,
      [isRTL ? 'الإجمالي' : 'Total']: s.totalAmount,
      [isRTL ? 'الحالة' : 'Status']: s.status
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, "Moto_Sales_Report.xlsx");
  };

  const formatCurrency = (val) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency', currency: 'EGP'
  }).format(val || 0);

  return (
    <div className="space-y-6 fade-in">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('sales')}</h1>
          <p className="page-subtitle">{isRTL ? 'سجل المبيعات والفواتير' : 'Sales history and invoices'}</p>
        </div>
        <button onClick={handleExportExcel} className="btn btn-secondary gap-2">
          <Download size={18} /> {isRTL ? 'تصدير الإكسل' : 'Export Excel'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)]">
        <div className="relative search-input md:col-span-1">
          <Search className="search-icon" size={16} />
          <input 
            type="text" className="form-input" placeholder={isRTL ? 'رقم الفاتورة أو الباركود...' : 'Invoice No. or Barcode...'}
            value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}
          />
        </div>
        <select className="form-input" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">{isRTL ? 'كل الحالات' : 'All Status'}</option>
          <option value="completed">{t('completed')}</option>
          <option value="cancelled">{t('cancelled')}</option>
        </select>
        <select className="form-input" value={filters.paymentMethod} onChange={e => setFilters({...filters, paymentMethod: e.target.value})}>
          <option value="">{isRTL ? 'كل طرق الدفع' : 'All Payments'}</option>
          <option value="cash">{t('cash')}</option>
          <option value="card">{t('card')}</option>
        </select>
        <input type="date" className="form-input" value={filters.from_date} onChange={e => setFilters({...filters, from_date: e.target.value})} />
        <input type="date" className="form-input" value={filters.to_date} onChange={e => setFilters({...filters, to_date: e.target.value})} />
      </div>

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('invoiceNo')}</th>
                <th>{t('date')}</th>
                <th>{t('customer')}</th>
                <th>{t('paymentMethod')}</th>
                <th>{t('total')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}><td colSpan="7"><div className="h-10 skeleton my-1" /></td></tr>)
              ) : sales.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-20 text-[var(--text-muted)]">{t('noData')}</td></tr>
              ) : sales.map(sale => (
                <tr key={sale._id}>
                  <td className="font-mono text-xs font-bold text-orange-500">{sale.invoiceNumber}</td>
                  <td className="text-xs opacity-70">{new Date(sale.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</td>
                  <td className="font-semibold">{sale.customer?.name || (isRTL ? 'عميل نقدي' : 'Cash Customer')}</td>
                  <td>
                    <div className="flex items-center gap-2 text-xs">
                      {sale.paymentMethod === 'cash' ? <Banknote size={14} className="text-green-500" /> : <CreditCard size={14} className="text-blue-500" />}
                      {t(sale.paymentMethod)}
                    </div>
                  </td>
                  <td className="font-black">{formatCurrency(sale.totalAmount)}</td>
                  <td>
                    <span className={`badge ${sale.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                      {t(sale.status)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedSale(sale)} className="p-2 hover:bg-[var(--bg-card2)] rounded-lg text-blue-500 transition-colors"><Eye size={18} /></button>
                      {sale.status !== 'cancelled' && (
                        <button onClick={() => {
                          if (window.confirm(isRTL ? 'إلغاء الفاتورة؟' : 'Cancel?')) {
                             api.put(`/sales/${sale._id}/cancel`).then(() => fetchSales());
                          }
                        }} className="p-2 hover:bg-[var(--bg-card2)] rounded-lg text-red-400 transition-colors"><XCircle size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedSale && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ y: 50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 50, opacity: 0 }} 
              className="modal-box max-w-4xl p-0 overflow-hidden shadow-2xl bg-[#f8fafc]"
            >
              <div className="p-4 bg-white border-b flex justify-between items-center no-print sticky top-0 z-10 shadow-sm">
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="btn bg-slate-900 text-white gap-2 h-10 px-4 rounded-xl hover:bg-black">
                    <Printer size={18} /> {isRTL ? 'طباعة' : 'Print'}
                  </button>
                  <button onClick={handleDownloadPDF} className="btn btn-secondary gap-2 h-10 px-4 rounded-xl">
                    <FileDown size={18} /> {isRTL ? 'تحميل PDF' : 'Download PDF'}
                  </button>
                </div>
                <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 md:p-8 bg-slate-200/30 overflow-y-auto max-h-[80vh]">
                <div className="bg-white shadow-xl mx-auto max-w-[210mm] min-h-[297mm]">
                  <OfficialInvoice ref={invoiceRef} sale={selectedSale} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
