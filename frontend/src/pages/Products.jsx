import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, Download, Edit, Trash2, 
  Package, AlertCircle, RefreshCw, Barcode
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function Products() {
  const { t, isRTL } = useLang();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [search, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?search=${search}&category=${categoryFilter}`);
      setProducts(res.data.data);
    } catch (err) {
      toast.error(isRTL ? 'فشل تحميل المنتجات' : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data.data);
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success(isRTL ? 'تم حذف المنتج' : 'Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(isRTL ? 'فشل الحذف' : 'Delete failed');
    }
  };

  const handleExport = () => {
    const dataToExport = products.map(p => ({
      [isRTL ? 'اسم المنتج' : 'Product Name']: isRTL ? p.nameAr || p.name : p.name,
      [isRTL ? 'الكود' : 'SKU']: p.sku,
      [isRTL ? 'التصنيف' : 'Category']: isRTL ? p.category?.nameAr || p.category?.name : p.category?.name,
      [isRTL ? 'السعر' : 'Price']: p.sellPrice,
      [isRTL ? 'الكمية' : 'Quantity']: p.quantity
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "Moto_Products.xlsx");
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('products')}</h1>
          <p className="page-subtitle">{isRTL ? 'إدارة قطع الغيار والمخزون' : 'Manage motorcycle parts and stock'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="btn btn-secondary gap-2 hide-mobile">
            <Download size={18} />
            {t('export')}
          </button>
          <button 
            onClick={() => { setEditingProduct(null); setShowAddModal(true); }}
            className="btn btn-primary gap-2"
          >
            <Plus size={18} />
            {isRTL ? 'إضافة منتج جديد' : 'Add New Product'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)]">
        <div className="md:col-span-2 relative search-input">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="form-input" 
            placeholder={isRTL ? 'بحث بالاسم، الكود...' : 'Search by name, SKU...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select 
            className="form-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">{isRTL ? 'كل التصنيفات' : 'All Categories'}</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{isRTL ? c.nameAr || c.name : c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchProducts} className="btn btn-secondary flex-1">
            <RefreshCw size={18} className={loading ? 'loading-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('productName')}</th>
                <th>{t('sku')}</th>
                <th>{t('category')}</th>
                <th>{t('price')}</th>
                <th>{t('quantity')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan="7"><div className="h-10 skeleton my-1" /></td></tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-20 text-[var(--text-muted)]">
                    <div className="flex flex-col items-center gap-3">
                      <Package size={48} className="opacity-20" />
                      {t('noData')}
                    </div>
                  </td>
                </tr>
              ) : products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="font-bold">{isRTL ? p.nameAr || p.name : p.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{p.motoType}</div>
                  </td>
                  <td className="font-mono text-xs">{p.sku}</td>
                  <td>
                    <span className="badge badge-info" style={{ backgroundColor: `${p.category?.color}20`, color: p.category?.color, borderColor: `${p.category?.color}40` }}>
                      {isRTL ? p.category?.nameAr || p.category?.name : p.category?.name}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm font-bold text-orange-500">{p.sellPrice} {t('currency')}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{isRTL ? 'تكلفة: ' : 'Cost: '} {p.buyPrice}</div>
                  </td>
                  <td>
                    <div className={`badge ${p.quantity <= p.minQuantity ? 'badge-danger' : 'badge-success'}`}>
                      {p.quantity} {p.unit === 'piece' ? (isRTL ? 'قطعة' : 'pcs') : p.unit}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingProduct(p); setShowAddModal(true); }} className="p-2 hover:bg-[var(--bg-card2)] rounded-lg text-blue-400"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(p._id)} className="p-2 hover:bg-[var(--bg-card2)] rounded-lg text-red-400"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
           <ProductModal 
            product={editingProduct} categories={categories}
            onClose={() => setShowAddModal(false)} 
            onSuccess={() => { setShowAddModal(false); fetchProducts(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductModal({ product, categories, onClose, onSuccess }) {
  const { t, isRTL } = useLang();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    nameAr: product?.nameAr || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    category: product?.category?._id || product?.category || '',
    motoType: product?.motoType || '',
    buyPrice: product?.buyPrice || '',
    sellPrice: product?.sellPrice || '',
    quantity: product?.quantity || 0,
    minQuantity: product?.minQuantity || 5,
    unit: product?.unit || 'piece',
    description: product?.description || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));

    try {
      if (product) {
        await api.put(`/products/${product._id}`, data);
        toast.success(isRTL ? 'تم التحديث بنجاح' : 'Updated successfully');
      } else {
        await api.post('/products', data);
        toast.success(isRTL ? 'تمت الإضافة بنجاح' : 'Added successfully');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-box max-w-2xl">
        <div className="modal-header">
          <h2 className="text-xl font-bold">{product ? t('editProduct') : t('addProduct')}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm"><Plus className="rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">Name (EN)</label><input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/></div>
            <div className="form-group"><label className="form-label">الاسم (AR)</label><input type="text" className="form-input" required value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t('sku')}</label><input type="text" className="form-input" required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t('barcode')}</label><div className="relative search-input"><Barcode className="search-icon" size={16} /><input type="text" className="form-input" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})}/></div></div>
            <div className="form-group">
              <label className="form-label">{t('category')}</label>
              <select className="form-input" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{isRTL ? c.nameAr : c.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t('motoType')}</label><input type="text" className="form-input" value={formData.motoType} onChange={e => setFormData({...formData, motoType: e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t('buyPrice')}</label><input type="number" step="0.01" className="form-input" required value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t('sellPrice')}</label><input type="number" step="0.01" className="form-input" required value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t('quantity')}</label><input type="number" className="form-input" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t('minQty')}</label><input type="number" className="form-input" value={formData.minQuantity} onChange={e => setFormData({...formData, minQuantity: e.target.value})}/></div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">{t('cancel')}</button>
            <button type="submit" disabled={loading} className="btn btn-primary min-w-[120px]">{loading ? <RefreshCw className="loading-spin" size={18} /> : t('save')}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
