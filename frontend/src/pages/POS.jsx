import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, UserPlus,
  CreditCard, Banknote, Printer, Package, Calculator, RefreshCw, X,
  Maximize2, Minimize2, Keyboard, RotateCcw, Eye, FileText, CheckCircle, AlertTriangle, Tag
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ProfessionalInvoice from '../components/ProfessionalInvoice';
import { PRODUCT_TYPES } from '../lib/exportUtils';

const playSound = (type) => {
  try {
    const isSuccessSoundEnabled = localStorage.getItem('barcode_sound_success') !== 'false';
    const isFailSoundEnabled = localStorage.getItem('barcode_sound_fail') !== 'false';
    if (type === 'success' && !isSuccessSoundEnabled) return;
    if (type === 'fail' && !isFailSoundEnabled) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    if (type === 'success') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.08);
    } else {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(130, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.35);
    }
  } catch (e) { console.error("Audio error:", e); }
};

// ====== مساعدة: تحويل الأرقام العربية ======
const normalizeNumber = (str) => {
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(str || '').replace(/[٠-٩]/g, d => arabicNums.indexOf(d));
};

// دالة مساعدة: هل العنصر هو حقل إدخال؟
const isInputElement = (el) => {
  if (!el) return false;
  const tag = el.tagName;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return true;
  if (el.isContentEditable) return true;
  return false;
};

