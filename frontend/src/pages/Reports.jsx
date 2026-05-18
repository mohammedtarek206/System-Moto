import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Download, FileText, Calendar, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';

export default function Reports() {
  const { t, isRTL, lang } = useLang();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('day');

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/reports/profit?group_by=${period}`);
      setData(res.data.data);
      setSummary(res.data.summary);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex-between">
        <div>
          <h1 className="page-title">{t('reports')}</h1>
          <p className="page-subtitle">{isRTL ? 'التقارير المالية وتحليل الأرباح' : 'Financial reports and profit analysis'}</p>
        </div>
        <div className="flex gap-2">
           <select className="form-input w-40" value={period} onChange={e => setPeriod(e.target.value)}>
             <option value="day">{isRTL ? 'يومي' : 'Daily'}</option>
             <option value="month">{isRTL ? 'شهري' : 'Monthly'}</option>
             <option value="year">{isRTL ? 'سنوي' : 'Yearly'}</option>
           </select>
           <button className="btn btn-primary gap-2"><Download size={18} /> {t('export')}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
           <div className="text-[var(--text-muted)] text-sm">{isRTL ? 'إجمالي قيمة المخزون (سعر الشراء)' : 'Total Inventory Value (Cost)'}</div>
           <div className="text-2xl font-black mt-1 text-purple-400">{summary?.total_stock_cost || 0} {t('currency')}</div>
        </div>
        <div className="stat-card">
           <div className="text-[var(--text-muted)] text-sm">{isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
           <div className="text-2xl font-black mt-1 text-orange-500">{summary?.total_revenue || 0} {t('currency')}</div>
        </div>
        <div className="stat-card">
           <div className="text-[var(--text-muted)] text-sm">{isRTL ? 'إجمالي التكاليف' : 'Total Cost'}</div>
           <div className="text-2xl font-black mt-1 text-blue-500">{summary?.total_cost || 0} {t('currency')}</div>
        </div>
        <div className="stat-card">
           <div className="text-[var(--text-muted)] text-sm">{isRTL ? 'إجمالي الأرباح' : 'Total Profit'}</div>
           <div className="text-2xl font-black mt-1 text-green-500">{(summary?.total_revenue - summary?.total_cost) || 0} {t('currency')}</div>
        </div>
      </div>

      <div className="chart-container h-[450px]">
        <h3 className="font-bold mb-6">{isRTL ? 'تحليل الأرباح' : 'Profit Analysis'}</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '12px' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="revenue" name={isRTL ? 'الإيرادات' : 'Revenue'} fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" name={isRTL ? 'الأرباح' : 'Profit'} fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="table-wrapper">
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
            {data.map((row, i) => (
              <tr key={i}>
                <td className="font-bold">{row.period}</td>
                <td>{row.invoices}</td>
                <td className="text-orange-500 font-bold">{row.revenue}</td>
                <td className="text-blue-500 font-bold">{row.cost}</td>
                <td className="text-green-500 font-black">{row.profit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
