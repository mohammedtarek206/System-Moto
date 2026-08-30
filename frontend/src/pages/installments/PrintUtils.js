export const printReceipt = (receiptData) => {
    if (!receiptData) return;
    const printContent = `
    <html>
      <head>
        <title>إيصال سداد قسط</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 30px; color: #333; background: #fff; }
          .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
          .title { font-size: 24px; font-weight: 800; color: #3b82f6; }
          .content { max-width: 500px; margin: 0 auto; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 12px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
          .label { font-weight: 700; color: #64748b; }
          .total-row { border-top: 2px solid #e2e8f0; padding-top: 15px; margin-top: 15px; font-size: 18px; font-weight: 800; }
        </style>
      </head>
      <body>
        <div class="content">
          <div class="header">
            <div class="title">معرض على بركة الله</div>
            <div style="font-size: 14px; margin-top: 5px;">إيصال سداد قسط</div>
          </div>
          <div class="row"><span class="label">رقم العقد:</span> <strong>${receiptData.contractNumber}</strong></div>
          <div class="row"><span class="label">العميل:</span> <strong>${receiptData.customerName}</strong></div>
          <div class="row"><span class="label">المركبة:</span> <strong>${receiptData.brand} ${receiptData.model}</strong></div>
          <div class="row"><span class="label">تاريخ التحصيل:</span> <strong>${receiptData.paymentDate}</strong></div>
          <div class="row total-row">
            <span class="label" style="color: #0f172a">المبلغ المدفوع:</span>
            <span style="color: #10b981">${receiptData.amount} ج</span>
          </div>
          <div class="row" style="margin-top: 10px;"><span class="label">المتبقي الكلي بالعقد:</span> <strong>${receiptData.remainingAmount} ج</strong></div>
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #64748b;">نظام إدارة الأقساط</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
    </html>
  `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
};

export const printContractLayout = (contract) => {
    if (!contract) return;
    const printContent = `
    <html>
      <head>
        <title>عقد مبيعات تقسيط</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 40px; color: #333; line-height: 1.8; }
          .title { text-align: center; font-size: 24px; font-weight: 800; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 30px; color: #3b82f6; }
          .section { margin-bottom: 25px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px; }
          .section-title { font-weight: 800; color: #3b82f6; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .label { font-weight: 700; color: #64748b; }
          .sigs { display: flex; justify-content: space-between; margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="title">عقد بيع موتوسيكل بالتقسيط</div>
        <div class="section">
          <div class="section-title">بيانات الأطراف</div>
          <div class="grid">
            <div><span class="label">العميل:</span> <strong>${contract.customer?.name}</strong></div>
            <div><span class="label">رقم الهاتف:</span> <strong>${contract.customer?.phone}</strong></div>
            <div><span class="label">الرقم القومي:</span> <strong>${contract.customer?.nationalId}</strong></div>
            <div><span class="label">الضامن:</span> <strong>${contract.customer?.guarantor || 'لا يوجد'}</strong></div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">بيانات العقد والدفع</div>
          <div class="grid">
            <div><span class="label">الموتوسيكل:</span> <strong>${contract.motorcycleBrand} ${contract.motorcycleModel}</strong></div>
            <div><span class="label">سعر الكاش:</span> <strong>${contract.cashPrice} ج</strong></div>
            <div><span class="label">المقدم:</span> <strong>${contract.downPayment} ج</strong></div>
            <div><span class="label">المتبقي:</span> <strong>${contract.remainingAmount} ج</strong></div>
            <div><span class="label">عدد الشهور:</span> <strong>${contract.monthsCount}</strong></div>
            <div><span class="label">القسط الشهري:</span> <strong style="color:#10b981">${contract.monthlyInstallment} ج</strong></div>
          </div>
        </div>
        <div class="sigs">
          <div style="text-align:center">توقيع البائع<br/><br/>______________</div>
          <div style="text-align:center">توقيع المشتري<br/><br/>______________</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
    </html>
  `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
};
