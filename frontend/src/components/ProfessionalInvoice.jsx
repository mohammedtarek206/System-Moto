import { forwardRef, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import api from '../lib/api';

const ProfessionalInvoice = forwardRef(({ sale, receiptWidth }, ref) => {
  const [settings, setSettings] = useState(null);
  const barcodeRef = useRef(null);

  // Fetch shop settings for dynamic store branding with professional fallbacks
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.data) {
          setSettings(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load settings in receipt:", err);
      }
    };
    fetchSettings();
  }, []);

  // Generate vector-sharp invoice barcode
  useEffect(() => {
    if (barcodeRef.current && sale?.invoiceNumber) {
      try {
        JsBarcode(barcodeRef.current, sale.invoiceNumber, {
          format: "CODE128",
          width: 1.3,
          height: 35,
          displayValue: true,
          fontSize: 9,
          font: "monospace",
          textMargin: 2,
          background: "transparent",
          lineColor: "#000000"
        });
      } catch (e) {
        console.error("JsBarcode generation failed:", e);
      }
    }
  }, [sale]);

  if (!sale) return null;

  // Global paper size configuration (80mm or 58mm)
  const paperSize = receiptWidth || localStorage.getItem('receipt_paper_size') || '80mm';

  // Fallbacks matched to "النسر" shop details from prompt & attached receipt mockups
  const shopName = settings?.shopNameAr || 'النسر';
  const shopSub = settings?.shopName ? 'لقطع غيار الموتوسيكلات' : 'لقطع غيار الموتوسيكلات';
  const shopPhone = settings?.shopPhone || '01234567890';
  const customerServicePhone = settings?.shopPhone || '01234567890';
  const shopAddress = settings?.shopAddress || 'جمهورية - بجوار محطة البنزين - القاهرة';

  // Calculation formatting
  const fmt = (n) => Number(n || 0).toFixed(2);

  const subtotal = sale.items?.reduce((s, i) => s + (i.sellPrice * i.quantity), 0) || 0;
  const totalQty  = sale.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const discount  = sale.discount || 0;
  
  // Tax calculations: handle dynamic tax from settings rate or sale property
  const taxRate = settings?.taxRate || sale.taxRate || 14; 
  const taxAmount = sale.tax || (subtotal * (taxRate / 100));
  const finalTotal = sale.totalAmount || sale.total || (subtotal - discount + taxAmount);
  
  const paid      = sale.paidAmount || finalTotal;
  const change    = Math.max(0, paid - finalTotal);

  // Formatting dates & times in Arabic local format
  const invoiceDate = new Date(sale.createdAt || Date.now());
  const dateStr = invoiceDate.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = invoiceDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <>
      {/* ======= PREMIUM THERMAL RECEIPT STYLES ======= */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

        .thermal-receipt-root, .thermal-receipt-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Cairo', 'Courier New', Courier, monospace, sans-serif;
          letter-spacing: normal !important;
          word-spacing: normal !important;
        }

        /* Screen Preview Styling: Rendered as a physical paper invoice */
        .thermal-receipt-root {
          background: #ffffff;
          color: #000000;
          margin: 0 auto;
          direction: rtl;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        /* Fluid sizing to scale between standard printer rolls */
        .thermal-receipt-root.size-80mm {
          width: 80mm;
          min-height: 140mm;
          padding: 6mm 4mm;
          font-size: 11px;
        }

        .thermal-receipt-root.size-58mm {
          width: 58mm;
          min-height: 100mm;
          padding: 4mm 2mm;
          font-size: 9px;
        }

        /* --- Logo & Header --- */
        .receipt-header {
          text-align: center;
          margin-bottom: 8px;
        }
        
        .receipt-logo-svg {
          display: block;
          margin: 0 auto 4px auto;
          fill: #000000;
        }

        .size-80mm .receipt-logo-svg {
          width: 65px;
          height: 42px;
        }

        .size-58mm .receipt-logo-svg {
          width: 48px;
          height: 32px;
        }

        .receipt-shop-name {
          font-weight: 900;
          color: #000000;
          line-height: 1.1;
          margin-bottom: 2px;
        }
        
        .size-80mm .receipt-shop-name {
          font-size: 18px;
        }

        .size-58mm .receipt-shop-name {
          font-size: 14px;
        }

        .receipt-shop-sub {
          font-weight: 700;
          opacity: 0.85;
          margin-bottom: 6px;
        }

        .size-80mm .receipt-shop-sub {
          font-size: 10px;
        }

        .size-58mm .receipt-shop-sub {
          font-size: 8px;
        }

        /* --- Commercial Dash Dividers --- */
        .receipt-divider {
          border-top: 1px dashed #000000;
          margin: 6px 0;
          width: 100%;
          height: 0;
        }

        .receipt-title {
          text-align: center;
          font-weight: 800;
          text-transform: uppercase;
          margin: 4px 0;
          letter-spacing: 1px;
        }

        .size-80mm .receipt-title {
          font-size: 13px;
        }

        .size-58mm .receipt-title {
          font-size: 10px;
        }

        /* --- Metadata Table --- */
        .receipt-meta-grid {
          margin: 6px 0;
          width: 100%;
        }

        .receipt-meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          line-height: 1.3;
        }

        .receipt-meta-label {
          font-weight: 600;
          color: #000000;
        }

        .receipt-meta-value {
          font-weight: 800;
          text-align: left;
        }

        /* --- Items Table --- */
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          margin: 6px 0;
        }

        .receipt-table th {
          border-bottom: 1px dashed #000000;
          font-weight: 800;
          padding: 4px 2px;
          text-align: right;
        }

        .receipt-table td {
          padding: 5px 2px;
          vertical-align: top;
          text-align: right;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .receipt-table tbody tr {
          border-bottom: 1px dotted #e0e0e0;
        }

        .receipt-table tbody tr:last-child {
          border-bottom: none;
        }

        /* Fixed column alignments and spacing */
        .col-idx { width: 6%; text-align: center !important; font-weight: 600; }
        .col-name { width: 44%; font-weight: 700; line-height: 1.2; }
        .col-code { width: 14%; font-family: monospace; text-align: center !important; font-size: 0.9em; }
        .col-qty { width: 10%; text-align: center !important; font-weight: 800; }
        .col-price { width: 12%; text-align: center !important; }
        .col-total { width: 14%; text-align: left !important; font-weight: 800; }

        .receipt-item-details {
          font-size: 0.85em;
          opacity: 0.7;
          font-weight: 600;
          margin-top: 1px;
        }

        /* --- Accounting Summary --- */
        .receipt-totals-box {
          margin: 6px 0;
          width: 100%;
        }

        .receipt-totals-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-weight: 600;
        }

        .receipt-totals-row.grand-total {
          border-top: 1px dashed #000000;
          border-bottom: 1px dashed #000000;
          margin-top: 4px;
          padding: 6px 0;
          font-weight: 900;
        }

        .size-80mm .receipt-totals-row.grand-total {
          font-size: 15px;
        }

        .size-58mm .receipt-totals-row.grand-total {
          font-size: 12px;
        }

        .receipt-totals-row.grand-total span:last-child {
          border-bottom: 2px double #000000;
        }

        /* --- Footer & Identifiers --- */
        .receipt-footer {
          text-align: center;
          margin-top: 10px;
        }

        .receipt-thank {
          font-weight: 800;
          margin-bottom: 2px;
        }

        .size-80mm .receipt-thank { font-size: 12px; }
        .size-58mm .receipt-thank { font-size: 9.5px; }

        .receipt-visit {
          font-size: 0.9em;
          opacity: 0.8;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .receipt-qr-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 8px 0;
        }

        .receipt-qr-text {
          font-size: 0.85em;
          opacity: 0.8;
          margin-top: 3px;
          font-weight: 700;
        }

        .receipt-contact-details {
          font-size: 0.85em;
          font-weight: 700;
          line-height: 1.4;
          margin-top: 6px;
          border-top: 1px dotted #000000;
          padding-top: 4px;
        }

        /* ======= PURE BLACK & WHITE HIGH-CONTRAST PRINT STYLES ======= */
        @media print {
          @page {
            size: auto;
            margin: 0 !important;
          }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
          }

          .no-print {
            display: none !important;
          }

          .thermal-receipt-root {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 2mm 1mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .receipt-divider {
            border-top: 1px dashed #000000 !important;
          }

          .receipt-totals-row.grand-total {
            border-top: 1px dashed #000000 !important;
            border-bottom: 1px dashed #000000 !important;
          }
        }
      `}</style>

      {/* ======= THERMAL INVOICE CONTAINER ======= */}
      <div ref={ref} className={`thermal-receipt-root size-${paperSize}`}>
        
        {/* ===== LOGO & HEADER SECTION ===== */}
        <div className="receipt-header">
          {/* Custom vector wings + motorcycle + cog gear SVG logo for pure sharp thermal prints */}
          <svg viewBox="0 0 100 60" className="receipt-logo-svg">
            {/* Left Wing */}
            <path d="M 35 25 C 20 25, 10 15, 5 30 C 12 35, 20 30, 35 28 Z" />
            <path d="M 32 30 C 18 31, 12 24, 8 36 C 14 39, 22 35, 32 33 Z" />
            <path d="M 29 35 C 16 37, 14 32, 11 41 C 17 43, 23 39, 29 37 Z" />
            
            {/* Right Wing */}
            <path d="M 65 25 C 80 25, 90 15, 95 30 C 88 35, 80 30, 65 28 Z" />
            <path d="M 68 30 C 82 31, 88 24, 92 36 C 86 39, 78 35, 68 33 Z" />
            <path d="M 71 35 C 84 37, 86 32, 89 41 C 83 43, 77 39, 71 37 Z" />

            {/* Central Gear / Cog Wheel */}
            <circle cx="50" cy="30" r="14" fill="none" stroke="#000000" strokeWidth="2.5" />
            <g transform="translate(50, 30)">
              {[...Array(8)].map((_, i) => (
                <rect key={i} x="-2" y="-16.5" width="4" height="3" transform={`rotate(${i * 45})`} />
              ))}
            </g>
            <circle cx="50" cy="30" r="11" fill="#ffffff" />
            
            {/* Central Motorcycle Silhouette */}
            <g transform="translate(41.5, 24) scale(0.17)">
              {/* Wheels */}
              <circle cx="10" cy="30" r="8" fill="none" stroke="#000000" strokeWidth="3" />
              <circle cx="10" cy="30" r="2" />
              <circle cx="90" cy="30" r="8" fill="none" stroke="#000000" strokeWidth="3" />
              <circle cx="90" cy="30" r="2" />
              {/* Chassis / Frame */}
              <path d="M 10 30 L 40 30 L 60 12 L 90 30 L 75 12" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 40 30 L 48 10 L 70 10 L 60 30 Z" />
              {/* Handlebars */}
              <path d="M 75 12 L 68 2" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 68 2 L 58 2" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
              {/* Seat */}
              <path d="M 30 18 L 52 18" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </svg>

          <h1 className="receipt-shop-name">{shopName}</h1>
          <p className="receipt-shop-sub">{shopSub}</p>
        </div>

        <div className="receipt-divider"></div>
        <div className="receipt-title">فاتورة بيع</div>
        <div className="receipt-divider"></div>

        {/* ===== METADATA: SALES & CASHIER DETAILS ===== */}
        <div className="receipt-meta-grid">
          <div className="receipt-meta-row">
            <span className="receipt-meta-label">رقم الفاتورة :</span>
            <span className="receipt-meta-value font-mono">{sale.invoiceNumber}</span>
          </div>
          <div className="receipt-meta-row">
            <span className="receipt-meta-label">التاريخ :</span>
            <span className="receipt-meta-value">{dateStr}</span>
          </div>
          <div className="receipt-meta-row">
            <span className="receipt-meta-label">وقت الفاتورة :</span>
            <span className="receipt-meta-value">{timeStr}</span>
          </div>
          <div className="receipt-meta-row">
            <span className="receipt-meta-label">الكاشير :</span>
            <span className="receipt-meta-value">{sale.user?.name || 'النظام'}</span>
          </div>
          <div className="receipt-meta-row">
            <span className="receipt-meta-label">اسم العميل :</span>
            <span className="receipt-meta-value">{sale.customer?.name || 'عميل نقدي'}</span>
          </div>
          <div className="receipt-meta-row">
            <span className="receipt-meta-label">رقم الهاتف :</span>
            <span className="receipt-meta-value">{sale.customer?.phone || '—'}</span>
          </div>
          <div className="receipt-meta-row">
            <span className="receipt-meta-label">العنوان :</span>
            <span className="receipt-meta-value">{sale.customer?.address || '—'}</span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* ===== PRODUCTS LIST TABLE ===== */}
        <table className="receipt-table">
          <thead>
            <tr>
              <th className="col-idx">م</th>
              <th className="col-name">الصنف</th>
              <th className="col-code">كود</th>
              <th className="col-qty">العدد</th>
              <th className="col-price">السعر</th>
              <th className="col-total">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, idx) => (
              <tr key={idx}>
                <td className="col-idx">{idx + 1}</td>
                <td className="col-name">
                  <div>{item.product?.nameAr || item.product?.name || item.name || item.nameAr || '—'}</div>
                  {/* Optional SKU/Barcode rendering below name to maximize print area */}
                  {(item.product?.sku && item.product.sku !== item.product?.barcode) && (
                    <div className="receipt-item-details font-mono">({item.product.sku})</div>
                  )}
                </td>
                <td className="col-code font-mono">{item.product?.sku || item.product?.barcode || '—'}</td>
                <td className="col-qty">{item.quantity}</td>
                <td className="col-price">{fmt(item.sellPrice)}</td>
                <td className="col-total">{fmt(item.sellPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-divider"></div>

        {/* ===== ACCOUNTING TOTALS SECTION ===== */}
        <div className="receipt-totals-box">
          <div className="receipt-totals-row">
            <span>إجمالي المنتجات :</span>
            <span className="font-mono">{sale.items?.length || 0}</span>
          </div>
          <div className="receipt-totals-row">
            <span>إجمالي الكمية :</span>
            <span className="font-mono">{totalQty}</span>
          </div>
          <div className="receipt-totals-row">
            <span>إجمالي قبل الخصم :</span>
            <span className="font-mono">{fmt(subtotal)}</span>
          </div>
          <div className="receipt-totals-row font-bold" style={{ color: discount > 0 ? '#000000' : 'inherit' }}>
            <span>الخصم :</span>
            <span className="font-mono">-{fmt(discount)}</span>
          </div>
          <div className="receipt-totals-row">
            <span>ضريبة القيمة المضافة ({taxRate}%) :</span>
            <span className="font-mono">{fmt(taxAmount)}</span>
          </div>
          
          <div className="receipt-totals-row grand-total">
            <span>الإجمالي النهائي :</span>
            <span className="font-mono">{fmt(finalTotal)}</span>
          </div>

          <div className="receipt-totals-row" style={{ marginTop: '4px', opacity: 0.9 }}>
            <span>المبلغ المدفوع :</span>
            <span className="font-mono">{fmt(paid)}</span>
          </div>
          {change > 0 && (
            <div className="receipt-totals-row" style={{ opacity: 0.9 }}>
              <span>المبلغ المرتجع :</span>
              <span className="font-mono">{fmt(change)}</span>
            </div>
          )}
        </div>

        <div className="receipt-divider"></div>

        {/* ===== RECEIPT FOOTER & SCAN CODES ===== */}
        <div className="receipt-footer">
          <div className="receipt-thank">شكرا لثقتكم بنا</div>
          <div className="receipt-thank">★ نتمنى لكم تجربة تسوق ممتعة ★</div>
          
          <div className="receipt-divider"></div>

          {/* Dynamic Vector Barcode */}
          <div className="my-3">
            <svg ref={barcodeRef} className="receipt-barcode-svg mx-auto"></svg>
          </div>

          {/* Dynamic Vector QR Code for instant smartphone retrieval */}
          <div className="receipt-qr-wrapper">
            <QRCodeSVG
              value={`INV:${sale.invoiceNumber}|TOTAL:${fmt(finalTotal)}|DATE:${dateStr}`}
              size={paperSize === '58mm' ? 70 : 100}
              fgColor="#000000"
              bgColor="#ffffff"
              level="M"
            />
            <span className="receipt-qr-text">امسح الكود للرجوع للفاتورة</span>
          </div>

          {/* Contact Details */}
          <div className="receipt-contact-details">
            <div>📞 {shopPhone}</div>
            <div>📍 {shopAddress}</div>
            <div style={{ marginTop: '4px', fontSize: '0.9em', borderTop: '1px dotted #ccc', paddingTop: '3px' }}>
              رقم خدمة العملاء
            </div>
            <div className="font-mono">{customerServicePhone}</div>
          </div>

          <div style={{ marginTop: '10px', fontSize: '0.75em', fontWeight: '800', opacity: 0.8, borderTop: '1px dashed #000', paddingTop: '5px' }}>
            Powered & Developed By ARQAM
          </div>
        </div>

      </div>
    </>
  );
});

ProfessionalInvoice.displayName = 'ProfessionalInvoice';
export default ProfessionalInvoice;
