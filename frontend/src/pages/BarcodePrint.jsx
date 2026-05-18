import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Printer, Search, RefreshCw, Barcode as BarcodeIcon } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import Barcode from 'react-barcode';

export default function BarcodePrint() {
  const { t, isRTL } = useLang();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [printQuantity, setPrintQuantity] = useState(1);

  const printComponentRef = useRef();

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?search=${search}&limit=10000`);
      setProducts(res.data.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printComponentRef.current;
    if (!printContent) return;

    // Create a temporary hidden iframe
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
    
    // Copy all CSS styles from main page
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
            @page {
              size: auto;
              margin: 5mm;
            }
            body {
              background: white !important;
              color: black !important;
              margin: 0;
              padding: 0;
              font-family: 'Cairo', sans-serif;
            }
            .print-grid {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 12px !important;
            }
            .barcode-label {
              border: 1px solid #000 !important;
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
              overflow: hidden !important;
            }
            @media print {
              body, body * {
                visibility: visible !important;
              }
              .print-grid, .print-grid *, .barcode-label, .barcode-label * {
                visibility: visible !important;
              }
            }
          </style>
        </head>
        <body dir="${isRTL ? 'rtl' : 'ltr'}">
          <div class="print-grid">
            ${printContent.innerHTML}
          </div>
          <script>
            // Ensure everything is rendered, then print
            setTimeout(() => {
              window.focus();
              window.print();
              setTimeout(() => {
                window.parent.document.body.removeChild(window.frameElement);
              }, 500);
            }, 300);
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  return (
    <div className="space-y-6 fade-in flex flex-col md:flex-row gap-6">
      {/* Configuration Section (Hidden on Print) */}
      <div className="w-full md:w-[400px] bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-xl print:hidden flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-1"><BarcodeIcon className="text-orange-500" /> {isRTL ? 'طباعة الباركود' : 'Print Barcodes'}</h2>
          <p className="text-sm text-[var(--text-muted)]">{isRTL ? 'اختر المنتج وحدد الكمية' : 'Select product and quantity'}</p>
        </div>

        <div className="relative search-input">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="form-input" 
            placeholder={isRTL ? 'بحث عن منتج...' : 'Search product...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2">
          {products.map(p => (
            <div 
              key={p._id} 
              onClick={() => setSelectedProduct(p)}
              className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedProduct?._id === p._id ? 'border-orange-500 bg-orange-500/10' : 'border-[var(--border)] hover:bg-[var(--bg-card2)]'}`}
            >
              <div className="font-bold text-sm">{isRTL ? p.nameAr || p.name : p.name}</div>
              <div className="text-xs text-[var(--text-muted)] font-mono mt-1">{p.barcode || p.sku}</div>
            </div>
          ))}
          {loading && <div className="flex-center py-4 text-orange-500"><RefreshCw className="loading-spin" /></div>}
        </div>

        {selectedProduct && (
          <div className="space-y-4 pt-4 border-t border-[var(--border)]">
            <div>
              <label className="form-label">{isRTL ? 'كمية الملصقات' : 'Labels Quantity'}</label>
              <input 
                type="number" 
                className="form-input text-lg font-bold" 
                value={printQuantity} 
                onChange={(e) => setPrintQuantity(Math.max(1, Number(e.target.value)))}
                min="1"
              />
            </div>
            <button 
              onClick={handlePrint}
              className="w-full btn btn-primary h-14 text-lg gap-2"
            >
              <Printer /> {t('print')}
            </button>
          </div>
        )}
      </div>

      {/* Print Preview Section */}
      <div className="flex-1 bg-white p-8 rounded-[2.5rem] print:rounded-none print:p-0 min-h-[500px] overflow-auto border border-[var(--border)] print:border-none print:m-0 print:shadow-none shadow-inner">
        <div ref={printComponentRef} className="print-grid grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2 auto-rows-max p-4 bg-white text-black">
          {selectedProduct ? [...Array(printQuantity)].map((_, i) => (
            <div key={i} className="barcode-label border-2 border-black border-dashed p-3 flex flex-col items-center justify-center bg-white text-black text-center break-inside-avoid print:border-solid h-[160px] print:h-[135px] w-full overflow-hidden">
              <div className="text-[11px] sm:text-xs font-bold leading-tight mb-1 truncate w-full">{isRTL ? selectedProduct.nameAr || selectedProduct.name : selectedProduct.name}</div>
              <div className="font-black text-sm mb-1">{selectedProduct.sellPrice} {t('currency')}</div>
              <Barcode 
                value={selectedProduct.barcode || selectedProduct.sku} 
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
          )) : (
            <div className="col-span-full h-full flex-center text-slate-300 print:hidden flex-col gap-4">
              <BarcodeIcon size={64} className="opacity-20" />
              <p className="font-bold">{isRTL ? 'اختر منتجاً لعرض الملصقات' : 'Select a product to view labels'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
