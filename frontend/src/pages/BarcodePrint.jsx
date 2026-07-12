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

const getDynamicFontSize = (name, baseAdjust = 0) => {
  const len = name ? name.length : 0;
  let size = 9.5; // default base size in px
  if (len > 35) {
    size = 6.5;
  } else if (len > 25) {
    size = 7.5;
  } else if (len > 15) {
    size = 8.5;
  }
  return Math.max(5.5, size + baseAdjust);
};

export default function BarcodePrint() {
  const { t, isRTL } = useLang();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [printQuantity, setPrintQuantity] = useState(1);
  
  // Custom Thermal Label Configurations
  const [selectedSize, setSelectedSize] = useState('micro'); // micro (40x20), small (40x30), medium (50x30), large (60x40)
  const [showQR, setShowQR] = useState(false);
  const [printRotation, setPrintRotation] = useState('landscape'); // landscape or portrait
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
    micro: {
      widthMm: 40,
      heightMm: 20,
      widthPx: 151,
      heightPx: 75,
      barcodeHeight: 32,
      barcodeWidth: 1.35,
      nameSize: 10,
      priceSize: 12,
      skuSize: 8.5,
      margin: 0
    },
    small: {
      widthMm: 40,
      heightMm: 30,
      widthPx: 151,
      heightPx: 113,
      barcodeHeight: 45,
      barcodeWidth: 1.35,
      nameSize: 12,
      priceSize: 14,
      skuSize: 10,
      margin: 1
    },
    medium: {
      widthMm: 50,
      heightMm: 30,
      widthPx: 189,
      heightPx: 113,
      barcodeHeight: 48,
      barcodeWidth: 1.45,
      nameSize: 14,
      priceSize: 16,
      skuSize: 11,
      margin: 1
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

    // Define size CSS properties for sandboxed page (without landscape keyword to prevent fallback to A4)
    const sizeCss = printRotation === 'portrait'
      ? (selectedSize === 'micro' ? '20mm 40mm' : selectedSize === 'small' ? '30mm 40mm' : selectedSize === 'medium' ? '30mm 50mm' : '40mm 60mm')
      : (selectedSize === 'micro' ? '40mm 20mm' : selectedSize === 'small' ? '40mm 30mm' : selectedSize === 'medium' ? '50mm 30mm' : '60mm 40mm');

    const widthCss = selectedSize === 'micro' ? '40mm' : selectedSize === 'small' ? '40mm' : selectedSize === 'medium' ? '50mm' : '60mm';
    const heightCss = selectedSize === 'micro' ? '20mm' : selectedSize === 'small' ? '30mm' : selectedSize === 'medium' ? '30mm' : '40mm';

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
              width: ${printRotation === 'portrait' ? heightCss : widthCss} !important;
              height: ${printRotation === 'portrait' ? widthCss : heightCss} !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Cairo', 'Arial', sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              overflow: hidden !important;
            }
            .labels-container {
              display: block !important;
              width: ${printRotation === 'portrait' ? heightCss : widthCss} !important;
              height: ${printRotation === 'portrait' ? widthCss : heightCss} !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
            }
            .barcode-label {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: ${selectedSize === 'micro' ? 'space-between' : 'center'} !important;
              width: ${printRotation === 'portrait' ? heightCss : widthCss} !important;
              height: ${printRotation === 'portrait' ? widthCss : heightCss} !important;
              box-sizing: border-box !important;
              padding: ${printRotation === 'portrait' ? '0' : (selectedSize === 'micro' ? '0.6mm 1.2mm 0.4mm 1.2mm' : '1.5mm')} !important;
              page-break-after: always !important;
              break-after: always !important;
              overflow: hidden !important;
              background: #ffffff !important;
              color: #000000 !important;
              text-align: center !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              position: relative !important;
            }
            .barcode-svg svg {
              width: 100% !important;
              height: auto !important;
              max-height: ${selectedSize === 'micro' ? '8.5mm' : '45px'} !important;
              display: block !important;
            }
            /* Remove margins/borders for physical thermal print */
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                width: ${printRotation === 'portrait' ? heightCss : widthCss} !important;
                height: ${printRotation === 'portrait' ? widthCss : heightCss} !important;
              }
              body * {
                visibility: hidden !important;
              }
              .barcode-print,
              .barcode-print * {
                visibility: visible !important;
              }
              .barcode-print {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: ${printRotation === 'portrait' ? heightCss : widthCss} !important;
                height: ${printRotation === 'portrait' ? widthCss : heightCss} !important;
              }
              .barcode-label {
                border: none !important;
                margin: 0 !important;
                padding: ${printRotation === 'portrait' ? '0' : (selectedSize === 'micro' ? '0.6mm 1.2mm 0.4mm 1.2mm' : '1.5mm')} !important;
                box-sizing: border-box !important;
                width: ${printRotation === 'portrait' ? heightCss : widthCss} !important;
                height: ${printRotation === 'portrait' ? widthCss : heightCss} !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: always !important;
                break-after: always !important;
              }
            }
          </style>
        </head>
        <body dir="${isRTL ? 'rtl' : 'ltr'}">
          <div class="barcode-print labels-container">
            ${Array(printQuantity).fill(0).map(() => {
              let innerHtml = '';
              if (selectedSize === 'micro') {
                const productName = isRTL ? selectedProduct.nameAr || selectedProduct.name : selectedProduct.name;
                const dynamicNameSize = getDynamicFontSize(productName, fontSizeAdjust);
                innerHtml = `
                  <!-- Row 1: Product Name (centered, auto font resize) -->
                  <div style="
                    font-size: ${dynamicNameSize}px; 
                    font-weight: 900; 
                    width: 100%;
                    white-space: nowrap; 
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-align: center;
                    line-height: 1.1;
                    color: #000000;
                    margin-bottom: 0.5mm;
                  ">
                    ${productName}
                  </div>

                  <!-- Row 2: Price and Code side-by-side -->
                  <div style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    width: 100%; 
                    gap: 4px;
                    margin-bottom: 0.5mm;
                    padding: 0 0.5mm;
                    box-sizing: border-box;
                  ">
                    ${includePrice ? `
                      <div style="
                        font-size: 11px; 
                        font-weight: 900; 
                        white-space: nowrap; 
                        text-align: right;
                        line-height: 1;
                        color: #000000;
                      ">
                        ${selectedProduct.sellPrice.toFixed(0)} ${isRTL ? 'ج.م' : 'EGP'}
                      </div>
                    ` : ''}
                    ${includeSku ? `
                      <div style="
                        font-size: 8.5px; 
                        font-family: monospace; 
                        font-weight: 900; 
                        white-space: nowrap; 
                        text-align: left;
                        line-height: 1;
                        color: #000000;
                      ">
                        Code: ${selectedProduct.sku.replace('MOTO-', '')}
                      </div>
                    ` : ''}
                  </div>

                  <!-- Row 3: Vector Barcode (centered, full width) -->
                  <div class="barcode-svg" style="
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    width: 100%; 
                    height: 8.5mm;
                    overflow: hidden;
                  ">
                    ${document.querySelector('.print-preview-barcode svg')?.outerHTML || ''}
                  </div>
                `;
              } else {
                innerHtml = `
                  <!-- Product Name -->
                  <div style="
                    font-size: ${currentConfig.nameSize + fontSizeAdjust}px; 
                    font-weight: 800; 
                    width: 100%; 
                    white-space: normal; 
                    word-break: break-word;
                    line-height: 1.1; 
                    max-height: 32px;
                    overflow: hidden;
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
                    <div class="barcode-svg" style="display: flex; justify-content: center; align-items: center; width: 100%;">
                      <!-- Rendered SVG inline copy -->
                      ${document.querySelector('.print-preview-barcode svg')?.outerHTML || ''}
                    </div>
                    
                    <!-- QR Code SVG Render (Vector) -->
                    ${showQR && selectedSize !== 'micro' && document.querySelector('.print-preview-qr svg') ? `
                      <div style="display: flex; justify-content: center; align-items: center;">
                        ${document.querySelector('.print-preview-qr svg').outerHTML}
                      </div>
                    ` : ''}
                  </div>
                `;
              }

              if (printRotation === 'portrait') {
                return `
                  <div class="barcode-label">
                    <div style="
                      width: ${widthCss} !important;
                      height: ${heightCss} !important;
                      transform: rotate(90deg) !important;
                      transform-origin: top left !important;
                      margin-left: ${heightCss} !important;
                      display: flex !important;
                      flex-direction: column !important;
                      justify-content: space-between !important;
                      align-items: center !important;
                      box-sizing: border-box !important;
                      padding: ${selectedSize === 'micro' ? '0.5mm' : '1.5mm'} !important;
                    ">
                      ${innerHtml}
                    </div>
                  </div>
                `;
              } else {
                return `
                  <div class="barcode-label">
                    ${innerHtml}
                  </div>
                `;
              }
            }).join('')}
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
      <style>{`
        .print-preview-barcode svg {
          width: 100% !important;
          height: auto !important;
          max-height: ${selectedSize === 'micro' ? '35px' : '45px'} !important;
        }
      `}</style>
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
              onClick={() => {
                setSelectedProduct(p);
                setPrintQuantity(p.quantity > 0 ? p.quantity : 1);
              }}
              className={`p-3 rounded-xl cursor-pointer transition-all border flex justify-between items-center ${selectedProduct?._id === p._id ? 'border-orange-500 bg-orange-500/10' : 'border-transparent hover:bg-[var(--bg-card)]'}`}
            >
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white break-words whitespace-normal">{isRTL ? p.nameAr || p.name : p.name}</div>
                <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5 flex items-center gap-1.5">
                  <span>Code: {p.sku.replace('MOTO-', '')}</span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${p.quantity > 0 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                    {isRTL ? `المخزون: ${p.quantity}` : `Stock: ${p.quantity}`}
                  </span>
                </div>
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
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'micro', label: '40x20 mm', labelAr: '٤٠×٢٠ مم', desc: 'صغير جداً (Micro)' },
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

          {/* Print Rotation Mode */}
          <div className="border-t border-[var(--border)] pt-3 space-y-2">
            <label className="form-label font-bold text-xs flex items-center gap-1">
              <Printer size={16} className="text-orange-500" />
              {isRTL ? 'اتجاه خروج الورق (طريقة الطباعة)' : 'Sticker Feed Orientation'}
            </label>
            <select 
              value={printRotation}
              onChange={(e) => setPrintRotation(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl h-11 px-3 text-xs text-slate-900 dark:text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold"
            >
              <option value="landscape">{isRTL ? '🔄 عرضي مباشر (Landscape - 0°)' : '🔄 Horizontal direct (Landscape - 0°)'}</option>
              <option value="portrait">{isRTL ? '📐 تدوير 90 درجة (Portrait - 90°)' : '📐 Rotated 90 degrees (Portrait - 90°)'}</option>
            </select>
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
              {isRTL ? '💡 اختر "تدوير 90 درجة" إذا كانت طابعتك تطبع الباركود بالطول لتقوم بلف الملصق تلقائياً.' : '💡 Use "Rotated 90 degrees" if your printer feeds vertically and prints portrait by default.'}
            </p>
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
                className={`bg-white border-2 border-black border-dashed rounded text-black flex flex-col items-center relative overflow-hidden transition-all shadow-md select-none ${selectedSize === 'micro' ? 'justify-between p-[2px_4px_1px_4px]' : 'justify-center p-2'}`}
                style={{
                  width: `${currentConfig.widthPx}px`,
                  height: `${currentConfig.heightPx}px`,
                  boxSizing: 'border-box'
                }}
              >
                {selectedSize === 'micro' ? (
                  /* 🧪 High-Contrast micro landscape layout (40x20mm) */
                  <div className="w-full h-full flex flex-col justify-between items-center text-black" style={{ padding: '0px' }}>
                    {/* Row 1: Name (centered, auto font resize) */}
                    <div 
                      className="font-black text-center w-full"
                      style={{ 
                        fontSize: `${getDynamicFontSize(isRTL ? selectedProduct.nameAr || selectedProduct.name : selectedProduct.name, fontSizeAdjust)}px`,
                        color: '#000000',
                        lineHeight: '1.1',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={isRTL ? selectedProduct.nameAr || selectedProduct.name : selectedProduct.name}
                    >
                      {isRTL ? selectedProduct.nameAr || selectedProduct.name : selectedProduct.name}
                    </div>

                    {/* Row 2: Price and Code side-by-side */}
                    <div className="flex justify-between items-center w-full" style={{ gap: '4px', margin: '1px 0' }}>
                      {includePrice && (
                        <div 
                          className="font-black shrink-0"
                          style={{ 
                            fontSize: '11px',
                            color: '#000000',
                            lineHeight: '1',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {selectedProduct.sellPrice.toFixed(0)} {isRTL ? 'ج.م' : 'EGP'}
                        </div>
                      )}
                      {includeSku && (
                        <div 
                          className="font-mono font-black shrink-0"
                          style={{ 
                            fontSize: '8.5px',
                            color: '#000000',
                            lineHeight: '1',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Code: {selectedProduct.sku.replace('MOTO-', '')}
                        </div>
                      )}
                    </div>

                    {/* Row 3: Full-width Vector Barcode taking bottom space */}
                    <div className="print-preview-barcode flex justify-center items-center w-full shrink-0" style={{ height: '32px', overflow: 'hidden' }}>
                      <Barcode 
                        value={selectedProduct.barcode || selectedProduct.sku} 
                        format="CODE128"
                        width={currentConfig.barcodeWidth}
                        height={currentConfig.barcodeHeight}
                        fontSize={8}
                        background="#ffffff"
                        lineColor="#000000"
                        margin={0}
                        displayValue={false}
                      />
                    </div>
                  </div>
                ) : (
                  /* 📦 Standard portrait/balanced multi-size layout */
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {/* 1. Name */}
                    <div 
                      className="font-extrabold text-center leading-tight w-full animate-fade-in"
                      style={{ 
                        fontSize: `${currentConfig.nameSize + fontSizeAdjust}px`,
                        color: '#000000',
                        lineHeight: '1.1',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        maxHeight: '32px',
                        overflow: 'hidden',
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
                      <div className={`print-preview-barcode flex justify-center items-center shrink-0 ${selectedSize === 'micro' ? 'w-full' : ''}`}>
                        <Barcode 
                          value={selectedProduct.barcode || selectedProduct.sku} 
                          format="CODE128"
                          width={selectedSize === 'micro' ? 1.25 : currentConfig.barcodeWidth}
                          height={currentConfig.barcodeHeight}
                          fontSize={8}
                          background="#ffffff"
                          lineColor="#000000"
                          margin={currentConfig.margin}
                          displayValue={false} // Hidden internally to match clean barcode scanner standards
                        />
                      </div>

                      {/* Vector QR Code SVG */}
                      {showQR && selectedSize !== 'micro' && (
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
                )}
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