export default function POS() {
  const { t, isRTL } = useLang();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceDiscount, setInvoiceDiscount] = useState('');    // خصم الفاتورة الإجمالي
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  // Filtering
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');

  // Modals & Drawers
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSalesDrawer, setShowSalesDrawer] = useState(false);
  const [recentSales, setRecentSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Edit item price modal
  const [editingItem, setEditingItem] = useState(null); // { productId, field: 'price'|'discount' }

  const invoiceRef = useRef();
  const [paperSize, setPaperSize] = useState(() => localStorage.getItem('receipt_paper_size') || '80mm');
  const [autoPrint, setAutoPrint] = useState(() => localStorage.getItem('receipt_auto_print') === 'true');

  // ====== إصلاح مشكلة التركيز التلقائي ======
  // نعيد التركيز للبحث فقط عند النقر على منطقة فارغة (لا حقول إدخال)
  useEffect(() => {
    const handleClick = (e) => {
      // لا تعِد التركيز إذا النقر على حقل إدخال أو زر
      if (isInputElement(e.target)) return;
      if (e.target.closest('button')) return;
      if (e.target.closest('select')) return;
      if (e.target.closest('[contenteditable]')) return;
      // فقط إذا لم يكن هناك حقل نشط حالياً
      setTimeout(() => {
        if (!isInputElement(document.activeElement)) {
          document.getElementById('posSearchInput')?.focus();
        }
      }, 50);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    try {
      const cleanSearch = normalizeNumber(debouncedSearch.trim());
      const params = new URLSearchParams();
      params.set('limit', '10000');
      if (cleanSearch) params.set('search', cleanSearch);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedProductType) params.set('product_type', selectedProductType);

      const res = await api.get(`/products?${params.toString()}`);
      const list = res.data.data;
      setProducts(list);

      // Barcode auto-add scanner feature
      if (cleanSearch && cleanSearch.length >= 3) {
        const exactMatch = list.find(p =>
          (p.barcode && p.barcode.toUpperCase() === cleanSearch.toUpperCase()) ||
          (p.sku && p.sku.toUpperCase() === cleanSearch.toUpperCase())
        );
        if (exactMatch) {
          addToCart(exactMatch);
          setSearch('');
        }
      }
    } catch { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCategory, selectedProductType]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, custRes] = await Promise.all([
          api.get('/products/categories'),
          api.get('/contacts?type=customer')
        ]);
        setCategories(catRes.data.data || []);
        setCustomers(custRes.data.data || []);
      } catch { }
    };
    loadFilters();
  }, []);

  const fetchRecentSales = async () => {
    setSalesLoading(true);
    try {
      const res = await api.get('/sales');
      setRecentSales(res.data.data || []);
    } catch {
      toast.error(isRTL ? 'فشل تحميل المبيعات الأخيرة' : 'Failed to load recent sales');
    } finally { setSalesLoading(false); }
  };

  const handleScanBarcode = async (barcode) => {
    let cleanBarcode = normalizeNumber(barcode.trim());
    const cmd = cleanBarcode.toUpperCase();
    if (cmd === 'CMD-PAY' || cmd === 'PAY') { playSound('success'); handleCheckout(); return; }
    if (cmd === 'CMD-CLEAR' || cmd === 'CLEAR') {
      playSound('success');
      if (window.confirm(isRTL ? 'هل تريد إفراغ السلة؟' : 'Clear current cart?')) resetPOS();
      return;
    }
    if (cmd === 'CMD-CASH' || cmd === 'CASH') { setPaymentMethod('cash'); playSound('success'); toast.success('نقدي'); return; }
    if (cmd === 'CMD-CARD' || cmd === 'CARD') { setPaymentMethod('card'); playSound('success'); toast.success('فيزا'); return; }
    if (cmd === 'CMD-CREDIT' || cmd === 'CREDIT') { setPaymentMethod('credit'); playSound('success'); toast.success('آجل'); return; }
    try {
      const res = await api.get(`/products/scan/${cleanBarcode}`);
      const product = res.data.data;
      if (product) { addToCart(product); }
      else { playSound('fail'); toast.error(isRTL ? 'المنتج غير مسجل' : 'Product not registered'); }
    } catch (err) {
      playSound('fail');
      toast.error(err.response?.data?.message || 'Scanner error');
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  };

  // ====== إصلاح كامل لمشكلة الكيبورد ======
  // استخدام refs لتجنب stale closures وإعادة تهيئة listener مع كل ضغطة
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const productsRef = useRef(products);
  productsRef.current = products;

  useEffect(() => {
    let barcodeBuffer = '';
    let keyTimes = [];
    let scanTimeout = null;

    setTimeout(() => { document.getElementById('posSearchInput')?.focus(); }, 400);

    const processScan = (buffer, times) => {
      if (buffer.length > 2) {
        let isScanner = false;
        if (times.length > 1) {
          let total = 0;
          for (let i = 1; i < times.length; i++) total += (times[i] - times[i - 1]);
          if (total / (times.length - 1) < 50) isScanner = true;
        }
        if (isScanner) {
          const searchInput = document.getElementById('posSearchInput');
          if (searchInput && document.activeElement === searchInput) {
            searchInput.value = '';
            setSearch('');
          }
          handleScanBarcode(buffer.trim());
        }
      }
      barcodeBuffer = ''; keyTimes = [];
    };

    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      // ✅ استخدام e.target بدل document.activeElement — أدق وأوثق
      const targetEl = e.target;
      const isInInput = isInputElement(targetEl);
      const isInSearchInput = targetEl?.id === 'posSearchInput';

      // مفاتيح الاختصارات العامة — تعمل دائماً
      if (e.key === 'F2') { e.preventDefault(); handleCheckout(); return; }
      if (e.key === 'F9' || e.key === 'F4') {
        e.preventDefault();
        document.getElementById('posSearchInput')?.focus();
        return;
      }
      if (e.key === 'F11') { e.preventDefault(); toggleFullScreen(); return; }

      // Delete و Escape — فقط إذا لم يكن المستخدم داخل حقل إدخال
      if (e.key === 'Delete' && !isInInput) {
        e.preventDefault();
        const currentCart = cartRef.current;
        if (currentCart.length > 0) {
          const lastItem = currentCart[currentCart.length - 1];
          removeFromCart(lastItem.productId);
          playSound('success');
          toast.success(isRTL ? 'تم حذف آخر صنف' : 'Last item removed');
        }
        return;
      }
      if (e.key === 'Escape' && !isInInput) {
        e.preventDefault();
        if (window.confirm(isRTL ? 'هل تريد إفراغ السلة؟' : 'Clear cart?')) resetPOS();
        return;
      }

      // ✅ الحل الجذري: إذا كان المستخدم يكتب داخل أي حقل (خصم/مدفوع/غيره)
      // ما عدا حقل البحث — لا نتدخل مطلقاً ونترك الحقل يعمل طبيعياً
      if (isInInput && !isInSearchInput) {
        return; // ← لا preventDefault ولا stopPropagation — فقط تجاهل تام
      }

      // حقل البحث يعمل طبيعياً — لا نتدخل في كتابته
      if (isInSearchInput) return;

      // === منطق الباركود: فقط عندما لا يكون المستخدم داخل أي حقل ===
      if (e.key !== 'Enter' && e.key.length !== 1) return;

      if (scanTimeout) { clearTimeout(scanTimeout); scanTimeout = null; }
      if (keyTimes.length && (currentTime - keyTimes[keyTimes.length - 1] > 300)) {
        barcodeBuffer = ''; keyTimes = [];
      }
      if (e.key === 'Enter') { e.preventDefault(); processScan(barcodeBuffer, keyTimes); return; }

      barcodeBuffer += e.key;
      keyTimes.push(currentTime);
      scanTimeout = setTimeout(() => processScan(barcodeBuffer, keyTimes), 80);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (scanTimeout) clearTimeout(scanTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← فارغ عمداً — نستخدم refs لتجنب stale closures

  // ====== إضافة للسلة مع سعر الكاشير ======
  const addToCart = (product) => {
    if (product.quantity <= 0) {
      playSound('fail');
      toast.error(isRTL ? 'الكمية غير متاحة بالمخزن' : 'Out of stock');
      return;
    }
    // استخدام سعر الكاشير إذا كان موجوداً، وإلا السعر الأساسي
    const effectivePrice = (product.cashierPrice && product.cashierPrice > 0)
      ? product.cashierPrice
      : product.sellPrice;

    const existing = cart.find(item => item.productId === product._id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        playSound('fail');
        toast.error(isRTL ? 'الكمية غير متاحة' : 'Max quantity reached');
        return;
      }
      setCart(cart.map(item => item.productId === product._id
        ? { ...item, quantity: item.quantity + 1 }
        : item
      ));
      playSound('success');
      toast.success(isRTL ? 'تم زيادة الكمية' : 'Quantity increased');
    } else {
      setCart([...cart, {
        productId: product._id,
        name: product.name,
        nameAr: product.nameAr,
        price: effectivePrice,           // السعر الفعلي (كاشير أو أساسي)
        originalPrice: product.sellPrice, // السعر الأساسي دائماً
        cashierPrice: product.cashierPrice || null,
        hasCashierPrice: !!(product.cashierPrice && product.cashierPrice > 0),
        itemDiscount: 0,                  // خصم البند (افتراضي صفر)
        quantity: 1,
        stock: product.quantity
      }]);
      playSound('success');
      const priceLabel = (product.cashierPrice && product.cashierPrice > 0)
        ? (isRTL ? ' (سعر الكاشير)' : ' (Cashier Price)')
        : '';
      toast.success((isRTL ? 'تم الإضافة' : 'Added') + priceLabel);
    }
  };

  const updateCartQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.productId === id) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty > item.stock) { toast.error(isRTL ? 'لا يوجد مخزون كافي' : 'Not enough stock'); return item; }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateItemPrice = (id, newPrice) => {
    const val = Math.max(0, Number(normalizeNumber(String(newPrice))) || 0);
    setCart(cart.map(item => item.productId === id ? { ...item, price: val } : item));
  };

  const updateItemDiscount = (id, newDiscount) => {
    setCart(cart.map(item => {
      if (item.productId === id) {
        const maxDiscount = item.price * item.quantity;
        const val = Math.min(Math.max(0, Number(normalizeNumber(String(newDiscount))) || 0), maxDiscount);
        return { ...item, itemDiscount: val };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.productId !== id));

  // ====== الحسابات ======
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItemDiscounts = cart.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);
  const afterItemDiscounts = subtotal - totalItemDiscounts;
  const invDiscount = Math.max(0, Number(normalizeNumber(String(invoiceDiscount))) || 0);
  const total = Math.max(0, afterItemDiscounts - invDiscount);
  const change = paidAmount ? Math.max(0, Number(normalizeNumber(String(paidAmount))) - total) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error(isRTL ? 'السلة فارغة' : 'Cart is empty');
    setLoading(true);
    try {
      const res = await api.post('/sales', {
        customer: selectedCustomer?._id,
        items: cart.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          sellPrice: item.price,
          itemDiscount: item.itemDiscount || 0
        })),
        discount: invDiscount,
        paymentMethod,
        paidAmount: Number(normalizeNumber(String(paidAmount))) || total
      });
      toast.success(isRTL ? 'تمت عملية البيع بنجاح' : 'Sale completed!');
      setLastInvoice(res.data.data);
      setShowInvoiceModal(true);
      resetPOS();
      if (localStorage.getItem('receipt_auto_print') === 'true') {
        setTimeout(() => doPrint(), 800);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  const doPrint = () => {
    const printElement = document.getElementById('pos-print-area');
    if (!printElement) return;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<html><head><title>Invoice</title><style>body{margin:0;padding:0;background:#fff}</style></head><body onload="setTimeout(function(){window.print();window.parent.document.body.removeChild(window.frameElement);},500)">${printElement.innerHTML}</body></html>`);
    doc.close();
  };

  const handleRefundSale = async (id) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من إلغاء هذه الفاتورة؟' : 'Cancel sale?')) return;
    try {
      await api.put(`/sales/${id}/cancel`);
      toast.success(isRTL ? 'تم الإلغاء وإرجاع الكميات' : 'Sale cancelled');
      fetchRecentSales(); fetchProducts();
    } catch { toast.error(isRTL ? 'فشل الإلغاء' : 'Cancel failed'); }
  };

  const resetPOS = () => {
    setCart([]);
    setSelectedCustomer(null);
    setInvoiceDiscount('');
    setPaidAmount('');
    setPaymentMethod('cash');
    fetchProducts();
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4 fade-in">

      {/* Top POS Action Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between shrink-0 bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h2 className="font-black text-white text-base leading-none">{isRTL ? 'شاشة الكاشير السريعة' : 'POS Cashier Console'}</h2>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-bold">{isRTL ? 'البيع المباشر والباركود' : 'Direct barcode billing'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchRecentSales(); setShowSalesDrawer(true); }}
            className="btn btn-secondary h-11 px-4 gap-2 text-xs font-bold border-[var(--border)] rounded-2xl bg-[var(--bg-card2)] text-orange-400">
            <RotateCcw size={16} /> {isRTL ? 'سجل فواتير اليوم' : 'Sales History'}
          </button>
          <button onClick={() => setShowShortcutsHelp(true)}
            className="btn btn-secondary h-11 w-11 p-0 flex items-center justify-center border-[var(--border)] rounded-2xl bg-[var(--bg-card2)] text-blue-400" title="Keyboard Shortcuts">
            <Keyboard size={18} />
          </button>
          <button onClick={toggleFullScreen}
            className="btn btn-secondary h-11 w-11 p-0 flex items-center justify-center border-[var(--border)] rounded-2xl bg-[var(--bg-card2)] text-purple-400">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">

        {/* Products Section */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-4 items-center w-full shrink-0">
            <div className="relative form-icon-group flex-1 w-full">
              <Search className="input-icon" size={20} />
              <input
                id="posSearchInput"
                type="text" className="form-input h-14 text-lg"
                placeholder={isRTL ? 'بحث عن منتج (الاسم أو الباركود أو SKU)...' : 'Search product (Name, Barcode, SKU)...'}
                value={search} onChange={e => setSearch(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 h-14 rounded-2xl flex items-center gap-3 shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">{isRTL ? 'الماسح نشط' : 'SCANNER ACTIVE'}</span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button onClick={() => { setSelectedProductType(''); setSelectedCategory(''); }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${!selectedProductType && !selectedCategory ? 'bg-orange-500 text-white' : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'}`}>
              {isRTL ? 'كل المنتجات' : 'All'}
            </button>
            {PRODUCT_TYPES.map(type => (
              <button key={type.value} onClick={() => { setSelectedProductType(type.value); setSelectedCategory(''); }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${selectedProductType === type.value ? 'bg-orange-500 text-white' : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'}`}>
                {isRTL ? type.labelAr : type.labelEn}
              </button>
            ))}
            {categories.map(cat => (
              <button key={cat._id} onClick={() => { setSelectedCategory(cat._id); setSelectedProductType(''); }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === cat._id ? 'bg-orange-500 text-white' : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'}`}>
                {isRTL ? cat.nameAr || cat.name : cat.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
            {products.map(p => (
              <motion.div whileTap={{ scale: 0.95 }} key={p._id} onClick={() => addToCart(p)} className="pos-product-card flex flex-col justify-between p-4">
                <div>
                  <div className="text-[10px] font-black text-orange-500 mb-1 uppercase tracking-widest">{p.sku}</div>
                  <div className="font-bold text-sm line-clamp-2 min-h-[40px] leading-tight">{isRTL ? p.nameAr || p.name : p.name || p.nameAr}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border)]/50">
                  {p.cashierPrice && p.cashierPrice > 0 ? (
                    <div>
                      <div className="text-orange-500 font-black text-lg">{p.cashierPrice} <span className="text-[10px] opacity-60">{t('currency')}</span></div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Tag size={9} className="text-emerald-400" />
                        <span className="text-[9px] text-emerald-400 font-bold">{isRTL ? 'سعر الكاشير' : 'Cashier'}</span>
                        <span className="text-[9px] text-[var(--text-muted)] line-through">{p.sellPrice}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-orange-500 font-black text-lg">{p.sellPrice} <span className="text-[10px] opacity-60">{t('currency')}</span></div>
                  )}
                  <div className={`text-[10px] font-bold mt-1 ${p.quantity <= (p.minQuantity || 5) ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
                    {isRTL ? 'المخزون: ' : 'Stock: '}{p.quantity} {p.quantity <= (p.minQuantity || 5) && '⚠️'}
                  </div>
                </div>
              </motion.div>
            ))}
            {products.length === 0 && (
              <div className="col-span-full flex-center flex-col py-20 opacity-20">
                <Package size={64} />
                <p className="mt-4 font-black uppercase tracking-widest">{t('noData')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart & Checkout */}
        <div className="w-full md:w-[420px] bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl shrink-0">
          <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card2)]/50">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t('customer')}</label>
            <select className="form-input h-12 text-sm font-bold" value={selectedCustomer?._id || ''}
              onChange={e => setSelectedCustomer(customers.find(c => c._id === e.target.value))}>
              <option value="">{isRTL ? 'عميل نقدي' : 'Walk-in Customer'}</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map(item => (
              <div key={item.productId} className="p-3 rounded-2xl bg-[var(--bg-card2)] border border-[var(--border)] group relative">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold break-words leading-tight">{isRTL ? item.nameAr || item.name : item.name || item.nameAr}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {item.hasCashierPrice && (
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                          <Tag size={8} /> {isRTL ? 'كاشير' : 'POS'}
                        </span>
                      )}
                      <span className="text-sm text-orange-500 font-black">{item.price} {t('currency')}</span>
                      {item.hasCashierPrice && item.originalPrice !== item.price && (
                        <span className="text-[10px] text-[var(--text-muted)] line-through">{item.originalPrice}</span>
                      )}
                    </div>
                  </div>
                  {/* Qty controls */}
                  <div className="flex items-center bg-[var(--bg-dark)] rounded-xl border border-[var(--border)] overflow-hidden h-9 shrink-0">
                    <button onClick={() => updateCartQty(item.productId, -1)} className="w-8 h-full flex-center hover:bg-red-500/10 text-red-400"><Minus size={13} /></button>
                    <span className="w-9 text-center text-sm font-black">{item.quantity}</span>
                    <button onClick={() => updateCartQty(item.productId, 1)} className="w-8 h-full flex-center hover:bg-green-500/10 text-green-400"><Plus size={13} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="p-1 text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                </div>

                {/* خصم البند */}
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-[10px] text-[var(--text-muted)] font-bold whitespace-nowrap">{isRTL ? 'خصم البند:' : 'Item Disc:'}</label>
                  <input
                    id={`item-discount-${item.productId}`}
                    type="number"
                    min="0"
                    max={item.price * item.quantity}
                    className="w-20 text-end bg-transparent border-b border-amber-500/30 focus:border-amber-500 outline-none font-black text-amber-400 text-sm"
                    value={item.itemDiscount || ''}
                    placeholder="0"
                    onChange={e => updateItemDiscount(item.productId, e.target.value)}
                    onFocus={e => e.target.select()}
                    // منع انتشار الأحداث لمنع تشغيل منطق الكيبورد
                    onKeyDown={e => e.stopPropagation()}
                  />
                  <span className="text-[10px] opacity-50">{t('currency')}</span>
                  <span className="text-xs text-emerald-400 font-black ms-auto">
                    = {((item.price * item.quantity) - (item.itemDiscount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex-center flex-col opacity-10 py-10">
                <ShoppingCart size={64} />
                <p className="mt-4 font-black uppercase tracking-widest">{isRTL ? 'السلة فارغة' : 'Empty Cart'}</p>
              </div>
            )}
          </div>

          {/* Totals & Payment */}
          <div className="p-5 bg-[var(--bg-card2)] border-t border-[var(--border)] space-y-3">
            <div className="space-y-2">
              <div className="flex-between text-sm">
                <span className="text-[var(--text-muted)] font-bold">{isRTL ? 'الإجمالي قبل الخصم' : 'Subtotal'}</span>
                <span className="font-black">{subtotal.toFixed(2)} {t('currency')}</span>
              </div>
              {totalItemDiscounts > 0 && (
                <div className="flex-between text-sm">
                  <span className="text-amber-400 font-bold">{isRTL ? 'خصومات البنود' : 'Item Discounts'}</span>
                  <span className="font-black text-amber-400">- {totalItemDiscounts.toFixed(2)} {t('currency')}</span>
                </div>
              )}

              {/* خصم الفاتورة */}
              <div className="flex-between text-sm">
                <span className="text-[var(--text-muted)] font-bold">{isRTL ? 'خصم الفاتورة' : 'Invoice Discount'}</span>
                <div className="flex items-center gap-2">
                  <input
                    id="invoiceDiscountInput"
                    type="number"
                    min="0"
                    className="w-24 text-end bg-transparent border-b border-orange-500/30 focus:border-orange-500 outline-none font-black text-orange-500 text-sm"
                    value={invoiceDiscount}
                    placeholder="0"
                    onChange={e => setInvoiceDiscount(e.target.value)}
                    onFocus={e => e.target.select()}
                    onKeyDown={e => e.stopPropagation()}
                  />
                  <span className="text-[10px] font-bold opacity-50">{t('currency')}</span>
                </div>
              </div>

              <div className="flex-between text-xl pt-3 border-t border-white/5">
                <span className="font-black italic">TOTAL</span>
                <span className="font-black text-orange-500 tracking-tight">{total.toFixed(2)} {t('currency')}</span>
              </div>
            </div>

            {/* المبلغ المدفوع */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-[var(--text-muted)] font-bold whitespace-nowrap">{isRTL ? 'المدفوع:' : 'Paid:'}</label>
              <input
                type="number"
                min="0"
                className="flex-1 form-input h-10 text-sm font-black text-center"
                value={paidAmount}
                placeholder={total.toFixed(2)}
                onChange={e => setPaidAmount(e.target.value)}
                onFocus={e => e.target.select()}
                onKeyDown={e => e.stopPropagation()}
              />
              {change > 0 && (
                <div className="text-xs text-emerald-400 font-black whitespace-nowrap">
                  {isRTL ? 'باقي:' : 'Change:'} {change.toFixed(2)}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setPaymentMethod('cash')} className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border-2 transition-all ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-white/5 bg-white/5 text-slate-400'}`}><Banknote size={14} /> {t('cash')}</button>
              <button onClick={() => setPaymentMethod('card')} className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border-2 transition-all ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-white/5 text-slate-400'}`}><CreditCard size={14} /> {t('transfer')}</button>
              <button onClick={() => setPaymentMethod('credit')} className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border-2 transition-all ${paymentMethod === 'credit' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-white/5 bg-white/5 text-slate-400'}`}><Calculator size={14} /> {t('credit')}</button>
            </div>

            <button onClick={handleCheckout} disabled={loading || cart.length === 0}
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-600 hover:scale-[1.02] active:scale-[0.98] text-white font-black text-lg rounded-2xl shadow-[0_15px_30px_rgba(249,115,22,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {loading ? <RefreshCw className="loading-spin" size={20} /> : <><Calculator size={20} /> {isRTL ? 'إتمام العملية (F2)' : 'PAY NOW (F2)'}</>}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Success Dialog */}
      <AnimatePresence>
        {showInvoiceModal && lastInvoice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ direction: 'rtl' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="flex flex-wrap items-center justify-between p-5 border-b border-[var(--border)] shrink-0 gap-4">
                <div>
                  <h2 className="text-xl font-black text-green-400 flex items-center gap-2"><CheckCircle /> {isRTL ? 'تمت العملية بنجاح' : 'Sale Completed!'}</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">{lastInvoice.invoiceNumber}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-muted)]">{isRTL ? 'عرض الورق:' : 'Width:'}</span>
                    <select className="form-input h-10 py-1 px-3 text-xs font-bold bg-[var(--bg-card2)] border-[var(--border)] rounded-xl text-white outline-none cursor-pointer"
                      value={paperSize} onChange={e => { setPaperSize(e.target.value); localStorage.setItem('receipt_paper_size', e.target.value); }}>
                      <option value="80mm">80 مم (POS)</option>
                      <option value="58mm">58 مم (Mini)</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text-muted)] select-none">
                    <input type="checkbox" className="w-4 h-4 rounded" checked={autoPrint}
                      onChange={e => { setAutoPrint(e.target.checked); localStorage.setItem('receipt_auto_print', e.target.checked ? 'true' : 'false'); }} />
                    {isRTL ? 'طباعة تلقائية' : 'Auto Print'}
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={doPrint} className="btn btn-primary gap-2 h-12 px-6"><Printer size={18} /> {isRTL ? 'طباعة' : 'Print'}</button>
                  <button onClick={() => setShowInvoiceModal(false)} className="btn btn-secondary h-12 w-12 p-0"><X size={20} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-slate-900 p-6 flex justify-center items-start">
                <div id="pos-print-area">
                  <ProfessionalInvoice ref={invoiceRef} sale={lastInvoice} receiptWidth={paperSize} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcutsHelp && (
          <div className="modal-overlay z-50">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="modal-box max-w-lg rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
                <h3 className="text-lg font-black text-white flex items-center gap-2"><Keyboard className="text-orange-500" /> {isRTL ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}</h3>
                <button onClick={() => setShowShortcutsHelp(false)} className="btn btn-ghost h-9 w-9 p-0 rounded-full"><X size={18} /></button>
              </div>
              <div className="py-4 space-y-3 max-h-[50vh] overflow-y-auto">
                {[
                  { label: isRTL ? 'إتمام البيع' : 'Complete Sale', key: 'F2', color: 'text-orange-500' },
                  { label: isRTL ? 'التركيز على البحث' : 'Focus Search', key: 'F9 / F4', color: 'text-blue-400' },
                  { label: isRTL ? 'شاشة كاملة' : 'Fullscreen', key: 'F11', color: 'text-purple-400' },
                  { label: isRTL ? 'حذف آخر صنف' : 'Remove Last Item', key: 'Delete', color: 'text-red-400' },
                  { label: isRTL ? 'تفريغ السلة' : 'Clear Cart', key: 'ESC', color: 'text-red-500' },
                ].map(s => (
                  <div key={s.key} className="flex justify-between items-center text-sm">
                    <span className="text-[var(--text-muted)] font-bold">{s.label}</span>
                    <kbd className={`px-3 py-1.5 rounded-lg bg-[var(--bg-card2)] border border-[var(--border)] font-mono font-black ${s.color}`}>{s.key}</kbd>
                  </div>
                ))}
                <div className="pt-3 border-t border-[var(--border)]/50 mt-3">
                  <div className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-2">{isRTL ? 'أكواد الماسح' : 'Scanner Codes'}</div>
                  {['CMD-PAY / PAY', 'CMD-CLEAR / CLEAR', 'CMD-CASH / CASH', 'CMD-CARD / CARD'].map(c => (
                    <div key={c} className="text-xs font-mono text-[var(--text-muted)] py-1">{c}</div>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowShortcutsHelp(false)} className="w-full btn btn-secondary h-12 rounded-2xl font-bold mt-2">{isRTL ? 'مفهوم' : 'Got it'}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sales History Drawer */}
      <AnimatePresence>
        {showSalesDrawer && (
          <div className="modal-overlay z-50">
            <motion.div initial={{ x: isRTL ? '-100%' : '100%' }} animate={{ x: 0 }} exit={{ x: isRTL ? '-100%' : '100%' }}
              className="absolute top-0 bottom-0 right-0 left-0 md:left-auto md:w-[650px] bg-[var(--bg-card)] border-l border-[var(--border)] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-card2)]/40 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-black text-white flex items-center gap-2"><RotateCcw className="text-orange-500" /> {isRTL ? 'سجل المبيعات والمرتجعات' : 'Sales & Returns'}</h3>
                <button onClick={() => setShowSalesDrawer(false)} className="btn btn-ghost h-10 w-10 p-0 rounded-full"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {salesLoading ? (
                  <div className="flex-center py-20"><RefreshCw className="loading-spin text-orange-500" size={32} /></div>
                ) : recentSales.length === 0 ? (
                  <div className="text-center py-20 opacity-30"><FileText size={48} className="mx-auto" /><p className="mt-4 font-bold">{isRTL ? 'لا توجد مبيعات' : 'No sales'}</p></div>
                ) : recentSales.map(sale => (
                  <div key={sale._id} className="p-4 rounded-2xl bg-[var(--bg-card2)] border border-[var(--border)] space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-sm font-black text-orange-400">{sale.invoiceNumber}</span>
                        <div className="text-xs text-[var(--text-muted)] mt-1">{new Date(sale.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${sale.status === 'cancelled' ? 'badge-danger' : 'badge-success'}`}>
                          {sale.status === 'cancelled' ? (isRTL ? 'ملغاة' : 'Cancelled') : (isRTL ? 'مكتملة' : 'Done')}
                        </span>
                        <span className="text-base font-black text-white">{(sale.totalAmount || sale.total || 0).toFixed(2)} EGP</span>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] space-y-1">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>• {item.name} x {item.quantity}</span>
                          <span className="font-mono">{(item.total || item.sellPrice * item.quantity || 0).toFixed(2)} EGP</span>
                        </div>
                      ))}
                      {(sale.discount > 0) && (
                        <div className="flex justify-between text-amber-400 font-bold">
                          <span>{isRTL ? '• خصم الفاتورة' : '• Invoice Discount'}</span>
                          <span>- {sale.discount.toFixed(2)} EGP</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]/50 text-xs">
                      <span className="text-[var(--text-muted)]">{isRTL ? 'العميل:' : 'Customer:'} <strong>{sale.customer?.name || (isRTL ? 'نقدي' : 'Walk-in')}</strong></span>
                      <div className="flex gap-2">
                        <button onClick={() => { setLastInvoice(sale); setShowInvoiceModal(true); }}
                          className="btn btn-secondary btn-sm h-8 rounded-lg text-[10px] text-blue-400 gap-1">
                          <Eye size={12} /> {isRTL ? 'معاينة' : 'Preview'}
                        </button>
                        {sale.status !== 'cancelled' && (
                          <button onClick={() => handleRefundSale(sale._id)}
                            className="btn btn-secondary btn-sm h-8 rounded-lg text-[10px] text-red-400 hover:bg-red-500/10 gap-1">
                            <Trash2 size={12} /> {isRTL ? 'إلغاء' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
