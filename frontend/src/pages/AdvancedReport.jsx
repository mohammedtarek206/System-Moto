import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { TrendingUp, Download, FileText, Printer, Search, Filter } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { exportToPDF, exportToExcel, exportToCSV, printTable, formatCurrency, formatDate, getDateRange } from '../lib/exportUtils';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN = () => localStorage.getItem('moto_token');
const COLORS = ['#2563EB','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16'];

const PERIODS = [
  { l: 'اليوم', v: 'today' },
  { l: 'الأسبوع', v: 'week' },
  { l: 'الشهر', v: 'month' },
  { l: 'السنة', v: 'year' },
  { l: 'مخصص', v: 'custom' },
];

export default function AdvancedReport({ type = 'all', title, icon: Icon, color = '#2563EB' }) {
  const { t, isRTL } = useLang();
  const { isDark } = useTheme();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [period, setPeriod] = useState('month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  
  const applyPeriod = (p) => {
    setPeriod(p);
    if (p !== 'custom') { 
      const { from, to } = getDateRange(p); 
      setFromDate(from || ''); 
      setToDate(to || ''); 
    }
  };

  // Initially set month
  useEffect(() => {
    const { from, to } = getDateRange('month');
    setFromDate(from);
    setToDate(to);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type !== 'all') params.set('type', type);
      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (brand) params.set('brand', brand);

      const res = await axios.get(`${API}/reports/advanced?${params}`, { 
        headers: { Authorization: `Bearer ${TOKEN()}` } 
      });
      setData(res.data.data);
    } catch { 
      toast.error(isRTL ? 'فشل تحميل التقرير' : 'Failed to load report'); 
    } finally { 
      setLoading(false); 
    }
  }, [type, fromDate, toDate, search, category, brand, isRTL]);

  useEffect(() => {
    if (fromDate !== undefined) fetchData();
  }, [fetchData]);

  const items = data?.items || [];
  const summary = data?.summary || { totalQuantity: 0, totalRevenue: 0, totalProfit: 0, totalInvoices: 0, avgSellPrice: 0 };
  const charts = data?.charts || { byDate: [], byProduct: [], byBrand: [], byCategory: [] };

  const COLS = [
    { key: 'invoiceNumber', header: isRTL ? 'رقم الفاتورة' : 'Invoice' },
    { key: 'createdAt', header: isRTL ? 'التاريخ' : 'Date', format: v => formatDate(v) },
    { key: 'productName', header: isRTL ? 'المنتج' : 'Product' },
    { key: 'category', header: isRTL ? 'التصنيف' : 'Category' },
    { key: 'brand', header: isRTL ? 'الماركة' : 'Brand' },
    { key: 'quantity', header: isRTL ? 'الكمية' : 'Qty' },
    { key: 'buyPrice', header: isRTL ? 'سعر الشراء' : 'Buy Price', format: v => formatCurrency(v) },
    { key: 'sellPrice', header: isRTL ? 'سعر البيع' : 'Sell Price', format: v => formatCurrency(v) },
    { key: 'totalSale', header: isRTL ? 'الإجمالي' : 'Total', format: v => formatCurrency(v) },
    { key: 'totalProfit', header: isRTL ? 'الربح' : 'Profit', format: v => formatCurrency(v) },
    { key: 'customerName', header: isRTL ? 'العميل' : 'Customer' },
    { key: 'userName', header: isRTL ? 'الموظف' : 'Employee' },
    { key: 'paymentMethod', header: isRTL ? 'طريقة الدفع' : 'Payment' },
  ];

  const tooltipStyle = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '12px',
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            {Icon && <Icon style={{ color }} size={28} />} {title}
          </h1>
          <p className="page-subtitle">
            {isRTL ? 'سجل المبيعات الدائم والمفصل' : 'Permanent detailed sales history'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportToPDF({ title, columns: COLS, rows: items, filename: `report-${type}` })} className="btn-secondary"><FileText size={14} /> PDF</button>
          <button onClick={() => exportToExcel({ title, columns: COLS, rows: items, filename: `report-${type}` })} className="btn-secondary"><Download size={14} /> Excel</button>
          <button onClick={() => exportToCSV({ columns: COLS, rows: items, filename: `report-${type}` })} className="btn-secondary">CSV</button>
          <button onClick={() => printTable({ title, columns: COLS, rows: items })} className="btn-secondary"><Printer size={14} /> {isRTL ? 'طباعة' : 'Print'}</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          {PERIODS.map(p => (
            <button key={p.v} onClick={() => applyPeriod(p.v)} style={{
              padding: '7px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              background: period === p.v ? color : 'var(--bg-card2)',
              color: period === p.v ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${period === p.v ? color : 'var(--border)'}`,
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
          
          <div className="relative" style={{ marginInlineStart: 'auto' }}>
            <Search size={14} style={{ position: 'absolute', insetInlineStart: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRTL ? 'بحث شامل...' : 'Global search...'} className="input-field" style={{ paddingInlineStart: '32px', width: '220px' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
          <div className="loading-spin" style={{ width: '40px', height: '40px', border: `2px solid ${color}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} />
          {isRTL ? 'جاري تحليل البيانات...' : 'Analyzing data...'}
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: isRTL ? 'إجمالي الفواتير' : 'Total Invoices', value: summary.totalInvoices },
              { label: isRTL ? 'المنتجات المباعة' : 'Products Sold', value: summary.totalQuantity },
              { label: isRTL ? 'إجمالي الإيرادات' : 'Total Revenue', value: formatCurrency(summary.totalRevenue), color: '#2563EB' },
              { label: isRTL ? 'إجمالي الأرباح' : 'Total Profit', value: formatCurrency(summary.totalProfit), color: '#10B981' },
              { label: isRTL ? 'متوسط سعر البيع' : 'Avg Sell Price', value: formatCurrency(summary.avgSellPrice) },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: s.color || 'var(--text-primary)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: isRTL ? 'أكثر منتج مبيعاً' : 'Best Product', data: summary.bestProduct ? `${summary.bestProduct._id} (${summary.bestProduct.sold})` : '-' },
              { label: isRTL ? 'أقل منتج مبيعاً' : 'Worst Product', data: summary.worstProduct ? `${summary.worstProduct._id} (${summary.worstProduct.sold})` : '-' },
              { label: isRTL ? 'أفضل ماركة' : 'Best Brand', data: summary.bestBrand ? `${summary.bestBrand._id} (${summary.bestBrand.sold})` : '-' },
              { label: isRTL ? 'أفضل تصنيف' : 'Best Category', data: summary.bestCategory ? `${summary.bestCategory._id} (${summary.bestCategory.sold})` : '-' },
            ].map((h, i) => (
              <div key={i} className="card text-center">
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.data}</div>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="chart-container">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                {isRTL ? 'المبيعات والأرباح' : 'Sales & Profit'}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={charts.byDate}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/><stop offset="95%" stopColor="#2563EB" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorPro" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="_id" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => formatCurrency(v)} />
                  <Area type="monotone" dataKey="revenue" name={isRTL ? 'الإيرادات' : 'Revenue'} stroke="#2563EB" fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="profit" name={isRTL ? 'الأرباح' : 'Profit'} stroke="#10B981" fill="url(#colorPro)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                {isRTL ? 'أكثر المنتجات مبيعاً' : 'Top Products'}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={charts.byProduct} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis dataKey="_id" type="category" width={100} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="sold" name={isRTL ? 'الكمية' : 'Qty'} fill={color} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
                {isRTL ? 'سجل تفاصيل العمليات' : 'Detailed Transaction Log'}
                <span className="badge badge-info" style={{ marginInlineStart: '10px' }}>{items.length} {isRTL ? 'عنصر' : 'items'}</span>
              </h3>
            </div>
            
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>{isRTL ? 'لا توجد مبيعات في هذه الفترة' : 'No sales found'}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{isRTL ? 'الفاتورة' : 'Invoice'}</th>
                      <th>{isRTL ? 'التاريخ' : 'Date'}</th>
                      <th>{isRTL ? 'اسم المنتج' : 'Product'}</th>
                      <th>{isRTL ? 'الباركود/الكود' : 'Barcode/SKU'}</th>
                      <th>{isRTL ? 'الماركة/الموديل' : 'Brand/Model'}</th>
                      <th>{isRTL ? 'الكمية' : 'Qty'}</th>
                      <th>{isRTL ? 'سعر الشراء' : 'Buy'}</th>
                      <th>{isRTL ? 'سعر البيع' : 'Sell'}</th>
                      <th>{isRTL ? 'الإجمالي' : 'Total'}</th>
                      <th>{isRTL ? 'الربح' : 'Profit'}</th>
                      <th>{isRTL ? 'العميل' : 'Customer'}</th>
                      <th>{isRTL ? 'الموظف' : 'Employee'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{r.invoiceNumber}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatDate(r.createdAt)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {r.productName}
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t(r.productType)} {r.category ? `- ${r.category}` : ''}</div>
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <div>{r.barcode || '-'}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{r.sku || '-'}</div>
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <div>{r.brand || '-'}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{r.model || '-'}</div>
                        </td>
                        <td><span className="badge badge-info">{r.quantity}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(r.buyPrice)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(r.sellPrice)}</td>
                        <td style={{ fontWeight: 700, color: '#2563EB' }}>{formatCurrency(r.totalSale)}</td>
                        <td style={{ fontWeight: 700, color: '#10B981' }}>{formatCurrency(r.totalProfit)}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                          {r.customerName}
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{r.customerPhone !== '-' ? r.customerPhone : ''}</div>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.userName}</td>
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
