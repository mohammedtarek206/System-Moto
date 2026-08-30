import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Trash2, X, RefreshCw,
  ShoppingBag, Printer, Eye, DollarSign,
  FileText, PlusCircle, AlertCircle, CheckCircle, Percent, ShieldAlert,
  Package, TrendingDown, Calendar, Filter, XCircle, Building2,
  ChevronDown, ClipboardList, Banknote, CreditCard, Clock, BarChart3
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Purchases() {
  const { isRTL } = useLang();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Filtered purchases
  const filteredPurchases = purchases.filter(p => {
    if (filterStatus && p.paymentStatus !== filterStatus) return false;
    if (filterSupplier && p.supplier?._id !== filterSupplier) return false;
    if (dateFrom && new Date(p.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(p.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterSupplier('');
    setDateFrom('');
    setDateTo('');
  };

  // Stats
  const totalPurchasesAmount = purchases.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPaidAmount = purchases.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalUnpaidAmount = totalPurchasesAmount - totalPaidAmount;
  const todayPurchases = purchases.filter(p => {
    const today = new Date();
    const d = new Date(p.createdAt);
    return d.toDateString() === today.toDateString();
  }).reduce((acc, curr) => acc + curr.totalAmount, 0);
  const monthPurchases = purchases.filter(p => {
    const now = new Date();
    const d = new Date(p.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((acc, curr) => acc + curr.totalAmount, 0);

  const statsCards = [
    { label: 'إجمالي فواتير الشراء', value: purchases.length, sub: 'فاتورة مسجلة', icon: ClipboardList, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'إجمالي المشتريات', value: `${totalPurchasesAmount.toFixed(0)} ج`, sub: 'القيمة الكلية', icon: ShoppingBag, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'مشتريات اليوم', value: `${todayPurchases.toFixed(0)} ج`, sub: 'مشتريات اليوم', icon: Calendar, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
    { label: 'مشتريات الشهر', value: `${monthPurchases.toFixed(0)} ج`, sub: 'الشهر الحالي', icon: BarChart3, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'إجمالي المدفوع', value: `${totalPaidAmount.toFixed(0)} ج`, sub: 'مُسدَّد للموردين', icon: CheckCircle, color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
    { label: 'المتبقي للموردين', value: `${totalUnpaidAmount.toFixed(0)} ج`, sub: 'ديون مستحقة', icon: AlertCircle, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  ];

  const getStatusBadge = (status) => {
    if (status === 'paid') return <span className="badge badge-success">مدفوعة</span>;
    if (status === 'partial') return <span className="badge badge-warning">جزئي</span>;
    return <span className="badge badge-danger">آجل</span>;
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              المشتريات
            </span>
          </h1>
          <p className="page-subtitle mt-1">إدارة فواتير المشتريات والموردين وحركة المخزون</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary gap-2 px-5"
            style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}
          >
            <Plus size={18} />
            تسجيل فاتورة شراء جديدة
          </button>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary gap-2"
          >
            <Printer size={16} />
            طباعة
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="stat-card" style={{ borderTopColor: card.color, borderTopWidth: 3 }}>
              <div className="flex items-start justify-between mb-3">
                <div
                  className="stat-icon"
                  style={{ background: card.bg, color: card.color }}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div className="text-xl font-black" style={{ color: card.color }}>{card.value}</div>
              <div className="form-label mt-1 mb-0 text-xs">{card.label}</div>
              <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Filters Section */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)', right: 14, left: 'auto' }} />
              <input
                type="text"
                className="form-input"
                placeholder="بحث برقم الفاتورة..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingRight: 42 }}
              />
            </div>
            {/* Status Filter */}
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 150 }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">كل الحالات</option>
              <option value="paid">مدفوعة</option>
              <option value="partial">دفع جزئي</option>
              <option value="unpaid">غير مدفوعة</option>
            </select>
            {/* Supplier Filter */}
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 180 }}
              value={filterSupplier}
              onChange={e => setFilterSupplier(e.target.value)}
            >
              <option value="">كل الموردين</option>
              {suppliers.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="form-label mb-0 whitespace-nowrap">من تاريخ:</label>
              <input type="date" className="form-input" style={{ width: 'auto' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <label className="form-label mb-0 whitespace-nowrap">إلى تاريخ:</label>
              <input type="date" className="form-input" style={{ width: 'auto' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            {(search || filterStatus || filterSupplier || dateFrom || dateTo) && (
              <button onClick={resetFilters} className="btn btn-ghost gap-1 text-sm" style={{ color: 'var(--danger)' }}>
                <XCircle size={16} />
                مسح الفلاتر
              </button>
            )}
            <span className="text-muted text-sm me-auto">
              {filteredPurchases.length} فاتورة
            </span>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>المورد</th>
              <th>التاريخ</th>
              <th>المنتجات</th>
              <th>الإجمالي</th>
              <th>المدفوع</th>
              <th>المتبقي</th>
              <th>الحالة</th>
              <th>المستخدم</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan="10">
                    <div className="skeleton" style={{ height: 36, borderRadius: 8, margin: '4px 0' }} />
                  </td>
                </tr>
              ))
            ) : filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan="10">
                  <div className="empty-state">
                    <div className="icon"><ShoppingBag size={48} /></div>
                    <p>لا توجد فواتير مشتريات</p>
                    <p style={{ fontSize: 13, marginTop: 8, color: 'var(--text-muted)' }}>
                      {search || filterStatus || filterSupplier ? 'جرب تغيير الفلاتر' : 'ابدأ بتسجيل فاتورة شراء جديدة'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredPurchases.map(p => (
              <tr key={p._id}>
                <td>
                  <span className="font-bold" style={{ color: 'var(--primary)' }}>#{p.invoiceNumber}</span>
                </td>
                <td>
                  <div className="font-bold">{p.supplier?.name || '---'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.supplier?.phone || '---'}</div>
                </td>
                <td style={{ fontSize: 13 }}>
                  {new Date(p.createdAt).toLocaleDateString('ar-EG')}
                </td>
                <td>
                  <span className="font-bold">{p.items?.length || 0} صنف</span>
                </td>
                <td>
                  <span className="font-black" style={{ color: '#F97316' }}>{p.totalAmount.toFixed(2)} ج</span>
                </td>
                <td>
                  <span className="font-bold" style={{ color: 'var(--success)' }}>{p.paidAmount.toFixed(2)} ج</span>
                </td>
                <td>
                  <span className="font-bold" style={{ color: (p.totalAmount - p.paidAmount) > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {(p.totalAmount - p.paidAmount).toFixed(2)} ج
                  </span>
                </td>
                <td>{getStatusBadge(p.paymentStatus)}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.user?.name || 'المدير'}</td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedPurchase(p)}
                      className="btn btn-secondary btn-sm"
                      style={{ width: 36, height: 36, padding: 0, borderRadius: 10, color: 'var(--primary)' }}
                      title="عرض التفاصيل"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handlePrint(p)}
                      className="btn btn-secondary btn-sm"
                      style={{ width: 36, height: 36, padding: 0, borderRadius: 10, color: '#8B5CF6' }}
                      title="طباعة"
                    >
                      <Printer size={15} />
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
  printWindow.document.write(`
    <html>
      <head>
        <title>فاتورة شراء #${purchase.invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 30px; color: #333; background: #fff; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: 800; color: #3b82f6; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .meta-box { background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; }
          .meta-title { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 800; margin-bottom: 6px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { background: #3b82f6; color: white; padding: 10px; text-align: right; font-size: 13px; }
          .table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .totals { margin-inline-start: auto; width: 300px; background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
          .grand-total { font-size: 18px; font-weight: 800; color: #ef4444; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #64748b; }
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
            <div class="meta-title">حالة الدفع</div>
            <div class="meta-row"><strong>الحالة:</strong> <span>${purchase.paymentStatus === 'paid' ? 'مدفوعة بالكامل' :
      purchase.paymentStatus === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة (آجل)'
    }</span></div>
            <div class="meta-row"><strong>المسجل:</strong> <span>${purchase.user?.name || 'المدير'}</span></div>
            <div class="meta-row"><strong>ملاحظات:</strong> <span>${purchase.notes || '---'}</span></div>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr><th>اسم الصنف</th><th>الكود</th><th>الكمية</th><th>سعر الشراء</th><th>الإجمالي</th></tr>
          </thead>
          <tbody>
            ${purchase.items.map(item => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td><code style="font-size: 11px;">${item.sku || '---'}</code></td>
                <td>${item.quantity}</td>
                <td>${item.buyPrice.toFixed(2)} ج</td>
                <td><strong>${item.total.toFixed(2)} ج</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>المجموع الفرعي:</span> <strong>${purchase.subtotal.toFixed(2)} ج</strong></div>
          <div class="total-row"><span>الخصم:</span> <strong>${purchase.discount.toFixed(2)} ج</strong></div>
          <div class="total-row"><span>الضريبة:</span> <strong>${purchase.tax.toFixed(2)} ج</strong></div>
          <div class="total-row grand-total"><span>الإجمالي النهائي:</span> <strong>${purchase.totalAmount.toFixed(2)} ج</strong></div>
          <div class="total-row" style="color: #22c55e;"><span>المدفوع:</span> <strong>${purchase.paidAmount.toFixed(2)} ج</strong></div>
          <div class="total-row" style="color: #ef4444;"><span>المتبقي للمورد:</span> <strong>${(purchase.totalAmount - purchase.paidAmount).toFixed(2)} ج</strong></div>
        </div>
        <div class="footer">نظام إدارة الكاشير والمبيعات - معرض على بركة الله للموتسيكلات</div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// 1. VIEW PURCHASE DETAIL MODAL
function ViewPurchaseModal({ purchase, onClose }) {
  return (
    <div className="modal-overlay">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="modal-box"
        style={{ maxWidth: 820 }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="flex items-center gap-3">
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', width: 40, height: 40, borderRadius: 10 }}>
                <FileText size={20} />
              </div>
              <div>
                <h2 className="font-black" style={{ fontSize: 18, color: 'var(--text-primary)' }}>
                  تفاصيل فاتورة الشراء #{purchase.invoiceNumber}
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(purchase.createdAt).toLocaleString('ar-EG')}
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 36, height: 36, padding: 0, borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-5">
          {/* Status & Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier */}
            <div className="glass-card p-4" style={{ borderRadius: 14 }}>
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={15} style={{ color: 'var(--primary)' }} />
                <h3 className="font-black text-xs uppercase" style={{ color: 'var(--primary)', letterSpacing: 1 }}>بيانات المورد</h3>
              </div>
              <div className="font-bold" style={{ fontSize: 16, color: 'var(--text-primary)' }}>{purchase.supplier?.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{purchase.supplier?.phone}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{purchase.supplier?.address || '---'}</div>
            </div>

            {/* Payment */}
            <div className="glass-card p-4" style={{ borderRadius: 14 }}>
              <div className="flex items-center gap-2 mb-3">
                <Banknote size={15} style={{ color: '#8B5CF6' }} />
                <h3 className="font-black text-xs uppercase" style={{ color: '#8B5CF6', letterSpacing: 1 }}>معلومات الدفع</h3>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>حالة الدفع:</span>
                <span className={`badge ${purchase.paymentStatus === 'paid' ? 'badge-success' :
                    purchase.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger'
                  }`}>
                  {purchase.paymentStatus === 'paid' ? 'مدفوعة' :
                    purchase.paymentStatus === 'partial' ? 'دفع جزئي' : 'غير مدفوعة'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>المسجل:</span>
                <span className="font-bold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{purchase.user?.name || 'Admin'}</span>
              </div>
              {purchase.notes && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
                  <strong>ملاحظات: </strong>{purchase.notes}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم الصنف</th>
                  <th>الكود</th>
                  <th>سعر الشراء</th>
                  <th>سعر البيع</th>
                  <th className="text-center">الكمية</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items?.map((item, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td className="font-bold">{item.name}</td>
                    <td>
                      <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sku || item.barcode || '---'}</code>
                    </td>
                    <td className="font-bold" style={{ color: 'var(--primary)' }}>{item.buyPrice.toFixed(2)} ج</td>
                    <td className="font-bold" style={{ color: 'var(--success)' }}>{item.sellPrice.toFixed(2)} ج</td>
                    <td className="font-black text-center">{item.quantity}</td>
                    <td className="font-black" style={{ color: '#F97316' }}>{item.total.toFixed(2)} ج</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="glass-card p-4" style={{ borderRadius: 14, minWidth: 300 }}>
              <div className="space-y-2">
                <div className="flex justify-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">{purchase.subtotal.toFixed(2)} ج</span>
                </div>
                {purchase.discount > 0 && (
                  <div className="flex justify-between" style={{ fontSize: 13, color: 'var(--danger)' }}>
                    <span>الخصم:</span>
                    <span className="font-bold">-{purchase.discount.toFixed(2)} ج</span>
                  </div>
                )}
                {purchase.tax > 0 && (
                  <div className="flex justify-between" style={{ fontSize: 13, color: 'var(--primary)' }}>
                    <span>الضريبة:</span>
                    <span className="font-bold">+{purchase.tax.toFixed(2)} ج</span>
                  </div>
                )}
                <div className="flex justify-between font-black" style={{ fontSize: 16, borderTop: '1px solid var(--border)', paddingTop: 10, color: '#F97316' }}>
                  <span style={{ color: 'var(--text-primary)' }}>الإجمالي النهائي:</span>
                  <span>{purchase.totalAmount.toFixed(2)} ج</span>
                </div>
                <div className="flex justify-between font-bold" style={{ fontSize: 14, color: 'var(--success)' }}>
                  <span>المدفوع:</span>
                  <span>{purchase.paidAmount.toFixed(2)} ج</span>
                </div>
                <div className="flex justify-between font-bold" style={{ fontSize: 14, color: 'var(--warning)' }}>
                  <span>المتبقي للمورد:</span>
                  <span>{(purchase.totalAmount - purchase.paidAmount).toFixed(2)} ج</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={() => handlePrint(purchase)} className="btn btn-secondary gap-2" style={{ color: '#8B5CF6' }}>
            <Printer size={16} />
            طباعة الفاتورة
          </button>
          <button onClick={onClose} className="btn btn-secondary px-6">إغلاق</button>
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

  const [items, setItems] = useState([
    { name: '', sku: '', barcode: '', buyPrice: 0, sellPrice: 0, quantity: 1, isNewProduct: false }
  ]);

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
    toast.success(`تم إدراج: ${productObj.nameAr || productObj.name}`);
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

  const subtotal = items.reduce((acc, curr) => acc + (Number(curr.buyPrice || 0) * Number(curr.quantity || 0)), 0);
  const totalAmount = subtotal - Number(discount) + Number(tax);
  const remaining = totalAmount - Number(paidAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error('الرجاء اختيار المورد');
      return;
    }
    for (const item of items) {
      if (!item.name) {
        toast.error('الرجاء كتابة اسم الصنف لجميع المواد');
        return;
      }
      if (Number(item.buyPrice) <= 0 || Number(item.quantity) <= 0) {
        toast.error('يجب أن يكون سعر الشراء والكمية أكبر من صفر');
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
      toast.success('تم تسجيل فاتورة الشراء وتحديث المخزون بنجاح');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطأ في حفظ الفاتورة');
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
        className="modal-box"
        style={{ maxWidth: 960 }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="stat-icon" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', width: 44, height: 44, borderRadius: 12 }}>
              <PlusCircle size={22} />
            </div>
            <div>
              <h2 className="font-black" style={{ fontSize: 20, color: 'var(--text-primary)' }}>
                تسجيل فاتورة شراء وتوريد جديدة
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                سيتم تحديث المخزون تلقائيًا بعد الحفظ
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 36, height: 36, padding: 0, borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-6" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
          {/* Invoice Meta */}
          <div className="glass-card p-5" style={{ borderRadius: 16 }}>
            <h3 className="font-black mb-4 flex items-center gap-2" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
              <FileText size={16} style={{ color: 'var(--primary)' }} />
              بيانات الفاتورة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">المورد <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select
                  className="form-input"
                  required
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                >
                  <option value="">-- اختر المورد --</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.phone})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">رقم الفاتورة <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="text"
                  className="form-input font-bold uppercase"
                  required
                  style={{ color: 'var(--primary)' }}
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ملاحظات</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="أي ملاحظات إضافية..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-black flex items-center gap-2" style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                <Package size={16} style={{ color: 'var(--primary)' }} />
                المنتجات ({items.length} صنف)
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-secondary btn-sm gap-2"
                style={{ color: 'var(--primary)', borderColor: 'rgba(37,99,235,0.3)', background: 'rgba(37,99,235,0.05)' }}
              >
                <Plus size={14} />
                إضافة صنف
              </button>
            </div>

            <div className="table-wrapper" style={{ borderRadius: 14 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-table-header)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', width: '28%' }}>اسم الصنف / المنتج</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', width: '14%' }}>كود SKU</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', width: '14%' }}>الباركود</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', width: '12%' }}>سعر الشراء</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', width: '12%' }}>سعر البيع</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', width: '10%' }}>الكمية</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', width: '8%' }}>الإجمالي</th>
                      <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const rowTotal = (Number(item.buyPrice || 0) * Number(item.quantity || 0)).toFixed(2);
                      return (
                        <tr key={index} style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-table-row)' }}>
                          <td style={{ padding: '8px 12px', verticalAlign: 'middle', position: 'relative' }}>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                className="form-input"
                                style={{ height: 38, fontSize: 13 }}
                                placeholder="أدخل اسم الصنف"
                                required
                                value={item.name}
                                onChange={e => updateItemField(index, 'name', e.target.value)}
                              />
                              {item.name.length > 1 && !item.product && (
                                <div style={{
                                  position: 'absolute', zIndex: 50, top: '100%', right: 0, left: 0,
                                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                                  borderRadius: 12, boxShadow: 'var(--shadow-modal)',
                                  maxHeight: 160, overflowY: 'auto', marginTop: 4
                                }}>
                                  <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: 'var(--warning)', borderBottom: '1px solid var(--border)' }}>
                                    منتج مسجل مسبقًا؟
                                  </div>
                                  {products
                                    .filter(p => (p.nameAr || p.name || '').toLowerCase().includes(item.name.toLowerCase()))
                                    .slice(0, 5)
                                    .map(p => (
                                      <button
                                        key={p._id}
                                        type="button"
                                        onClick={() => handleProductSelect(index, p)}
                                        style={{
                                          display: 'block', width: '100%', textAlign: 'right',
                                          padding: '8px 12px', fontSize: 12, fontWeight: 600,
                                          background: 'transparent', border: 'none', cursor: 'pointer',
                                          color: 'var(--text-primary)', transition: 'background 0.15s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-table-hover)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                      >
                                        {p.nameAr || p.name}
                                        <span style={{ color: 'var(--text-muted)', fontSize: 11, marginRight: 8 }}>
                                          (الكمية: {p.quantity} | آخر سعر: {p.buyPrice} ج)
                                        </span>
                                      </button>
                                    ))
                                  }
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                            <input type="text" className="form-input" style={{ height: 38, fontSize: 12, fontFamily: 'monospace' }} placeholder="اختياري" value={item.sku} onChange={e => updateItemField(index, 'sku', e.target.value)} />
                          </td>
                          <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                            <input type="text" className="form-input" style={{ height: 38, fontSize: 12, fontFamily: 'monospace' }} placeholder="اختياري" value={item.barcode} onChange={e => updateItemField(index, 'barcode', e.target.value)} />
                          </td>
                          <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                            <input type="number" step="any" className="form-input font-bold" style={{ height: 38, fontSize: 12, color: 'var(--primary)' }} required value={item.buyPrice} onChange={e => updateItemField(index, 'buyPrice', Number(e.target.value))} />
                          </td>
                          <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                            <input type="number" step="any" className="form-input font-bold" style={{ height: 38, fontSize: 12, color: 'var(--success)' }} required value={item.sellPrice} onChange={e => updateItemField(index, 'sellPrice', Number(e.target.value))} />
                          </td>
                          <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                            <input type="number" className="form-input font-black text-center" style={{ height: 38, fontSize: 13 }} required min="1" value={item.quantity} onChange={e => updateItemField(index, 'quantity', Number(e.target.value))} />
                          </td>
                          <td style={{ padding: '8px 12px', verticalAlign: 'middle', fontWeight: 700, color: '#F97316', fontSize: 13 }}>
                            {rowTotal} ج
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              disabled={items.length === 1}
                              className="btn btn-ghost"
                              style={{ width: 34, height: 34, padding: 0, borderRadius: 8, color: 'var(--danger)', opacity: items.length === 1 ? 0.3 : 1 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Payment Details */}
            <div className="glass-card p-5" style={{ borderRadius: 16 }}>
              <h4 className="font-black mb-4 flex items-center gap-2" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                <CreditCard size={15} style={{ color: '#8B5CF6' }} />
                بيانات الدفع
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">قيمة الخصم</label>
                  <div className="form-icon-group">
                    <Percent size={14} className="input-icon" />
                    <input type="number" className="form-input" style={{ color: 'var(--danger)' }} value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">قيمة الضريبة</label>
                  <input type="number" className="form-input" value={tax} onChange={e => setTax(Number(e.target.value))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--success)' }}>المبلغ المدفوع نقدًا <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div className="form-icon-group">
                  <DollarSign size={16} className="input-icon" style={{ color: 'var(--success)' }} />
                  <input type="number" className="form-input font-black" style={{ fontSize: 16, color: 'var(--success)' }} required value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Summary Box */}
            <div className="glass-card p-5" style={{ borderRadius: 16 }}>
              <h4 className="font-black mb-4 flex items-center gap-2" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                <BarChart3 size={15} style={{ color: 'var(--primary)' }} />
                ملخص الفاتورة
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>عدد الأصناف:</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{items.length} صنف</span>
                </div>
                <div className="flex justify-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>إجمالي الكميات:</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{items.reduce((a, c) => a + Number(c.quantity || 0), 0)}</span>
                </div>
                <div className="flex justify-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{subtotal.toFixed(2)} ج</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between" style={{ fontSize: 13, color: 'var(--danger)' }}>
                    <span>الخصم:</span>
                    <span className="font-bold">-{Number(discount).toFixed(2)} ج</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between" style={{ fontSize: 13, color: 'var(--primary)' }}>
                    <span>الضريبة:</span>
                    <span className="font-bold">+{Number(tax).toFixed(2)} ج</span>
                  </div>
                )}
                <div className="flex justify-between font-black" style={{ fontSize: 18, borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 6 }}>
                  <span style={{ color: 'var(--text-primary)' }}>الإجمالي:</span>
                  <span style={{ color: '#F97316' }}>{totalAmount.toFixed(2)} ج</span>
                </div>
                <div className="flex justify-between font-bold" style={{ fontSize: 14, color: 'var(--success)' }}>
                  <span>المدفوع:</span>
                  <span>{Number(paidAmount).toFixed(2)} ج</span>
                </div>
                {remaining > 0 && (
                  <div className="flex justify-between font-bold" style={{ fontSize: 14, color: 'var(--warning)' }}>
                    <span>المتبقي للمورد:</span>
                    <span>{remaining.toFixed(2)} ج</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 mt-4 p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
                <ShieldAlert size={14} style={{ color: 'var(--warning)', marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>
                  سيتم تحديث كميات المنتجات في المخزون تلقائيًا فور الحفظ.
                </span>
              </div>
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary px-6">إلغاء</button>
          <button
            type="submit"
            form="purchase-form-stub"
            disabled={loading}
            onClick={handleSubmit}
            className="btn btn-primary px-8"
            style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)', minWidth: 180 }}
          >
            {loading ? <RefreshCw className="loading-spin" size={18} /> : 'حفظ الفاتورة وتوريد المخزن'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
