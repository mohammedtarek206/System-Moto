import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Droplet, TrendingUp, Package, Search, FileText, Download, Printer, Star, AlertTriangle } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToCSV, printTable, formatCurrency, formatDate, getDateRange } from '../lib/exportUtils';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN = () => localStorage.getItem('moto_token');

const PERIODS = [
  { l: 'اليوم', v: 'today' },
  { l: 'الأسبوع', v: 'week' },
  { l: 'الشهر', v: 'month' },
  { l: 'السنة', v: 'year' },
  { l: 'مخصص', v: 'custom' },
];

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
    if (p !== 'custom') { const { from, to } = getDateRange(p); setFromDate(from || ''); setToDate(to || ''); }
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
    !search || (r.nameAr || r.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totals = {
    totalSold:    filtered.reduce((a, r) => a + (r.totalSold    || 0), 0),
    totalRevenue: filtered.reduce((a, r) => a + (r.totalRevenue || 0), 0),
    totalProfit:  filtered.reduce((a, r) => a + (r.totalProfit  || 0), 0),
    currentStock: filtered.reduce((a, r) => a + (r.currentStock || 0), 0),
  };

  const bestSelling  = filtered.length > 0 ? filtered.reduce((a, b) => (a.totalSold || 0) > (b.totalSold || 0) ? a : b) : null;
  const worstSelling = filtered.length > 0 ? filtered.reduce((a, b) => (a.totalSold || 0) < (b.totalSold || 0) ? a : b) : null;

  const displayData = filtered.map(r => ({ ...r, name: r.nameAr || r.name || '-' }));

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Droplet style={{ color: '#22c55e' }} size={26} /> تقارير الزيوت
          </h1>
          <p className="page-subtitle">تقرير تفصيلي لمبيعات الزيوت</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportToPDF({ title: 'تقرير الزيوت', columns: COLS, rows: displayData, filename: 'oils-report' })} className="btn-secondary"><FileText size={14} /> PDF</button>
          <button onClick={() => exportToExcel({ title: 'تقرير الزيوت', columns: COLS, rows: displayData, filename: 'oils-report' })} className="btn-secondary"><Download size={14} /> Excel</button>
          <button onClick={() => exportToCSV({ columns: COLS, rows: displayData, filename: 'oils-report' })} className="btn-secondary">CSV</button>
          <button onClick={() => printTable({ title: 'تقرير الزيوت', columns: COLS, rows: displayData })} className="btn-secondary"><Printer size={14} /> طباعة</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          {PERIODS.map(p => (
            <button key={p.v} onClick={() => applyPeriod(p.v)}
              style={{
                padding: '7px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                background: period === p.v ? '#22c55e' : 'var(--bg-card2)',
                color: period === p.v ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${period === p.v ? '#22c55e' : 'var(--border)'}`,
                transition: 'all 0.2s',
              }}>
              {p.l}
            </button>
          ))}
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input-field" style={{ width: 'auto' }} />
              <span style={{ color: 'var(--text-muted)' }}>—</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input-field" style={{ width: 'auto' }} />
            </div>
          )}
          <div className="relative" style={{ marginInlineStart: 'auto' }}>
            <Search size={14} style={{ position: 'absolute', insetInlineStart: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن زيت..." className="input-field" style={{ paddingInlineStart: '32px', width: '180px' }} />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الكميات المباعة', value: `${totals.totalSold.toLocaleString('ar-EG')} عبوة`, icon: Droplet, from: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: 'إجمالي المبيعات', value: formatCurrency(totals.totalRevenue), icon: TrendingUp, from: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'إجمالي الأرباح', value: formatCurrency(totals.totalProfit), icon: TrendingUp, from: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          { label: 'الكمية بالمخزن', value: `${totals.currentStock.toLocaleString('ar-EG')} عبوة`, icon: Package, from: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} style={{ color: s.from }} />
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: s.from, marginTop: '4px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Best / Worst selling highlights */}
      {(bestSelling || worstSelling) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestSelling && (
            <div className="card flex items-center gap-4">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={22} style={{ color: '#22c55e' }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>أكثر زيت مبيعاً</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>{bestSelling.nameAr || bestSelling.name}</div>
                <div style={{ fontSize: '13px', color: '#22c55e' }}>{bestSelling.totalSold} عبوة مباعة</div>
              </div>
            </div>
          )}
          {worstSelling && (
            <div className="card flex items-center gap-4">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>أقل زيت مبيعاً</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>{worstSelling.nameAr || worstSelling.name}</div>
                <div style={{ fontSize: '13px', color: '#ef4444' }}>{worstSelling.totalSold} عبوة مباعة</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
            تفاصيل مبيعات الزيوت
            <span className="badge badge-success" style={{ marginInlineStart: '10px' }}>{filtered.length} نوع</span>
          </h3>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid #22c55e', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            جاري التحميل...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
            <Droplet size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p>لا توجد بيانات في هذه الفترة</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>اسم الزيت</th>
                <th>الكميات المباعة</th>
                <th>إجمالي المبيعات</th>
                <th>إجمالي الأرباح</th>
                <th>الكمية بالمخزن</th>
                <th>متوسط السعر</th>
                <th>آخر عملية بيع</th>
                <th>أكثر عميل</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <motion.tr key={r.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.nameAr || r.name || '-'}</td>
                  <td><span className="badge badge-info">{r.totalSold || 0}</span></td>
                  <td style={{ fontWeight: 700, color: '#22c55e' }}>{(r.totalRevenue || 0).toLocaleString('ar-EG')} ج</td>
                  <td style={{ fontWeight: 700, color: '#f97316' }}>{(r.totalProfit || 0).toLocaleString('ar-EG')} ج</td>
                  <td><span className={`badge ${(r.currentStock || 0) > 0 ? 'badge-success' : 'badge-danger'}`}>{r.currentStock || 0}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{(r.avgSellPrice || 0).toLocaleString('ar-EG')} ج</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{formatDate(r.lastSaleDate)}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{r.topCustomer || '-'}</td>
                </motion.tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-table-header)', borderTop: '2px solid var(--border)' }}>
                <td colSpan={2} style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>الإجمالي</td>
                <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>{totals.totalSold}</td>
                <td style={{ padding: '12px 16px', fontWeight: 900, color: '#22c55e' }}>{totals.totalRevenue.toLocaleString('ar-EG')} ج</td>
                <td style={{ padding: '12px 16px', fontWeight: 900, color: '#f97316' }}>{totals.totalProfit.toLocaleString('ar-EG')} ج</td>
                <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>{totals.currentStock}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
