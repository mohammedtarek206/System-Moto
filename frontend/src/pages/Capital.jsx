import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Edit, Trash2, X,
  BarChart3, FileText, Download, Printer, RefreshCw, Bell, AlertTriangle,
  Users, Package, Wallet, ArrowUpRight, ArrowDownRight,
  Activity, Target, Award, Calendar, Filter, Info,
  Building2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  exportToPDF, exportToExcel, exportToCSV, printTable,
  formatCurrency, getDateRange, EXPENSE_CATEGORIES
} from '../lib/exportUtils';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN = () => localStorage.getItem('moto_token');
const H = () => ({ headers: { Authorization: `Bearer ${TOKEN()}` } });

const C = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a855f7'];

const TYPE_AR = {
  motorcycles: 'موتسيكلات', scooters: 'سكوترات', oils: 'زيوت', spare_parts: 'قطع غيار',
  batteries: 'بطاريات', tires: 'إطارات', accessories: 'إكسسوارات', extras: 'كماليات', other: 'أخرى'
};

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
  { id: 'inventory', label: 'المخزون', icon: Package },
  { id: 'cashflow', label: 'التدفق النقدي', icon: Activity },
  { id: 'analytics', label: 'التحليلات', icon: Target },
  { id: 'expenses', label: 'المصروفات', icon: TrendingDown },
];

function fmt(v) { return Number(v || 0).toLocaleString('ar-EG'); }
function fmtC(v) { return `${fmt(v)} ج`; }

