import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Zap, TrendingUp, FileText, Download, Printer } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { exportToPDF, exportToExcel, exportToCSV, printTable, formatCurrency, formatDate, getDateRange } from '../lib/exportUtils';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN = () => localStorage.getItem('moto_token');
const COLORS = ['#6366f1','#a855f7','#10b981','#eab308','#3b82f6','#ec4899','#f97316','#06b6d4'];

const COLS = [
  { key: 'name', header: 'السكوتر' },
  { key: 'brand', header: 'الماركة' },
  { key: 'model', header: 'الموديل' },
  { key: 'totalSold', header: 'عدد المباع' },
  { key: 'totalRevenue', header: 'إجمالي الإيرادات', format: v => `${Number(v).toLocaleString('ar-EG')} ج` },
  { key: 'totalProfit', header: 'إجمالي الأرباح', format: v => `${Number(v).toLocaleString('ar-EG')} ج` },
  { key: 'avgSellPrice', header: 'متوسط سعر البيع', format: v => `${Number(v).toLocaleString('ar-EG')} ج` },
  { key: 'lastSaleDate', header: 'آخر عملية بيع', format: v => formatDate(v) },
];

const PERIODS = [
  { l: 'اليوم', v: 'today' },
  { l: 'الأسبوع', v: 'week' },
  { l: 'الشهر', v: 'month' },
  { l: 'السنة', v: 'year' },
  { l: 'مخصص', v: 'custom' },
];

export default function ScooterReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('custom');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const applyPeriod = p => {
    setPeriod(p);
    if (p !== 'custom') { const { from, to } = getDateRange(p); setFromDate(from || ''); setToDate(to || ''); }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);
      const res = await axios.get(`${API}/reports/scooters?${params}`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      setReport(res.data?.data || null);
    } catch { toast.error('فشل تحميل تقارير السكوترات'); }
    finally { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary = report?.summary || { totalSold: 0, totalRevenue: 0, totalProfit: 0, stockCount: 0 };
  const byModel = report?.byModel || [];
  const byBrand = report?.byBrand || [];
  const displayData = byModel.map(r => ({ ...r, name: `${r.brand} ${r.model}` }));

  const tooltipStyle = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '12px',
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Zap style={{ color: '#6366f1' }} size={26} /> تقارير السكوترات 🛵
          </h1>
          <p className="page-subtitle">تقارير وتحليلات مبيعات السكوترات</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportToPDF({ title: 'تقرير السكوترات', columns: COLS, rows: displayData, filename: 'scooters-report' })} className="btn-secondary"><FileText size={14} /> PDF</button>
          <button onClick={() => exportToExcel({ title: 'تقرير السكوترات', columns: COLS, rows: displayData, filename: 'scooters-report' })} className="btn-secondary"><Download size={14} /> Excel</button>
          <button onClick={() => exportToCSV({ columns: COLS, rows: displayData, filename: 'scooters-report' })} className="btn-secondary">CSV</button>
          <button onClick={() => printTable({ title: 'تقرير السكوترات', columns: COLS, rows: displayData })} className="btn-secondary"><Printer size={14} /> طباعة</button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          {PERIODS.map(p => (
            <button key={p.v} onClick={() => applyPeriod(p.v)} style={{
              padding: '7px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              background: period === p.v ? '#6366f1' : 'var(--bg-card2)',
              color: period === p.v ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${period === p.v ? '#6366f1' : 'var(--border)'}`,
              transition: 'all 0.2s',
            }}>{p.l}</button>
          ))}
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input-field" style={{ width: 'auto' }} />
              <span style={{ color: 'var(--text-muted)' }}>—</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input-field" style={{ width: 'auto' }} />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
          <div style={{ width: '40px', height: '40px', border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
          جاري التحميل...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'السكوترات المباعة', value: `${summary.totalSold} سكوتر`, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
              { label: 'إجمالي الإيرادات', value: formatCurrency(summary.totalRevenue), color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
              { label: 'إجمالي الأرباح', value: formatCurrency(summary.totalProfit), color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
              { label: 'المتاح بالمخزون', value: `${summary.stockCount} نوع`, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'الماركة الأكثر مبيعاً', value: report?.topBrand || 'لا يوجد' },
              { label: 'الموديل الأكثر مبيعاً', value: report?.bestModel ? `${report.bestModel.brand} ${report.bestModel.model} (${report.bestModel.totalSold} مباع)` : 'لا يوجد' },
              { label: 'الموديل الأقل مبيعاً', value: report?.worstModel ? `${report.worstModel.brand} ${report.worstModel.model} (${report.worstModel.totalSold} مباع)` : 'لا يوجد' },
            ].map((h, i) => (
              <div key={i} className="card text-center">
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h.label}</div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '8px' }}>{h.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="chart-container">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '16px' }}>المبيعات حسب الماركة</h3>
              {byBrand.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byBrand} dataKey="totalSold" nameKey="_id" cx="50%" cy="50%" outerRadius={75}
                      label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                      {byBrand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={v => `${v} مباع`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>لا توجد بيانات</div>}
            </div>
            <div className="chart-container">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '16px' }}>إيرادات الماركات</h3>
              {byBrand.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byBrand}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="_id" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => `${Number(v).toLocaleString()} ج`} />
                    <Bar dataKey="totalRevenue" name="إيرادات" fill="#6366f1" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>لا توجد بيانات</div>}
            </div>
          </div>

          <div className="table-wrapper">
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>تفاصيل المبيعات حسب الموديل</h3>
            </div>
            {byModel.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>لا توجد تفاصيل مبيعات للسكوترات</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>الماركة</th><th>الموديل</th><th>عدد المباع</th>
                    <th>إجمالي الإيرادات</th><th>إجمالي الأرباح</th><th>متوسط السعر</th><th>آخر عملية بيع</th>
                  </tr>
                </thead>
                <tbody>
                  {byModel.map((r, i) => (
                    <tr key={r._id || i}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.brand}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.model}</td>
                      <td><span className="badge badge-info">{r.totalSold}</span></td>
                      <td style={{ fontWeight: 700, color: '#22c55e' }}>{(r.totalRevenue || 0).toLocaleString('ar-EG')} ج</td>
                      <td style={{ fontWeight: 700, color: '#f97316' }}>{(r.totalProfit || 0).toLocaleString('ar-EG')} ج</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{(r.avgSellPrice || 0).toLocaleString('ar-EG')} ج</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{formatDate(r.lastSaleDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
