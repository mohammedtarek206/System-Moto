import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const ProfessionalInvoice = forwardRef(({ sale }, ref) => {
  if (!sale) return null;

  const subtotal = sale.items?.reduce((s, i) => s + (i.sellPrice * i.quantity), 0) || 0;
  const totalQty  = sale.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const discount  = sale.discount || 0;
  const tax       = sale.tax || 0;
  const finalTotal = sale.totalAmount || sale.total || 0;
  const paid      = sale.paidAmount || finalTotal;
  const change    = Math.max(0, paid - finalTotal);

  const paymentLabels = { cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل', credit: 'آجل' };

  const fmt = (n) => Number(n || 0).toFixed(2);

  const invoiceDate = new Date(sale.createdAt || Date.now());
  const dateStr = invoiceDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = invoiceDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* ======= PRINT STYLES ======= */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

        .pro-invoice-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Cairo', sans-serif;
        }

        .pro-invoice-root {
          background: #fff;
          color: #1a1a2e;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 10mm 12mm;
          direction: rtl;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html, body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .pro-invoice-root {
            width: 100% !important;
            min-height: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }

        /* ---- Header ---- */
        .inv-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px solid #e63946;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        .inv-logo { width: 70px; height: 70px; object-fit: contain; border-radius: 8px; }
        .inv-shop-center { text-align: center; flex: 1; padding: 0 12px; }
        .inv-shop-name { font-size: 22px; font-weight: 900; color: #e63946; line-height: 1.2; }
        .inv-shop-sub { font-size: 11px; color: #555; margin-top: 2px; }
        .inv-shop-contact { font-size: 10px; color: #777; margin-top: 4px; }

        /* ---- Meta Row ---- */
        .inv-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 10px 0;
        }
        .inv-meta-box {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 8px 12px;
        }
        .inv-meta-title {
          font-size: 10px;
          font-weight: 800;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 4px;
        }
        .inv-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 3px;
          color: #333;
        }
        .inv-meta-label { color: #888; font-weight: 600; }
        .inv-meta-value { font-weight: 700; }
        .inv-inv-num { font-size: 14px; font-weight: 900; color: #e63946; }

        /* ---- Table ---- */
        .inv-table-wrapper {
          margin: 10px 0;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
        }
        .inv-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .inv-table thead tr {
          background: #1a1a2e;
          color: #fff;
        }
        .inv-table th {
          padding: 8px 10px;
          text-align: right;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.3px;
        }
        .inv-table td {
          padding: 7px 10px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
          text-align: right;
          font-size: 11px;
        }
        .inv-table tbody tr:last-child td { border-bottom: none; }
        .inv-table tbody tr:nth-child(even) { background: #fafafa; }
        .inv-table tbody tr:hover { background: #fff8f0; }
        .inv-product-name { font-weight: 700; color: #1a1a2e; }
        .inv-product-sku  { font-size: 9px; color: #aaa; font-family: monospace; }
        .inv-num-col      { text-align: center !important; }
        .inv-total-cell   { font-weight: 800; color: #e63946; }

        /* ---- Totals + QR ---- */
        .inv-bottom {
          display: grid;
          grid-template-columns: 1fr 200px;
          gap: 12px;
          margin-top: 10px;
          align-items: start;
        }
        .inv-totals-box {
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
        }
        .inv-totals-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 12px;
          font-size: 11px;
          border-bottom: 1px solid #f0f0f0;
          color: #555;
        }
        .inv-totals-row:last-child { border-bottom: none; }
        .inv-totals-row.discount { color: #e63946; }
        .inv-totals-row.grand {
          background: #1a1a2e;
          color: #fff;
          font-size: 15px;
          font-weight: 900;
          padding: 10px 12px;
        }
        .inv-totals-row.grand span:last-child { color: #f97316; }
        .inv-totals-row.paid-row { background: #f0fff4; color: #2d6a4f; font-weight: 700; }
        .inv-totals-row.change-row { background: #fff8f0; color: #d4a017; font-weight: 700; }

        /* ---- QR & Notes ---- */
        .inv-right-col { display: flex; flex-direction: column; gap: 8px; align-items: center; }
        .inv-qr-box {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          width: 100%;
        }
        .inv-qr-label { font-size: 9px; color: #aaa; margin-top: 4px; font-weight: 600; }

        /* ---- Notes & Footer ---- */
        .inv-notes {
          margin-top: 10px;
          padding: 8px 12px;
          background: #fff8f0;
          border: 1px solid #ffe0b2;
          border-radius: 8px;
          font-size: 10px;
          color: #7c5c00;
        }
        .inv-notes-title { font-weight: 800; margin-bottom: 4px; color: #e65100; }

        .inv-signature-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 12px;
        }
        .inv-signature-box {
          border-top: 1px dashed #ccc;
          padding-top: 6px;
          text-align: center;
          font-size: 10px;
          color: #aaa;
        }

        .inv-footer {
          margin-top: 14px;
          text-align: center;
          border-top: 2px solid #e63946;
          padding-top: 8px;
        }
        .inv-thank { font-size: 14px; font-weight: 900; color: #e63946; }
        .inv-footer-sub { font-size: 9px; color: #aaa; margin-top: 2px; }

        .inv-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }
        .inv-badge-cash     { background: #e8f5e9; color: #2e7d32; }
        .inv-badge-card     { background: #e3f2fd; color: #1565c0; }
        .inv-badge-transfer { background: #f3e5f5; color: #6a1b9a; }
        .inv-badge-credit   { background: #fff3e0; color: #e65100; }
      `}</style>

      {/* ======= INVOICE CONTENT ======= */}
      <div ref={ref} className="pro-invoice-root">

          {/* ===== HEADER ===== */}
          <div className="inv-header">
            <img src="/photo_2026-05-12_22-56-52.jpg" alt="logo-right" className="inv-logo" />

            <div className="inv-shop-center">
              <div className="inv-shop-name">على بركة الله</div>
              <div className="inv-shop-sub">متخصصون في قطع غيار الموتوسيكلات</div>
              <div className="inv-shop-contact">📞 ٠١٠٩٥٣٩٢٩٢٩ / ٠١١١١١٧٥٠٩٩ &nbsp;|&nbsp; 📍 الحي الغربي بعد مجمع المحاكم</div>
            </div>

            <img src="/photo_2026-05-18_01-04-37.jpg" alt="logo-left" className="inv-logo" />
          </div>

          {/* ===== META: INVOICE INFO + CUSTOMER ===== */}
          <div className="inv-meta">
            {/* Invoice Info */}
            <div className="inv-meta-box">
              <div className="inv-meta-title">بيانات الفاتورة</div>
              <div className="inv-meta-row">
                <span className="inv-meta-label">رقم الفاتورة</span>
                <span className="inv-inv-num">{sale.invoiceNumber}</span>
              </div>
              <div className="inv-meta-row">
                <span className="inv-meta-label">التاريخ</span>
                <span className="inv-meta-value">{dateStr}</span>
              </div>
              <div className="inv-meta-row">
                <span className="inv-meta-label">الوقت</span>
                <span className="inv-meta-value">{timeStr}</span>
              </div>
              <div className="inv-meta-row">
                <span className="inv-meta-label">الكاشير</span>
                <span className="inv-meta-value">{sale.user?.name || 'النظام'}</span>
              </div>
              <div className="inv-meta-row">
                <span className="inv-meta-label">طريقة الدفع</span>
                <span className={`inv-badge inv-badge-${sale.paymentMethod || 'cash'}`}>
                  {paymentLabels[sale.paymentMethod] || 'نقدي'}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="inv-meta-box">
              <div className="inv-meta-title">بيانات العميل</div>
              <div className="inv-meta-row">
                <span className="inv-meta-label">الاسم</span>
                <span className="inv-meta-value">{sale.customer?.name || 'عميل نقدي'}</span>
              </div>
              <div className="inv-meta-row">
                <span className="inv-meta-label">الهاتف</span>
                <span className="inv-meta-value">{sale.customer?.phone || '—'}</span>
              </div>
              <div className="inv-meta-row">
                <span className="inv-meta-label">العنوان</span>
                <span className="inv-meta-value">{sale.customer?.address || '—'}</span>
              </div>
              <div className="inv-meta-row" style={{ marginTop: '8px' }}>
                <span className="inv-meta-label">عدد الأصناف</span>
                <span className="inv-meta-value" style={{ color: '#e63946', fontWeight: 900 }}>{sale.items?.length || 0}</span>
              </div>
              <div className="inv-meta-row">
                <span className="inv-meta-label">إجمالي الكمية</span>
                <span className="inv-meta-value" style={{ color: '#e63946', fontWeight: 900 }}>{totalQty} قطعة</span>
              </div>
            </div>
          </div>

          {/* ===== ITEMS TABLE ===== */}
          <div className="inv-table-wrapper">
            <table className="inv-table">
              <thead>
                <tr>
                  <th className="inv-num-col" style={{ width: '32px' }}>م</th>
                  <th>اسم الصنف / المنتج</th>
                  <th style={{ width: '90px' }}>كود المنتج</th>
                  <th className="inv-num-col" style={{ width: '70px' }}>سعر البيع</th>
                  <th className="inv-num-col" style={{ width: '50px' }}>الكمية</th>
                  <th className="inv-num-col" style={{ width: '80px' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {sale.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="inv-num-col" style={{ fontWeight: 700, color: '#aaa' }}>{idx + 1}</td>
                    <td>
                      <div className="inv-product-name">
                        {item.product?.nameAr || item.product?.name || item.name || item.nameAr || '—'}
                      </div>
                      <div className="inv-product-sku">{item.product?.sku || '—'}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '10px', color: '#666' }}>
                      {item.product?.sku || item.product?.barcode || '—'}
                    </td>
                    <td className="inv-num-col">{fmt(item.sellPrice)}</td>
                    <td className="inv-num-col" style={{ fontWeight: 800 }}>{item.quantity}</td>
                    <td className="inv-num-col inv-total-cell">{fmt(item.sellPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ===== BOTTOM: TOTALS + QR ===== */}
          <div className="inv-bottom">
            {/* Totals */}
            <div className="inv-totals-box">
              <div className="inv-totals-row">
                <span>إجمالي المنتجات ({sale.items?.length || 0} صنف)</span>
                <span style={{ fontWeight: 700 }}>{fmt(subtotal)} ج.م</span>
              </div>
              <div className="inv-totals-row">
                <span>إجمالي الكمية</span>
                <span style={{ fontWeight: 700 }}>{totalQty} قطعة</span>
              </div>
              <div className="inv-totals-row">
                <span>إجمالي قبل الخصم</span>
                <span style={{ fontWeight: 700 }}>{fmt(subtotal)} ج.م</span>
              </div>
              {discount > 0 && (
                <div className="inv-totals-row discount">
                  <span>خصم</span>
                  <span style={{ fontWeight: 800 }}>- {fmt(discount)} ج.م</span>
                </div>
              )}
              {tax > 0 && (
                <div className="inv-totals-row">
                  <span>ضريبة</span>
                  <span style={{ fontWeight: 700 }}>{fmt(tax)} ج.م</span>
                </div>
              )}
              <div className="inv-totals-row grand">
                <span>الإجمالي النهائي</span>
                <span>{fmt(finalTotal)} ج.م</span>
              </div>
              <div className="inv-totals-row paid-row">
                <span>المبلغ المدفوع</span>
                <span>{fmt(paid)} ج.م</span>
              </div>
              {change > 0 && (
                <div className="inv-totals-row change-row">
                  <span>المبلغ المرتجع</span>
                  <span>{fmt(change)} ج.م</span>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="inv-right-col">
              <div className="inv-qr-box">
                <QRCodeSVG
                  value={`INV:${sale.invoiceNumber}|TOTAL:${finalTotal}|DATE:${invoiceDate.toISOString().slice(0,10)}`}
                  size={120}
                  fgColor="#1a1a2e"
                  bgColor="#f8f9fa"
                  level="M"
                />
                <div className="inv-qr-label">امسح للتحقق من الفاتورة</div>
                <div className="inv-qr-label" style={{ color: '#e63946', fontWeight: 800, marginTop: 2 }}>
                  {sale.invoiceNumber}
                </div>
              </div>
            </div>
          </div>

          {/* ===== NOTES ===== */}
          <div className="inv-notes">
            <div className="inv-notes-title">📝 ملاحظات وسياسة الاسترجاع</div>
            <div>• الاستبدال خلال 14 يوماً من تاريخ الفاتورة بشرط وجود الفاتورة الأصلية.</div>
            <div>• يجب أن تكون القطعة في حالتها الأصلية دون كسر أو استخدام.</div>
            {sale.notes && <div>• {sale.notes}</div>}
          </div>

          {/* ===== SIGNATURE ===== */}
          <div className="inv-signature-row">
            <div className="inv-signature-box">
              <div style={{ height: '30px' }}></div>
              توقيع العميل
            </div>
            <div className="inv-signature-box">
              <div style={{ height: '30px' }}></div>
              توقيع المسؤول
            </div>
          </div>

          {/* ===== FOOTER ===== */}
          <div className="inv-footer">
            <div className="inv-thank">🙏 شكراً لثقتكم في محل على بركة الله</div>
            <div className="inv-footer-sub">نتمنى لكم رحلة آمنة — تفضلوا بزيارتنا مرة أخرى</div>
            <div className="inv-footer-sub" style={{ marginTop: 2 }}>📞 ٠١٠٩٥٣٩٢٩٢٩ / ٠١١١١١٧٥٠٩٩ &nbsp;|&nbsp; 📍 الحي الغربي بعد مجمع المحاكم</div>
          </div>

        </div>
    </>
  );
});

ProfessionalInvoice.displayName = 'ProfessionalInvoice';
export default ProfessionalInvoice;
