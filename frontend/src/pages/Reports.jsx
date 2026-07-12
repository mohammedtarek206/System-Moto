import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Download, FileText, Calendar, Filter, Search, Printer } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../lib/api';
import { exportToPDF, exportToExcel, exportToCSV, printTable, formatCurrency, formatDate, getDateRange } from '../lib/exportUtils';

const PERIODS = [
  { l: 'اليوم', le: 'Today', v: 'today' },
  { l: 'الأسبوع', le: 'Week', v: 'week' },
  { l: 'الشهر', le: 'Month', v: 'month' },
  { l: 'السنة', le: 'Year', v: 'year' },
  { l: 'مخصص', le: 'Custom', v: 'custom' },
];

const STATUS_COLORS = {
  completed: 'badge-success',
  pending: 'badge-warning',
  cancelled: 'badge-danger',
  refunded: 'badge-orange',
};

export default function Reports() {
  const { t, isRTL } = useLang();
  const { isDark } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [salesDetails, setSalesDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const applyPeriod = (p) => {
    setPeriod(p);
    if (p !== 'custom') {
      const { from, to } = getDateRange(p);
      setFromDate(from || '');
      setToDate(to || '');
    }
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);

      const [profitRes, detailsRes] = await Promise.all([
        api.get(`/dashboard/reports/profit?group_by=${period}&${params}`),
        api.get(`/sales?${params}&limit=200`).catch(() => ({ data: { data: [] } })),
      ]);
      setChartData(profitRes.data.data || []);
      setSummary(profitRes.data.summary || {});
      setSalesDetails(detailsRes.data.data || detailsRes.data || []);
    } catch {}
    setLoading(false);
  }, [period, fromDate, toDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const filtered = salesDetails.filter(s => {
    const searchLower = search.toLowerCase();
    const matchSearch = !search ||
      (s.invoice_number || '').toLowerCase().includes(searchLower) ||
      (s.customer_name || '').includes(search) ||
      (s.cashier_name || '').includes(search);
    const matchStatus  = !filterStatus  || s.status === filterStatus;
    const matchPayment = !filterPayment || s.payment_method === filterPayment;
    return matchSearch && matchStatus && matchPayment;
  });

  const totalRevenue = summary?.total_revenue || 0;
  const totalCost = summary?.total_cost || 0;
  const totalProfit = totalRevenue - totalCost;

  const COLS_EXPORT = [
    { key: 'invoice_number', header: 'رقم الفاتورة' },
    { key: 'created_at', header: 'التاريخ', format: v => formatDate(v) },
    { key: 'customer_name', header: 'اسم العميل' },
    { key: 'total', header: 'إجمالي البيع', format: v => `${Number(v).toLocaleString('ar-EG')} ج` },
    { key: 'payment_method', header: 'طريقة الدفع' },
    { key: 'status', header: 'الحالة' },
    { key: 'cashier_name', header: 'الكاشير' },
  ];

  const chartStyle = {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
    borderRadius: '12px',
    color: isDark ? '#F1F5F9' : '#0F172A',
    fontSize: '12px',
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('reports')}</h1>
          <p className="page-subtitle">{isRTL ? 'التقارير المالية وتحليل الأرباح والمبيعات' : 'Financial reports and profit analysis'}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportToPDF({ title: 'تقرير المبيعات', columns: COLS_EXPORT, rows: filtered, filename: 'sales-report' })} className="btn-secondary">
            <FileText size={14} /> PDF
          </button>
          <button onClick={() => exportToExcel({ title: 'تقرير المبيعات', columns: COLS_EXPORT, rows: filtered, filename: 'sales-report' })} className="btn-secondary">
            <Download size={14} /> Excel
          </button>
          <button onClick={() => exportToCSV({ columns: COLS_EXPORT, rows: filtered, filename: 'sales-report' })} className="btn-secondary">
            CSV
          </button>
          <button onClick={() => printTable({ title: 'تقرير المبيعات', columns: COLS_EXPORT, rows: filtered })} className="btn-secondary">
            <Printer size={14} /> {isRTL ? 'طباعة' : 'Print'}
          </button>
        </div>
      </div>

      {/* Period filter */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          {PERIODS.map(p => (
            <button key={p.v} onClick={() => applyPeriod(p.v)}
              className="px-4 py-2 rounded-xl font-bold transition-all"
              style={{
                fontSize: '13px',
                background: period === p.v ? 'var(--primary)' : 'var(--bg-card2)',
                color: period === p.v ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${period === p.v ? 'var(--primary)' : 'var(--border)'}`,
              }}>
              {isRTL ? p.l : p.le}
            </button>
          ))}
          {period === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input-field" style={{ width: 'auto' }} />
              <span style={{ color: 'var(--text-muted)' }}>—</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input-field" style={{ width: 'auto' }} />
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isRTL ? 'إجمالي قيمة المخزون' : 'Inventory Value', value: `${Number(summary?.total_stock_cost || 0).toLocaleString('ar-EG')} ${isRTL ? 'ج' : 'EGP'}`, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
          { label: isRTL ? 'إجمالي الإيرادات' : 'Total Revenue', value: `${Number(totalRevenue).toLocaleString('ar-EG')} ${isRTL ? 'ج' : 'EGP'}`, color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
          { label: isRTL ? 'إجمالي التكاليف' : 'Total Cost', value: `${Number(totalCost).toLocaleString('ar-EG')} ${isRTL ? 'ج' : 'EGP'}`, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { label: isRTL ? 'إجمالي الأرباح' : 'Total Profit', value: `${Number(totalProfit).toLocaleString('ar-EG')} ${isRTL ? 'ج' : 'EGP'}`, color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 900, marginTop: '8px', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="chart-container" style={{ height: '400px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '16px', color: 'var(--text-primary)' }}>
          {isRTL ? 'تحليل الإيرادات والأرباح' : 'Revenue & Profit Analysis'}
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} />
            <YAxis stroke="var(--text-muted)" fontSize={11} />
            <Tooltip contentStyle={chartStyle} />
            <Bar dataKey="revenue" name={isRTL ? 'الإيرادات' : 'Revenue'} fill="#f97316" radius={[4,4,0,0]} />
            <Bar dataKey="profit"  name={isRTL ? 'الأرباح' : 'Profit'}   fill="#22c55e" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Sales Table */}
      <div className="table-wrapper">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
              {isRTL ? 'تفاصيل المبيعات' : 'Sales Details'}
              <span className="badge badge-info" style={{ marginInlineStart: '10px' }}>{filtered.length}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search size={14} style={{ position: 'absolute', insetInlineStart: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRTL ? 'بحث...' : 'Search...'} className="input-field" style={{ paddingInlineStart: '32px', width: '180px' }} />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field" style={{ width: 'auto' }}>
                <option value="">{isRTL ? 'كل الحالات' : 'All Status'}</option>
                <option value="completed">{t('completed')}</option>
                <option value="pending">{t('pending')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select>
              <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} className="input-field" style={{ width: 'auto' }}>
                <option value="">{isRTL ? 'كل طرق الدفع' : 'All Payment'}</option>
                <option value="cash">{t('cash')}</option>
                <option value="card">{t('card')}</option>
                <option value="transfer">{t('transfer')}</option>
                <option value="credit">{t('credit')}</option>
              </select>
            </div>
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <div className="loading-spin" style={{ width: '32px', height: '32px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} />
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{isRTL ? 'رقم الفاتورة' : 'Invoice No.'}</th>
                <th>{isRTL ? 'التاريخ' : 'Date'}</th>
                <th>{isRTL ? 'الوقت' : 'Time'}</th>
                <th>{isRTL ? 'اسم العميل' : 'Customer'}</th>
                <th>{isRTL ? 'رقم الهاتف' : 'Phone'}</th>
                <th>{isRTL ? 'إجمالي البيع' : 'Total'}</th>
                <th>{isRTL ? 'طريقة الدفع' : 'Payment'}</th>
                <th>{isRTL ? 'الكاشير' : 'Cashier'}</th>
                <th>{isRTL ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const dt = row.created_at ? new Date(row.created_at) : null;
                return (
                  <tr key={row.id || i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{row.invoice_number}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {dt ? dt.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US') : '-'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {dt ? dt.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.customer_name || (isRTL ? 'عميل نقدي' : 'Cash Customer')}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{row.customer_phone || '-'}</td>
                    <td style={{ fontWeight: 700, color: '#22c55e' }}>{Number(row.total || 0).toLocaleString('ar-EG')} {isRTL ? 'ج' : 'EGP'}</td>
                    <td>
                      <span className="badge badge-info">{t(row.payment_method) || row.payment_method || '-'}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{row.cashier_name || '-'}</td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[row.status] || 'badge-gray'}`}>{t(row.status) || row.status}</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    {t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: 'var(--bg-table-header)' }}>
                  <td colSpan={6} style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{isRTL ? 'الإجمالي' : 'Total'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: '#22c55e' }}>
                    {filtered.reduce((s, r) => s + Number(r.total || 0), 0).toLocaleString('ar-EG')} {isRTL ? 'ج' : 'EGP'}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Period summary table */}
      <div className="table-wrapper">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
            {isRTL ? 'ملخص الفترات' : 'Period Summary'}
          </h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>{isRTL ? 'الفترة' : 'Period'}</th>
              <th>{isRTL ? 'عدد الفواتير' : 'Invoices'}</th>
              <th>{isRTL ? 'الإيرادات' : 'Revenue'}</th>
              <th>{isRTL ? 'التكلفة' : 'Cost'}</th>
              <th>{isRTL ? 'الأرباح' : 'Profit'}</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.period}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.invoices}</td>
                <td style={{ fontWeight: 700, color: '#f97316' }}>{Number(row.revenue || 0).toLocaleString('ar-EG')} {isRTL ? 'ج' : 'EGP'}</td>
                <td style={{ fontWeight: 700, color: '#3b82f6' }}>{Number(row.cost || 0).toLocaleString('ar-EG')} {isRTL ? 'ج' : 'EGP'}</td>
                <td style={{ fontWeight: 900, color: '#22c55e' }}>{Number(row.profit || 0).toLocaleString('ar-EG')} {isRTL ? 'ج' : 'EGP'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
