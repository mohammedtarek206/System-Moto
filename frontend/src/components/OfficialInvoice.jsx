import { forwardRef, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { useLang } from '../contexts/LangContext';

const OfficialInvoice = forwardRef(({ sale }, ref) => {
  const { isRTL } = useLang();
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && sale?.invoiceNumber) {
      JsBarcode(barcodeRef.current, sale.invoiceNumber, {
        format: "CODE128",
        width: 1,
        height: 30,
        displayValue: false
      });
    }
  }, [sale]);

  if (!sale) return null;

  const subtotal = (sale.totalAmount || 0) + (sale.discount || 0);

  return (
    <div ref={ref} className="invoice-container bg-white p-8 font-sans text-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* --- HEADER --- */}
      <div className="flex justify-between items-start border-b-4 border-red-600 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-red-600 flex items-center justify-center rounded-xl rotate-3 shadow-lg">
             <span className="text-white font-black text-2xl italic">M</span>
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-slate-900">على بركة الله</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{isRTL ? 'لإدارة قطع غيار الموتوسيكلات' : 'Motorcycle Spare Parts'}</p>
          </div>
        </div>
        <div className="text-end">
           <h2 className="text-2xl font-black text-red-600 uppercase mb-1">{isRTL ? 'فاتورة مبيعات' : 'Sales Invoice'}</h2>
           <div className="flex flex-col items-end gap-1">
              <p className="text-sm font-mono font-bold">#{sale.invoiceNumber}</p>
              <canvas ref={barcodeRef} className="max-h-8"></canvas>
           </div>
        </div>
      </div>

      {/* --- INFO SECTION --- */}
      <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
        <div className="space-y-1">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b w-fit">{isRTL ? 'بيانات المحل' : 'STORE INFO'}</div>
          <p className="font-bold">على بركة الله</p>
          <p className="opacity-70">{isRTL ? 'القاهرة، شارع رمسيس' : 'Cairo, Ramsis St.'}</p>
          <p className="opacity-70">Tel: +20 123 456 789</p>
          <p className="opacity-70">Email: info@motoparts.com</p>
        </div>
        <div className="text-end space-y-1">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b w-fit ms-auto">{isRTL ? 'مفوتر إلى' : 'BILL TO'}</div>
          <p className="font-bold text-lg">{sale.customer?.name || (isRTL ? 'عميل نقدي' : 'Cash Customer')}</p>
          <p className="opacity-70">{sale.customer?.phone || ''}</p>
          <div className="pt-2">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{isRTL ? 'التاريخ والوقت' : 'DATE & TIME'}</p>
            <p className="font-mono text-xs">{new Date(sale.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</p>
          </div>
        </div>
      </div>

      {/* --- ITEMS TABLE --- */}
      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className={`py-3 px-4 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'المنتج' : 'Item'}</th>
              <th className="py-3 px-4 text-center">{isRTL ? 'الكمية' : 'Qty'}</th>
              <th className="py-3 px-4 text-center">{isRTL ? 'السعر' : 'Price'}</th>
              <th className={`py-3 px-4 ${isRTL ? 'text-left' : 'text-right'}`}>{isRTL ? 'الإجمالي' : 'Total'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sale.items?.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-800">{isRTL ? item.product?.nameAr || item.product?.name : item.product?.name}</div>
                  <div className="text-[10px] opacity-50 font-mono italic">{item.product?.sku}</div>
                </td>
                <td className="py-4 px-4 text-center font-black">{item.quantity}</td>
                <td className="py-4 px-4 text-center font-mono">{Number(item.sellPrice).toFixed(2)}</td>
                <td className={`py-4 px-4 font-black ${isRTL ? 'text-left' : 'text-right'}`}>{(item.sellPrice * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- TOTALS & FOOTER --- */}
      <div className="flex justify-between items-start gap-12">
        <div className="flex-1 space-y-6">
           <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{isRTL ? 'ملاحظات وسياسة الاسترجاع' : 'NOTES & RETURN POLICY'}</p>
              <ul className="text-[10px] opacity-70 list-disc list-inside space-y-1">
                <li>{isRTL ? 'الاستبدال خلال 14 يوماً من تاريخ الفاتورة' : 'Exchanges within 14 days of invoice date'}</li>
                <li>{isRTL ? 'يجب أن تكون القطعة في حالتها الأصلية' : 'Items must be in original condition'}</li>
                <li>{isRTL ? 'شكراً لاختياركم معرضنا' : 'Thank you for choosing us'}</li>
              </ul>
           </div>
           <div className="flex items-center gap-4 opacity-30">
              <div className="text-xs font-black italic tracking-tighter">فاتورة معتمدة - على بركة الله</div>
           </div>
        </div>

        <div className="w-72">
          <div className="space-y-2 border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-bold">{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span className="font-mono">{subtotal.toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm text-red-600 font-bold">
                <span>{isRTL ? 'الخصم' : 'Discount'}</span>
                <span className="font-mono">-{sale.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-bold">{isRTL ? 'الضريبة (0%)' : 'Tax (0%)'}</span>
              <span className="font-mono">0.00</span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-black italic">TOTAL</span>
            <span className="text-3xl font-black text-red-600 tracking-tighter">{Number(sale.totalAmount).toFixed(2)} <span className="text-xs uppercase">EGP</span></span>
          </div>
          
          <div className="flex justify-between items-end">
            <div className="text-[10px] font-black text-slate-400">
               <div>CASHIER: {sale.user?.name}</div>
               <div className="mt-1">PAYMENT: {sale.paymentMethod?.toUpperCase()}</div>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg">
               <QRCodeSVG value={`https://motoparts.com/invoice/${sale.invoiceNumber}`} size={60} fgColor="#FFFFFF" bgColor="transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* CSS for Thermal Printing */}
      <style>{`
        @media print {
          @page { size: auto; margin: 5mm; }
          .invoice-container { 
            width: 100% !important; 
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Thermal adjustments if width is small */
          @media (max-width: 80mm) {
            .invoice-container { font-size: 10px !important; }
            .grid { grid-template-cols: 1fr !important; gap: 4px !important; }
            .w-72 { width: 100% !important; }
          }
        }
      `}</style>
    </div>
  );
});

export default OfficialInvoice;
