import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Warehouse, ArrowUpRight, ArrowDownLeft, AlertTriangle, History, Search, RefreshCw, Package } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Inventory() {
  const { t, isRTL } = useLang();
  const [logs, setLogs] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [logsRes, lowRes] = await Promise.all([
        api.get('/inventory/logs'),
        api.get('/products?low_stock=true')
      ]);
      setLogs(logsRes.data.data);
      setLowStock(lowRes.data.data);
    } catch {
      toast.error(isRTL ? 'فشل تحميل بيانات المخزن' : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex-between">
        <div>
          <h1 className="page-title">{isRTL ? 'المخزن' : 'Inventory'}</h1>
          <p className="page-subtitle">{isRTL ? 'متابعة حركة القطع والمخزون المنخفض' : 'Track parts movement and low stock'}</p>
        </div>
        <button onClick={fetchInventoryData} className="btn btn-secondary gap-2">
          <RefreshCw size={18} className={loading ? 'loading-spin' : ''} />
          {isRTL ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-500" size={20} />
            <h2 className="font-bold text-lg">{isRTL ? 'نواقص المخزن' : 'Low Stock Alerts'}</h2>
          </div>
          {lowStock.length === 0 ? (
            <div className="p-10 bg-green-500/5 border border-green-500/20 rounded-3xl text-center">
              <Package className="mx-auto text-green-500 opacity-20 mb-2" size={32} />
              <div className="text-green-500 text-sm font-bold">{isRTL ? 'المخزون ممتاز' : 'Stock is healthy'}</div>
            </div>
          ) : lowStock.map(p => (
            <div key={p._id} className="stat-card p-4 flex items-center justify-between border-s-4 border-red-500">
              <div>
                <div className="font-bold text-sm">{isRTL ? p.nameAr || p.name : p.name}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{p.sku}</div>
              </div>
              <div className="text-end">
                <div className="text-red-500 font-black text-lg">{p.quantity}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{isRTL ? 'قطعة متبقية' : 'pcs left'}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Inventory Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <History className="text-orange-500" size={20} />
            <h2 className="font-bold text-lg">{isRTL ? 'سجل الحركة' : 'Movement History'}</h2>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isRTL ? 'المنتج' : 'Product'}</th>
                  <th>{isRTL ? 'النوع' : 'Type'}</th>
                  <th>{isRTL ? 'الكمية' : 'Qty'}</th>
                  <th>{isRTL ? 'بواسطة' : 'User'}</th>
                  <th>{isRTL ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                   <tr><td colSpan="5" className="text-center py-10 opacity-30">{t('noData')}</td></tr>
                ) : logs.map(log => (
                  <tr key={log._id}>
                    <td>
                      <div className="font-bold text-sm">{log.productName}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{isRTL ? 'تعديل مخزون' : 'Stock adjustment'}</div>
                    </td>
                    <td>
                      <span className={`badge ${log.type === 'in' ? 'badge-success' : 'badge-danger'}`}>
                        {log.type === 'in' ? (isRTL ? 'توريد +' : 'In +') : (isRTL ? 'صرف -' : 'Out -')}
                      </span>
                    </td>
                    <td className="font-bold">{log.quantity}</td>
                    <td className="text-xs">{log.user?.name || 'System'}</td>
                    <td className="text-[10px] opacity-60">
                      {new Date(log.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