function StatCard({ label, value, icon: Icon, gradient, sub, change, badge }) {
  const pos = change === undefined ? null : change >= 0;
  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }} className="relative overflow-hidden rounded-2xl p-4 border border-white/10"
      style={{ background: gradient || 'linear-gradient(135deg,#1e293b,#0f172a)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon size={18} className="text-white" />
        </div>
        {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">{badge}</span>}
        {pos !== null && (
          <span className={`flex items-center gap-1 text-xs font-bold ${pos ? 'text-emerald-300' : 'text-red-300'}`}>
            {pos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-white/60 text-xs font-semibold mb-1">{label}</div>
      <div className="text-white text-lg font-black leading-tight">{value}</div>
      {sub && <div className="text-white/50 text-xs mt-1">{sub}</div>}
    </motion.div>
  );
}

function AlertBanner({ alerts }) {
  if (!alerts?.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
          className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold
            ${a.level === 'danger' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
          <AlertTriangle size={16} className="shrink-0" />
          {a.msg}
        </motion.div>
      ))}
    </div>
  );
}

function SectionCard({ title, icon: Icon, color = '#f59e0b', children, actions }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <h3 className="font-black text-white text-sm">{title}</h3>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ExpenseForm({ expense, onSave, onClose }) {
  const [form, setForm] = useState({
    category: expense?.category || 'rent',
    amount: expense?.amount || '',
    description: expense?.description || '',
    date: expense?.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    responsible: expense?.responsible || '',
    notes: expense?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const url = expense ? `${API}/capital/${expense._id}` : `${API}/capital`;
      const method = expense ? 'put' : 'post';
      await axios[method](url, form, H());
      toast.success(expense ? 'تم التحديث ✅' : 'تم إضافة المصروف ✅');
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'حدث خطأ'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="card w-full max-w-lg" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <TrendingDown className="text-red-400" size={22} />
            {expense ? 'تعديل مصروف' : 'إضافة مصروف جديد'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)]"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">الفئة *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field" required>
                {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.labelAr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">القيمة *</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className="input-field" min="0" step="0.01" required placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">التاريخ</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">المسؤول</label>
              <input value={form.responsible} onChange={e => set('responsible', e.target.value)} className="input-field" placeholder="اسم المسؤول" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">الوصف</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} className="input-field" placeholder="وصف المصروف" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">ملاحظات</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field h-16 resize-none" placeholder="ملاحظات إضافية" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">إلغاء</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'جاري...' : expense ? 'تحديث' : 'إضافة'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Capital() {
  const [summary, setSummary] = useState(null);
  const [full, setFull] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);

  const applyPeriod = p => {
    setPeriod(p);
    if (p !== 'custom') {
      const { from, to } = getDateRange(p);
      setFromDate(from || ''); setToDate(to || '');
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);
      const [sumRes, expRes, fullRes] = await Promise.all([
        axios.get(`${API}/capital/summary?${params}`, H()),
        axios.get(`${API}/capital?${params}&limit=500`, H()),
        axios.get(`${API}/capital2/full-summary?${params}`, H()),
      ]);
      setSummary(sumRes.data?.data);
      setExpenses(expRes.data?.data || []);
      setFull(fullRes.data?.data);
    } catch { toast.error('فشل التحميل'); }
    finally { setLoading(false); }
  }, [fromDate, toDate, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 30000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, fetchData]);

  const handleDelete = async id => {
    try {
      await axios.delete(`${API}/capital/${id}`, H());
      toast.success('تم الحذف'); setDeleteConfirm(null); fetchData();
    } catch { toast.error('فشل الحذف'); }
  };

  const cfCols = [
    { key: 'dateStr', header: 'التاريخ' },
    { key: 'typeAr', header: 'نوع الحركة' },
    { key: 'description', header: 'الوصف' },
    { key: 'income', header: 'إيراد', format: v => fmtC(v) },
    { key: 'expense', header: 'مصروف', format: v => fmtC(v) },
    { key: 'balance', header: 'الرصيد', format: v => fmtC(v) },
    { key: 'user', header: 'المستخدم' },
  ];
  const cfRows = (full?.cashFlow || []).map(r => ({
    ...r, dateStr: new Date(r.date).toLocaleDateString('ar-EG')
  }));

  const expCols = [
    { key: 'categoryAr', header: 'الفئة' },
    { key: 'amount', header: 'القيمة', format: v => fmtC(v) },
    { key: 'description', header: 'الوصف' },
    { key: 'responsible', header: 'المسؤول' },
    { key: 'date', header: 'التاريخ', format: v => new Date(v).toLocaleDateString('ar-EG') },
  ];

  const d = full;

  return (
    <div className="space-y-5" dir="rtl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <DollarSign className="text-yellow-500" size={28} /> دورة رأس المال
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">لوحة تحكم مالية شاملة — مستوى ERP</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { setAutoRefresh(v => !v); }}
            className={`btn-secondary flex items-center gap-1 text-sm ${autoRefresh ? 'bg-green-500/20 border-green-500/50 text-green-400' : ''}`}>
            <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} /> {autoRefresh ? 'تحديث تلقائي' : 'تحديث يدوي'}
          </button>
          <button onClick={() => exportToPDF({ title: 'تقرير رأس المال - التدفق النقدي', columns: cfCols, rows: cfRows, filename: 'cashflow' })}
            className="btn-secondary flex items-center gap-1 text-sm"><FileText size={14} /> PDF</button>
          <button onClick={() => exportToExcel({ title: 'رأس المال', columns: cfCols, rows: cfRows, filename: 'capital' })}
            className="btn-secondary flex items-center gap-1 text-sm"><Download size={14} /> Excel</button>
          <button onClick={() => exportToCSV({ columns: cfCols, rows: cfRows, filename: 'capital' })}
            className="btn-secondary flex items-center gap-1 text-sm"><Download size={14} /> CSV</button>
          <button onClick={() => printTable({ title: 'تقرير رأس المال', columns: cfCols, rows: cfRows })}
            className="btn-secondary flex items-center gap-1 text-sm"><Printer size={14} /> طباعة</button>
          <button onClick={() => { setEditExpense(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> إضافة مصروف
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {d?.alerts?.length > 0 && (
        <SectionCard title={`تنبيهات (${d.alerts.length})`} icon={Bell} color="#ef4444">
          <AlertBanner alerts={d.alerts} />
        </SectionCard>
      )}

      {/* ── Period Filter ── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-[var(--text-muted)]" />
          {[{ l: 'اليوم', v: 'today' }, { l: 'الأسبوع', v: 'week' }, { l: 'الشهر', v: 'month' }, { l: 'السنة', v: 'year' }, { l: 'مخصص', v: 'custom' }].map(p => (
            <button key={p.v} onClick={() => applyPeriod(p.v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${period === p.v ? 'bg-orange-500 text-white' : 'bg-white/10 text-[var(--text-secondary)] hover:bg-white/20'}`}>
              {p.l}
            </button>
          ))}
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input-field w-auto text-sm" />
              <span className="text-[var(--text-muted)]">—</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input-field w-auto text-sm" />
            </div>
          )}
          <button onClick={fetchData} className="mr-auto p-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-white/10">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 font-bold text-sm transition-all border-b-2 flex items-center gap-1.5
                ${activeTab === t.id ? 'border-orange-500 text-orange-500' : 'border-transparent text-[var(--text-muted)] hover:text-white'}`}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">جاري التحميل...</p>
        </div>
      ) : (
        <>
          {/* ══════════════ TAB: OVERVIEW ══════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Capital Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                <StatCard label="رأس المال الحالي" value={fmtC(d?.capital?.current)}
                  icon={DollarSign} gradient="linear-gradient(135deg,#7c3aed,#4f46e5)" badge="إجمالي" />
                <StatCard label="صافي الربح" value={fmtC(d?.sales?.netProfit)}
                  icon={(d?.sales?.netProfit || 0) >= 0 ? TrendingUp : TrendingDown}
                  gradient={(d?.sales?.netProfit || 0) >= 0 ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#dc2626,#ef4444)"} />
                <StatCard label="إجمالي الإيرادات" value={fmtC(d?.sales?.totalRevenue)}
                  icon={TrendingUp} gradient="linear-gradient(135deg,#ea580c,#f97316)" />
                <StatCard label="إجمالي المصروفات" value={fmtC(d?.expenses?.total)}
                  icon={TrendingDown} gradient="linear-gradient(135deg,#dc2626,#b91c1c)" />
                <StatCard label="قيمة المخزون" value={fmtC(d?.inventory?.total)}
                  icon={Package} gradient="linear-gradient(135deg,#0284c7,#0ea5e9)"
                  sub="بسعر الشراء" />
                <StatCard label="مستحقات العملاء" value={fmtC(d?.customers?.receivables)}
                  icon={Users} gradient="linear-gradient(135deg,#d97706,#f59e0b)"
                  sub={`${d?.customers?.debtorCount || 0} عميل مدين`} />
                <StatCard label="مستحقات الموردين" value={fmtC(d?.suppliers?.payables)}
                  icon={Building2} gradient="linear-gradient(135deg,#9333ea,#a855f7)"
                  sub={`${d?.suppliers?.count || 0} مورد`} />
                <StatCard label="هامش الربح" value={`${d?.sales?.profitMargin || 0}%`}
                  icon={Target} gradient="linear-gradient(135deg,#0891b2,#06b6d4)" />
              </div>

              {/* Capital Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <SectionCard title="تفاصيل رأس المال الشامل" icon={DollarSign} color="#f59e0b">
                  <div className="space-y-3">
                    {[
                      { label: 'الإيرادات من المبيعات', val: d?.sales?.totalRevenue, color: 'text-green-400', sign: '+' },
                      { label: 'قيمة المخزون', val: d?.inventory?.total, color: 'text-blue-400', sign: '+' },
                      { label: 'مستحقات العملاء', val: d?.customers?.receivables, color: 'text-yellow-400', sign: '+' },
                      { label: 'إيرادات أخرى', val: d?.extraRevenue?.total, color: 'text-emerald-400', sign: '+' },
                      { label: 'المصروفات التشغيلية', val: d?.expenses?.total, color: 'text-red-400', sign: '-' },
                      { label: 'مستحقات الموردين', val: d?.suppliers?.payables, color: 'text-purple-400', sign: '-' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-[var(--text-secondary)] text-sm">{row.label}</span>
                        <span className={`font-black text-sm ${row.color}`}>
                          {row.sign}{fmtC(row.val)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-white/20">
                      <span className="font-black text-white">صافي رأس المال</span>
                      <span className={`font-black text-lg ${(d?.capital?.current || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {fmtC(d?.capital?.current)}
                      </span>
                    </div>
                  </div>
                </SectionCard>

                {/* Profit/Loss Chart */}
                <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-black text-white text-sm mb-4">الإيرادات مقابل المصروفات الشهرية</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={d?.monthlyData || []}>
                      <defs>
                        <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f1f5f9' }}
                        formatter={v => `${fmt(v)} ج`} />
                      <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                      <Area type="monotone" dataKey="revenue" name="إيرادات" stroke="#10b981" fill="url(#gr)" strokeWidth={2} />
                      <Area type="monotone" dataKey="expenses" name="مصروفات" stroke="#ef4444" fill="url(#ge)" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" name="أرباح" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Customers / Suppliers / Cashflow mini */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SectionCard title="الخزنة" icon={Wallet} color="#10b981">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">النقد الداخل</span><span className="text-green-400 font-bold">{fmtC(d?.sales?.totalRevenue)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">النقد الخارج</span><span className="text-red-400 font-bold">{fmtC(d?.expenses?.total)}</span></div>
                    <div className="flex justify-between text-sm border-t border-white/10 pt-2"><span className="text-white font-bold">الرصيد النهائي</span><span className="text-yellow-400 font-black">{fmtC(d?.capital?.cashBalance)}</span></div>
                  </div>
                </SectionCard>

                <SectionCard title="العملاء" icon={Users} color="#3b82f6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">إجمالي المبيعات</span><span className="text-blue-400 font-bold">{fmtC(d?.customers?.totalRevenue)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">المحصل</span><span className="text-green-400 font-bold">{fmtC(d?.customers?.totalCollected)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">المستحق</span><span className="text-red-400 font-bold">{fmtC(d?.customers?.totalRemaining)}</span></div>
                    <div className="flex justify-between text-sm border-t border-white/10 pt-2"><span className="text-[var(--text-muted)]">عدد المدينين</span><span className="text-yellow-400 font-black">{d?.customers?.debtorCount || 0}</span></div>
                  </div>
                </SectionCard>

                <SectionCard title="الموردون" icon={Building2} color="#8b5cf6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">إجمالي المشتريات</span><span className="text-purple-400 font-bold">{fmtC(d?.suppliers?.totalPurchased)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">المدفوع</span><span className="text-green-400 font-bold">{fmtC(d?.suppliers?.totalPaid)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">المتبقي</span><span className="text-red-400 font-bold">{fmtC(d?.suppliers?.remaining)}</span></div>
                    <div className="flex justify-between text-sm border-t border-white/10 pt-2"><span className="text-[var(--text-muted)]">عدد الموردين</span><span className="text-yellow-400 font-black">{d?.suppliers?.count || 0}</span></div>
                  </div>
                </SectionCard>

                <SectionCard title="الأرباح والخسائر" icon={BarChart3} color="#f59e0b">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">الربح الإجمالي</span><span className="text-green-400 font-bold">{fmtC(d?.sales?.grossProfit)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">المصروفات</span><span className="text-red-400 font-bold">{fmtC(d?.expenses?.total)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">صافي الربح</span><span className={(d?.sales?.netProfit || 0) >= 0 ? "text-green-400 font-black" : "text-red-400 font-black"}>{fmtC(d?.sales?.netProfit)}</span></div>
                    <div className="flex justify-between text-sm border-t border-white/10 pt-2"><span className="text-[var(--text-muted)]">هامش الربح</span><span className="text-yellow-400 font-black">{d?.sales?.profitMargin || 0}%</span></div>
                  </div>
                </SectionCard>
              </div>

              {/* Revenue by category pie + Sales by type bar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <SectionCard title="توزيع رأس المال حسب الأقسام" icon={Package} color="#3b82f6">
                  {(d?.inventory?.byType || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={d.inventory.byType.filter(t => t.totalValue > 0)}
                          dataKey="totalValue" nameKey="nameAr" cx="50%" cy="50%" outerRadius={85} innerRadius={40}
                          label={({ nameAr, percentage }) => `${nameAr} ${percentage}%`} labelLine={false}>
                          {d.inventory.byType.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                        </Pie>
                        <Tooltip formatter={v => fmtC(v)} contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f1f5f9' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-40 text-[var(--text-muted)] text-sm">لا توجد بيانات</div>}
                </SectionCard>

                <SectionCard title="أرباح الأقسام" icon={TrendingUp} color="#10b981">
                  {(d?.sales?.byCategory || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={d.sales.byCategory.filter(c => c.revenue > 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="nameAr" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f1f5f9' }} formatter={v => fmtC(v)} />
                        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                        <Bar dataKey="revenue" name="إيراد" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" name="ربح" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-40 text-[var(--text-muted)] text-sm">لا توجد مبيعات</div>}
                </SectionCard>
              </div>
            </div>
          )}

          {/* ══════════════ TAB: INVENTORY ══════════════ */}
          {activeTab === 'inventory' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {(d?.inventory?.byType || []).map((t, i) => (
                  <StatCard key={t._id} label={t.nameAr} value={fmtC(t.totalValue)}
                    icon={Package} gradient={`linear-gradient(135deg,${C[i % C.length]}cc,${C[(i + 1) % C.length]}88)`}
                    sub={`${fmt(t.totalQty)} قطعة | ${t.percentage}%`} />
                ))}
              </div>
              <SectionCard title={`إجمالي قيمة المخزون: ${fmtC(d?.inventory?.total)}`} icon={Package} color="#3b82f6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-white/10">
                      {['القسم', 'القيمة الإجمالية', 'الكميات', 'عدد المنتجات', 'النسبة'].map(h => (
                        <th key={h} className="px-4 py-3 text-start text-xs font-bold text-[var(--text-muted)]">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {(d?.inventory?.byType || []).map((t, i) => (
                        <tr key={t._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ background: C[i % C.length] }} />
                              <span className="text-white font-semibold text-sm">{t.nameAr}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-black text-blue-400">{fmtC(t.totalValue)}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-sm">{fmt(t.totalQty)}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-sm">{t.count}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-white/10">
                                <div className="h-2 rounded-full" style={{ width: `${t.percentage}%`, background: C[i % C.length] }} />
                              </div>
                              <span className="text-xs font-bold text-[var(--text-muted)] w-10">{t.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-white/20 bg-white/5">
                        <td className="px-4 py-3 font-black text-white">الإجمالي</td>
                        <td className="px-4 py-3 font-black text-yellow-400 text-base">{fmtC(d?.inventory?.total)}</td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ══════════════ TAB: CASH FLOW ══════════════ */}
          {activeTab === 'cashflow' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-white font-black">سجل التدفق النقدي ({cfRows.length} حركة)</h3>
                <div className="flex gap-2">
                  <button onClick={() => exportToPDF({ title: 'التدفق النقدي', columns: cfCols, rows: cfRows, filename: 'cashflow' })} className="btn-secondary text-sm flex items-center gap-1"><FileText size={13} /> PDF</button>
                  <button onClick={() => exportToExcel({ title: 'التدفق النقدي', columns: cfCols, rows: cfRows, filename: 'cashflow' })} className="btn-secondary text-sm flex items-center gap-1"><Download size={13} /> Excel</button>
                  <button onClick={() => printTable({ title: 'التدفق النقدي', columns: cfCols, rows: cfRows })} className="btn-secondary text-sm flex items-center gap-1"><Printer size={13} /> طباعة</button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-white/10 bg-white/5">
                      {['التاريخ', 'نوع الحركة', 'الوصف', 'إيراد', 'مصروف', 'الرصيد', 'المستخدم'].map(h => (
                        <th key={h} className="px-3 py-3 text-start text-xs font-bold text-[var(--text-muted)]">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {cfRows.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-[var(--text-muted)]">لا يوجد تدفق نقدي مسجل</td></tr>
                      ) : cfRows.map((row, i) => (
                        <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs">{row.dateStr}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold
                              ${row.type === 'sale' ? 'bg-green-500/20 text-green-400' :
                                row.type === 'expense' ? 'bg-red-500/20 text-red-400' :
                                  row.type === 'purchase' ? 'bg-purple-500/20 text-purple-400' :
                                    'bg-blue-500/20 text-blue-400'}`}>{row.typeAr}</span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)] text-xs max-w-[180px] truncate">{row.description}</td>
                          <td className="px-3 py-2.5 text-green-400 font-bold text-sm">{row.income > 0 ? fmtC(row.income) : '-'}</td>
                          <td className="px-3 py-2.5 text-red-400 font-bold text-sm">{row.expense > 0 ? fmtC(row.expense) : '-'}</td>
                          <td className="px-3 py-2.5 font-black text-sm">
                            <span className={row.balance >= 0 ? 'text-yellow-400' : 'text-red-400'}>{fmtC(row.balance)}</span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs">{row.user}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ TAB: ANALYTICS ══════════════ */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <StatCard label="متوسط الربح الشهري" value={fmtC(d?.averages?.monthlyProfit)} icon={TrendingUp} gradient="linear-gradient(135deg,#059669,#10b981)" />
                <StatCard label="متوسط الإيراد الشهري" value={fmtC(d?.averages?.monthlyRevenue)} icon={Activity} gradient="linear-gradient(135deg,#0284c7,#0ea5e9)" />
                <StatCard label="متوسط المصروف الشهري" value={fmtC(d?.averages?.monthlyExpense)} icon={TrendingDown} gradient="linear-gradient(135deg,#dc2626,#ef4444)" />
                <StatCard label="متوسط الإيراد اليومي" value={fmtC(d?.averages?.dailyRevenue)} icon={Calendar} gradient="linear-gradient(135deg,#d97706,#f59e0b)" />
                <StatCard label="متوسط المصروف اليومي" value={fmtC(d?.averages?.dailyExpense)} icon={Calendar} gradient="linear-gradient(135deg,#7c3aed,#8b5cf6)" />
              </div>

              {/* Best/Worst */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SectionCard title="أفضل الأقسام ربحاً" icon={Award} color="#10b981">
                  <div className="space-y-2">
                    {(d?.sales?.byCategory || []).sort((a, b) => b.profit - a.profit).slice(0, 5).map((c, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                          style={{ background: `${C[i]}30`, color: C[i] }}>{i + 1}</div>
                        <span className="text-[var(--text-secondary)] text-sm flex-1">{c.nameAr}</span>
                        <span className="text-green-400 font-black text-sm">{fmtC(c.profit)}</span>
                        <span className="text-xs text-[var(--text-muted)]">{c.margin}%</span>
                      </div>
                    ))}
                    {!(d?.sales?.byCategory?.length) && <p className="text-[var(--text-muted)] text-sm">لا توجد بيانات</p>}
                  </div>
                </SectionCard>

                <SectionCard title="أعلى المنتجات ربحاً" icon={TrendingUp} color="#f59e0b">
                  <div className="space-y-2">
                    {(d?.topProducts || []).slice(0, 5).map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                          style={{ background: `${C[i]}30`, color: C[i] }}>{i + 1}</div>
                        <span className="text-[var(--text-secondary)] text-sm flex-1 truncate">{p.nameAr || p.name || 'منتج'}</span>
                        <span className="text-yellow-400 font-black text-sm">{fmtC(p.profit)}</span>
                      </div>
                    ))}
                    {!(d?.topProducts?.length) && <p className="text-[var(--text-muted)] text-sm">لا توجد بيانات</p>}
                  </div>
                </SectionCard>

                {d?.bestMonth && (
                  <SectionCard title="أفضل شهر" icon={Award} color="#10b981">
                    <div className="text-center py-4">
                      <div className="text-4xl font-black text-white mb-1">{d.bestMonth.period}</div>
                      <div className="text-green-400 font-black text-xl">{fmtC(d.bestMonth.profit)}</div>
                      <div className="text-[var(--text-muted)] text-sm mt-2">إيراد: {fmtC(d.bestMonth.revenue)}</div>
                    </div>
                  </SectionCard>
                )}
                {d?.worstMonth && (
                  <SectionCard title="أدنى شهر" icon={TrendingDown} color="#ef4444">
                    <div className="text-center py-4">
                      <div className="text-4xl font-black text-white mb-1">{d.worstMonth.period}</div>
                      <div className="text-red-400 font-black text-xl">{fmtC(d.worstMonth.profit)}</div>
                      <div className="text-[var(--text-muted)] text-sm mt-2">إيراد: {fmtC(d.worstMonth.revenue)}</div>
                    </div>
                  </SectionCard>
                )}
              </div>

              {/* Monthly profit line chart */}
              <SectionCard title="تطور الأرباح الشهرية" icon={TrendingUp} color="#10b981">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={d?.monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f1f5f9' }} formatter={v => fmtC(v)} />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                    <Line type="monotone" dataKey="profit" name="ربح صافي" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
                    <Line type="monotone" dataKey="revenue" name="إيراد" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>
          )}

          {/* ══════════════ TAB: EXPENSES ══════════════ */}
          {activeTab === 'expenses' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="إجمالي المصروفات" value={fmtC(d?.expenses?.total)} icon={TrendingDown} gradient="linear-gradient(135deg,#dc2626,#ef4444)" />
                <StatCard label="عدد المصروفات" value={d?.expenses?.count || 0} icon={FileText} gradient="linear-gradient(135deg,#7c3aed,#8b5cf6)" />
                <StatCard label="أكبر فئة" value={d?.expenses?.byCategory?.[0]?.categoryAr || '-'} icon={Info} gradient="linear-gradient(135deg,#d97706,#f59e0b)" />
                <StatCard label="متوسط المصروف" value={fmtC((d?.expenses?.total || 0) / (d?.expenses?.count || 1))} icon={Activity} gradient="linear-gradient(135deg,#0284c7,#0ea5e9)" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <SectionCard title="المصروفات حسب الفئة" icon={TrendingDown} color="#ef4444">
                  {(d?.expenses?.byCategory || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={d.expenses.byCategory} dataKey="total" nameKey="categoryAr"
                          cx="50%" cy="50%" outerRadius={80} innerRadius={35}
                          label={({ categoryAr, percent }) => `${categoryAr} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {d.expenses.byCategory.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                        </Pie>
                        <Tooltip formatter={v => fmtC(v)} contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f1f5f9' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-40 text-[var(--text-muted)] text-sm">لا توجد مصروفات</div>}
                </SectionCard>

                <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <h3 className="font-black text-white text-sm">سجل المصروفات ({expenses.length})</h3>
                    <button onClick={() => printTable({ title: 'تقرير المصروفات', columns: expCols, rows: expenses })}
                      className="btn-secondary text-xs flex items-center gap-1"><Printer size={13} /> طباعة</button>
                  </div>
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-[#1a1a2e]">
                        <tr className="border-b border-white/10">
                          {['التاريخ', 'الفئة', 'الوصف', 'القيمة', 'المسؤول', 'إجراءات'].map(h => (
                            <th key={h} className="px-3 py-3 text-start text-xs font-bold text-[var(--text-muted)]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">لا توجد مصروفات</td></tr>
                        ) : expenses.map((exp, i) => (
                          <motion.tr key={exp._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs">{new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                            <td className="px-3 py-2.5"><span className="badge badge-warning text-xs">{exp.categoryAr || exp.category}</span></td>
                            <td className="px-3 py-2.5 text-[var(--text-secondary)] text-xs max-w-[150px] truncate">{exp.description || '-'}</td>
                            <td className="px-3 py-2.5 font-black text-red-400 text-sm">{fmtC(exp.amount)}</td>
                            <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs">{exp.responsible || '-'}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex gap-1">
                                <button onClick={() => { setEditExpense(exp); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-blue-400"><Edit size={13} /></button>
                                <button onClick={() => setDeleteConfirm(exp._id)} className="p-1.5 rounded-lg hover:bg-white/10 text-red-400"><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                      {expenses.length > 0 && (
                        <tfoot>
                          <tr className="border-t border-white/20 bg-white/5">
                            <td colSpan={3} className="px-3 py-3 font-black text-white text-sm">الإجمالي</td>
                            <td className="px-3 py-3 font-black text-red-400">{fmtC(expenses.reduce((a, e) => a + (e.amount || 0), 0))}</td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {showForm && (
          <ExpenseForm expense={editExpense}
            onSave={() => { setShowForm(false); setEditExpense(null); fetchData(); }}
            onClose={() => { setShowForm(false); setEditExpense(null); }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="card p-6 max-w-sm w-full text-center" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-400" size={24} />
              </div>
              <h3 className="text-white font-black mb-2">تأكيد الحذف</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">هل تريد حذف هذا المصروف؟</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">إلغاء</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1">حذف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
