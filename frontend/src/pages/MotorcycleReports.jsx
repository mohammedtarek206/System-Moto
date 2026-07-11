import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Bike, TrendingUp, DollarSign, Calendar, BarChart3, FileText, Download, Printer } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { exportToPDF, exportToExcel, exportToCSV, printTable, formatCurrency, formatDate, getDateRange } from '../lib/exportUtils';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN = () => localStorage.getItem('moto_token');

const COLORS = ['#ea580c','#3b82f6','#10b981','#eab308','#8b5cf6','#ec4899','#06b6d4','#84cc16'];

const COLS = [
  { key: 'name', header: 'الموتسيكل' },
  { key: 'brand', header: 'الماركة' },
  { key: 'model', header: 'الموديل' },
  { key: 'totalSold', header: 'عدد المباع' },
  { key: 'totalRevenue', header: 'إجمالي الإيرادات', format: v => `${Number(v).toLocaleString('ar-EG')} ج` },
  { key: 'totalProfit', header: 'إجمالي الأرباح', format: v => `${Number(v).toLocaleString('ar-EG')} ج` },
  { key: 'avgSellPrice', header: 'متوسط سعر البيع', format: v => `${Number(v).toLocaleString('ar-EG')} ج` },
  { key: 'lastSaleDate', header: 'آخر عملية بيع', format: v => formatDate(v) },
];

