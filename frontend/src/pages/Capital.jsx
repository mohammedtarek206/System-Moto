import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Edit, Trash2, X,
  BarChart3, FileText, Download, Printer
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { exportToPDF, exportToExcel, printTable, formatCurrency, getDateRange, EXPENSE_CATEGORIES } from '../lib/exportUtils';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN = () => localStorage.getItem('moto_token');

const SALE_LABELS = {
  spare_parts: 'قطع غيار', oils: 'زيوت', motorcycles: 'موتسيكلات',
  scooters: 'سكوترات', mixed: 'متنوعة', other: 'أخرى'
};
const COLORS = ['#f59e0b','#3b82f6','#10b981','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16'];

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className={`card bg-gradient-to-br ${color} border-0 p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-white/70 text-xs font-bold mb-1">{label}</div>
          <div className="text-white text-xl font-black">{value}</div>
          {sub && <div className="text-white/60 text-xs mt-1">{sub}</div>}
        </div>
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function ExpenseForm({ expense, onSave, onClose }) {
  const [form, setForm] = useState({
    category: expense?.category || 'rent',
    amount: expense?.amount || '',
    description: expense?.description || '',
    date: expense?.date ? expense.date.slice(0,10) : new Date().toISOString().slice(0,10),
    responsible: expense?.responsible || '',
    notes: expense?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (expense) {
        await axios.put(`${API}/capital/${expense._id}`, form, { headers: { Authorization: `Bearer ${TOKEN()}` } });
        toast.success('تم التحديث ✅');
      } else {
        await axios.post(`${API}/capital`, form, { headers: { Authorization: `Bearer ${TOKEN()}` } });
        toast.success('تم إضافة المصروف ✅');
      }
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
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)]"><X size={20}/></button>
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
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className="input-field" min="0" step="0.01" required placeholder="0.00"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">التاريخ</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">المسؤول</label>
              <input value={form.responsible} onChange={e => set('responsible', e.target.value)} className="input-field" placeholder="اسم المسؤول"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">الوصف</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} className="input-field" placeholder="وصف المصروف"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">ملاحظات</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field h-16 resize-none" placeholder="ملاحظات إضافية"/>
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
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('custom');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
      const params = new URLSearchParams({ period: 'month' });
      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);
      const [sumRes, expRes] = await Promise.all([
        axios.get(`${API}/capital/summary?${params}`, { headers: { Authorization: `Bearer ${TOKEN()}` } }),
        axios.get(`${API}/capital?${params}&limit=500`, { headers: { Authorization: `Bearer ${TOKEN()}` } }),
      ]);
      setSummary(sumRes.data?.data);
      setExpenses(expRes.data?.data || []);
    } catch { toast.error('فشل التحميل'); }
    finally { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async id => {
    try {
      await axios.delete(`${API}/capital/${id}`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      toast.success('تم الحذف'); setDeleteConfirm(null); fetchData();
    } catch { toast.error('فشل الحذف'); }
  };

  const expCols = [
    { key: 'categoryAr', header: 'الفئة' },
    { key: 'amount', header: 'القيمة', format: v => `${Number(v).toLocaleString('ar-EG')} ج` },
    { key: 'description', header: 'الوصف' },
    { key: 'responsible', header: 'المسؤول' },
    { key: 'date', header: 'التاريخ', format: v => new Date(v).toLocaleDateString('ar-EG') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <DollarSign className="text-yellow-500" size={28}/> دورة رأس المال
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">إيرادات ومصروفات وصافي الأرباح</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => exportToPDF({ title: 'تقرير المصروفات', columns: expCols, rows: expenses, filename: 'expenses' })}
            className="btn-secondary flex items-center gap-1 text-sm"><FileText size={15}/> PDF</button>
          <button onClick={() => exportToExcel({ title: 'المصروفات', columns: expCols, rows: expenses, filename: 'expenses' })}
            className="btn-secondary flex items-center gap-1 text-sm"><Download size={15}/> Excel</button>
          <button onClick={() => { setEditExpense(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18}/> إضافة مصروف
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          {[{l:'اليوم',v:'today'},{l:'الأسبوع',v:'week'},{l:'الشهر',v:'month'},{l:'السنة',v:'year'},{l:'مخصص',v:'custom'}].map(p => (
            <button key={p.v} onClick={() => applyPeriod(p.v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${period===p.v ? 'bg-orange-500 text-white' : 'bg-white/10 text-[var(--text-secondary)] hover:bg-white/20'}`}>
              {p.l}
            </button>
          ))}
          {period==='custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input-field w-auto text-sm"/>
              <span className="text-[var(--text-muted)]">—</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input-field w-auto text-sm"/>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {[{id:'overview',l:'نظرة عامة'},{id:'expenses',l:'سجل المصروفات'}].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2.5 font-bold text-sm transition-all border-b-2 ${activeTab===t.id ? 'border-orange-500 text-orange-500' : 'border-transparent text-[var(--text-muted)] hover:text-white'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"/><p className="text-[var(--text-muted)]">جاري التحميل...</p></div>
      ) : activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="إجمالي الإيرادات" value={formatCurrency(summary?.totalRevenue)} icon={TrendingUp} color="from-green-500 to-emerald-600"/>
            <StatCard label="إجمالي المصروفات" value={formatCurrency(summary?.totalExpenses)} icon={TrendingDown} color="from-red-500 to-rose-600"/>
            <StatCard label="تكلفة البضاعة" value={formatCurrency(summary?.totalCost)} icon={DollarSign} color="from-orange-500 to-amber-600"/>
            <StatCard label="الربح الإجمالي" value={formatCurrency(summary?.grossProfit)} icon={BarChart3} color="from-blue-500 to-indigo-600"/>
            <StatCard label="صافي الربح" value={formatCurrency(summary?.netProfit)} icon={TrendingUp} color={(summary?.netProfit||0)>=0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600'}/>
            <StatCard label="رأس المال الحالي" value={formatCurrency(summary?.currentCapital)} icon={DollarSign} color="from-purple-500 to-violet-600"/>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 card">
              <h3 className="text-sm font-black text-white mb-4">الإيرادات مقابل المصروفات</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={summary?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
                  <XAxis dataKey="period" tick={{ fill:'#94a3b8', fontSize:10 }}/>
                  <YAxis tick={{ fill:'#94a3b8', fontSize:10 }}/>
                  <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid #2a2a3a', borderRadius:8, color:'#f1f5f9' }}/>
                  <Legend wrapperStyle={{ color:'#94a3b8', fontSize:12 }}/>
                  <Bar dataKey="revenue" name="إيرادات" fill="#10b981" radius={[4,4,0,0]}/>
                  <Bar dataKey="expenses" name="مصروفات" fill="#ef4444" radius={[4,4,0,0]}/>
                  <Bar dataKey="profit" name="أرباح" fill="#f59e0b" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="text-sm font-black text-white mb-4">المصروفات حسب الفئة</h3>
              {(summary?.expensesByCategory||[]).length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={summary.expensesByCategory} dataKey="total" nameKey="categoryAr" cx="50%" cy="50%" outerRadius={75} label={({categoryAr,percent}) => `${categoryAr} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {summary.expensesByCategory.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={v=>`${Number(v).toLocaleString('ar-EG')} ج`} contentStyle={{ background:'#1a1a24', border:'1px solid #2a2a3a', borderRadius:8 }}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-[var(--text-muted)] text-sm">لا توجد مصروفات</div>
              )}
            </div>
          </div>

          {/* Revenue by category */}
          <div className="card">
            <h3 className="text-sm font-black text-white mb-4">الإيرادات حسب نوع المبيعات</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {(summary?.salesByCategory||[]).map((cat,i) => (
                <div key={cat._id||i} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xs text-[var(--text-muted)] mb-1">{SALE_LABELS[cat._id]||cat._id}</div>
                  <div className="font-black text-white text-lg">{(cat.total||0).toLocaleString('ar-EG')}</div>
                  <div className="text-xs text-[var(--text-muted)]">جنيه</div>
                </div>
              ))}
              {(summary?.salesByCategory||[]).length === 0 && (
                <div className="col-span-6 text-center py-6 text-[var(--text-muted)] text-sm">لا توجد مبيعات في هذه الفترة</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Expenses Table */
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-black text-white">سجل المصروفات ({expenses.length})</h3>
            <button onClick={() => printTable({ title:'تقرير المصروفات', columns:expCols, rows:expenses })}
              className="btn-secondary text-sm flex items-center gap-1"><Printer size={14}/> طباعة</button>
          </div>
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">لا توجد مصروفات مسجلة في هذه الفترة</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['التاريخ','الفئة','الوصف','القيمة','المسؤول','إجراءات'].map(h => (
                      <th key={h} className="px-3 py-3 text-start text-xs font-bold text-[var(--text-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp,i) => (
                    <motion.tr key={exp._id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-3 py-3 text-[var(--text-muted)] text-sm">{new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                      <td className="px-3 py-3"><span className="badge badge-warning text-xs">{exp.categoryAr||exp.category}</span></td>
                      <td className="px-3 py-3 text-[var(--text-secondary)] text-sm max-w-[200px] break-words whitespace-normal">{exp.description||'-'}</td>
                      <td className="px-3 py-3 font-black text-red-400">{(exp.amount||0).toLocaleString('ar-EG')} ج</td>
                      <td className="px-3 py-3 text-[var(--text-muted)] text-sm">{exp.responsible||'-'}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditExpense(exp); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-blue-400"><Edit size={14}/></button>
                          <button onClick={() => setDeleteConfirm(exp._id)} className="p-1.5 rounded-lg hover:bg-white/10 text-red-400"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/20 bg-white/5">
                    <td colSpan={3} className="px-3 py-3 font-black text-white text-sm">الإجمالي</td>
                    <td className="px-3 py-3 font-black text-red-400 text-base">
                      {expenses.reduce((a,e)=>a+(e.amount||0),0).toLocaleString('ar-EG')} ج
                    </td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <ExpenseForm expense={editExpense}
            onSave={() => { setShowForm(false); setEditExpense(null); fetchData(); }}
            onClose={() => { setShowForm(false); setEditExpense(null); }}/>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <motion.div className="card p-6 max-w-sm w-full text-center" initial={{scale:0.8}} animate={{scale:1}}>
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-400" size={24}/>
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
