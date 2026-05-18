import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Phone, User, Trash2, Edit, X, RefreshCw, 
  ShoppingBag, Printer, Eye, Calendar, DollarSign, Archive, 
  FileText, PlusCircle, AlertCircle, CheckCircle, Percent, ShieldAlert
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Purchases() {
  const { t, isRTL } = useLang();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        api.get(`/purchases?search=${search}`),
        api.get('/contacts/suppliers'),
        api.get('/products')
      ]);
      setPurchases(purchasesRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
      setProducts(productsRes.data.data || []);
    } catch (err) {
      toast.error(isRTL ? 'فشل تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const totalPurchasesAmount = purchases.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPaidAmount = purchases.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalUnpaidAmount = totalPurchasesAmount - totalPaidAmount;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{isRTL ? 'المشتريات والموردين' : 'Purchases & Suppliers'}</h1>
          <p className="page-subtitle">{isRTL ? 'تسجيل فواتير الشراء، إدارة حسابات الموردين، وزيادة المخزون تلقائياً' : 'Log purchase invoices, manage supplier accounts, and auto-increment stock'}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn btn-primary gap-2 h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} /> {isRTL ? 'تسجيل فاتورة شراء جديدة' : 'Record Purchase Invoice'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card border-t-4 border-t-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[var(--text-muted)] text-sm font-bold">{isRTL ? 'إجمالي فواتير الشراء' : 'Total Purchases'}</div>
              <div className="text-2xl font-black mt-2 text-blue-500">{totalPurchasesAmount.toFixed(2)} EGP</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>
        <div className="stat-card border-t-4 border-t-green-500">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[var(--text-muted)] text-sm font-bold">{isRTL ? 'المبالغ المدفوعة' : 'Total Paid'}</div>
              <div className="text-2xl font-black mt-2 text-green-500">{totalPaidAmount.toFixed(2)} EGP</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
        <div className="stat-card border-t-4 border-t-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[var(--text-muted)] text-sm font-bold">{isRTL ? 'المديونيات المتبقية للموردين' : 'Total Pending Balance'}</div>
              <div className="text-2xl font-black mt-2 text-amber-500">{totalUnpaidAmount.toFixed(2)} EGP</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="relative form-icon-group max-w-md">
        <Search className="input-icon" size={18} />
        <input 
          type="text" className="form-input h-12" placeholder={isRTL ? 'بحث برقم الفاتورة...' : 'Search by invoice number...'}
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Purchases List */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>{isRTL ? 'رقم الفاتورة' : 'Invoice No.'}</th>
              <th>{isRTL ? 'المورد' : 'Supplier'}</th>
              <th>{isRTL ? 'عدد المواد' : 'Items'}</th>
              <th>{isRTL ? 'المجموع الإجمالي' : 'Total Amount'}</th>
              <th>{isRTL ? 'المدفوع' : 'Paid'}</th>
              <th>{isRTL ? 'الحالة' : 'Status'}</th>
              <th>{isRTL ? 'التاريخ' : 'Date'}</th>
              <th>{isRTL ? 'العمليات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan="8"><div className="h-10 skeleton rounded-lg my-1" /></td></tr>
              ))
            ) : purchases.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-10 opacity-30">{t('noData')}</td></tr>
            ) : purchases.map(p => (
              <tr key={p._id}>
                <td className="font-bold text-blue-500">{p.invoiceNumber}</td>
                <td>
                  <div className="font-bold">{p.supplier?.name || '---'}</div>
                  <div className="text-xs text-[var(--text-muted)] font-mono">{p.supplier?.phone || '---'}</div>
                </td>
                <td className="font-bold">{p.items?.length || 0}</td>
                <td className="font-black text-orange-500">{p.totalAmount.toFixed(2)} EGP</td>
                <td className="font-bold text-green-500">{p.paidAmount.toFixed(2)} EGP</td>
                <td>
                  <span className={`badge ${
                    p.paymentStatus === 'paid' ? 'badge-success' :
                    p.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {p.paymentStatus === 'paid' ? (isRTL ? 'مدفوعة' : 'Paid') :
                     p.paymentStatus === 'partial' ? (isRTL ? 'دفع جزئي' : 'Partial') : (isRTL ? 'غير مدفوعة' : 'Unpaid')}
                  </span>
                </td>
                <td className="text-xs opacity-75">{new Date(p.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</td>
                <td>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedPurchase(p)} 
                      className="btn btn-secondary btn-sm h-9 w-9 p-0 rounded-xl flex items-center justify-center text-blue-400 border-[var(--border)] bg-[var(--bg-card2)] hover:border-blue-500/40"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handlePrint(p)} 
                      className="btn btn-secondary btn-sm h-9 w-9 p-0 rounded-xl flex items-center justify-center text-purple-400 border-[var(--border)] bg-[var(--bg-card2)] hover:border-purple-500/40"
                    >
                      <Printer size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Detail Modal */}
      <AnimatePresence>
        {selectedPurchase && (
          <ViewPurchaseModal 
            purchase={selectedPurchase} 
            onClose={() => setSelectedPurchase(null)} 
          />
        )}
      </AnimatePresence>

      {/* Add Purchase Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddPurchaseModal 
            suppliers={suppliers} 
            products={products}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Print Handler
function handlePrint(purchase) {
  const printWindow = window.open('', '_blank');
  const isRTL = true; // default system is RTL Arabic
  
  printWindow.document.write(`
    <html>
      <head>
        <title>فاتورة شراء #${purchase.invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          body {
            font-family: 'Cairo', sans-serif;
            direction: ${isRTL ? 'rtl' : 'ltr'};
            padding: 30px;
            color: #333;
            background: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title { font-size: 24px; font-weight: 800; color: #3b82f6; }
          .meta-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .meta-box {
            background: #f8fafc;
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
          }
          .meta-title { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 800; margin-bottom: 6px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .table th {
            background: #3b82f6;
            color: white;
            padding: 10px;
            text-align: right;
            font-size: 13px;
          }
          .table td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          .totals {
            margin-inline-start: auto;
            width: 300px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 14px;
          }
          .grand-total {
            font-size: 18px;
            font-weight: 800;
            color: #ef4444;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
            margin-top: 6px;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            font-size: 12px;
            color: #64748b;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">فاتورة شراء وتوريد مخزن</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">معرض موتسيكلات على بركة الله</div>
          </div>
          <div style="text-align: left;">
            <div style="font-weight: bold; font-size: 16px;">رقم الفاتورة: #${purchase.invoiceNumber}</div>
            <div style="font-size: 12px; color: #64748b;">التاريخ: ${new Date(purchase.createdAt).toLocaleDateString('ar-EG')}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-box">
            <div class="meta-title">بيانات المورد</div>
            <div class="meta-row"><strong>الاسم:</strong> <span>${purchase.supplier?.name || '---'}</span></div>
            <div class="meta-row"><strong>الهاتف:</strong> <span>${purchase.supplier?.phone || '---'}</span></div>
            <div class="meta-row"><strong>العنوان:</strong> <span>${purchase.supplier?.address || '---'}</span></div>
          </div>
          <div class="meta-box">
            <div class="meta-title">حالة الدفع والتسجيل</div>
            <div class="meta-row"><strong>حالة الدفع:</strong> <span>${
              purchase.paymentStatus === 'paid' ? 'مدفوعة بالكامل' :
              purchase.paymentStatus === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة (آجل)'
            }</span></div>
            <div class="meta-row"><strong>المسؤول عن الإدخال:</strong> <span>${purchase.user?.name || 'المدير'}</span></div>
            <div class="meta-row"><strong>ملاحظات:</strong> <span>${purchase.notes || '---'}</span></div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>اسم الصنف</th>
              <th>الرمز / الكود</th>
              <th>الكمية</th>
              <th>سعر الشراء</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${purchase.items.map(item => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td><code style="font-size: 11px;">${item.sku || '---'}</code></td>
                <td>${item.quantity}</td>
                <td>${item.buyPrice.toFixed(2)} EGP</td>
                <td><strong>${item.total.toFixed(2)} EGP</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>المجموع الفرعي:</span> <strong>${purchase.subtotal.toFixed(2)} EGP</strong></div>
          <div class="total-row"><span>الخصم:</span> <strong>${purchase.discount.toFixed(2)} EGP</strong></div>
          <div class="total-row"><span>الضريبة:</span> <strong>${purchase.tax.toFixed(2)} EGP</strong></div>
          <div class="total-row grand-total"><span>الإجمالي النهائي:</span> <strong>${purchase.totalAmount.toFixed(2)} EGP</strong></div>
          <div class="total-row" style="color: #22c55e;"><span>المدفوع نقداً:</span> <strong>${purchase.paidAmount.toFixed(2)} EGP</strong></div>
          <div class="total-row" style="color: #ef4444;"><span>المتبقي للمورد:</span> <strong>${(purchase.totalAmount - purchase.paidAmount).toFixed(2)} EGP</strong></div>
        </div>

        <div class="footer">
          نظام إدارة الكاشير والمبيعات - قطع غيار موتسيكلات على بركة الله
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// 1. VIEW PURCHASE DETAIL MODAL
function ViewPurchaseModal({ purchase, onClose }) {
  const { isRTL } = useLang();
  return (
    <div className="modal-overlay">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-box max-w-3xl rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
        <div className="modal-header border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <FileText className="text-blue-500" />
              {isRTL ? `تفاصيل فاتورة الشراء #${purchase.invoiceNumber}` : `Purchase Details #${purchase.invoiceNumber}`}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {isRTL ? `تاريخ التسجيل: ${new Date(purchase.createdAt).toLocaleString('ar-EG')}` : `Date: ${new Date(purchase.createdAt).toLocaleString()}`}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm h-10 w-10 rounded-full"><X size={20} /></button>
        </div>

        <div className="modal-body p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-card2)] border border-[var(--border)] space-y-2">
              <h3 className="text-xs font-black text-blue-500 uppercase">{isRTL ? 'بيانات المورد' : 'Supplier Details'}</h3>
              <div className="font-bold text-white text-base">{purchase.supplier?.name}</div>
              <div className="text-xs text-[var(--text-muted)] font-mono">{purchase.supplier?.phone}</div>
              <div className="text-xs text-[var(--text-muted)]">{purchase.supplier?.address || '---'}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-card2)] border border-[var(--border)] space-y-2">
              <h3 className="text-xs font-black text-purple-400 uppercase">{isRTL ? 'معلومات الدفع' : 'Payment Status'}</h3>
              <div className="flex justify-between text-sm">
                <span>{isRTL ? 'حالة الدفع:' : 'Status:'}</span>
                <span className={`badge ${
                  purchase.paymentStatus === 'paid' ? 'badge-success' :
                  purchase.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger'
                }`}>
                  {purchase.paymentStatus === 'paid' ? (isRTL ? 'مدفوعة' : 'Paid') :
                   purchase.paymentStatus === 'partial' ? (isRTL ? 'دفع جزئي' : 'Partial') : (isRTL ? 'غير مدفوعة' : 'Unpaid')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{isRTL ? 'المسجل:' : 'Recorded By:'}</span>
                <span className="font-bold text-white">{purchase.user?.name || 'Admin'}</span>
              </div>
              {purchase.notes && (
                <div className="text-xs text-[var(--text-muted)] border-t border-[var(--border)] pt-2 mt-2">
                  <strong>{isRTL ? 'ملاحظات: ' : 'Notes: '}</strong>{purchase.notes}
                </div>
              )}
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr className="bg-[var(--bg-card2)]">
                  <th>{isRTL ? 'اسم الصنف' : 'Item Name'}</th>
                  <th>{isRTL ? 'الرمز / الكود' : 'SKU / Barcode'}</th>
                  <th>{isRTL ? 'سعر الشراء' : 'Buy Price'}</th>
                  <th>{isRTL ? 'سعر البيع' : 'Sell Price'}</th>
                  <th className="text-center">{isRTL ? 'الكمية' : 'Qty'}</th>
                  <th>{isRTL ? 'الإجمالي' : 'Total'}</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="font-bold text-white">{item.name}</td>
                    <td>
                      <code className="text-[10px] text-[var(--text-muted)] font-mono">{item.sku || item.barcode || '---'}</code>
                    </td>
                    <td className="font-bold text-blue-400">{item.buyPrice.toFixed(2)} EGP</td>
                    <td className="font-bold text-green-400">{item.sellPrice.toFixed(2)} EGP</td>
                    <td className="font-black text-center text-white">{item.quantity}</td>
                    <td className="font-black text-orange-500">{item.total.toFixed(2)} EGP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Box */}
          <div className="flex justify-end">
            <div className="w-80 rounded-2xl bg-[var(--bg-card2)] border border-[var(--border)] p-4 space-y-2">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>{isRTL ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span className="font-bold">{purchase.subtotal.toFixed(2)} EGP</span>
              </div>
              {purchase.discount > 0 && (
                <div className="flex justify-between text-xs text-red-400">
                  <span>{isRTL ? 'الخصم:' : 'Discount:'}</span>
                  <span className="font-bold">-{purchase.discount.toFixed(2)} EGP</span>
                </div>
              )}
              {purchase.tax > 0 && (
                <div className="flex justify-between text-xs text-blue-400">
                  <span>{isRTL ? 'الضريبة:' : 'Tax:'}</span>
                  <span className="font-bold">+{purchase.tax.toFixed(2)} EGP</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-white border-t border-[var(--border)] pt-2">
                <span>{isRTL ? 'الإجمالي النهائي:' : 'Grand Total:'}</span>
                <span className="text-orange-500">{purchase.totalAmount.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-sm text-green-400 border-t border-[var(--border)]/50 pt-2">
                <span>{isRTL ? 'المدفوع:' : 'Paid:'}</span>
                <span className="font-bold">{purchase.paidAmount.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-sm text-amber-500">
                <span>{isRTL ? 'المتبقي للمورد (آجل):' : 'Pending:'}</span>
                <span className="font-bold">{(purchase.totalAmount - purchase.paidAmount).toFixed(2)} EGP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer border-t border-[var(--border)] p-4 flex justify-between bg-black/10">
          <button 
            onClick={() => handlePrint(purchase)} 
            className="btn btn-secondary rounded-2xl gap-2 font-bold text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30"
          >
            <Printer size={18} />
            {isRTL ? 'طباعة الفاتورة' : 'Print Invoice'}
          </button>
          <button onClick={onClose} className="btn btn-secondary px-6 rounded-2xl font-bold">{isRTL ? 'إغلاق' : 'Close'}</button>
        </div>
      </motion.div>
    </div>
  );
}

// 2. ADD NEW PURCHASE RECEIPT MODAL
function AddPurchaseModal({ suppliers, products, onClose, onSuccess }) {
  const { isRTL } = useLang();
  const [loading, setLoading] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`PUR-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  // Cart / Items inside receipt
  const [items, setItems] = useState([
    { name: '', sku: '', barcode: '', buyPrice: 0, sellPrice: 0, quantity: 1, isNewProduct: false }
  ]);

  // Handle selected product search fill
  const handleProductSelect = (index, productObj) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      product: productObj._id,
      name: productObj.nameAr || productObj.name,
      sku: productObj.sku || '',
      barcode: productObj.barcode || '',
      buyPrice: productObj.buyPrice || 0,
      sellPrice: productObj.sellPrice || 0,
      isNewProduct: false
    };
    setItems(updated);
    toast.success(isRTL ? `تم إدراج: ${productObj.nameAr || productObj.name} (آخر تكلفة: ${productObj.buyPrice} EGP)` : `Filled: ${productObj.name}`);
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', sku: '', barcode: '', buyPrice: 0, sellPrice: 0, quantity: 1, isNewProduct: false }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemField = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Calculations
  const subtotal = items.reduce((acc, curr) => acc + (Number(curr.buyPrice || 0) * Number(curr.quantity || 0)), 0);
  const totalAmount = subtotal - Number(discount) + Number(tax);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error(isRTL ? 'الرجاء اختيار المورد' : 'Please select a supplier');
      return;
    }
    
    // Check item validation
    for (const item of items) {
      if (!item.name) {
        toast.error(isRTL ? 'الرجاء كتابة اسم الصنف لجميع المواد' : 'Item names cannot be empty');
        return;
      }
      if (Number(item.buyPrice) <= 0 || Number(item.quantity) <= 0) {
        toast.error(isRTL ? 'يجب أن يكون سعر الشراء والكمية أكبر من صفر' : 'Quantity and Buy Price must be positive');
        return;
      }
    }

    setLoading(true);
    try {
      await api.post('/purchases', {
        supplierId,
        invoiceNumber,
        items,
        discount,
        tax,
        paidAmount,
        notes
      });
      toast.success(isRTL ? 'تم تسجيل فاتورة الشراء وتحديث المخزون بنجاح' : 'Purchase registered successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }} 
        className="modal-box max-w-5xl rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden shadow-2xl"
      >
        {/* Modal Header */}
        <div className="modal-header border-b border-[var(--border)] p-6 flex justify-between items-center bg-[var(--bg-card2)]/30">
          <h2 className="text-2xl font-black text-white flex items-center gap-2 italic">
            <PlusCircle className="text-blue-500 animate-pulse" />
            {isRTL ? 'تسجيل فاتورة شراء وتوريد جديدة' : 'Record New Purchase Invoice'}
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm h-10 w-10 rounded-full hover:bg-white/5"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Header invoice meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-3xl bg-[var(--bg-card2)] border border-[var(--border)]">
            <div className="form-group">
              <label className="form-label text-xs font-bold mb-2 block text-[var(--text-muted)]">{isRTL ? 'اختر المورد' : 'Select Supplier'}</label>
              <select 
                className="form-input h-12 text-sm font-bold" required value={supplierId} 
                onChange={e => setSupplierId(e.target.value)}
              >
                <option value="">{isRTL ? '-- اختر المورد --' : '-- Select Supplier --'}</option>
                {suppliers.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.phone})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label text-xs font-bold mb-2 block text-[var(--text-muted)]">{isRTL ? 'رقم الفاتورة (فاتورة المورد)' : 'Supplier Invoice Number'}</label>
              <input 
                type="text" className="form-input h-12 font-bold text-blue-500 uppercase text-sm" required 
                value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label text-xs font-bold mb-2 block text-[var(--text-muted)]">{isRTL ? 'ملاحظات وتفاصيل إضافية' : 'Notes'}</label>
              <input 
                type="text" className="form-input h-12 text-sm" placeholder={isRTL ? 'أي ملاحظات إضافية...' : 'Any notes...'} 
                value={notes} onChange={e => setNotes(e.target.value)} 
              />
            </div>
          </div>

          {/* Cart Items Title */}
          <div className="flex justify-between items-center pt-2">
            <h3 className="font-black text-lg text-white">{isRTL ? 'أصناف الفاتورة' : 'Invoice Items'}</h3>
            <button 
              type="button" onClick={handleAddItem} 
              className="btn btn-secondary btn-sm h-10 rounded-xl gap-2 font-bold text-blue-500 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30"
            >
              <Plus size={16} />
              {isRTL ? 'إضافة صنف جديد' : 'Add Item'}
            </button>
          </div>

          {/* Spacious Responsive HTML Table for Items */}
          <div className="overflow-x-auto rounded-3xl border border-[var(--border)] bg-[var(--bg-card2)] shadow-inner">
            <table className="w-full text-right border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-black/25 text-[var(--text-secondary)] font-bold text-xs border-b border-[var(--border)]">
                  <th className="p-3 text-start w-[28%] font-black">{isRTL ? 'اسم الصنف / المنتج' : 'Item Name'}</th>
                  <th className="p-3 text-start w-[16%] font-black">{isRTL ? 'كود SKU' : 'SKU'}</th>
                  <th className="p-3 text-start w-[16%] font-black">{isRTL ? 'الباركود Barcode' : 'Barcode'}</th>
                  <th className="p-3 text-start w-[12%] font-black">{isRTL ? 'سعر الشراء' : 'Buy Price'}</th>
                  <th className="p-3 text-start w-[12%] font-black">{isRTL ? 'سعر البيع' : 'Sell Price'}</th>
                  <th className="p-3 text-center w-[10%] font-black">{isRTL ? 'الكمية' : 'Qty'}</th>
                  <th className="p-3 w-[6%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/55">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors duration-150">
                    <td className="p-2 align-middle">
                      <div className="relative flex gap-2">
                        <input 
                          type="text" className="form-input h-11 text-xs w-full font-bold" required 
                          placeholder={isRTL ? 'أدخل اسم الصنف' : 'Enter item name'}
                          value={item.name} 
                          onChange={e => updateItemField(index, 'name', e.target.value)}
                        />
                        {/* Autocomplete list */}
                        {item.name.length > 1 && !item.product && (
                          <div className="absolute z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl mt-12 p-2 max-h-40 overflow-y-auto w-64 shadow-2xl space-y-1">
                            <div className="text-[10px] font-bold text-orange-500 p-1 border-b border-[var(--border)]">{isRTL ? 'هل هو منتج مسجل مسبقاً؟' : 'Select existing product?'}</div>
                            {products
                              .filter(p => (p.nameAr || p.name || '').toLowerCase().includes(item.name.toLowerCase()))
                              .slice(0, 4)
                              .map(p => (
                                <button
                                  key={p._id} type="button"
                                  onClick={() => handleProductSelect(index, p)}
                                  className="w-full text-right p-2 rounded-lg hover:bg-white/5 text-xs text-white truncate font-bold"
                                >
                                  {p.nameAr || p.name}
                                </button>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 align-middle">
                      <input 
                        type="text" className="form-input h-11 text-xs font-mono" 
                        placeholder={isRTL ? 'اختياري' : 'Optional'}
                        value={item.sku} onChange={e => updateItemField(index, 'sku', e.target.value)}
                      />
                    </td>
                    <td className="p-2 align-middle">
                      <input 
                        type="text" className="form-input h-11 text-xs font-mono" 
                        placeholder={isRTL ? 'اختياري' : 'Optional'}
                        value={item.barcode} onChange={e => updateItemField(index, 'barcode', e.target.value)}
                      />
                    </td>
                    <td className="p-2 align-middle">
                      <input 
                        type="number" step="any" className="form-input h-11 text-xs font-black text-blue-400" required
                        value={item.buyPrice} onChange={e => updateItemField(index, 'buyPrice', Number(e.target.value))}
                      />
                    </td>
                    <td className="p-2 align-middle">
                      <input 
                        type="number" step="any" className="form-input h-11 text-xs font-black text-green-400" required
                        value={item.sellPrice} onChange={e => updateItemField(index, 'sellPrice', Number(e.target.value))}
                      />
                    </td>
                    <td className="p-2 align-middle">
                      <input 
                        type="number" className="form-input h-11 text-xs font-black text-center text-white" required min="1"
                        value={item.quantity} onChange={e => updateItemField(index, 'quantity', Number(e.target.value))}
                      />
                    </td>
                    <td className="p-2 text-center align-middle">
                      <button 
                        type="button" onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className="btn btn-secondary h-10 w-10 p-0 rounded-xl text-red-500 hover:bg-red-500/10 border-none disabled:opacity-30 flex items-center justify-center mx-auto"
                        title={isRTL ? 'حذف السطر' : 'Remove Line'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Calculations & Summary Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border)]">
            {/* Left: inputs */}
            <div className="space-y-4 p-5 rounded-3xl bg-[var(--bg-card2)] border border-[var(--border)]">
              <h4 className="font-bold text-white text-sm pb-2 border-b border-[var(--border)]/35">{isRTL ? 'تفاصيل المبالغ والخصم' : 'Financing & Adjustments'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-xs mb-1 block">{isRTL ? 'قيمة الخصم' : 'Discount'}</label>
                  <div className="form-icon-group">
                    <Percent className="input-icon" size={14} />
                    <input 
                      type="number" className="form-input h-11 text-sm font-bold text-red-400" 
                      value={discount} onChange={e => setDiscount(Number(e.target.value))} 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label text-xs mb-1 block">{isRTL ? 'قيمة الضريبة' : 'Tax'}</label>
                  <input 
                    type="number" className="form-input h-11 text-sm font-bold" 
                    value={tax} onChange={e => setTax(Number(e.target.value))} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label text-xs text-green-400 font-bold mb-1 block">{isRTL ? 'المبلغ المدفوع نقداً (من درج الكاشير)' : 'Amount Paid Cash'}</label>
                <div className="form-icon-group">
                  <DollarSign className="input-icon text-green-400" size={16} />
                  <input 
                    type="number" className="form-input h-12 font-black text-green-500 text-lg" required
                    value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} 
                  />
                </div>
              </div>
            </div>

            {/* Right: summary box */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card2)] border border-[var(--border)] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm text-[var(--text-muted)]">
                  <span className="font-bold">{isRTL ? 'إجمالي التكلفة الفرعي:' : 'Subtotal Cost:'}</span>
                  <span className="font-black text-white">{subtotal.toFixed(2)} EGP</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm text-red-400">
                    <span className="font-bold">{isRTL ? 'الخصم المباشر:' : 'Discount Total:'}</span>
                    <span className="font-black">-{discount.toFixed(2)} EGP</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between items-center text-sm text-blue-400">
                    <span className="font-bold">{isRTL ? 'الضرائب المضافة:' : 'Taxes Added:'}</span>
                    <span className="font-black">+{tax.toFixed(2)} EGP</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-black text-white border-t border-[var(--border)]/50 pt-3">
                  <span>{isRTL ? 'الإجمالي المطلوب للفوترة:' : 'Grand Total Cost:'}</span>
                  <span className="text-orange-500 text-xl font-mono font-black">{totalAmount.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between items-center text-sm text-amber-500 border-t border-[var(--border)]/30 pt-3">
                  <span className="font-bold">{isRTL ? 'المتبقي للمورد (آجل ودين):' : 'Supplier Balance (Credit):'}</span>
                  <span className="font-black text-base font-mono font-black">{(totalAmount - paidAmount).toFixed(2)} EGP</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{isRTL ? 'تنبيه: سيتم زيادة كميات هذه المنتجات في المخزن تلقائياً وتعديل آخر سعر شراء فور الحفظ.' : 'Notice: Inventory quantities will auto-increment and update prices instantly upon saving.'}</span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border-t border-[var(--border)] pt-4 flex justify-end gap-3 bg-[var(--bg-card)]">
            <button type="button" onClick={onClose} className="btn btn-secondary h-12 px-6 rounded-2xl font-bold">{isRTL ? 'إلغاء' : 'Cancel'}</button>
            <button 
              type="submit" disabled={loading} 
              className="btn btn-primary h-12 px-8 rounded-2xl font-black shadow-lg shadow-blue-500/20 min-w-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            >
              {loading ? <RefreshCw className="loading-spin" size={20} /> : (isRTL ? 'حفظ الفاتورة وتوريد المخزن' : 'SAVE & INBOUND')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
