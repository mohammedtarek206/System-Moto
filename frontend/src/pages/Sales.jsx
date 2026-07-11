import { useState, useEffect, useRef } from 'react';
import { 
  Search, Eye, XCircle, Download, 
  CreditCard, Banknote, RefreshCw, X, Printer, Package, FileDown, Filter
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ProfessionalInvoice from '../components/ProfessionalInvoice';
import { PRODUCT_TYPES } from '../lib/exportUtils';

export default function Sales() {
  const { t, isRTL, lang } = useLang();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentMethod: '',
    from_date: '',
    to_date: '',
    customer: '',
    cashier: '',
    product_type: '',
    sale_category: '',
    min_price: '',
    max_price: ''
  });

  const invoiceRef = useRef();
  const [paperSize, setPaperSize] = useState(() => localStorage.getItem('receipt_paper_size') || '80mm');
  
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
      const cleanFilters = {};
      Object.keys(filters).forEach(k => {
        if (filters[k] !== '') cleanFilters[k] = filters[k];
      });
      const query = new URLSearchParams(cleanFilters).toString();
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
      [isRTL ? 'الحالة' : 'Status']: s.status,
      [isRTL ? 'نوع المبيعات' : 'Sale Category']: s.saleCategory || '-'
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
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
            className={`btn gap-2 ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter size={18} /> {isRTL ? 'فلترة متقدمة' : 'Advanced Filters'}
          </button>
          <button onClick={handleExportExcel} className="btn btn-secondary gap-2">
            <Download size={18} /> {isRTL ? 'تصدير الإكسل' : 'Export Excel'}
          </button>
        </div>
      </div>

      <div className="card space-y-4">
        {/* Simple Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <option value="credit">{t('credit')}</option>
          </select>
          <input type="date" className="form-input" value={filters.from_date} onChange={e => setFilters({...filters, from_date: e.target.value})} />
          <input type="date" className="form-input" value={filters.to_date} onChange={e => setFilters({...filters, to_date: e.target.value})} />
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--border)]"
            >
              <div className="form-group">
                <label className="form-label text-xs">{isRTL ? 'اسم العميل' : 'Customer Name'}</label>
                <input 
                  type="text" className="form-input" placeholder={isRTL ? 'ابحث باسم العميل...' : 'Customer...'}
                  value={filters.customer} onChange={e => setFilters({...filters, customer: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">{isRTL ? 'اسم الكاشير' : 'Cashier'}</label>
                <input 
                  type="text" className="form-input" placeholder={isRTL ? 'اسم الموظف...' : 'Cashier...'}
                  value={filters.cashier} onChange={e => setFilters({...filters, cashier: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">{isRTL ? 'نوع المنتج بالفاتورة' : 'Product Type'}</label>
                <select className="form-input" value={filters.product_type} onChange={e => setFilters({...filters, product_type: e.target.value})}>
                  <option value="">{isRTL ? 'الكل' : 'All'}</option>
                  {PRODUCT_TYPES.map(pt => (
                    <option key={pt.value} value={pt.value}>{isRTL ? pt.labelAr : pt.labelEn}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label text-xs">{isRTL ? 'تصنيف المبيعات' : 'Sale Category'}</label>
                <select className="form-input" value={filters.sale_category} onChange={e => setFilters({...filters, sale_category: e.target.value})}>
                  <option value="">{isRTL ? 'الكل' : 'All'}</option>
                  <option value="spare_parts">{isRTL ? 'قطع غيار' : 'Spare Parts'}</option>
                  <option value="oils">{isRTL ? 'زيوت' : 'Oils'}</option>
                  <option value="motorcycles">{isRTL ? 'موتسيكلات' : 'Motorcycles'}</option>
                  <option value="scooters">{isRTL ? 'سكوترات' : 'Scooters'}</option>
                  <option value="mixed">{isRTL ? 'متنوعة' : 'Mixed'}</option>
                  <option value="other">{isRTL ? 'أخرى' : 'Other'}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label text-xs">{isRTL ? 'الحد الأدنى للسعر' : 'Min Price'}</label>
                <input 
                  type="number" className="form-input" placeholder="0"
                  value={filters.min_price} onChange={e => setFilters({...filters, min_price: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">{isRTL ? 'الحد الأقصى للسعر' : 'Max Price'}</label>
                <input 
                  type="number" className="form-input" placeholder="100000"
                  value={filters.max_price} onChange={e => setFilters({...filters, max_price: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 flex items-end gap-2 justify-end">
                <button 
                  onClick={() => setFilters({
                    search: '', status: '', paymentMethod: '', from_date: '', to_date: '',
                    customer: '', cashier: '', product_type: '', sale_category: '', min_price: '', max_price: ''
                  })} 
                  className="btn btn-secondary text-xs h-10 px-4 rounded-xl"
                >
                  {isRTL ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                <th>{isRTL ? 'تصنيف المبيعات' : 'Sale Category'}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}><td colSpan="8"><div className="h-10 skeleton my-1" /></td></tr>)
              ) : sales.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-20 text-[var(--text-muted)]">{t('noData')}</td></tr>
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
                    <span className="badge badge-warning text-xs">
                      {sale.saleCategory ? (isRTL ? t(sale.saleCategory) : sale.saleCategory) : '-'}
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
              <div className="p-4 bg-white border-b flex flex-wrap justify-between items-center no-print sticky top-0 z-10 shadow-sm gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => {
                      const printElement = document.getElementById('sales-print-area');
                      if (!printElement) return;

                      const iframe = document.createElement('iframe');
                      iframe.style.position = 'fixed';
                      iframe.style.right = '0';
                      iframe.style.bottom = '0';
                      iframe.style.width = '0';
                      iframe.style.height = '0';
                      iframe.style.border = '0';
                      document.body.appendChild(iframe);

                      const doc = iframe.contentDocument || iframe.contentWindow.document;
                      doc.open();
                      doc.write(`
                        <html>
                          <head>
                            <title>Print Invoice</title>
                            <style>
                              body { margin: 0; padding: 0; background: #fff; }
                            </style>
                          </head>
                          <body onload="setTimeout(function(){ window.print(); window.parent.document.body.removeChild(window.frameElement); }, 500)">
                            ${printElement.innerHTML}
                          </body>
                        </html>
                      `);
                      doc.close();
                    }}
                    className="btn bg-slate-900 text-white gap-2 h-10 px-4 rounded-xl hover:bg-black font-bold"
                  >
                    <Printer size={18} /> {isRTL ? 'طباعة الفاتورة' : 'Print Receipt'}
                  </button>
                  <button onClick={handleDownloadPDF} className="btn btn-secondary gap-2 h-10 px-4 rounded-xl font-bold">
                    <FileDown size={18} /> {isRTL ? 'تحميل PDF' : 'Download PDF'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">{isRTL ? 'عرض ريسيت الطابعة:' : 'Receipt Width:'}</span>
                  <select
                    className="h-10 py-1 px-3 text-xs font-bold bg-slate-100 border border-slate-200 rounded-xl text-slate-800 outline-none cursor-pointer focus:border-slate-500"
                    value={paperSize}
                    onChange={(e) => {
                      setPaperSize(e.target.value);
                      localStorage.setItem('receipt_paper_size', e.target.value);
                    }}
                  >
                    <option value="80mm">80 مم (POS Printer)</option>
                    <option value="58mm">58 مم (Mini Printer)</option>
                  </select>
                </div>

                <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 bg-slate-900 overflow-y-auto max-h-[75vh] flex justify-center items-start">
                <div id="sales-print-area">
                  <ProfessionalInvoice ref={invoiceRef} sale={selectedSale} receiptWidth={paperSize} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