export default function MotorcycleReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('custom');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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

      const res = await axios.get(`${API}/reports/motorcycles?${params}`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      setReport(res.data?.data || null);
    } catch { toast.error('فشل تحميل تقارير الموتسيكلات'); }
    finally { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary = report?.summary || { totalSold: 0, totalRevenue: 0, totalProfit: 0, stockCount: 0 };
  const byModel = report?.byModel || [];
  const byBrand = report?.byBrand || [];

  const displayData = byModel.map(r => ({ ...r, name: `${r.brand} ${r.model}` }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Bike className="text-orange-500" size={28}/> تقارير الموتسيكلات
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">تقارير وتحليلات مبيعات الموتسيكلات</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportToPDF({ title:'تقرير مبيعات الموتسيكلات', columns:COLS, rows:displayData, filename:'motorcycles-report' })} className="btn-secondary flex items-center gap-1 text-sm"><FileText size={14}/> PDF</button>
          <button onClick={() => exportToExcel({ title:'تقرير مبيعات الموتسيكلات', columns:COLS, rows:displayData, filename:'motorcycles-report' })} className="btn-secondary flex items-center gap-1 text-sm"><Download size={14}/> Excel</button>
          <button onClick={() => exportToCSV({ columns:COLS, rows:displayData, filename:'motorcycles-report' })} className="btn-secondary flex items-center gap-1 text-sm">CSV</button>
          <button onClick={() => printTable({ title:'تقرير مبيعات الموتسيكلات', columns:COLS, rows:displayData })} className="btn-secondary flex items-center gap-1 text-sm"><Printer size={14}/> طباعة</button>
        </div>
      </div>

      {/* Date Filter */}
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
              <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="input-field w-auto text-sm"/>
              <span className="text-[var(--text-muted)]">—</span>
              <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="input-field w-auto text-sm"/>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"/><p className="text-[var(--text-muted)]">جاري التحميل...</p></div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card bg-gradient-to-br from-orange-500 to-red-500 border-0 p-4 text-white">
              <div className="text-white/80 text-xs font-bold">الموتسيكلات المباعة</div>
              <div className="text-2xl font-black mt-1">{summary.totalSold} موتسيكل</div>
            </div>
            <div className="card bg-gradient-to-br from-green-500 to-emerald-600 border-0 p-4 text-white">
              <div className="text-white/80 text-xs font-bold">إجمالي الإيرادات</div>
              <div className="text-2xl font-black mt-1">{formatCurrency(summary.totalRevenue)}</div>
            </div>
            <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 border-0 p-4 text-white">
              <div className="text-white/80 text-xs font-bold">إجمالي الأرباح</div>
              <div className="text-2xl font-black mt-1">{formatCurrency(summary.totalProfit)}</div>
            </div>
            <div className="card bg-gradient-to-br from-purple-500 to-violet-600 border-0 p-4 text-white">
              <div className="text-white/80 text-xs font-bold">المتاح بالمخزون حالياً</div>
              <div className="text-2xl font-black mt-1">{summary.stockCount} نوع</div>
            </div>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card text-center p-4">
              <div className="text-xs text-[var(--text-muted)] font-bold">الماركة الأكثر مبيعاً</div>
              <div className="text-lg font-black text-white mt-1">{report?.topBrand || 'لا يوجد'}</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-xs text-[var(--text-muted)] font-bold">الموديل الأكثر مبيعاً</div>
              <div className="text-lg font-black text-white mt-1">
                {report?.bestModel ? `${report.bestModel.brand} ${report.bestModel.model} (${report.bestModel.totalSold} مباع)` : 'لا يوجد'}
              </div>
            </div>
            <div className="card text-center p-4">
              <div className="text-xs text-[var(--text-muted)] font-bold">الموديل الأقل مبيعاً</div>
              <div className="text-lg font-black text-white mt-1">
                {report?.worstModel ? `${report.worstModel.brand} ${report.worstModel.model} (${report.worstModel.totalSold} مباع)` : 'لا يوجد'}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <h3 className="text-sm font-black text-white mb-4">المبيعات حسب الماركة</h3>
              {byBrand.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byBrand} dataKey="totalSold" nameKey="_id" cx="50%" cy="50%" outerRadius={70} label={({_id,percent})=>`${_id} ${(percent*100).toFixed(0)}%`}>
                      {byBrand.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={v=>`${v} مباع`}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-10 text-[var(--text-muted)] text-sm">لا توجد بيانات للرسم البياني</div>
              )}
            </div>
            <div className="card">
              <h3 className="text-sm font-black text-white mb-4">إيرادات الماركات</h3>
              {byBrand.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byBrand}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
                    <XAxis dataKey="_id" tick={{ fill:'#94a3b8', fontSize:10 }}/>
                    <YAxis tick={{ fill:'#94a3b8', fontSize:10 }}/>
                    <Tooltip formatter={v=>`${Number(v).toLocaleString()} ج`}/>
                    <Bar dataKey="totalRevenue" name="إيرادات" fill="#3b82f6" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-10 text-[var(--text-muted)] text-sm">لا توجد بيانات للرسم البياني</div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <h3 className="font-black text-white mb-3">تفاصيل المبيعات حسب الموديل</h3>
            {byModel.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">لا توجد تفاصيل مبيعات للموتسيكلات</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['#','الماركة','الموديل','عدد المباع','إجمالي الإيرادات','إجمالي الأرباح','متوسط السعر','آخر عملية بيع'].map(h => (
                        <th key={h} className="px-3 py-3 text-start text-xs font-bold text-[var(--text-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {byModel.map((r,i) => (
                      <tr key={r._id||i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-3 py-3 text-[var(--text-muted)] text-sm">{i+1}</td>
                        <td className="px-3 py-3 font-bold text-white">{r.brand}</td>
                        <td className="px-3 py-3 text-[var(--text-secondary)]">{r.model}</td>
                        <td className="px-3 py-3 text-center"><span className="badge badge-info">{r.totalSold}</span></td>
                        <td className="px-3 py-3 font-bold text-green-400">{(r.totalRevenue||0).toLocaleString('ar-EG')} ج</td>
                        <td className="px-3 py-3 font-bold text-orange-400">{(r.totalProfit||0).toLocaleString('ar-EG')} ج</td>
                        <td className="px-3 py-3 text-[var(--text-secondary)]">{(r.avgSellPrice||0).toLocaleString('ar-EG')} ج</td>
                        <td className="px-3 py-3 text-[var(--text-muted)] text-xs">{formatDate(r.lastSaleDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
