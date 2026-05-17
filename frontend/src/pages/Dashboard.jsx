import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Package, Users, ShoppingCart, 
  AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

export default function Dashboard() {
  const { t, isRTL, lang } = useLang();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="stat-card h-32 skeleton" />
      ))}
    </div>
  );

  const formatCurrency = (val) => new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
    style: 'currency', currency: 'EGP'
  }).format(val);

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-primary)]">
            {isRTL ? 'مرحباً، ' : 'Welcome, '}{user?.name} 👋
          </h2>
          <p className="text-[var(--text-muted)] text-sm">
            {isRTL ? 'إليك ما يحدث في المحل اليوم' : "Here's what's happening in your shop today"}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] p-2 rounded-2xl">
          <Clock size={16} className="text-orange-500" />
          <span className="text-sm font-bold">{new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex-between mb-4">
            <div className="stat-icon bg-orange-500/10 text-orange-500">
              <DollarSign size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full font-bold">
              <TrendingUp size={12} /> {stats?.today?.count || 0} {isRTL ? 'فاتورة' : 'inv'}
            </div>
          </div>
          <div className="text-[var(--text-muted)] text-sm font-semibold">{t('todaySales')}</div>
          <div className="text-2xl font-black mt-1">{formatCurrency(stats?.today?.revenue || 0)}</div>
        </div>

        <div className="stat-card">
          <div className="flex-between mb-4">
            <div className="stat-icon bg-blue-500/10 text-blue-500">
              <ShoppingCart size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full font-bold">
              {stats?.month?.count || 0} {isRTL ? 'فاتورة' : 'inv'}
            </div>
          </div>
          <div className="text-[var(--text-muted)] text-sm font-semibold">{t('monthSales')}</div>
          <div className="text-2xl font-black mt-1">{formatCurrency(stats?.month?.revenue || 0)}</div>
        </div>

        <div className="stat-card">
          <div className="flex-between mb-4">
            <div className="stat-icon bg-green-500/10 text-green-500">
              <Package size={24} />
            </div>
          </div>
          <div className="text-[var(--text-muted)] text-sm font-semibold">{t('totalProducts')}</div>
          <div className="text-2xl font-black mt-1">{stats?.products?.total || 0}</div>
        </div>

        <div className="stat-card">
          <div className="flex-between mb-4">
            <div className="stat-icon bg-red-500/10 text-red-500">
              <AlertTriangle size={24} />
            </div>
            {(stats?.products?.low_stock || 0) > 0 && (
              <div className="flex items-center gap-1 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded-full font-bold">
                {isRTL ? 'تحتاج توريد' : 'Need restock'}
              </div>
            )}
          </div>
          <div className="text-[var(--text-muted)] text-sm font-semibold">{t('lowStock')}</div>
          <div className="text-2xl font-black mt-1">{stats?.products?.low_stock || 0}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 chart-container h-[400px]">
          <div className="flex-between mb-6">
            <h3 className="font-bold text-lg">{isRTL ? 'إحصائيات المبيعات (14 يوم)' : 'Sales Stats (14 Days)'}</h3>
            <div className="flex gap-2">
               <span className="flex items-center gap-2 text-xs font-bold"><span className="w-3 h-3 rounded-full bg-orange-500" /> {t('total')}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.chartData || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="var(--text-muted)" 
                fontSize={12} 
                tickFormatter={(val) => new Date(val).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: '2-digit', month: 'short' })}
              />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
                labelStyle={{ fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container h-[400px]">
          <h3 className="font-bold text-lg mb-6">{t('topProducts')}</h3>
          <div className="space-y-4">
            {stats?.topProducts?.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-card2)] border border-[var(--border)] flex items-center justify-center font-bold text-orange-500 text-xs">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {isRTL ? (p.product_name_ar || p.product_name) : p.product_name}
                  </div>
                  <div className="w-full bg-[var(--bg-card2)] h-1.5 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full"
                      style={{ width: `${(p.sold / (stats.topProducts[0].sold || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs font-bold text-[var(--text-muted)]">{p.sold} {isRTL ? 'قطعة' : 'pcs'}</div>
              </div>
            ))}
            {(!stats?.topProducts || stats.topProducts.length === 0) && (
              <div className="text-center py-10 text-[var(--text-muted)] text-sm">
                {t('noData')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="table-wrapper">
          <div className="p-4 border-b border-[var(--border)] flex-between">
            <h3 className="font-bold">{t('recentSales')}</h3>
            <button className="text-orange-500 text-xs font-bold hover:underline">{isRTL ? 'عرض الكل' : 'View All'}</button>
          </div>
          <div className="overflow-x-auto">
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
                    <td className="font-mono text-xs">{sale.invoice_number}</td>
                    <td>{sale.customer_name || (isRTL ? 'عميل نقدي' : 'Cash Customer')}</td>
                    <td className="font-bold">{formatCurrency(sale.total)}</td>
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
          <div className="p-4 border-b border-[var(--border)] flex-between">
            <h3 className="font-bold">{isRTL ? 'منتجات تحتاج للطلب' : 'Low Stock Products'}</h3>
            <button className="text-orange-500 text-xs font-bold hover:underline">{isRTL ? 'عرض المخزن' : 'View Stock'}</button>
          </div>
          <div className="p-4 space-y-4">
            {stats?.lowStockItems?.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--bg-card2)] border border-[var(--border)]">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">
                  📦
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{isRTL ? item.name_ar || item.name : item.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{isRTL ? 'الكمية الحالية: ' : 'Stock: '} {item.quantity}</div>
                </div>
                <div className="text-end">
                   <div className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-lg">
                    {isRTL ? 'منخفض' : 'Low'}
                   </div>
                </div>
              </div>
            ))}
            {(!stats?.lowStockItems || stats.lowStockItems.length === 0) && (
              <div className="text-center py-10 text-[var(--text-muted)] text-sm">
                {isRTL ? 'المخزن بحالة جيدة 👍' : 'Stock is healthy 👍'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
