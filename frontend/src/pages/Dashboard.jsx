import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Package, Users, ShoppingCart,
  AlertTriangle, DollarSign, Clock, Landmark, Receipt, ShoppingBag
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

export default function Dashboard() {
  const { t, isRTL } = useLang();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [capital, setCapital] = useState(null);
  const [recentSold, setRecentSold] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, capRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/capital/summary'),
        ]);
        setStats(statsRes.data.data);
        setCapital(capRes.data.data);
        // Try to get recent sold items
        try {
          const soldRes = await api.get('/dashboard/recent-sold?limit=10');
          setRecentSold(soldRes.data.data || []);
        } catch {
          // fallback: use recentSales from stats
          setRecentSold(statsRes.data.data?.recentSales || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const chartTooltipStyle = {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    color: isDark ? '#F1F5F9' : '#0F172A',
    fontSize: '12px'
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="stat-card h-32 skeleton" />
      ))}
    </div>
  );

  const formatCurrency = (val) => new Intl.NumberFormat('ar-EG', {
    style: 'currency', currency: 'EGP', maximumFractionDigits: 0
  }).format(val || 0);

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString(isRTL ? 'ar-EG' : 'en-US', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
    });
  };

  const statCards = [
    {
      label: t('todaySales'), value: formatCurrency(stats?.today?.revenue || 0),
      icon: DollarSign, color: '#F97316', bg: 'rgba(249,115,22,0.1)',
      badge: `${stats?.today?.count || 0} ${isRTL ? 'فاتورة' : 'inv'}`
    },
    {
      label: t('monthSales'), value: formatCurrency(stats?.month?.revenue || 0),
      icon: ShoppingCart, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',
      badge: `${stats?.month?.count || 0} ${isRTL ? 'فاتورة' : 'inv'}`
    },
    {
      label: t('totalProducts'), value: stats?.products?.total || 0,
      icon: Package, color: '#22C55E', bg: 'rgba(34,197,94,0.1)',
    },
    {
      label: t('lowStock'), value: stats?.products?.low_stock || 0,
      icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)',
      badge: (stats?.products?.low_stock || 0) > 0 ? (isRTL ? 'يحتاج توريد' : 'Restock') : null
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
            {isRTL ? 'مرحباً، ' : 'Welcome, '}{user?.name} 👋
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            {isRTL ? 'إليك ما يحدث في المحل اليوم والمركز المالي' : "Here's what's happening in your shop today"}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl px-4 py-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Clock size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: isRTL ? 'رأس المال الحالي' : 'Current Capital', value: formatCurrency(capital?.currentCapital), icon: Landmark, from: '#10b981', to: '#059669', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', desc: isRTL ? 'شاملاً الإيرادات ناقص المصروفات' : 'Including revenues minus expenses' },
          { label: isRTL ? 'إجمالي الإيرادات' : 'Total Revenue', value: formatCurrency(capital?.totalRevenue), icon: TrendingUp, from: '#3b82f6', to: '#2563eb', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', desc: isRTL ? 'مبيعات المنتجات والزيادات' : 'Product sales and positive adjustments' },
          { label: isRTL ? 'إجمالي المصروفات' : 'Total Expenses', value: formatCurrency(capital?.totalExpenses), icon: TrendingDown, from: '#f59e0b', to: '#d97706', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', desc: isRTL ? 'يشمل إيجارات، فواتير، وصيانة' : 'Includes rent, bills, maintenance' },
        ].map((card, i) => (
          <div key={i} className="rounded-3xl p-5 shadow-sm" style={{ background: 'var(--bg-card)', border: `1px solid ${card.border}` }}>
            <div className="flex-between">
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 700 }}>{card.label}</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={20} style={{ color: card.from }} />
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '10px' }}>{card.value}</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s, i) => (
          <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className="flex-between" style={{ marginBottom: '14px' }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <s.icon size={22} />
              </div>
              {s.badge && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: s.color, background: s.bg, padding: '3px 8px', borderRadius: '20px' }}>
                  {s.badge}
                </span>
              )}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 900, marginTop: '4px', color: 'var(--text-primary)' }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 chart-container" style={{ height: '380px' }}>
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
              {isRTL ? 'إحصائيات مبيعات المحل (14 يوم)' : 'Sales Stats (Last 14 Days)'}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.chartData || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="var(--text-muted)"
                fontSize={11}
                tickFormatter={(val) => new Date(val).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: '2-digit', month: 'short' })}
              />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container" style={{ height: '380px', overflowY: 'auto' }}>
          <h3 style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>{t('topProducts')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {stats?.topProducts?.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--bg-card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '12px', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isRTL ? (p.product_name_ar || p.product_name) : p.product_name}
                  </div>
                  <div style={{ width: '100%', background: 'var(--bg-card2)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg, #2563EB, #60A5FA)', height: '100%', borderRadius: '3px', width: `${(p.sold / (stats.topProducts[0]?.sold || 1)) * 100}%` }} />
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{p.sold} {isRTL ? 'قطعة' : 'pcs'}</div>
              </div>
            ))}
            {(!stats?.topProducts || stats.topProducts.length === 0) && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>{t('noData')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent sold products */}
      <div className="table-wrapper">
        <div className="flex-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '16px' }}>
              {isRTL ? 'آخر المنتجات المباعة' : 'Recently Sold Products'}
            </h3>
          </div>
          <span className="badge badge-info">{isRTL ? 'آخر 10 عمليات' : 'Last 10 items'}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{isRTL ? 'المنتج' : 'Product'}</th>
                <th>{isRTL ? 'النوع' : 'Type'}</th>
                <th>{isRTL ? 'الكمية' : 'Qty'}</th>
                <th>{isRTL ? 'سعر البيع' : 'Price'}</th>
                <th>{isRTL ? 'العميل' : 'Customer'}</th>
                <th>{isRTL ? 'وقت البيع' : 'Time'}</th>
                <th>{isRTL ? 'رقم الفاتورة' : 'Invoice'}</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentSales?.map((sale, i) => (
                <tr key={sale.id || i}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {sale.items?.[0]?.product_name || sale.customer_name || '-'}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{sale.items?.[0]?.product_type || '-'}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {sale.items?.[0]?.quantity || 1}
                  </td>
                  <td style={{ fontWeight: 700, color: '#22c55e' }}>
                    {Number(sale.total || 0).toLocaleString('ar-EG')} {isRTL ? 'ج' : 'EGP'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {sale.customer_name || (isRTL ? 'عميل نقدي' : 'Cash Customer')}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {formatTime(sale.created_at)}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{sale.invoice_number}</span>
                  </td>
                </tr>
              ))}
              {(!stats?.recentSales || stats.recentSales.length === 0) && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="table-wrapper">
          <div className="p-4 flex-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{t('recentSales')}</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('invoiceNo')}</th>
                  <th>{t('customer')}</th>
                  <th>{t('total')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentSales?.map((sale) => (
                  <tr key={sale.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{sale.invoice_number}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{sale.customer_name || (isRTL ? 'عميل نقدي' : 'Cash Customer')}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(sale.total)}</td>
                    <td>
                      <span className={`badge ${sale.status === 'completed' ? 'badge-success' : sale.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                        {t(sale.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-wrapper">
          <div className="p-4 flex-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>
              {isRTL ? 'منتجات تحتاج للطلب' : 'Low Stock Products'}
            </h3>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats?.lowStockItems?.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isRTL ? item.name_ar || item.name : item.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {isRTL ? 'الكمية: ' : 'Stock: '} {item.quantity}
                  </div>
                </div>
                <span className="badge badge-danger">{isRTL ? 'منخفض' : 'Low'}</span>
              </div>
            ))}
            {(!stats?.lowStockItems || stats.lowStockItems.length === 0) && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                {isRTL ? 'المخزون بحالة جيدة 👍' : 'Stock is healthy 👍'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
