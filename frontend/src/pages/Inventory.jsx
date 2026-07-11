import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Warehouse, ArrowUpRight, ArrowDownLeft, AlertTriangle, History, Search, 
  RefreshCw, Package, PlusCircle, Barcode as BarcodeIcon, Settings, 
  ChevronRight, Plus, ArrowUpCircle, Printer, Grid, ShoppingCart, Tag, Info, User,
  FileText, Download, TrendingDown, Hourglass
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';
import { exportToPDF, exportToExcel, printTable, formatCurrency } from '../lib/exportUtils';

export default function Inventory() {
  const { t, isRTL } = useLang();
  const [activeTab, setActiveTab] = useState('board');
  const [loading, setLoading] = useState(false);

  // States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [stagnant, setStagnant] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | low | out | stagnant

  // Tab 3: Top-up stock state
  const [topupProductId, setTopupProductId] = useState('');
  const [topupQty, setTopupQty] = useState(1);
  const [topupBuyPrice, setTopupBuyPrice] = useState('');
  const [topupSellPrice, setTopupSellPrice] = useState('');

  // Tab 4: Add new product state
  const [newProduct, setNewProduct] = useState({
    name: '', nameAr: '', category: '', buyPrice: '', sellPrice: '',
    quantity: 0, minQuantity: 5, sku: '', barcode: '', motoType: '', unit: 'piece', productType: 'spare_parts'
  });

  // Tab 5: Barcode print state
  const [printProductId, setPrintProductId] = useState('');
  const [printQuantity, setPrintQuantity] = useState(6);
  const printComponentRef = useRef();

  const fetchInventoryStats = useCallback(async () => {
    try {
      const res = await api.get('/products/inventory-stats');
      if (res.data?.success) {
        setStagnant(res.data.data.stagnantProducts || []);
      }
    } catch {}
  }, []);

  const fetchInventoryBoard = useCallback(async () => {
    setLoading(true);
    try {
      const q = searchQuery ? `&search=${searchQuery}` : '';
      let low = '';
      if (filterType === 'low') low = '&low_stock=true';
      
      const [productsRes, lowStockRes] = await Promise.all([
        api.get(`/products?limit=10000${q}${low}`),
        api.get('/products?low_stock=true')
      ]);
      
      let filteredProds = productsRes.data.data || [];
      if (filterType === 'out') {
        filteredProds = filteredProds.filter(p => p.quantity <= 0);
      } else if (filterType === 'stagnant') {
        // match against stagnant products from stats endpoint
        const stagnantIds = new Set(stagnant.map(s => s._id));
        filteredProds = filteredProds.filter(p => stagnantIds.has(p._id));
      }

      setProducts(filteredProds);
      setLowStock(lowStockRes.data.data || []);
    } catch {
      toast.error(isRTL ? 'فشل تحميل المنتجات' : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType, stagnant, isRTL]);

  useEffect(() => {
    fetchInventoryStats();
  }, [fetchInventoryStats]);

  useEffect(() => {
    fetchInventoryBoard();
    fetchCategoriesAndSuppliers();
  }, [fetchInventoryBoard]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchCategoriesAndSuppliers = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        api.get('/products/categories'),
        api.get('/contacts?type=supplier')
      ]);
      setCategories(catRes.data.data || []);
      setSuppliers(supRes.data.data || []);
    } catch {}
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/logs');
      setLogs(res.data.data || []);
    } catch {
      toast.error(isRTL ? 'فشل تحميل سجل حركة المخزن' : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const generateSKUAndBarcode = () => {
    const stamp = Date.now().toString().slice(-7);
    const rand = Math.floor(100 + Math.random() * 900).toString();
    const cleanBarcode = `${stamp}${rand}`;
    setNewProduct(prev => ({
      ...prev,
      sku: `MOTO-${stamp}-${rand}`,
      barcode: cleanBarcode
    }));
    toast.success(isRTL ? 'تم توليد باركود رقمي نظيف للتوافق مع قارئ الباركود!' : 'Clean barcode generated!');
  };

  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    if (!topupProductId) {
      toast.error(isRTL ? 'الرجاء اختيار المنتج أولاً' : 'Please select product');
      return;
    }
    setLoading(true);
    try {
      const prod = products.find(p => p._id === topupProductId);
      const updatedQty = (prod?.quantity || 0) + Number(topupQty);
      
      const payload = { quantity: updatedQty };
      if (topupBuyPrice) payload.buyPrice = Number(topupBuyPrice);
      if (topupSellPrice) payload.sellPrice = Number(topupSellPrice);

      await api.put(`/products/${topupProductId}`, payload);
      
      toast.success(isRTL ? 'تم إضافة الكمية وتحديث المخزون بنجاح!' : 'Stock incremented successfully');
      setTopupProductId('');
      setTopupQty(1);
      setTopupBuyPrice('');
      setTopupSellPrice('');
      fetchInventoryBoard();
      setActiveTab('board');
    } catch {
      toast.error(isRTL ? 'فشل تعديل المخزون' : 'Failed to top-up');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/products', newProduct);
      toast.success(isRTL ? 'تم إدراج الصنف الجديد وتأسيس مخزونه بنجاح!' : 'Product added successfully');
      setNewProduct({
        name: '', nameAr: '', category: '', buyPrice: '', sellPrice: '',
        quantity: 0, minQuantity: 5, sku: '', barcode: '', motoType: '', unit: 'piece', productType: 'spare_parts'
      });
      fetchInventoryBoard();
      setActiveTab('board');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBarcodes = () => {
    const printContent = printComponentRef.current;
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0'; iframe.style.bottom = '0';
    iframe.style.width = '0px'; iframe.style.height = '0px';
    iframe.style.border = 'none'; iframe.style.zIndex = '-1000';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    let stylesHtml = '';
    for (const node of document.querySelectorAll('style, link[rel="stylesheet"]')) {
      stylesHtml += node.outerHTML;
    }

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print Barcodes</title>
          ${stylesHtml}
          <style>
            @page { size: auto; margin: 3mm; }
            body { background: white !important; color: black !important; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
            .print-grid { display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 8px !important; }
            .barcode-label { 
              border: 1.5px solid #000000 !important; 
              padding: 6px !important; 
              background: white !important; 
              color: black !important; 
              break-inside: avoid; 
              page-break-inside: avoid; 
              height: 135px !important; 
              display: flex !important; 
              flex-direction: column !important; 
              align-items: center !important; 
              justify-content: center !important; 
              text-align: center !important; 
            }
            @media print { body, body * { visibility: visible !important; } .print-grid, .print-grid *, .barcode-label, .barcode-label * { visibility: visible !important; } }
          </style>
        </head>
        <body dir="${isRTL ? 'rtl' : 'ltr'}">
          <div class="print-grid">${printContent.innerHTML}</div>
          <script>
            setTimeout(() => {
              window.focus(); window.print();
              setTimeout(() => { window.parent.document.body.removeChild(window.frameElement); }, 500);
            }, 300);
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  // Exports
  const columns = [
    { key: 'name', header: 'الاسم' },
    { key: 'sku', header: 'SKU' },
    { key: 'barcode', header: 'الباركود' },
    { key: 'buyPrice', header: 'سعر الشراء', format: v => `${v.toLocaleString('ar-EG')} ج` },
    { key: 'sellPrice', header: 'سعر البيع', format: v => `${v.toLocaleString('ar-EG')} ج` },
    { key: 'quantity', header: 'الكمية' },
    { key: 'categoryName', header: 'التصنيف' },
    { key: 'motoType', header: 'نوع الموتسيكل' },
  ];

  const handleExportPDF = () => {
    const rows = products.map(p => ({
      ...p,
      name: p.nameAr || p.name,
      categoryName: p.category?.name || '-'
    }));
    exportToPDF({ title: 'تقرير جرد المخازن', columns, rows, filename: 'inventory-report' });
  };

  const handleExportExcel = () => {
    const rows = products.map(p => ({
      ...p,
      name: p.nameAr || p.name,
      categoryName: p.category?.name || '-'
    }));
    exportToExcel({ title: 'تقرير جرد المخازن', columns, rows, filename: 'inventory-report' });
  };

  const handlePrint = () => {
    const rows = products.map(p => ({
      ...p,
      name: p.nameAr || p.name,
      categoryName: p.category?.name || '-'
    }));
    printTable({ title: 'تقرير جرد المخازن', columns, rows });
  };

  const selectedPrintProduct = products.find(p => p._id === printProductId);

  return (
    <div className="space-y-6 fade-in">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{isRTL ? 'المخزن وإدارة السلع' : 'Inventory & Products'}</h1>
          <p className="page-subtitle">{isRTL ? 'مركز التحكم في الأصناف ونواقص المخازن وحركة البضائع والباركود' : 'Unified control center for products, stock limits, logs, and barcodes'}</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'board' && (
            <>
              <button onClick={handleExportPDF} className="btn btn-secondary gap-1.5 text-xs"><FileText size={15} /> PDF</button>
              <button onClick={handleExportExcel} className="btn btn-secondary gap-1.5 text-xs"><Download size={15} /> Excel</button>
              <button onClick={handlePrint} className="btn btn-secondary gap-1.5 text-xs"><Printer size={15} /> طباعة</button>
            </>
          )}
          <button onClick={fetchInventoryBoard} className="btn btn-primary gap-2">
            <RefreshCw size={18} className={loading ? 'loading-spin' : ''} />
            {isRTL ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tabs list bar */}
      <div className="flex flex-wrap border-b border-[var(--border)] gap-2 pb-px shrink-0">
        {[
          { id: 'board', label: isRTL ? 'لوحة المخزن الحالية' : 'Stock Overview', icon: Grid },
          { id: 'logs', label: isRTL ? 'حركة المنتجات (البيع والشراء)' : 'Stock Logs', icon: History },
          { id: 'topup', label: isRTL ? 'زيادة كمية منتج موجود' : 'Quick Stock In', icon: ArrowUpCircle },
          { id: 'new', label: isRTL ? 'إضافة منتج جديد' : 'New Product', icon: PlusCircle },
          { id: 'barcodes', label: isRTL ? 'طباعة ملصقات الباركود' : 'Barcode Labels', icon: Printer }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-12 px-5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.id ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="pt-2">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: STOCK BOARD */}
          {activeTab === 'board' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* Board Header Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative form-icon-group flex-1 w-full max-w-md">
                  <Search className="input-icon" size={18} />
                  <input 
                    type="text" className="form-input h-11 text-xs" 
                    placeholder={isRTL ? 'بحث بالاسم، الباركود، SKU...' : 'Search by name, barcode, SKU...'}
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0 justify-end">
                  {[
                    { id: 'all', label: isRTL ? 'كل المنتجات' : 'All Products', icon: Grid },
                    { id: 'low', label: isRTL ? `نواقص (${lowStock.length})` : `Low Stock (${lowStock.length})`, icon: AlertTriangle, color: 'text-red-400 bg-red-500/10' },
                    { id: 'out', label: isRTL ? 'نفد المخزون' : 'Out of Stock', icon: TrendingDown, color: 'text-rose-400 bg-rose-500/10' },
                    { id: 'stagnant', label: isRTL ? `منتجات راكدة (${stagnant.length})` : `Stagnant (${stagnant.length})`, icon: Hourglass, color: 'text-purple-400 bg-purple-500/10' }
                  ].map(filter => (
                    <button 
                      key={filter.id}
                      onClick={() => setFilterType(filter.id)}
                      className={`btn h-11 px-4 gap-2 text-xs font-bold border rounded-2xl transition-all ${filterType === filter.id ? 'bg-orange-500 border-orange-500 text-white' : 'btn-secondary'}`}
                    >
                      <filter.icon size={15} />
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Table */}
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{isRTL ? 'اسم المنتج' : 'Product Name'}</th>
                      <th>{isRTL ? 'الرموز' : 'SKU / Barcode'}</th>
                      <th>{isRTL ? 'سعر الشراء' : 'Buy Price'}</th>
                      <th>{isRTL ? 'سعر البيع' : 'Sell Price'}</th>
                      <th>{isRTL ? 'المخزون الحالي' : 'Stock'}</th>
                      <th>{isRTL ? 'التصنيف' : 'Category'}</th>
                      <th>{isRTL ? 'نوع الموتسيكل' : 'Moto Type'}</th>
                      <th>{isRTL ? 'الإجراءات' : 'Quick Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [...Array(6)].map((_, i) => <tr key={i}><td colSpan="8"><div className="h-10 skeleton my-1 rounded-xl" /></td></tr>)
                    ) : products.length === 0 ? (
                      <tr><td colSpan="8" className="text-center py-20 opacity-30">{t('noData')}</td></tr>
                    ) : products.map(p => (
                      <tr key={p._id} className={p.quantity <= (p.minQuantity || 5) ? 'bg-red-500/5' : ''}>
                        <td>
                          <div className="font-bold text-white text-sm">{isRTL ? p.nameAr || p.name : p.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{p.unit}</div>
                        </td>
                        <td>
                          <div className="text-xs font-mono text-[var(--text-muted)]">SKU: {p.sku || '---'}</div>
                          <div className="text-xs font-mono text-[var(--text-muted)]">BC: {p.barcode || '---'}</div>
                        </td>
                        <td className="font-bold text-blue-400">{Number(p.buyPrice || 0).toFixed(2)} EGP</td>
                        <td className="font-black text-green-400">{Number(p.sellPrice || 0).toFixed(2)} EGP</td>
                        <td>
                          <span className={`font-black text-base ${p.quantity <= (p.minQuantity || 5) ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {p.quantity}
                          </span>
                          {p.quantity <= (p.minQuantity || 5) && (
                            <span className="ms-2 badge badge-danger text-[9px]">{isRTL ? 'ناقص ⚠️' : 'Low Stock ⚠️'}</span>
                          )}
                        </td>
                        <td className="text-xs text-[var(--text-muted)]">{p.category?.name || '---'}</td>
                        <td className="text-xs font-bold text-orange-400">{p.motoType || '---'}</td>
                        <td>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setTopupProductId(p._id); setTopupBuyPrice(p.buyPrice); setTopupSellPrice(p.sellPrice); setActiveTab('topup'); }}
                              className="btn btn-secondary btn-sm h-8 rounded-lg text-[10px] text-orange-400 gap-1 border-[var(--border)] bg-[var(--bg-card2)] hover:border-orange-500/30"
                            >
                              <Plus size={12} /> {isRTL ? 'زيادة مخزون' : 'Add Qty'}
                            </button>
                            <button 
                              onClick={() => { setPrintProductId(p._id); setActiveTab('barcodes'); }}
                              className="btn btn-secondary btn-sm h-8 rounded-lg text-[10px] text-purple-400 gap-1 border-[var(--border)] bg-[var(--bg-card2)] hover:border-purple-500/30"
                            >
                              <Printer size={12} /> {isRTL ? 'ملصقات' : 'Labels'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 2: MOVEMENT HISTORY LOGS */}
          {activeTab === 'logs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <History className="text-orange-500 animate-spin" style={{ animationDuration: '4s' }} size={22} />
                <h2 className="font-black text-lg text-white">{isRTL ? 'حركة المنتجات التفصيلية (سجل التعديلات)' : 'Detailed Inventory Movement Logs'}</h2>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{isRTL ? 'اسم المنتج' : 'Product'}</th>
                      <th>{isRTL ? 'نوع العملية' : 'Movement Type'}</th>
                      <th>{isRTL ? 'الكمية المضافة/المخصومة' : 'Qty Adjusted'}</th>
                      <th>{isRTL ? 'الكمية قبل' : 'Qty Before'}</th>
                      <th>{isRTL ? 'الكمية بعد' : 'Qty After'}</th>
                      <th>{isRTL ? 'مرجعية العملية' : 'Reference'}</th>
                      <th>{isRTL ? 'بواسطة' : 'User'}</th>
                      <th>{isRTL ? 'التاريخ والوقت' : 'Date & Time'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [...Array(6)].map((_, i) => <tr key={i}><td colSpan="8"><div className="h-10 skeleton my-1 rounded-xl" /></td></tr>)
                    ) : logs.length === 0 ? (
                      <tr><td colSpan="8" className="text-center py-10 opacity-30">{t('noData')}</td></tr>
                    ) : logs.map(log => (
                      <tr key={log._id}>
                        <td className="font-bold text-white">{log.productName || '---'}</td>
                        <td>
                          <span className={`badge ${
                            log.type === 'in' ? 'badge-success' : 
                            log.type === 'out' ? 'badge-danger' : 
                            log.type === 'return' ? 'badge-orange' : 'badge-gray'
                          }`}>
                            {log.type === 'in' ? (isRTL ? 'توريد / مشتريات +' : 'Inbound +') : 
                             log.type === 'out' ? (isRTL ? 'صرف مبيعات -' : 'Outbound -') :
                             log.type === 'return' ? (isRTL ? 'مرتجع مبيعات' : 'Return') : (isRTL ? 'تعديل مخزون' : 'Adjustment')}
                          </span>
                        </td>
                        <td className="font-black text-base text-white">{log.quantity}</td>
                        <td className="opacity-70 font-mono">{log.quantityBefore !== undefined ? log.quantityBefore : '---'}</td>
                        <td className="font-black font-mono text-orange-400">{log.quantityAfter !== undefined ? log.quantityAfter : '---'}</td>
                        <td className="text-xs italic text-[var(--text-muted)]">{log.notes || '---'}</td>
                        <td className="text-xs text-blue-400">{log.user?.name || 'System'}</td>
                        <td className="text-xs opacity-75 font-mono">
                          {new Date(log.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 3: QUICK STOCK TOP-UP */}
          {activeTab === 'topup' && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
              <div className="p-8 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl space-y-6">
                
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                    <ArrowUpCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white italic">{isRTL ? 'زيادة وتوريد مخزون صنف متواجد' : 'Top-Up Existing Product Qty'}</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{isRTL ? 'قم بزيادة الكمية المتاحة لأي منتج مسجل مسبقاً وتعديل الأسعار سريعاً' : 'Direct stock addition and instant pricing topups'}</p>
                  </div>
                </div>

                <form onSubmit={handleTopupSubmit} className="space-y-5 pt-4">
                  
                  <div className="form-group">
                    <label className="form-label">{isRTL ? 'اختر المنتج المراد تزويده' : 'Select Product'}</label>
                    <select 
                      className="form-input h-12" required value={topupProductId}
                      onChange={e => {
                        const val = e.target.value;
                        setTopupProductId(val);
                        const prod = products.find(p => p._id === val);
                        if (prod) {
                          setTopupBuyPrice(prod.buyPrice || '');
                          setTopupSellPrice(prod.sellPrice || '');
                        }
                      }}
                    >
                      <option value="">{isRTL ? '-- اختر المنتج --' : '-- Select Product --'}</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.nameAr || p.name} (SKU: {p.sku || '---'} | المخزون الحالي: {p.quantity})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label className="form-label text-green-400 font-bold">{isRTL ? 'الكمية المراد إضافتها (+)' : 'Quantity to Add'}</label>
                      <input 
                        type="number" className="form-input h-12 font-black text-lg text-center" required min="1"
                        value={topupQty} onChange={e => setTopupQty(Math.max(1, Number(e.target.value)))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isRTL ? 'تعديل سعر الشراء (اختياري)' : 'Edit Buy Price (Optional)'}</label>
                      <input 
                        type="number" step="any" className="form-input h-12 font-bold text-blue-400"
                        value={topupBuyPrice} onChange={e => setTopupBuyPrice(e.target.value)}
                        placeholder={isRTL ? 'سعر الشراء الحالي' : 'Current cost price'}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isRTL ? 'تعديل سعر البيع (اختياري)' : 'Edit Sell Price (Optional)'}</label>
                      <input 
                        type="number" step="any" className="form-input h-12 font-bold text-green-400"
                        value={topupSellPrice} onChange={e => setTopupSellPrice(e.target.value)}
                        placeholder={isRTL ? 'سعر البيع الحالي' : 'Current sell price'}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]/50">
                    <button type="button" onClick={() => setActiveTab('board')} className="btn btn-secondary h-12 px-6 rounded-2xl font-bold">{isRTL ? 'إلغاء' : 'Cancel'}</button>
                    <button 
                      type="submit" disabled={loading}
                      className="btn btn-primary h-12 px-8 rounded-2xl font-black bg-gradient-to-r from-orange-500 to-red-600 text-white min-w-[140px]"
                    >
                      {loading ? <RefreshCw className="loading-spin" size={20} /> : (isRTL ? 'زيادة المخزون الآن' : 'TOP-UP STOCK NOW')}
                    </button>
                  </div>

                </form>

              </div>
            </motion.div>
          )}

          {/* TAB 4: ADD NEW PRODUCT */}
          {activeTab === 'new' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto">
              <div className="p-8 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl space-y-6">
                
                <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
                  <div className="flex gap-3 items-center">
                    <PlusCircle className="text-orange-500" size={24} />
                    <h2 className="text-xl font-black text-white italic">{isRTL ? 'تسجيل منتج وقطعة غيار جديدة' : 'Add New Spare Part / Product'}</h2>
                  </div>
                  <button 
                    type="button" onClick={generateSKUAndBarcode}
                    className="btn btn-secondary btn-sm h-10 rounded-xl text-xs gap-1 border-blue-500/20 text-blue-400"
                  >
                    <BarcodeIcon size={14} />
                    {isRTL ? 'توليد باركود تلقائي' : 'Auto Generate Codes'}
                  </button>
                </div>

                <form onSubmit={handleAddProductSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">{isRTL ? 'الاسم باللغة العربية' : 'Arabic Name'}</label>
                      <input 
                        type="text" className="form-input h-12" required
                        value={newProduct.nameAr} onChange={e => setNewProduct({...newProduct, nameAr: e.target.value, name: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isRTL ? 'الاسم باللغة الإنجليزية (اختياري)' : 'English Name (Optional)'}</label>
                      <input 
                        type="text" className="form-input h-12" 
                        value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label className="form-label">{isRTL ? 'كود الصنف SKU' : 'SKU'}</label>
                      <input 
                        type="text" className="form-input h-12 font-mono" required
                        value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isRTL ? 'الباركود Barcode' : 'Barcode'}</label>
                      <input 
                        type="text" className="form-input h-12 font-mono" required
                        value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isRTL ? 'نوع الموتسيكل المتوافق' : 'Moto Type'}</label>
                      <input 
                        type="text" className="form-input h-12" placeholder="مثال: دايون 4، بوكسر..."
                        value={newProduct.motoType} onChange={e => setNewProduct({...newProduct, motoType: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label className="form-label">{isRTL ? 'نوع المنتج' : 'Product Type'}</label>
                      <select 
                        className="form-input h-12" required value={newProduct.productType}
                        onChange={e => setNewProduct({...newProduct, productType: e.target.value})}
                      >
                        <option value="spare_parts">{isRTL ? 'قطع غيار' : 'Spare Parts'}</option>
                        <option value="oils">{isRTL ? 'زيوت' : 'Oils'}</option>
                        <option value="batteries">{isRTL ? 'بطاريات' : 'Batteries'}</option>
                        <option value="tires">{isRTL ? 'إطارات' : 'Tires'}</option>
                        <option value="accessories">{isRTL ? 'إكسسوارات' : 'Accessories'}</option>
                        <option value="extras">{isRTL ? 'كماليات' : 'Extras'}</option>
                        <option value="other">{isRTL ? 'أخرى' : 'Other'}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isRTL ? 'تصنيف الصنف' : 'Category'}</label>
                      <select 
                        className="form-input h-12" required value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                      >
                        <option value="">{isRTL ? '-- اختر التصنيف --' : '-- Select Category --'}</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isRTL ? 'الوحدة' : 'Unit'}</label>
                      <select 
                        className="form-input h-12" required value={newProduct.unit}
                        onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                      >
                        <option value="piece">{isRTL ? 'قطعة' : 'Piece'}</option>
                        <option value="pair">{isRTL ? 'جوز' : 'Pair'}</option>
                        <option value="set">{isRTL ? 'طقم' : 'Set'}</option>
                        <option value="box">{isRTL ? 'علبة' : 'Box'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-3xl bg-[var(--bg-card2)] border border-[var(--border)]">
                    <div className="form-group">
                      <label className="form-label text-blue-400 font-bold">{isRTL ? 'سعر الشراء' : 'Buy Price'}</label>
                      <input 
                        type="number" step="any" className="form-input h-12 text-lg font-black text-center text-blue-500" required
                        value={newProduct.buyPrice} onChange={e => setNewProduct({...newProduct, buyPrice: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label text-green-400 font-bold">{isRTL ? 'سعر البيع' : 'Sell Price'}</label>
                      <input 
                        type="number" step="any" className="form-input h-12 text-lg font-black text-center text-green-500" required
                        value={newProduct.sellPrice} onChange={e => setNewProduct({...newProduct, sellPrice: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label text-white font-bold">{isRTL ? 'الكمية الابتدائية للمخزن' : 'Initial Stock'}</label>
                      <input 
                        type="number" className="form-input h-12 text-lg font-black text-center" required
                        value={newProduct.quantity} onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label text-red-400 font-bold">{isRTL ? 'الحد الأدنى للتنبيه' : 'Low stock limit'}</label>
                      <input 
                        type="number" className="form-input h-12 text-lg font-black text-center text-red-500" required
                        value={newProduct.minQuantity} onChange={e => setNewProduct({...newProduct, minQuantity: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]/50">
                    <button type="button" onClick={() => setActiveTab('board')} className="btn btn-secondary h-12 px-6 rounded-2xl font-bold">{isRTL ? 'إلغاء' : 'Cancel'}</button>
                    <button 
                      type="submit" disabled={loading}
                      className="btn btn-primary h-12 px-8 rounded-2xl font-black bg-gradient-to-r from-orange-500 to-red-600 text-white min-w-[140px]"
                    >
                      {loading ? <RefreshCw className="loading-spin" size={20} /> : (isRTL ? 'تأسيس وحفظ المنتج' : 'CREATE PRODUCT')}
                    </button>
                  </div>
                </form>

              </div>
            </motion.div>
          )}

          {/* TAB 5: BARCODE LABELS PRINT */}
          {activeTab === 'barcodes' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col md:flex-row gap-6">
              
              {/* Configuration Panel */}
              <div className="w-full md:w-[350px] bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-xl flex flex-col gap-6 shrink-0 h-fit">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mb-1">
                    <Printer className="text-orange-500 animate-pulse" />
                    {isRTL ? 'إعداد ملصقات الباركود' : 'Barcode Layout Manager'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">{isRTL ? 'اختر المنتج المسجل لتوليد الباركود وتحديد كمية الطباعة' : 'Select product to generate label counts'}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">{isRTL ? 'اختر منتجاً' : 'Select Product'}</label>
                  <select 
                    className="form-input h-12" value={printProductId}
                    onChange={e => setPrintProductId(e.target.value)}
                  >
                    <option value="">{isRTL ? '-- اختر صنفاً --' : '-- Choose Item --'}</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.nameAr || p.name} ({p.sku || p.barcode})</option>
                    ))}
                  </select>
                </div>

                {printProductId && (
                  <div className="space-y-4 pt-4 border-t border-[var(--border)]/50">
                    <div className="form-group">
                      <label className="form-label">{isRTL ? 'كمية النسخ المطلوبة للطباعة' : 'Number of labels'}</label>
                      <input 
                        type="number" className="form-input h-12 font-black text-lg text-center" min="1"
                        value={printQuantity} onChange={e => setPrintQuantity(Math.max(1, Number(e.target.value)))}
                      />
                    </div>

                    <button 
                      type="button" onClick={handlePrintBarcodes}
                      className="w-full btn btn-primary h-14 text-lg font-black gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white"
                    >
                      <Printer size={20} />
                      {isRTL ? 'أمر طباعة الملصقات' : 'PRINT LABELS NOW'}
                    </button>
                  </div>
                )}
              </div>

              {/* Print Preview panel */}
              <div className="flex-1 bg-white p-6 rounded-[2.5rem] min-h-[400px] border border-[var(--border)] shadow-inner overflow-auto">
                <div className="mb-4 text-xs font-bold text-slate-400 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                  <Info size={14} className="text-slate-400" />
                  <span>{isRTL ? 'معاينة ملصقات الباركود الورقية قبل الإرسال للطابعة:' : 'Live preview:'}</span>
                </div>

                <div 
                  ref={printComponentRef} 
                  className="print-grid grid grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-max p-4 bg-white text-black rounded-2xl"
                >
                  {selectedPrintProduct ? (
                    [...Array(printQuantity)].map((_, i) => (
                      <div key={i} className="barcode-label border border-dashed border-slate-300 p-3 bg-white text-black break-inside-avoid flex flex-col items-center justify-center min-h-[145px]">
                        <div className="text-[11px] font-extrabold truncate leading-tight w-full mb-0.5 text-slate-900">
                          {selectedPrintProduct.nameAr || selectedPrintProduct.name}
                        </div>
                        <div className="text-xs font-black text-slate-900 mb-1.5">
                          {selectedPrintProduct.sellPrice.toFixed(2)} EGP
                        </div>
                        <div className="w-full flex justify-center shrink-0">
                          <Barcode 
                            value={selectedPrintProduct.barcode || selectedPrintProduct.sku} 
                            format="CODE128"
                            width={1.4}
                            height={45}
                            fontSize={11}
                            background="#ffffff"
                            lineColor="#000000"
                            margin={8}
                            displayValue={true}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full h-[300px] flex-center flex-col text-slate-300 gap-3">
                      <BarcodeIcon size={48} className="opacity-20 animate-pulse text-slate-400" />
                      <span className="font-bold text-sm text-slate-400">{isRTL ? 'الرجاء اختيار صنف من اللوحة الجانبية لعرض الملصقات' : 'Select item to view barcode layout'}</span>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
