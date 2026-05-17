import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, UserPlus, 
  CreditCard, Banknote, Printer, Package, Calculator, RefreshCw, X
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ProfessionalInvoice from '../components/ProfessionalInvoice';

export default function POS() {
  const { t, isRTL } = useLang();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const invoiceRef = useRef();
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/products?search=${search}&limit=10000`);
      setProducts(res.data.data);
    } catch {}
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/contacts/customers');
      setCustomers(res.data.data);
    } catch {}
  };

  const handleScanBarcode = async (barcode) => {
    try {
      const res = await api.get(`/products/scan/${barcode}`);
      const product = res.data.data;
      addToCart(product);
    } catch (err) {
      toast.error(isRTL ? 'المنتج غير موجود' : 'Product not found');
    }
  };

  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      
      // Differentiate between manual typing in an input field vs scanner inputs
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      const timeDiff = currentTime - lastKeyTime;
      const isScannerFast = timeDiff < 30; // Scanner keypresses are extremely fast

      // If user is manually typing, let them type normally without intercepting for barcode
      if (isInputActive && !isScannerFast && e.key !== 'F2' && e.key !== 'F9') {
        lastKeyTime = currentTime;
        return;
      }

      // If time between keystrokes is too long, reset the buffer (prevent manual slow typing from compiling a barcode)
      if (timeDiff > 60) {
        barcodeBuffer = '';
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 2) {
          e.preventDefault();
          handleScanBarcode(barcodeBuffer.trim());
          barcodeBuffer = '';
          return;
        }
      }

      if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }

      lastKeyTime = currentTime;

      // Keyboard shortcuts
      if (e.key === 'F2') {
        e.preventDefault();
        handleCheckout();
      } else if (e.key === 'F9') {
        e.preventDefault();
        document.getElementById('posSearchInput')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCustomer, discount, paidAmount, paymentMethod]); // Dependencies needed to ensure handleCheckout gets latest state

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      toast.error(isRTL ? 'المنتج غير متوفر في المخزن' : 'Product out of stock');
      return;
    }
    const existing = cart.find(item => item.productId === product._id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error(isRTL ? 'الكمية المتاحة نفدت' : 'Max quantity reached');
        return;
      }
      setCart(cart.map(item => item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item));
      toast.success(isRTL ? 'تم زيادة الكمية' : 'Quantity increased');
    } else {
      setCart([...cart, { 
        productId: product._id, 
        name: product.name, 
        nameAr: product.nameAr, 
        price: product.sellPrice, 
        quantity: 1, 
        stock: product.quantity 
      }]);
      toast.success(isRTL ? 'تم إضافة المنتج' : 'Product added');
    }
  };

  const updateCartQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.productId === id) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty > item.stock) {
          toast.error(isRTL ? 'لا يوجد مخزون كافي' : 'Not enough stock');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.productId !== id));

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);
  const change = paidAmount ? Math.max(0, paidAmount - total) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error(isRTL ? 'السلة فارغة' : 'Cart is empty');
    
    setLoading(true);
    try {
      const res = await api.post('/sales', {
        customer: selectedCustomer?._id,
        items: cart.map(item => ({ 
          product: item.productId, 
          quantity: item.quantity, 
          sellPrice: item.price 
        })),
        discount,
        paymentMethod,
        paidAmount: Number(paidAmount) || total
      });
      toast.success(isRTL ? 'تمت عملية البيع بنجاح' : 'Sale completed successfully');
      setLastInvoice(res.data.data);
      setShowInvoiceModal(true);
      resetPOS();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const resetPOS = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setPaidAmount('');
    setPaymentMethod('cash');
    fetchProducts();
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 fade-in">
      {/* Products Selection Section */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
          <div className="relative form-icon-group flex-1 w-full">
            <Search className="input-icon" size={20} />
            <input 
              id="posSearchInput"
              type="text" className="form-input h-14 text-lg" 
              placeholder={isRTL ? 'بحث عن منتج (الاسم أو الباركود)...' : 'Search product (Name or Barcode)...'}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 h-14 rounded-2xl flex items-center gap-3 shrink-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest leading-none">
              {isRTL ? 'الماسح نشط' : 'SCANNER ACTIVE'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
          {products.map(p => (
            <motion.div 
              whileTap={{ scale: 0.95 }}
              key={p._id} onClick={() => addToCart(p)}
              className="pos-product-card flex flex-col justify-between p-4"
            >
              <div>
                <div className="text-[10px] font-black text-orange-500 mb-1 uppercase tracking-widest">{p.sku}</div>
                <div className="font-bold text-sm line-clamp-2 min-h-[40px] leading-tight">{isRTL ? p.nameAr || p.name : p.name}</div>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--border)]/50">
                <div className="text-orange-500 font-black text-lg">{p.sellPrice} <span className="text-[10px] font-bold opacity-60">{t('currency')}</span></div>
                <div className={`text-[10px] font-bold mt-1 ${p.quantity < 5 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
                  {isRTL ? 'المخزون: ' : 'Stock: '} {p.quantity}
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

      {/* Cart & Checkout Section */}
      <div className="w-full md:w-[400px] bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-card2)]/50">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t('customer')}</label>
          <div className="flex gap-2">
            <select 
              className="form-input h-12 text-sm font-bold"
              value={selectedCustomer?._id || ''}
              onChange={e => setSelectedCustomer(customers.find(c => c._id == e.target.value))}
            >
              <option value="">{isRTL ? 'عميل نقدي' : 'Walk-in Customer'}</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map(item => (
            <div key={item.productId} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-card2)] border border-[var(--border)] group relative">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate pr-4">{isRTL ? item.nameAr || item.name : item.name}</div>
                <div className="text-sm text-orange-500 font-black">{item.price} {t('currency')}</div>
              </div>
              <div className="flex items-center bg-[var(--bg-dark)] rounded-xl border border-[var(--border)] overflow-hidden h-10">
                <button onClick={() => updateCartQty(item.productId, -1)} className="w-8 h-full flex-center hover:bg-red-500/10 text-red-400"><Minus size={14} /></button>
                <span className="w-10 text-center text-sm font-black">{item.quantity}</span>
                <button onClick={() => updateCartQty(item.productId, 1)} className="w-8 h-full flex-center hover:bg-green-500/10 text-green-400"><Plus size={14} /></button>
              </div>
              <button onClick={() => removeFromCart(item.productId)} className="absolute top-2 end-2 p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex-center flex-col opacity-10 py-10">
              <ShoppingCart size={64} />
              <p className="mt-4 font-black uppercase tracking-widest">{isRTL ? 'السلة فارغة' : 'Empty Cart'}</p>
            </div>
          )}
        </div>

        <div className="p-8 bg-[var(--bg-card2)] border-t border-[var(--border)] space-y-6">
          <div className="space-y-3">
            <div className="flex-between text-sm">
              <span className="text-[var(--text-muted)] font-bold">{t('subtotal')}</span>
              <span className="font-black">{subtotal.toFixed(2)} {t('currency')}</span>
            </div>
            <div className="flex-between text-sm">
              <span className="text-[var(--text-muted)] font-bold">{t('discount')}</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number" className="w-20 text-end bg-transparent border-b border-orange-500/30 focus:border-orange-500 outline-none font-black text-orange-500"
                  value={discount} onChange={e => setDiscount(Number(e.target.value))}
                />
                <span className="text-[10px] font-bold opacity-50">{t('currency')}</span>
              </div>
            </div>
            <div className="flex-between text-2xl pt-4 border-t border-white/5">
              <span className="font-black italic">TOTAL</span>
              <span className="font-black text-orange-500 tracking-tight">{total.toFixed(2)} {t('currency')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setPaymentMethod('cash')} className={`h-14 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-white/5 bg-white/5 text-slate-400'}`}><Banknote size={20} /> {t('cash')}</button>
            <button onClick={() => setPaymentMethod('card')} className={`h-14 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${paymentMethod === 'card' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-white/5 bg-white/5 text-slate-400'}`}><CreditCard size={20} /> {t('card')}</button>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full h-16 bg-gradient-to-r from-orange-500 to-red-600 hover:scale-[1.02] active:scale-[0.98] text-white font-black text-xl rounded-2xl shadow-[0_15px_30px_rgba(249,115,22,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="loading-spin" size={24} /> : <><Calculator size={24} /> {isRTL ? 'إتمام العملية' : 'PAY NOW'}</>}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showInvoiceModal && lastInvoice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ direction: 'rtl' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)] shrink-0">
                <div>
                  <h2 className="text-xl font-black text-green-400">✓ {isRTL ? 'تمت العملية بنجاح' : 'Sale Completed!'}</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">{lastInvoice.invoiceNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const printElement = document.getElementById('pos-print-area');
                      if (!printElement) return;

                      // Create temporary iframe for A4 printing
                      const iframe = document.createElement('iframe');
                      iframe.style.position = 'fixed';
                      iframe.style.right = '0';
                      iframe.style.bottom = '0';
                      iframe.style.width = '0';
                      iframe.style.height = '0';
                      iframe.style.border = '0';
                      document.body.appendChild(iframe);

                      const doc = iframe.contentDocument || iframe.contentWindow.document;
                      doc.open();
                      doc.write(`
                        <html>
                          <head>
                            <title>Print Invoice</title>
                            <style>
                              body { margin: 0; padding: 0; background: #fff; }
                            </style>
                          </head>
                          <body onload="setTimeout(function(){ window.print(); window.parent.document.body.removeChild(window.frameElement); }, 500)">
                            ${printElement.innerHTML}
                          </body>
                        </html>
                      `);
                      doc.close();
                    }}
                    className="btn btn-primary gap-2 h-12 px-6"
                  >
                    <Printer size={18} /> {isRTL ? 'طباعة الفاتورة' : 'Print Invoice'}
                  </button>
                  <button onClick={() => setShowInvoiceModal(false)} className="btn btn-secondary h-12 w-12 p-0">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Invoice Preview */}
              <div className="flex-1 overflow-auto bg-slate-200 p-4">
                <div className="bg-white rounded-xl shadow-2xl mx-auto" style={{ maxWidth: '210mm' }}>
                  <div id="pos-print-area">
                    <ProfessionalInvoice ref={invoiceRef} sale={lastInvoice} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
