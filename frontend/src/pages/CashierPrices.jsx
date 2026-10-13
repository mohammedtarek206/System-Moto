import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Tag, RefreshCw, CheckCircle, XCircle, Filter, Edit3, Save, X, Download } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { PRODUCT_TYPES, exportToExcel, formatCurrency } from '../lib/exportUtils';

const PRODUCT_TYPE_LABELS = {
    spare_parts: 'قطع الغيار', oils: 'الزيوت', motorcycles: 'الموتوسيكلات',
    scooters: 'السكوترات', batteries: 'البطاريات', tires: 'الإطارات',
    accessories: 'الإكسسوارات', extras: 'الكماليات', other: 'أخرى'
};

export default function CashierPrices() {
    const { isRTL } = useLang();
    const { user } = useAuth();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});

    // Filters
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterHasCashierPrice, setFilterHasCashierPrice] = useState('');

    // Inline edit state: { [productId]: { cashierPrice: '', minSellPrice: '' } }
    const [editing, setEditing] = useState({});

    const isAdmin = user?.role === 'admin' || user?.role === 'warehouse';

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (filterCategory) params.set('category', filterCategory);
            if (filterType) params.set('product_type', filterType);
            if (filterHasCashierPrice) params.set('has_cashier_price', filterHasCashierPrice);
            const res = await api.get(`/products/cashier-prices?${params}`);
            setProducts(res.data.data || []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'فشل تحميل البيانات');
        } finally { setLoading(false); }
    }, [search, filterCategory, filterType, filterHasCashierPrice]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    useEffect(() => {
        api.get('/products/categories').then(r => setCategories(r.data.data || [])).catch(() => { });
    }, []);

    const startEdit = (product) => {
        setEditing(prev => ({
            ...prev,
            [product._id]: {
                cashierPrice: product.cashierPrice != null ? String(product.cashierPrice) : '',
                minSellPrice: product.minSellPrice != null ? String(product.minSellPrice) : ''
            }
        }));
    };

    const cancelEdit = (id) => {
        setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    };

    const saveProduct = async (product) => {
        const vals = editing[product._id];
        if (!vals) return;
        setSaving(prev => ({ ...prev, [product._id]: true }));
        try {
            const payload = {
                cashierPrice: vals.cashierPrice === '' ? null : Number(vals.cashierPrice),
                minSellPrice: vals.minSellPrice === '' ? null : Number(vals.minSellPrice)
            };
            const res = await api.put(`/products/${product._id}/cashier-price`, payload);
            setProducts(prev => prev.map(p => p._id === product._id ? res.data.data : p));
            cancelEdit(product._id);
            toast.success('تم حفظ سعر الكاشير');
        } catch (err) {
            toast.error(err.response?.data?.message || 'فشل الحفظ');
        } finally { setSaving(prev => ({ ...prev, [product._id]: false })); }
    };

    const clearCashierPrice = async (product) => {
        if (!window.confirm(`هل تريد حذف سعر الكاشير للمنتج "${product.name || product.nameAr}"؟`)) return;
        setSaving(prev => ({ ...prev, [product._id]: true }));
        try {
            const res = await api.put(`/products/${product._id}/cashier-price`, { cashierPrice: null });
            setProducts(prev => prev.map(p => p._id === product._id ? res.data.data : p));
            toast.success('تم مسح سعر الكاشير');
        } catch (err) {
            toast.error(err.response?.data?.message || 'فشل المسح');
        } finally { setSaving(prev => ({ ...prev, [product._id]: false })); }
    };

    const handleExcelExport = () => {
        const rows = products.map(p => ({
            sku: p.sku || '-',
            name: p.nameAr || p.name || '-',
            productType: PRODUCT_TYPE_LABELS[p.productType] || p.productType,
            category: p.category?.nameAr || p.category?.name || '-',
            sellPrice: p.sellPrice,
            cashierPrice: p.cashierPrice ?? '-',
            diff: p.cashierPrice != null ? (p.cashierPrice - p.sellPrice).toFixed(2) : '-',
            status: p.cashierPrice != null ? 'محدد' : 'غير محدد',
            updatedAt: p.cashierPriceUpdatedAt ? new Date(p.cashierPriceUpdatedAt).toLocaleDateString('ar-EG') : '-',
            updatedBy: p.cashierPriceUpdatedByName || p.cashierPriceUpdatedBy?.name || '-'
        }));
        exportToExcel({
            title: 'أسعار الكاشير',
            columns: [
                { key: 'sku', header: 'الكود' }, { key: 'name', header: 'اسم المنتج' },
                { key: 'productType', header: 'نوع المنتج' }, { key: 'category', header: 'التصنيف' },
                { key: 'sellPrice', header: 'السعر الأساسي' }, { key: 'cashierPrice', header: 'سعر الكاشير' },
                { key: 'diff', header: 'الفرق' }, { key: 'status', header: 'الحالة' },
                { key: 'updatedAt', header: 'آخر تحديث' }, { key: 'updatedBy', header: 'بواسطة' }
            ],
            rows,
            filename: 'cashier-prices'
        });
    };

    const stats = {
        total: products.length,
        withCashierPrice: products.filter(p => p.cashierPrice != null && p.cashierPrice > 0).length,
        withoutCashierPrice: products.filter(p => !p.cashierPrice).length,
    };

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <Tag className="text-orange-500" size={28} />
                        {isRTL ? 'أسعار الكاشير' : 'Cashier Prices'}
                    </h1>
                    <p className="page-subtitle">{isRTL ? 'إدارة أسعار الكاشير المستقلة لكل منتج' : 'Manage independent POS prices per product'}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExcelExport} className="btn btn-secondary gap-2">
                        <Download size={16} /> Excel
                    </button>
                    <button onClick={fetchProducts} className="btn btn-secondary gap-2">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        {isRTL ? 'تحديث' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: isRTL ? 'إجمالي المنتجات' : 'Total Products', value: stats.total, color: 'text-blue-400' },
                    { label: isRTL ? 'بسعر كاشير' : 'With Cashier Price', value: stats.withCashierPrice, color: 'text-emerald-400' },
                    { label: isRTL ? 'بدون سعر كاشير' : 'Without Cashier Price', value: stats.withoutCashierPrice, color: 'text-amber-400' },
                ].map((s, i) => (
                    <div key={i} className="card text-center">
                        <div className="text-[11px] text-[var(--text-muted)] font-bold mb-1">{s.label}</div>
                        <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex flex-wrap gap-3">
                    <div className="relative form-icon-group flex-1 min-w-[200px]">
                        <Search className="input-icon" size={16} />
                        <input
                            type="text" className="form-input h-11"
                            placeholder={isRTL ? 'بحث بالاسم أو الكود أو الباركود...' : 'Search...'}
                            value={search} onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="form-input h-11 min-w-[150px]" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                        <option value="">{isRTL ? 'كل التصنيفات' : 'All Categories'}</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.nameAr || c.name}</option>)}
                    </select>
                    <select className="form-input h-11 min-w-[150px]" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="">{isRTL ? 'كل الأنواع' : 'All Types'}</option>
                        {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.labelAr}</option>)}
                    </select>
                    <select className="form-input h-11 min-w-[170px]" value={filterHasCashierPrice} onChange={e => setFilterHasCashierPrice(e.target.value)}>
                        <option value="">{isRTL ? 'كل المنتجات' : 'All Products'}</option>
                        <option value="true">{isRTL ? 'بسعر كاشير فقط' : 'With Cashier Price'}</option>
                        <option value="false">{isRTL ? 'بدون سعر كاشير' : 'Without Cashier Price'}</option>
                    </select>
                    {(search || filterCategory || filterType || filterHasCashierPrice) && (
                        <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterType(''); setFilterHasCashierPrice(''); }}
                            className="btn btn-secondary h-11 gap-1 text-red-400">
                            <X size={14} /> {isRTL ? 'مسح' : 'Clear'}
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="font-bold text-base">{isRTL ? 'جدول أسعار الكاشير' : 'Cashier Prices Table'}
                        <span className="badge badge-info ms-2">{products.length} {isRTL ? 'منتج' : 'products'}</span>
                    </h3>
                </div>
                {loading ? (
                    <div className="flex-center py-20"><RefreshCw className="animate-spin text-orange-500" size={32} /></div>
                ) : products.length === 0 ? (
                    <div className="flex-center flex-col py-20 opacity-30">
                        <Tag size={48} />
                        <p className="mt-4 font-bold">{isRTL ? 'لا توجد منتجات' : 'No products'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{isRTL ? 'الكود' : 'SKU'}</th>
                                    <th>{isRTL ? 'اسم المنتج' : 'Product'}</th>
                                    <th>{isRTL ? 'النوع/التصنيف' : 'Type/Category'}</th>
                                    <th>{isRTL ? 'السعر الأساسي' : 'Base Price'}</th>
                                    <th>{isRTL ? 'سعر الكاشير' : 'Cashier Price'}</th>
                                    <th>{isRTL ? 'الفرق' : 'Diff'}</th>
                                    <th>{isRTL ? 'الحد الأدنى' : 'Min Price'}</th>
                                    <th>{isRTL ? 'الحالة' : 'Status'}</th>
                                    <th>{isRTL ? 'آخر تحديث' : 'Updated'}</th>
                                    {isAdmin && <th>{isRTL ? 'إجراء' : 'Action'}</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product, idx) => {
                                    const isEditing = !!editing[product._id];
                                    const isSaving = !!saving[product._id];
                                    const hasCashierPrice = product.cashierPrice != null && product.cashierPrice > 0;
                                    const diff = hasCashierPrice ? (product.cashierPrice - product.sellPrice) : null;

                                    return (
                                        <motion.tr key={product._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}>
                                            <td className="text-[var(--text-muted)]">{idx + 1}</td>
                                            <td className="font-mono text-xs text-orange-400">{product.sku || '-'}</td>
                                            <td>
                                                <div className="font-bold">{product.nameAr || product.name || `${product.brand} ${product.model}`}</div>
                                                <div className="text-xs text-[var(--text-muted)]">{product.barcode}</div>
                                            </td>
                                            <td>
                                                <div className="text-xs font-bold">{PRODUCT_TYPE_LABELS[product.productType] || product.productType}</div>
                                                <div className="text-xs text-[var(--text-muted)]">{product.category?.nameAr || product.category?.name || '-'}</div>
                                            </td>
                                            <td className="font-bold">{formatCurrency(product.sellPrice)}</td>

                                            {/* سعر الكاشير - قابل للتعديل */}
                                            <td>
                                                {isEditing ? (
                                                    <input
                                                        type="number" min="0" step="0.01"
                                                        className="w-28 form-input h-9 text-sm font-bold text-orange-400"
                                                        value={editing[product._id].cashierPrice}
                                                        onChange={e => setEditing(prev => ({ ...prev, [product._id]: { ...prev[product._id], cashierPrice: e.target.value } }))}
                                                        placeholder={isRTL ? 'سعر الكاشير' : 'Cashier Price'}
                                                        autoFocus
                                                    />
                                                ) : hasCashierPrice ? (
                                                    <span className="font-black text-orange-400">{formatCurrency(product.cashierPrice)}</span>
                                                ) : (
                                                    <span className="text-[var(--text-muted)] text-xs">-</span>
                                                )}
                                            </td>

                                            {/* الفرق */}
                                            <td>
                                                {diff != null ? (
                                                    <span className={`font-bold text-sm ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                                                        {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                                                    </span>
                                                ) : '-'}
                                            </td>

                                            {/* الحد الأدنى */}
                                            <td>
                                                {isEditing ? (
                                                    <input
                                                        type="number" min="0" step="0.01"
                                                        className="w-24 form-input h-9 text-sm"
                                                        value={editing[product._id].minSellPrice}
                                                        onChange={e => setEditing(prev => ({ ...prev, [product._id]: { ...prev[product._id], minSellPrice: e.target.value } }))}
                                                        placeholder="-"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-[var(--text-muted)]">{product.minSellPrice != null ? formatCurrency(product.minSellPrice) : '-'}</span>
                                                )}
                                            </td>

                                            {/* الحالة */}
                                            <td>
                                                {hasCashierPrice ? (
                                                    <span className="badge badge-success flex items-center gap-1 w-fit">
                                                        <CheckCircle size={11} /> {isRTL ? 'محدد' : 'Set'}
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-warning flex items-center gap-1 w-fit">
                                                        <XCircle size={11} /> {isRTL ? 'غير محدد' : 'Not Set'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* آخر تحديث */}
                                            <td className="text-xs text-[var(--text-muted)]">
                                                {product.cashierPriceUpdatedAt ? (
                                                    <>
                                                        <div>{new Date(product.cashierPriceUpdatedAt).toLocaleDateString('ar-EG')}</div>
                                                        <div className="opacity-60">{product.cashierPriceUpdatedByName || product.cashierPriceUpdatedBy?.name || '-'}</div>
                                                    </>
                                                ) : '-'}
                                            </td>

                                            {/* الإجراءات */}
                                            {isAdmin && (
                                                <td>
                                                    {isEditing ? (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => saveProduct(product)} disabled={isSaving}
                                                                className="btn btn-primary btn-sm h-8 gap-1 text-xs">
                                                                {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                                                                {isRTL ? 'حفظ' : 'Save'}
                                                            </button>
                                                            <button onClick={() => cancelEdit(product._id)} className="btn btn-secondary btn-sm h-8 gap-1 text-xs">
                                                                <X size={12} /> {isRTL ? 'إلغاء' : 'Cancel'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => startEdit(product)}
                                                                className="btn btn-secondary btn-sm h-8 gap-1 text-xs text-orange-400">
                                                                <Edit3 size={12} /> {isRTL ? 'تعديل' : 'Edit'}
                                                            </button>
                                                            {hasCashierPrice && (
                                                                <button onClick={() => clearCashierPrice(product)} disabled={isSaving}
                                                                    className="btn btn-secondary btn-sm h-8 gap-1 text-xs text-red-400 hover:bg-red-500/10">
                                                                    <XCircle size={12} /> {isRTL ? 'مسح' : 'Clear'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
