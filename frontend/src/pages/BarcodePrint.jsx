import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Printer, Search, RefreshCw, Barcode as BarcodeIcon, 
  Settings, Check, LayoutGrid, ToggleLeft, ToggleRight, Info, Eye
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function BarcodePrint() {
  const { t, isRTL } = useLang();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [printQuantity, setPrintQuantity] = useState(1);
  
  // Custom Thermal Label Configurations
  const [selectedSize, setSelectedSize] = useState('medium'); // small (40x30), medium (50x30), large (60x40)
  const [showQR, setShowQR] = useState(false);
  const [includeSku, setIncludeSku] = useState(true);
  const [includePrice, setIncludePrice] = useState(true);
  const [fontSizeAdjust, setFontSizeAdjust] = useState(0); // offset adjustment (-2px to +2px)

  const printComponentRef = useRef();

  // Debounce search to eliminate keyboard scanner API race conditions
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 150);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      const cleanSearch = debouncedSearch.trim().replace(/[٠-٩]/g, (d) => arabicNums.indexOf(d));

      const res = await api.get(`/products?search=${cleanSearch}&limit=10000`);
      const list = res.data.data;
      setProducts(list);

      // Auto-select if exact match is scanned/searched
      if (cleanSearch && list.length > 0) {
        const exactMatch = list.find(p => 
          (p.barcode && p.barcode.toUpperCase() === cleanSearch.toUpperCase()) || 
          (p.sku && p.sku.toUpperCase() === cleanSearch.toUpperCase())
        );
        if (exactMatch) {
          setSelectedProduct(exactMatch);
        }
      }
    } catch (err) {
      toast.error(isRTL ? 'فشل تحميل المنتجات' : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Setup dimension labels & styling based on selectedSize
  const labelConfig = {
    small: {
      widthMm: 40,
      heightMm: 30,
      widthPx: 151,
      heightPx: 113,
      barcodeHeight: 25,
      barcodeWidth: 1.1,
      nameSize: 10,
      priceSize: 12,
      skuSize: 8,
      margin: 2
    },
    medium: {
      widthMm: 50,
      heightMm: 30,
      widthPx: 189,
      heightPx: 113,
      barcodeHeight: 32,
      barcodeWidth: 1.2,
      nameSize: 11,
      priceSize: 13,
      skuSize: 9,
      margin: 4
    },
    large: {
      widthMm: 60,
      heightMm: 40,
      widthPx: 226,
      heightPx: 151,
      barcodeHeight: 45,
      barcodeWidth: 1.4,
      nameSize: 12,
      priceSize: 15,
      skuSize: 10,
      margin: 6
    }
  };

  const currentConfig = labelConfig[selectedSize];

  const handlePrint = () => {
    if (!selectedProduct) return;

    // Create a temporary hidden iframe for perfect sandboxed printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-1000';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // Define size CSS properties for sandboxed page
    const sizeCss = selectedSize === 'small' 
      ? '40mm 30mm' 
      : selectedSize === 'medium' 
        ? '50mm 30mm' 
        : '60mm 40mm';

    const widthCss = selectedSize === 'small' ? '40mm' : selectedSize === 'medium' ? '50mm' : '60mm';
    const heightCss = selectedSize === 'small' ? '30mm' : selectedSize === 'medium' ? '30mm' : '40mm';

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print Labels - Xprinter T361U</title>
          <style>
            @page {
              size: ${sizeCss};
              margin: 0 !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: ${widthCss} !important;
              height: ${heightCss} !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Cairo', 'Arial', sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .labels-container {
              display: block !important;
              width: ${widthCss} !important;
              height: ${heightCss} !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .barcode-label {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              width: ${widthCss} !important;
              height: ${heightCss} !important;
              box-sizing: border-box !important;
              padding: 1.5mm !important;
              page-break-after: always !important;
              break-after: always !important;
              overflow: hidden !important;
              background: #ffffff !important;
              color: #000000 !important;
              text-align: center !important;
            }
            /* Remove margins/borders for physical thermal print */
            @media print {
              html, body {
                width: ${widthCss} !important;
                height: ${heightCss} !important;
              }
              .barcode-label {
                border: none !important;
                margin: 0 !important;
              }
            }
          </style>
        </head>
        <body dir="${isRTL ? 'rtl' : 'ltr'}">
          <div class="labels-container">
            ${Array(printQuantity).fill(0).map(() => `
              <div class="barcode-label">
                <!-- Product Name -->
                <div style="
                  font-size: ${currentConfig.nameSize + fontSizeAdjust}px; 
                  font-weight: 800; 
                  width: 100%; 
                  white-space: nowrap; 
                  overflow: hidden; 
                  text-overflow: ellipsis; 
                  line-height: 1.2; 
                  margin-bottom: 2px;
                ">
                  ${isRTL ? selectedProduct.nameAr || selectedProduct.name : selectedProduct.name}
                </div>

                <!-- Price and SKU Row -->
                <div style="
                  display: flex; 
                  justify-content: space-around; 
                  align-items: center; 
                  width: 100%; 
                  margin-bottom: 3px;
                ">
                  ${includePrice ? `
                    <div style="font-size: ${currentConfig.priceSize}px; font-weight: 900; color: #000000;">
                      ${selectedProduct.sellPrice.toFixed(2)} EGP
                    </div>
                  ` : ''}
                  ${includeSku ? `
                    <div style="font-size: ${currentConfig.skuSize}px; font-family: monospace; font-weight: 600; color: #000000;">
                      Code: ${selectedProduct.sku.replace('MOTO-', '')}
                    </div>
                  ` : ''}
                </div>

                <!-- Barcode & Optional QR Code Layout -->
                <div style="
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  width: 100%; 
                  gap: 8px;
                ">
                  <!-- Barcode SVG Render (Vector) -->
                  <div class="barcode-svg" style="display: flex; justify-content: center; align-items: center;">
                    <!-- Rendered SVG inline copy -->
                    ${document.querySelector('.print-preview-barcode svg')?.outerHTML || ''}
                  </div>
                  
                  <!-- QR Code SVG Render (Vector) -->
                  ${showQR && document.querySelector('.print-preview-qr svg') ? `
                    <div style="display: flex; justify-content: center; align-items: center;">
                      ${document.querySelector('.print-preview-qr svg').outerHTML}
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <script>
            // Ensure fonts and images are parsed, then run thermal print command
            setTimeout(() => {
              window.focus();
              window.print();
              setTimeout(() => {
                window.parent.document.body.removeChild(window.frameElement);
              }, 500);
            }, 350);
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  return (
    <div className="space-y-6 fade-in flex flex-col xl:flex-row gap-6">
      {/* 🛠️ Dashboard Configurations Panel */}
      <div className="w-full xl:w-[450px] shrink-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-xl print:hidden flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 text-orange-500 mb-1">
            <Settings className="animate-spin-slow" size={24} />
            <span className="text-xs font-bold uppercase tracking-wider bg-orange-500/10 px-2.5 py-1 rounded-full">{isRTL ? 'إعدادات Xprinter' : 'Xprinter Mode'}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            {isRTL ? 'مصمم ملصقات الباركود' : 'Barcode Label Designer'}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {isRTL ? 'إعدادات مخصصة لطابعة Xprinter T361U الحرارية' : 'Optimized configuration for thermal Xprinter'}
          </p>
        </div>

        {/* Product Search Field */}
        <div className="space-y-2">
          <label className="form-label font-bold text-xs">{isRTL ? 'ابحث عن منتج' : 'Search Product'}</label>
          <div className="relative search-input">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="form-input" 
              placeholder={isRTL ? 'ابحث بالاسم أو الباركود أو الـ SKU...' : 'Search by Name, Barcode, SKU...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Live Search Results Drawer */}
        <div className="overflow-y-auto max-h-[160px] space-y-2 border border-[var(--border)] rounded-2xl p-2 bg-[var(--bg-card2)]">
          {products.map(p => (
            <div 
              key={p._id} 
              onClick={() => setSelectedProduct(p)}
              className={`p-3 rounded-xl cursor-pointer transition-all border flex justify-between items-center ${selectedProduct?._id === p._id ? 'border-orange-500 bg-orange-500/10' : 'border-transparent hover:bg-[var(--bg-card)]'}`}
            >
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[200px]">{isRTL ? p.nameAr || p.name : p.name}</div>
                <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">Code: {p.sku.replace('MOTO-', '')}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-orange-500">{p.sellPrice.toFixed(2)} EGP</div>
                {selectedProduct?._id === p._id && <Check size={16} className="text-orange-500 ml-auto mt-1" />}
              </div>
            </div>
          ))}
          {products.length === 0 && !loading && (
            <div className="text-center py-6 text-xs text-[var(--text-muted)]">
              {isRTL ? 'ابدأ البحث لعرض قائمة قطع الغيار' : 'Search to list motorcycle parts'}
            </div>
          )}
          {loading && (
            <div className="flex justify-center py-6 text-orange-500">
              <RefreshCw className="loading-spin" />
            </div>
          )}
        </div>

        {/* Xprinter Label Size Selection */}
        <div className="space-y-3">
          <label className="form-label font-bold text-xs flex items-center gap-1">
            <LayoutGrid size={16} className="text-orange-500" />
            {isRTL ? 'مقاس ملصق طابعة Xprinter' : 'Select Label Sticker Size'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'small', label: '40x30 mm', labelAr: '٤٠×٣٠ مم', desc: 'للقطع الصغيرة' },
              { id: 'medium', label: '50x30 mm', labelAr: '٥٠×٣٠ مم', desc: 'المقاس المعتاد' },
              { id: 'large', label: '60x40 mm', labelAr: '٦٠×٤٠ مم', desc: 'للقطع الكبيرة' }
            ].map(size => (
              <button
                key={size.id}
                type="button"
                onClick={() => setSelectedSize(size.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${selectedSize === size.id ? 'border-orange-500 bg-orange-500/10 text-orange-500 font-extrabold' : 'border-[var(--border)] hover:bg-[var(--bg-card2)]'}`}
              >
                <span className="text-sm font-black">{isRTL ? size.labelAr : size.label}</span>
                <span className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">{isRTL ? size.desc : size.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Layout & Content Toggles */}
        <div className="space-y-4 bg-[var(--bg-card2)] p-4 rounded-3xl border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 dark:text-white">{isRTL ? 'طباعة كود الاستجابة السريعة (QR Code)' : 'Include QR Code'}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{isRTL ? 'مسح سريع بالهاتف أو ماسح 2D' : 'For phone or 2D Scanners'}</span>
            </div>
            <button type="button" onClick={() => setShowQR(!showQR)} className="text-orange-500">
              {showQR ? <ToggleRight size={38} className="fill-orange-500" /> : <ToggleLeft size={38} className="text-slate-400" />}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 dark:text-white">{isRTL ? 'عرض السعر على الملصق' : 'Display Retail Price'}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{isRTL ? 'كتابة السعر بالجنيه المصري' : 'Show price tag in EGP'}</span>
            </div>
            <button type="button" onClick={() => setIncludePrice(!includePrice)} className="text-orange-500">
              {includePrice ? <ToggleRight size={38} className="fill-orange-500" /> : <ToggleLeft size={38} className="text-slate-400" />}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 dark:text-white">{isRTL ? 'عرض كود الصنف (SKU)' : 'Display Item SKU'}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{isRTL ? 'لتعريف المنتج يدوياً بسهولة' : 'Show short SKU details'}</span>
            </div>
            <button type="button" onClick={() => setIncludeSku(!includeSku)} className="text-orange-500">
              {includeSku ? <ToggleRight size={38} className="fill-orange-500" /> : <ToggleLeft size={38} className="text-slate-400" />}
            </button>
          </div>

          {/* Font Size Adjust Slider */}
          <div className="border-t border-[var(--border)] pt-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900 dark:text-white">{isRTL ? 'حجم خط اسم المنتج' : 'Product Name Font Size'}</span>
              <span className="font-mono bg-orange-500/10 px-2 py-0.5 rounded text-orange-500 font-bold">{fontSizeAdjust >= 0 ? `+${fontSizeAdjust}` : fontSizeAdjust}px</span>
            </div>
            <input 
              type="range" 
              min="-2" 
              max="2" 
              value={fontSizeAdjust} 
              onChange={(e) => setFontSizeAdjust(Number(e.target.value))}
              className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
        </div>

        {/* Print Quantity & Print Button */}
        {selectedProduct && (
          <div className="space-y-4 pt-4 border-t border-[var(--border)] flex flex-col gap-2">
            <div className="flex items-center justify-between bg-[var(--bg-card2)] p-3 rounded-2xl border border-[var(--border)]">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{isRTL ? 'عدد النسخ للطباعة:' : 'Print Copies:'}</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setPrintQuantity(Math.max(1, printQuantity - 1))}
                  className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center font-bold text-lg hover:border-orange-500 transition-all"
                >
                  -
                </button>
                <input 
                  type="number" 
                  className="w-16 text-center font-black text-lg bg-transparent border-none outline-none focus:ring-0" 
                  value={printQuantity} 
                  onChange={(e) => setPrintQuantity(Math.max(1, Number(e.target.value)))}
                  min="1"
                />
                <button 
                  onClick={() => setPrintQuantity(printQuantity + 1)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center font-bold text-lg hover:border-orange-500 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            <button 
              onClick={handlePrint}
              className="w-full btn btn-primary h-14 text-lg font-black shadow-lg shadow-orange-500/20 gap-2 rounded-2xl flex items-center justify-center"
            >
              <Printer size={22} className="animate-pulse" /> 
              {isRTL ? `طباعة ${printQuantity} ملصق حراري` : `Print ${printQuantity} Thermal Labels`}
            </button>
          </div>
        )}
      </div>

      {/* 👁️ High-Fidelity Sticker Preview Sheet */}
      <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-[2.5rem] flex flex-col gap-6 shadow-inner">
        <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2"><Eye className="text-orange-500" /> {isRTL ? 'معاينة ملصقات طابعة Xprinter الحرارية' : 'Thermal Label Print Preview'}</h3>
            <p className="text-xs text-[var(--text-muted)]">{isRTL ? 'الباركود يطبع بدقة متجهات شارب فائقة (Pure Vector Black)' : 'Stickers rendered in pure contrast for Xprinter 203 DPI'}</p>
          </div>
          <div className="text-right text-xs bg-slate-100 dark:bg-slate-800 border border-[var(--border)] px-3 py-1.5 rounded-full font-mono flex items-center gap-1.5 font-bold">
            <Info size={14} className="text-orange-500" />
            <span>Size: {currentConfig.widthMm}mm × {currentConfig.heightMm}mm ({selectedSize})</span>
          </div>
        </div>

        {/* Stickers Grid */}
        <div className="flex-1 flex justify-center items-center p-8 bg-[var(--bg-card2)] border border-dashed border-[var(--border)] rounded-[2rem] min-h-[400px]">
          {selectedProduct ? (
            <div className="flex flex-wrap gap-4 justify-center items-center">
              {/* STICKER CONTAINER IN PREVIEW */}
              <div 
                className="bg-white border-2 border-black border-dashed rounded p-2 text-black flex flex-col items-center justify-center relative overflow-hidden transition-all shadow-md select-none"
                style={{
                  width: `${currentConfig.widthPx}px`,
                  height: `${currentConfig.heightPx}px`,
                  boxSizing: 'border-box'
                }}
              >
                {/* 1. Name */}
                <div 
                  className="font-extrabold text-center truncate leading-tight w-full"
                  style={{ 
                    fontSize: `${currentConfig.nameSize + fontSizeAdjust}px`,
                    color: '#000000',
                    lineHeight: '1.2',
                    marginBottom: '1px'
                  }}
                >
                  {isRTL ? selectedProduct.nameAr || selectedProduct.name : selectedProduct.name}
                </div>

                {/* 2. Price and SKU Row */}
                <div className="flex justify-around items-center w-full mb-1">
                  {includePrice && (
                    <div 
                      className="font-black text-[#000000]"
                      style={{ fontSize: `${currentConfig.priceSize}px` }}
                    >
                      {selectedProduct.sellPrice.toFixed(2)} EGP
                    </div>
                  )}
                  {includeSku && (
                    <div 
                      className="font-mono font-bold text-[#000000]"
                      style={{ fontSize: `${currentConfig.skuSize}px` }}
                    >
                      Code: {selectedProduct.sku.replace('MOTO-', '')}
                    </div>
                  )}
                </div>

                {/* 3. Barcode and optional QR Row */}
                <div className="flex justify-center items-center w-full gap-2 shrink-0">
                  {/* Vector SVG Barcode */}
                  <div className="print-preview-barcode flex justify-center items-center shrink-0">
                    <Barcode 
                      value={selectedProduct.barcode || selectedProduct.sku} 
                      format="CODE128"
                      width={currentConfig.barcodeWidth}
                      height={currentConfig.barcodeHeight}
                      fontSize={8}
                      background="#ffffff"
                      lineColor="#000000"
                      margin={currentConfig.margin}
                      displayValue={false} // Hidden internally to match clean barcode scanner standards
                    />
                  </div>

                  {/* Vector QR Code SVG */}
                  {showQR && (
                    <div className="print-preview-qr flex justify-center items-center shrink-0">
                      <QRCodeSVG 
                        value={selectedProduct.barcode || selectedProduct.sku}
                        size={selectedSize === 'small' ? 24 : selectedSize === 'medium' ? 32 : 40}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="M"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-[var(--text-muted)] max-w-sm text-center">
              <BarcodeIcon size={64} className="opacity-15 animate-bounce-slow text-orange-500" />
              <h4 className="text-base font-black text-slate-800 dark:text-slate-200">{isRTL ? 'يرجى اختيار صنف أو قطعة غيار' : 'No Spare Part Selected'}</h4>
              <p className="text-xs leading-relaxed">{isRTL ? 'قم بالبحث واختيار قطعة الغيار لفلترة الملصق وعرض المعاينة المباشرة المقاومة للتشويش والقص.' : 'Search and select a motorcycle part to display its professional high-contrast thermal sticker preview.'}</p>
            </div>
          )}
        </div>

        {/* 📚 Thermal Setup Helper Alert */}
        <div className="bg-orange-500/10 border border-orange-500/25 rounded-3xl p-4 flex gap-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <Info className="text-orange-500 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1">
            <span className="font-extrabold text-orange-500">{isRTL ? 'إرشادات الطباعة لطابعة Xprinter T361U:' : 'Xprinter T361U Printer Configuration Guide:'}</span>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px] font-medium">
              <li>{isRTL ? 'تأكد من ضبط مقاس الورق في إعدادات نظام Windows على نفس المقاس المختار (مثال: 50x30mm).' : 'Configure the paper size in Windows printer properties to match your selected size (e.g. 50x30mm).'}</li>
              <li>{isRTL ? 'اضبط الهوامش في شاشة الطباعة على (None) أو (بلا هوامش) للحفاظ على موضع العناصر.' : 'Set print settings margins to (None) in the browser print dialog to maintain sticker boundaries.'}</li>
              <li>{isRTL ? 'تم إلغاء طباعة الهيدر والفوتر (Header & Footer) تلقائياً لمنع طباعة تاريخ اليوم أو عنوان الصفحة.' : 'Header & Footer options are bypassed automatically to keep your stickers perfectly clean.'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
