import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Droplet, TrendingUp, Package, Users, Search, FileText, Download, Printer, Filter } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToCSV, printTable, formatCurrency, formatDate, getDateRange } from '../lib/exportUtils';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN = () => localStorage.getItem('moto_token');

const PERIODS = [{l:'اليوم',v:'today'},{l:'الأسبوع',v:'week'},{l:'الشهر',v:'month'},{l:'السنة',v:'year'},{l:'مخصص',v:'custom'}];

const COLS = [
  { key: 'name', header: 'اسم الزيت' },
  { key: 'totalSold', header: 'الكميات المباعة' },
  { key: 'totalRevenue', header: 'إجمالي المبيعات', format: v => `${Number(v).toLocaleString('ar-EG')} ج` },
  { key: 'totalProfit', header: 'إجمالي الأرباح', format: v => `${Number(v).toLocaleString('ar-EG')} ج` },
  { key: 'currentStock', header: 'الكمية بالمخزن' },
  { key: 'avgSellPrice', header: 'متوسط سعر البيع', format: v => `${Number(v).toLocaleString('ar-EG')} ج` },
  { key: 'lastSaleDate', header: 'آخر عملية بيع', format: v => formatDate(v) },
  { key: 'topCustomer', header: 'أكثر عميل اشترى' },
];

export default function OilReports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('custom');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  const applyPeriod = p => {
    setPeriod(p);
    if (p !== 'custom') { const { from, to } = getDateRange(p); setFromDate(from||''); setToDate(to||''); }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);
      const res = await axios.get(`${API}/reports/oils?${params}`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      setData(res.data?.data || []);
    } catch { toast.error('فشل تحميل التقرير'); }
    finally { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter(r =>
    !search || (r.name||'').toLowerCase().includes(search.toLowerCase()) || (r.nameAr||'').includes(search)
  );

  // Totals
  const totals = {
    totalSold: filtered.reduce((a, r) => a + r.totalSold, 0),
    totalRevenue: filtered.reduce((a, r) => a + r.totalRevenue, 0),
    totalProfit: filtered.reduce((a, r) => a + r.totalProfit, 0),
    currentStock: filtered.reduce((a, r) => a + r.currentStock, 0),
  };

  const displayData = filtered.map(r => ({ ...r, name: r.nameAr || r.name || '-' }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Droplet className="text-green-400" size={28}/> تقارير الزيوت
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">تقرير تفصيلي لمبيعات الزيوت</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportToPDF({ title:'تقرير الزيوت', columns:COLS, rows:displayData, filename:'oils-report' })} className="btn-secondary flex items-center gap-1 text-sm"><FileText size={14}/> PDF</button>
          <button onClick={() => exportToExcel({ title:'تقرير الزيوت', columns:COLS, rows:displayData, filename:'oils-report' })} className="btn-secondary flex items-center gap-1 text-sm"><Download size={14}/> Excel</button>
          <button onClick={() => exportToCSV({ columns:COLS, rows:displayData, filename:'oils-report' })} className="btn-secondary flex items-center gap-1 text-sm">CSV</button>
          <button onClick={() => printTable({ title:'تقرير الزيوت', columns:COLS, rows:displayData })} className="btn-secondary flex items-center gap-1 text-sm"><Printer size={14}/> طباعة</button>
        </div>
      </div>

      {/* Period */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          {PERIODS.map(p => (
            <button key={p.v} onClick={() => applyPeriod(p.v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${period===p.v ? 'bg-green-500 text-white' : 'bg-white/10 text-[var(--text-secondary)] hover:bg-white/20'}`}>
              {p.l}
            </button>
          ))}
          {period==='custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="input-field w-auto text-sm"/>
              <span className="text-[var(--text-muted)]">—</span>
              <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="input-field w-auto text-sm"/>
            </div>
          )}
          <div className="relative ms-auto">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="input-field ps-8 text-sm w-48"/>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'إجمالي الكميات المباعة', value:`${totals.totalSold.toLocaleString('ar-EG')} عبوة`, icon:Droplet, color:'from-green-500 to-emerald-600' },
          { label:'إجمالي المبيعات', value:formatCurrency(totals.totalRevenue), icon:TrendingUp, color:'from-blue-500 to-indigo-600' },
          { label:'إجمالي الأرباح', value:formatCurrency(totals.totalProfit), icon:TrendingUp, color:'from-orange-500 to-amber-600' },
          { label:'الكمية بالمخزن', value:`${totals.currentStock.toLocaleString('ar-EG')} عبوة`, icon:Package, color:'from-purple-500 to-violet-600' },
        ].map((s,i) => (
          <div key={i} className={`card bg-gradient-to-br ${s.color} border-0 p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-bold mb-1">{s.label}</div>
                <div className="text-white text-xl font-black">{s.value}</div>
              </div>
              <s.icon className="text-white/60" size={28}/>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-3"/><p className="text-[var(--text-muted)]">جاري التحميل...</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><Droplet size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-30"/><p className="text-[var(--text-muted)]">لا توجد بيانات في هذه الفترة</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['#','اسم الزيت','الكميات المباعة','إجمالي المبيعات','الأرباح','الكمية بالمخزن','متوسط السعر','آخر بيع','أكثر عميل'].map(h => (
                    <th key={h} className="px-3 py-3 text-start text-xs font-bold text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r,i) => (
                  <motion.tr key={r.id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-3 py-3 text-[var(--text-muted)] text-sm">{i+1}</td>
                    <td className="px-3 py-3 font-bold text-white">{r.nameAr || r.name || '-'}</td>
                    <td className="px-3 py-3 text-center"><span className="badge badge-info">{r.totalSold}</span></td>
                    <td className="px-3 py-3 font-bold text-green-400">{(r.totalRevenue||0).toLocaleString('ar-EG')} ج</td>
                    <td className="px-3 py-3 font-bold text-orange-400">{(r.totalProfit||0).toLocaleString('ar-EG')} ج</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`badge ${r.currentStock > 0 ? 'badge-success' : 'badge-danger'}`}>{r.currentStock}</span>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{(r.avgSellPrice||0).toLocaleString('ar-EG')} ج</td>
                    <td className="px-3 py-3 text-[var(--text-muted)] text-sm">{formatDate(r.lastSaleDate)}</td>
                    <td className="px-3 py-3 text-[var(--text-secondary)] text-sm">{r.topCustomer || '-'}</td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-white/20 bg-white/5 font-black">
                  <td className="px-3 py-3 text-white text-sm" colSpan={2}>الإجمالي</td>
                  <td className="px-3 py-3 text-center text-white">{totals.totalSold}</td>
                  <td className="px-3 py-3 text-green-400">{totals.totalRevenue.toLocaleString('ar-EG')} ج</td>
                  <td className="px-3 py-3 text-orange-400">{totals.totalProfit.toLocaleString('ar-EG')} ج</td>
                  <td className="px-3 py-3 text-center text-white">{totals.currentStock}</td>
                  <td colSpan={3}/>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
