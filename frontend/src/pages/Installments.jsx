import { useState, useEffect, useRef } from 'react';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Wallet, Plus, Search, FileText, Printer, CheckCircle, AlertTriangle,
  Clock, Users, Coins, TrendingUp, Download, Eye, FileSpreadsheet, Trash2,
  Upload, Sparkles, QrCode, Calendar, ArrowUpRight, Check, CheckCircle2,
  ChevronRight, ChevronLeft, Bell, MapPin, Briefcase, ShieldAlert,
  ArrowRightLeft, FileCode, CheckSquare, PlusCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

export default function Installments() {
  const { isRTL } = useLang();
  const { user } = useAuth();
  const printRef = useRef(null);

  // Tabs: 'dashboard' | 'customers' | 'contracts' | 'collection' | 'reports'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Loaders
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Overdue Notifications Drawer
  const [notifOpen, setNotifOpen] = useState(false);

  // Contract step creation states (1, 2, 3)
  const [contractStep, setContractStep] = useState(1);

  // State Data
  const [stats, setStats] = useState({
    totalContracts: 0,
    totalRemaining: 0,
    paidToday: 0,
    overdueCount: 0,
    customersCount: 0,
    totalProfits: 0,
    recentPayments: [],
    chartData: []
  });

  const [customers, setCustomers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [reportType, setReportType] = useState('summary');

  // Search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionSearch, setCollectionSearch] = useState('');

  // Selected details
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Modals & Drawers state
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Drag and drop preview states
  const [nationalIdPreview, setNationalIdPreview] = useState(null);
  const [contractDocPreview, setContractDocPreview] = useState(null);

  // Forms state
  const [customerForm, setCustomerForm] = useState({
    name: '', phone: '', nationalId: '', address: '', job: '',
    guarantor: '', guarantorPhone: ''
  });
  const [customerFiles, setCustomerFiles] = useState({
    nationalIdImage: null,
    contractImage: null
  });

  const [contractForm, setContractForm] = useState({
    customerId: '', motorcycleBrand: '', motorcycleModel: '',
    cashPrice: '', downPayment: '', monthsCount: '12', interestRate: '15',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [paymentForm, setPaymentForm] = useState({
    contractId: '',
    installmentNumber: '',
    paymentMethod: 'cash',
    notes: ''
  });

  // Calculate dynamic contract preview values
  const contractPreview = () => {
    const cash = Number(contractForm.cashPrice) || 0;
    const down = Number(contractForm.downPayment) || 0;
    const months = Number(contractForm.monthsCount) || 1;
    const interest = Number(contractForm.interestRate) || 0;

    const principal = cash - down;
    const interestAmt = principal * (interest / 100);
    const totalRemaining = principal + interestAmt;
    const monthly = Math.round(totalRemaining / months);

    return { principal, interestAmt, totalRemaining, monthly };
  };

  // Fetch initial data
  useEffect(() => {
    fetchStats();
    fetchCustomers();
    fetchContracts();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/installments/stats');
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      toast.error('خطأ في تحميل إحصائيات الأقساط');
    }
  };

  const fetchCustomers = async (search = '') => {
    try {
      const res = await api.get(`/installments/customers?search=${search}`);
      if (res.data.success) setCustomers(res.data.data);
    } catch (err) {
      toast.error('خطأ في تحميل قائمة العملاء');
    }
  };

  const fetchContracts = async (search = '') => {
    try {
      const res = await api.get(`/installments/contracts?search=${search}`);
      if (res.data.success) setContracts(res.data.data);
    } catch (err) {
      toast.error('خطأ في تحميل العقود');
    }
  };

  const fetchReports = async (type) => {
    setLoading(true);
    try {
      const res = await api.get(`/installments/reports?reportType=${type}`);
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      toast.error('خطأ في تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  // Handle Search in collection
  const handleCollectionSearch = async () => {
    if (!collectionSearch.trim()) return;
    try {
      const res = await api.get(`/installments/contracts?search=${collectionSearch}`);
      if (res.data.success) {
        setSearchResults(res.data.data);
        if (res.data.data.length === 0) {
          toast.error('لا يوجد عقود مطابقة لهذا البحث');
        }
      }
    } catch (err) {
      toast.error('خطأ في البحث');
    }
  };

  // Files inputs and drag/drop
  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (fileType === 'nationalIdImage') {
      setCustomerFiles(prev => ({ ...prev, nationalIdImage: file }));
      setNationalIdPreview(URL.createObjectURL(file));
    } else {
      setCustomerFiles(prev => ({ ...prev, contractImage: file }));
      setContractDocPreview(URL.createObjectURL(file));
    }
  };

  // Customer Actions
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!customerForm.name || !customerForm.phone || !customerForm.nationalId) {
      return toast.error('يرجى ملء الاسم الكامل، رقم الهاتف والرقم القومي');
    }

    setIsSubmitting(true);
    const formData = new FormData();
    Object.keys(customerForm).forEach(key => formData.append(key, customerForm[key]));
    if (customerFiles.nationalIdImage) formData.append('nationalIdImage', customerFiles.nationalIdImage);
    if (customerFiles.contractImage) formData.append('contractImage', customerFiles.contractImage);

    try {
      const res = await api.post('/installments/customers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('تم تسجيل العميل بنجاح');
        setCustomerModalOpen(false);
        setCustomerForm({
          name: '', phone: '', nationalId: '', address: '', job: '', guarantor: '', guarantorPhone: ''
        });
        setCustomerFiles({ nationalIdImage: null, contractImage: null });
        setNationalIdPreview(null);
        setContractDocPreview(null);
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل في حفظ العميل');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Contract Actions
  const handleContractSubmit = async (e) => {
    e.preventDefault();
    if (!contractForm.customerId || !contractForm.motorcycleBrand || !contractForm.motorcycleModel || !contractForm.cashPrice || !contractForm.downPayment) {
      return toast.error('يرجى ملء كافة تفاصيل العقد والموتوسيكل');
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/installments/contracts', contractForm);
      if (res.data.success) {
        toast.success('تم إنشاء عقد التقسيط بنجاح وجدولة الأقساط');
        setContractModalOpen(false);
        setContractStep(1);
        setContractForm({
          customerId: '', motorcycleBrand: '', motorcycleModel: '',
          cashPrice: '', downPayment: '', monthsCount: '12', interestRate: '15',
          startDate: new Date().toISOString().split('T')[0]
        });
        fetchContracts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل في إنشاء العقد');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment trigger
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/pay', paymentForm);
      if (res.data.success) {
        toast.success('تم دفع القسط بنجاح وتسجيل عملية التحصيل!');
        setPaymentModalOpen(false);

        // Load receipt data
        const updatedContract = res.data.data;
        const currentInst = updatedContract.installments.find(i => i.installmentNumber === Number(paymentForm.installmentNumber));

        setReceiptData({
          contractNumber: updatedContract.contractNumber,
          customerName: updatedContract.customer?.name || 'عميل تقسيط',
          phone: updatedContract.customer?.phone,
          brand: updatedContract.motorcycleBrand,
          model: updatedContract.motorcycleModel,
          amount: currentInst.amount,
          installmentNumber: currentInst.installmentNumber,
          remainingAmount: updatedContract.remainingAmount,
          paymentMethod: paymentForm.paymentMethod,
          paymentDate: new Date().toLocaleString('ar-EG'),
          notes: paymentForm.notes || 'سداد قسط دوري'
        });

        // Refresh lists
        if (selectedContract) {
          const freshContract = await api.get(`/installments/contracts/${selectedContract._id}`);
          if (freshContract.data.success) setSelectedContract(freshContract.data.data);
        }
        handleCollectionSearch();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تحصيل القسط');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Contract
  const handleDeleteContract = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العقد وكافة الأقساط وجدول السداد المرتبط به نهائياً؟')) return;
    try {
      const res = await api.delete(`/installments/contracts/${id}`);
      if (res.data.success) {
        toast.success('تم حذف العقد نهائياً');
        setSelectedContract(null);
        fetchContracts();
      }
    } catch (err) {
      toast.error('فشل في حذف العقد');
    }
  };

  // Printable Receipt execution using Iframe printer pattern
  const printReceipt = () => {
    if (!receiptData) return;
    const printContent = `
      <html>
        <head>
          <title>إيصال سداد قسط</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 20px; color: #1e293b; }
            .receipt-card { border: 2px dashed #e11d48; padding: 25px; border-radius: 12px; max-width: 500px; margin: 0 auto; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .header h2 { margin: 0 0 5px 0; color: #0f172a; font-size: 22px; }
            .header p { margin: 5px 0; color: #64748b; font-size: 14px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; }
            .label { font-weight: bold; color: #475569; }
            .value { color: #0f172a; }
            .total-row { border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0; padding: 10px 0; margin-top: 15px; font-size: 18px; font-weight: bold; }
            .footer { text-align: center; margin-top: 25px; font-size: 13px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <div class="header">
              <h2>معرض على بركة الله للسيارات والموتوسيكلات</h2>
              <p>الحي الغربي بعد مجمع المحاكم</p>
              <p>هاتف: ٠١٠٩٥٣٩٢٩٢٩ / ٠١١١١١٧٥٠٩٩</p>
              <h3 style="margin: 15px 0 0 0; background: #ffe4e6; padding: 8px; border-radius: 8px; font-size: 16px; color:#e11d48">إيصال تحصيل قسط تقسيط</h3>
            </div>
            <div class="row"><span class="label">رقم العقد:</span><span class="value">${receiptData.contractNumber}</span></div>
            <div class="row"><span class="label">العميل:</span><span class="value">${receiptData.customerName}</span></div>
            <div class="row"><span class="label">الموتوسيكل:</span><span class="value">${receiptData.brand} ${receiptData.model}</span></div>
            <div class="row"><span class="label">رقم القسط:</span><span class="value">قسط رقم ${receiptData.installmentNumber}</span></div>
            <div class="row"><span class="label">طريقة السداد:</span><span class="value">${receiptData.paymentMethod === 'cash' ? 'نقدي' : receiptData.paymentMethod === 'card' ? 'بطاقة' : 'تحويل'}</span></div>
            <div class="row"><span class="label">تاريخ التحصيل:</span><span class="value">${receiptData.paymentDate}</span></div>
            
            <div class="row total-row">
              <span class="label" style="color:#0f172a">المبلغ المدفوع:</span>
              <span class="value" style="color:#10b981">${receiptData.amount} جنيه</span>
            </div>
            
            <div class="row" style="margin-top: 10px;"><span class="label">المتبقي الكلي بالعقد:</span><span class="value" style="font-weight:bold">${receiptData.remainingAmount} جنيه</span></div>
            <div class="row"><span class="label">ملاحظات:</span><span class="value">${receiptData.notes}</span></div>
            
            <div class="footer">
              <p>شكراً لثقتكم بنا، تم تسجيل المعاملة بنجاح.</p>
              <small>تم التوليد تلقائياً بواسطة نظام إدارة الأقساط.</small>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printContent);
    doc.close();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  };

  // Printable Contract template
  const printContractLayout = (contract) => {
    if (!contract) return;
    const printContent = `
      <html>
        <head>
          <title>عقد مبيعات تقسيط</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 40px; color: #0f172a; line-height: 1.8; }
            .contract-title { text-align: center; font-size: 26px; font-weight: bold; border-bottom: 3px double #e11d48; padding-bottom: 10px; margin-bottom: 30px; color: #e11d48; }
            .section { margin-bottom: 25px; background: #fafafa; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; }
            .section-title { font-size: 18px; font-weight: bold; color: #e11d48; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .field { font-size: 15px; }
            .label { font-weight: bold; color: #475569; }
            .signature-block { display: flex; justify-content: space-between; margin-top: 50px; border-top: 1px dashed #cbd5e1; padding-top: 30px; }
            .sig { text-align: center; width: 45%; }
            .footer-info { text-align: center; margin-top: 60px; font-size: 13px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="contract-title">عقد بيع موتوسيكل بالتقسيط</div>
          
          <div class="section">
            <div class="section-title">أولاً: بيانات أطراف العقد</div>
            <div class="grid">
              <div class="field"><span class="label">الطرف الأول (البائع):</span> معرض على بركة الله للسيارات والموتوسيكلات</div>
              <div class="field"><span class="label">الطرف الثاني (المشتري):</span> ${contract.customer?.name}</div>
              <div class="field"><span class="label">رقم الهاتف:</span> ${contract.customer?.phone}</div>
              <div class="field"><span class="label">الرقم القومي:</span> ${contract.customer?.nationalId}</div>
              <div class="field"><span class="label">العنوان:</span> ${contract.customer?.address || 'غير محدد'}</div>
              <div class="field"><span class="label">وظيفة المشتري:</span> ${contract.customer?.job || 'غير محدد'}</div>
              <div class="field"><span class="label">الضامن الكفيل:</span> ${contract.customer?.guarantor || 'لا يوجد ضامن'}</div>
              <div class="field"><span class="label">هاتف الضامن:</span> ${contract.customer?.guarantorPhone || 'لا يوجد ضامن'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">ثانياً: تفاصيل المبيعات والموتوسيكل</div>
            <div class="grid">
              <div class="field"><span class="label">رقم العقد:</span> ${contract.contractNumber}</div>
              <div class="field"><span class="label">نوع المركبة:</span> موتوسيكل ${contract.motorcycleBrand}</div>
              <div class="field"><span class="label">الموديل والطراز:</span> ${contract.motorcycleModel}</div>
              <div class="field"><span class="label">سعر الكاش الأصلي:</span> ${contract.cashPrice} جنيه</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">ثالثاً: الشروط المالية وجدولة الأقساط</div>
            <div class="grid">
              <div class="field"><span class="label">المبلغ المقدم المدفوع:</span> ${contract.downPayment} جنيه</div>
              <div class="field"><span class="label">المبلغ الإجمالي المتبقي (مع الفائدة):</span> ${contract.remainingAmount} جنيه</div>
              <div class="field"><span class="label">عدد شهور التقسيط:</span> ${contract.monthsCount} شهر</div>
              <div class="field"><span class="label">قيمة القسط الشهري:</span> ${contract.monthlyInstallment} جنيه مصري</div>
              <div class="field"><span class="label">تاريخ بدء العقد:</span> ${new Date(contract.startDate).toLocaleDateString('ar-EG')}</div>
              <div class="field"><span class="label">تاريخ نهاية العقد:</span> ${new Date(contract.endDate).toLocaleDateString('ar-EG')}</div>
              <div class="field"><span class="label">نسبة الفائدة المضافة:</span> ${contract.interestRate}%</div>
            </div>
          </div>

          <div style="font-size: 14px; margin-top: 30px; text-align: justify;">
            يقر الطرف الثاني (المشتري) بأنه قد استلم المركبة الموضحة أعلاه بالحالة الممتازة، ويتعهد بسداد الأقساط الشهرية بانتظام في موعد استحقاقها المحدد في جدول السداد، وفي حالة التأخر عن سداد أي قسط في موعده، يحق للطرف الأول (البائع) اتخاذ كافة الإجراءات القانونية المتاحة لضمان حقوقه المالية.
          </div>

          <div class="signature-block">
            <div class="sig">
              <p>توقيع الطرف الأول (البائع)</p>
              <br/><br/>
              <p>_______________________</p>
            </div>
            <div class="sig">
              <p>توقيع الطرف الثاني (المشتري)</p>
              <br/><br/>
              <p>_______________________</p>
            </div>
          </div>

          <div class="footer-info">
            <p>معرض على بركة الله - الحي الغربي بعد مجمع المحاكم</p>
            <p>٠١٠٩٥٣٩٢٩٢٩ / ٠١١١١١٧٥٠٩٩</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printContent);
    doc.close();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  };

  return (
    <div className="space-y-8 p-1 sm:p-2 bg-slate-950 min-h-screen text-slate-100 relative">
      {/* Red Glowing Orb Background Accent */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-red-900/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Header with Premium Dark/Red theme */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-br from-slate-900 via-[#1e1416] to-[#0c0708] border border-red-950/40 p-6 sm:p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-[#991b1b] flex items-center justify-center border border-red-500/30 shadow-[0_8px_16px_rgba(225,29,72,0.15)] shrink-0">
            <Wallet className="w-9 h-9 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                نظام الأقساط الذكي
              </h1>
              <span className="bg-red-500/10 text-red-500 text-[10px] px-2.5 py-1 rounded-full font-bold border border-red-500/20 uppercase tracking-wider flex items-center gap-1 shadow-inner">
                <Sparkles className="w-3 h-3 text-red-500" /> PREMIUM
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">
              شاشة الإدارة المتكاملة للعملاء والجدولة، تحصيل سريع، إيصالات فورية، ومتابعة حية للأرباح والديون
            </p>
          </div>
        </div>

        {/* Action Panel & Notification Bell */}
        <div className="flex items-center gap-4 z-10 w-full md:w-auto justify-end">
          {/* Glowing Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-3 bg-slate-900 border border-slate-800 hover:border-red-900/60 rounded-xl hover:bg-slate-850 transition-all text-slate-300 relative group active:scale-95"
            >
              <Bell className="w-6 h-6 text-slate-300 group-hover:text-red-500 transition-colors" />
              {stats.overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5.5 h-5.5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950 animate-bounce">
                  {stats.overdueCount}
                </span>
              )}
            </button>

            {/* Quick Overdue Alert Popover */}
            {notifOpen && (
              <div className="absolute left-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-40 space-y-3 animate-fade-in text-right">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-slate-100 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" /> تنبيهات متأخرات الدفع
                  </h4>
                  <button onClick={() => setNotifOpen(false)} className="text-[10px] text-slate-400 hover:text-slate-200">إغلاق</button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  {stats.overdueCount > 0 ? (
                    <div className="bg-red-950/20 border border-red-900/30 p-3 rounded-xl text-xs space-y-2">
                      <p className="text-red-400 font-bold leading-relaxed">
                        يوجد حالياً <span className="font-black text-red-500">{stats.overdueCount} قسط متأخر</span> عن تاريخ الاستحقاق. يرجى مراجعة شاشة التحصيل والتقارير.
                      </p>
                      <button
                        onClick={() => { setNotifOpen(false); setActiveTab('collection'); }}
                        className="text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg w-full font-bold transition-all text-center"
                      >
                        الانتقال للتحصيل الفوري
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs py-4 text-center font-semibold">كل الأقساط مستقرة ومنتظمة بنجاح 🎉</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setCustomerModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-200 font-bold px-4 py-3.5 rounded-2xl border border-slate-800 hover:border-red-950/50 shadow-md transition-all active:scale-95 text-xs sm:text-sm"
          >
            <PlusCircle className="w-5 h-5 text-red-500" />
            إضافة عميل
          </button>
          <button
            onClick={() => setContractModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-[#991b1b] hover:from-red-500 hover:to-red-600 text-white font-bold px-5 py-3.5 rounded-2xl shadow-[0_8px_16px_rgba(220,38,38,0.2)] border border-red-500/20 transition-all active:scale-95 text-xs sm:text-sm"
          >
            <Plus className="w-5 h-5 text-white" />
            إنشاء عقد
          </button>
        </div>
      </div>

      {/* Tabs Menu Section - ERP Style */}
      <div className="flex border-b border-slate-900 overflow-x-auto gap-2 no-scrollbar">
        {[
          { id: 'dashboard', label: 'لوحة الأقساط', icon: Coins },
          { id: 'customers', label: 'العملاء والضامنين', icon: Users },
          { id: 'contracts', label: 'العقود وجدول السداد', icon: FileText },
          { id: 'collection', label: 'شاشة التحصيل السريع', icon: Clock },
          { id: 'reports', label: 'تقارير الأقساط', icon: TrendingUp },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'reports') fetchReports('summary');
              }}
              className={`flex items-center gap-2.5 px-6 py-4 font-extrabold text-sm sm:text-base border-b-3 transition-all duration-300 whitespace-nowrap shrink-0 ${active
                  ? 'border-red-600 text-red-500 bg-red-950/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-red-500' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          {/* Stat Cards - Premium Glassmorphism & Soft Shadows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'إجمالي العقود', value: `${stats.totalContracts} عقد`, desc: 'العقود المسجلة بالسيستم', icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'الأقساط المتبقية', value: `${stats.totalRemaining} جنيه`, desc: 'إجمالي الديون القائمة للتحصيل', icon: Coins, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: 'أقساط متأخرة', value: `${stats.overdueCount} قسط`, desc: 'تجاوزت تاريخ الاستحقاق', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', glow: stats.overdueCount > 0 },
              { label: 'مقبوضات اليوم', value: `${stats.paidToday} جنيه`, desc: 'إجمالي التحصيل الفعلي اليوم', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className={`bg-slate-900/60 border border-slate-900 hover:border-slate-800 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-between relative overflow-hidden ${card.glow ? 'ring-1 ring-red-500/30 border-red-950' : ''
                    }`}
                >
                  <div className="space-y-2">
                    <p className="text-slate-400 text-xs sm:text-sm font-bold">{card.label}</p>
                    <h3 className={`text-2xl sm:text-3xl font-black ${card.color}`}>{card.value}</h3>
                    <p className="text-[10px] text-slate-500 font-semibold">{card.desc}</p>
                  </div>
                  <div className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center border border-white/5 shadow-inner`}>
                    <Icon className={`w-7 h-7 ${card.color}`} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-900 p-6 rounded-3xl flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl" />
              <div>
                <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  مؤشر تحصيل الأقساط والمقبوضات (الـ 6 أشهر الماضية)
                </h3>
                <p className="text-slate-400 text-xs mt-1">رصد بياني لمعدل كفاءة التحصيل واسترداد المبالغ القائمة</p>
              </div>

              <div className="h-64 mt-8 z-10">
                {stats.chartData && stats.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #1f2937', borderRadius: '16px', color: '#f3f4f6' }} />
                      <Area type="monotone" dataKey="collections" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCollections)" name="المحصل" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">لا توجد بيانات كافية للتحليل البياني</div>
                )}
              </div>
            </div>

            {/* Quick Actions & Recent Payments */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-slate-900/60 border border-slate-900 p-6 rounded-3xl shadow-xl">
                <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4 text-red-500" /> إجراءات سريعة ومميزة
                </h3>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => { setActiveTab('collection'); }}
                    className="flex flex-col items-center justify-center p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-red-950/40 rounded-2xl transition-all duration-300 group"
                  >
                    <ArrowRightLeft className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-slate-300 mt-2">تحصيل سريع</span>
                  </button>

                  <button
                    onClick={() => { setContractModalOpen(true); }}
                    className="flex flex-col items-center justify-center p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-red-950/40 rounded-2xl transition-all duration-300 group"
                  >
                    <FileCode className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-slate-300 mt-2">جدولة عقد</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('reports'); setReportType('overdue'); }}
                    className="flex flex-col items-center justify-center p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-red-950/40 rounded-2xl transition-all duration-300 group"
                  >
                    <ShieldAlert className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-slate-300 mt-2">متابعة المتأخرات</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('reports'); setReportType('collection'); }}
                    className="flex flex-col items-center justify-center p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-red-950/40 rounded-2xl transition-all duration-300 group"
                  >
                    <CheckSquare className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-slate-300 mt-2">جرد المقبوضات</span>
                  </button>
                </div>
              </div>

              {/* Feed of Recent Payments */}
              <div className="bg-slate-900/60 border border-slate-900 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    التحصيلات والمقبوضات اليوم
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">تتبع التدفقات النقدية اللحظية</p>
                </div>
                <div className="mt-4 space-y-3 max-h-48 overflow-y-auto pr-1 no-scrollbar flex-1">
                  {stats.recentPayments && stats.recentPayments.length > 0 ? (
                    stats.recentPayments.map((pay, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950/60 border border-slate-850/60 p-3.5 rounded-2xl hover:border-slate-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                            {pay.customerName.trim().charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-slate-200 text-xs font-bold">{pay.customerName}</h4>
                            <p className="text-[9px] text-slate-500 mt-0.5">عقد: {pay.contractNumber} | قسط {pay.installmentNumber}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-emerald-400 text-xs font-black">+{pay.amount} جنيه</span>
                          <p className="text-[8px] text-slate-600 mt-0.5">{new Date(pay.paymentDate).toLocaleTimeString('ar-EG')}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-600 text-xs font-semibold">لا يوجد مقبوضات لليوم حتى الآن</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-fade-in">
          {/* Modern search bar */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-slate-900/60 border border-slate-900 p-5 rounded-3xl shadow-lg">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="ابحث بالاسم الكامل للعميل، الهاتف، أو الرقم القومي..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchCustomers(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-850/80 rounded-2xl py-3 pr-12 pl-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-600 transition-colors font-semibold"
              />
            </div>
          </div>

          {/* Premium Customers Table */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-black tracking-wider border-b border-slate-850">
                    <th className="p-4 sm:p-5">العميل المستفيد</th>
                    <th className="p-4 sm:p-5">رقم الهاتف</th>
                    <th className="p-4 sm:p-5">الرقم القومي</th>
                    <th className="p-4 sm:p-5">العنوان والعمل</th>
                    <th className="p-4 sm:p-5">الضامن والكفيل</th>
                    <th className="p-4 sm:p-5">مستندات ومرفقات العقد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {customers.length > 0 ? (
                    customers.map(cust => (
                      <tr key={cust._id} className="hover:bg-slate-900/40 text-slate-200 transition-colors font-medium">
                        <td className="p-4 sm:p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 font-black text-base shrink-0">
                              {cust.name.trim().charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-slate-100 text-sm sm:text-base font-black">{cust.name}</h4>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 sm:p-5 font-black text-slate-300">{cust.phone}</td>
                        <td className="p-4 sm:p-5 font-black text-slate-300">{cust.nationalId}</td>
                        <td className="p-4 sm:p-5 text-slate-400">
                          <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {cust.address || 'غير محدد'}</div>
                          <div className="flex items-center gap-1 mt-1 font-semibold text-red-500"><Briefcase className="w-3.5 h-3.5 text-red-950" /> {cust.job || 'غير محدد'}</div>
                        </td>
                        <td className="p-4 sm:p-5 text-slate-300">
                          <div className="font-black text-slate-200">{cust.guarantor || 'لا يوجد ضامن'}</div>
                          <div className="mt-1 text-slate-500 font-bold">{cust.guarantorPhone || '-'}</div>
                        </td>
                        <td className="p-4 sm:p-5">
                          <div className="flex gap-2">
                            {cust.nationalIdImage ? (
                              <a href={`${api.defaults.baseURL.replace('/api', '')}${cust.nationalIdImage}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-red-500 hover:text-red-400 px-3 py-2 rounded-xl border border-slate-850 hover:border-red-950/40 transition-all font-bold">
                                <Eye className="w-4 h-4" /> البطاقة
                              </a>
                            ) : <span className="text-[10px] text-slate-600">لا بطاقة</span>}

                            {cust.contractImage ? (
                              <a href={`${api.defaults.baseURL.replace('/api', '')}${cust.contractImage}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-red-500 hover:text-red-400 px-3 py-2 rounded-xl border border-slate-850 hover:border-red-950/40 transition-all font-bold">
                                <Eye className="w-4 h-4" /> صورة العقد
                              </a>
                            ) : <span className="text-[10px] text-slate-600">لا صورة عقد</span>}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center p-12 text-slate-500 font-black">لا يوجد عملاء تقسيط مسجلين بالسيستم حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="space-y-6 animate-fade-in">
          {/* Modern search bar */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-slate-900/60 border border-slate-900 p-5 rounded-3xl shadow-lg">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="البحث برقم العقد أو اسم العميل..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchContracts(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-850/80 rounded-2xl py-3 pr-12 pl-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-600 transition-colors font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contracts List with dynamic Accents */}
            <div className="lg:col-span-2 space-y-4">
              {contracts.length > 0 ? (
                contracts.map(contract => (
                  <div
                    key={contract._id}
                    onClick={() => setSelectedContract(contract)}
                    className={`p-6 rounded-3xl border cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between gap-4 shadow-md hover:shadow-lg ${selectedContract?._id === contract._id
                        ? 'bg-gradient-to-br from-[#1e1012] to-[#0d0708] border-red-600/80'
                        : 'bg-slate-900/60 border-slate-900 hover:border-slate-800'
                      }`}
                  >
                    {/* Red glow indicator */}
                    <div className={`absolute top-0 right-0 w-2 h-full ${contract.status === 'active'
                        ? 'bg-blue-600'
                        : contract.status === 'completed'
                          ? 'bg-emerald-600'
                          : 'bg-red-600'
                      }`} />

                    <div className="flex justify-between items-start mr-2">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-lg">العقد: {contract.contractNumber}</span>
                        <h4 className="text-slate-100 font-black text-base sm:text-lg mt-3">{contract.customer?.name}</h4>
                        <p className="text-slate-400 text-xs mt-1">موتوسيكل: {contract.motorcycleBrand} {contract.motorcycleModel}</p>
                      </div>
                      <span className={`px-3.5 py-1.5 rounded-full text-xs font-black border ${contract.status === 'active'
                          ? 'bg-blue-600/10 text-blue-500 border-blue-600/20'
                          : contract.status === 'completed'
                            ? 'bg-emerald-600/10 text-emerald-500 border-emerald-600/20'
                            : 'bg-red-600/10 text-red-500 border-red-600/20 animate-pulse'
                        }`}>
                        {contract.status === 'active' ? 'نشط' : contract.status === 'completed' ? 'مكتمل' : 'متأخر'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-900 mr-2">
                      <div>
                        <p className="text-slate-500 text-[10px] font-bold">المقدم المقبوض</p>
                        <p className="text-slate-200 text-sm font-black mt-0.5">{contract.downPayment} جنيه</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px] font-bold">المبلغ المتبقي</p>
                        <p className="text-red-500 text-sm font-black mt-0.5">{contract.remainingAmount} جنيه</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px] font-bold">القسط الشهري</p>
                        <p className="text-emerald-400 text-sm font-black mt-0.5">{contract.monthlyInstallment} جنيه</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px] font-bold">الشهور</p>
                        <p className="text-slate-200 text-sm font-black mt-0.5">{contract.monthsCount} شهر</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-500 border-t border-slate-850 pt-3 mr-2 font-bold">
                      <span>تاريخ البدء: {new Date(contract.startDate).toLocaleDateString('ar-EG')}</span>
                      <span>تاريخ الانتهاء: {new Date(contract.endDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-12 bg-slate-900 border border-slate-850 rounded-3xl text-slate-500 font-bold">لا يوجد عقود تقسيط مسجلة بالسيستم</div>
              )}
            </div>

            {/* Selected Contract Schedule */}
            <div className="lg:col-span-1">
              {selectedContract ? (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6 sticky top-24 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex justify-between items-start border-b border-slate-800 pb-4 z-10 relative">
                    <div>
                      <h3 className="text-lg font-black text-slate-100">جدولة العقد والأقساط</h3>
                      <p className="text-slate-400 text-xs mt-1">تتبع الدفعات وتوقيت الاستحقاق</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => printContractLayout(selectedContract)}
                        className="p-2.5 bg-slate-950 hover:bg-slate-850 text-red-500 hover:text-red-400 rounded-xl border border-slate-850 transition-all active:scale-95 shadow-md"
                        title="طباعة العقد الرسمي"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                      {user && user.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteContract(selectedContract._id)}
                          className="p-2.5 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all active:scale-95 shadow-md"
                          title="حذف العقد"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR Code and basic info */}
                  <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-850 shadow-inner z-10 relative">
                    <QRCodeSVG
                      value={`MOTO-INSTALLMENT:${selectedContract.contractNumber}`}
                      size={90}
                      bgColor={"#09090b"}
                      fgColor={"#ef4444"}
                      level={"L"}
                      includeMargin={false}
                    />
                    <div className="text-left font-bold text-xs space-y-1">
                      <p className="text-slate-400">الضامن: <span className="text-slate-200">{selectedContract.customer?.guarantor || 'لا يوجد'}</span></p>
                      <p className="text-slate-400">الهاتف: <span className="text-slate-200">{selectedContract.customer?.guarantorPhone || '-'}</span></p>
                    </div>
                  </div>

                  {/* Installments List Calendar View */}
                  <div className="space-y-3 z-10 relative">
                    <h4 className="text-slate-300 text-xs font-black">جدول الاستحقاق الشهري</h4>
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 no-scrollbar">
                      {selectedContract.installments.map((inst, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-2xl border border-slate-850 hover:border-slate-800 transition-colors text-xs font-bold">
                          <div>
                            <span className="text-slate-500 font-bold">القسط {inst.installmentNumber}: </span>
                            <span className="text-slate-200 font-black">{inst.amount} جنيه</span>
                            <p className="text-[10px] text-slate-500 mt-1 font-medium">الاستحقاق: {new Date(inst.dueDate).toLocaleDateString('ar-EG')}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${inst.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : inst.status === 'overdue'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                            {inst.status === 'paid' ? 'مدفوع' : inst.status === 'overdue' ? 'متأخر' : 'مستحق'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden lg:flex flex-col items-center justify-center text-center p-12 bg-slate-900/40 border border-slate-850 border-dashed rounded-3xl h-96 text-slate-500">
                  <Eye className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="font-bold text-sm leading-relaxed">
                    اختر أحد عقود التقسيط المفتوحة لتصفح تفاصيل جدول الأقساط الشهري، تفاصيل الضامن وطباعة المستندات الرسمية الموقعة.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Collection Tab */}
      {activeTab === 'collection' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Collection search bar */}
          <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/60 border border-slate-900 p-5 rounded-3xl shadow-lg">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="البحث بالهاتف، اسم العميل، أو رقم العقد للتحصيل الفوري والسداد..."
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCollectionSearch()}
                className="w-full bg-slate-950 border border-slate-850/80 rounded-2xl py-3.5 pr-12 pl-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600 transition-colors font-black text-sm"
              />
            </div>
            <button
              onClick={handleCollectionSearch}
              className="bg-gradient-to-r from-red-600 to-[#991b1b] hover:from-red-500 hover:to-red-600 text-white font-black px-8 py-3 rounded-2xl active:scale-95 transition-all text-xs sm:text-sm border border-red-500/20 shadow-[0_8px_16px_rgba(220,38,38,0.2)]"
            >
              البحث وتحصيل القسط
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {searchResults.length > 0 ? (
                searchResults.map(contract => (
                  <div key={contract._id} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex justify-between items-start border-b border-slate-850 pb-4 relative z-10">
                      <div>
                        <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">عقد نشط: {contract.contractNumber}</span>
                        <h4 className="text-slate-100 font-black text-lg mt-3">{contract.customer?.name}</h4>
                        <p className="text-slate-400 text-xs mt-1">هاتف: {contract.customer?.phone} | موتوسيكل: {contract.motorcycleBrand} {contract.motorcycleModel}</p>
                      </div>
                      <div className="text-left font-bold">
                        <span className="text-xs text-slate-500">المتبقي الكلي بالعقد</span>
                        <h3 className="text-2xl font-black text-red-500 mt-1">{contract.remainingAmount} جنيه</h3>
                      </div>
                    </div>

                    {/* Timeline of payments cards */}
                    <div className="space-y-4 relative z-10">
                      <h4 className="text-slate-200 text-sm font-black flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-500" /> مخطط سداد الأقساط وجدول السداد
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {contract.installments.map((inst, i) => (
                          <div key={i} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-850/80 hover:border-slate-800 transition-colors text-xs font-bold">
                            <div>
                              <p className="text-slate-500">القسط رقم {inst.installmentNumber}</p>
                              <p className="text-slate-100 font-black text-sm mt-1">{inst.amount} جنيه</p>
                              <p className="text-[10px] text-slate-600 mt-1 font-medium">الاستحقاق: {new Date(inst.dueDate).toLocaleDateString('ar-EG')}</p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${inst.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : inst.status === 'overdue'
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                {inst.status === 'paid' ? 'مدفوع' : inst.status === 'overdue' ? 'متأخر' : 'مستحق'}
                              </span>

                              {inst.status !== 'paid' && (
                                <button
                                  onClick={() => {
                                    setPaymentForm({
                                      contractId: contract._id,
                                      installmentNumber: inst.installmentNumber,
                                      paymentMethod: 'cash',
                                      notes: ''
                                    });
                                    setPaymentModalOpen(true);
                                  }}
                                  className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-md active:scale-95 transition-all"
                                >
                                  تحصيل فوري
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-12 bg-slate-900 border border-slate-850 rounded-3xl text-slate-500 font-bold leading-relaxed">
                  قم بالبحث بالأعلى عن رقم العقد، اسم العميل، أو رقم الهاتف لبدء عملية استلام المقبوضات وتحصيل الأقساط الدورية.
                </div>
              )}
            </div>

            {/* Generated collection receipt */}
            <div className="lg:col-span-1">
              {receiptData ? (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 sticky top-24 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="text-center border-b border-slate-850 pb-4 z-10 relative">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                    <h3 className="text-lg font-black text-slate-100 mt-3">تم إثبات السداد والتحصيل</h3>
                    <p className="text-slate-400 text-xs mt-1">توليد إيصال دفع قسط تقسيط آمن</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-xs space-y-3 font-semibold z-10 relative">
                    <div className="flex justify-between"><span className="text-slate-500">رقم العقد:</span><span className="text-slate-200">{receiptData.contractNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">العميل:</span><span className="text-slate-200">{receiptData.customerName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">المركبة:</span><span className="text-slate-200">{receiptData.brand} {receiptData.model}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">رقم القسط:</span><span className="text-red-500">القسط رقم {receiptData.installmentNumber}</span></div>
                    <div className="flex justify-between border-t border-slate-900 pt-2"><span className="text-slate-500">المبلغ المدفوع:</span><span className="text-emerald-400 font-black text-sm">{receiptData.amount} جنيه</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">المتبقي الكلي بالعقد:</span><span className="text-slate-200 font-bold">{receiptData.remainingAmount} جنيه</span></div>
                  </div>

                  <button
                    onClick={printReceipt}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-[#991b1b] hover:from-red-500 hover:to-red-600 text-white font-black py-4 rounded-2xl shadow-[0_8px_16px_rgba(220,38,38,0.2)] border border-red-500/20 active:scale-95 transition-all text-sm z-10 relative"
                  >
                    <Printer className="w-5 h-5" />
                    طباعة إيصال التحصيل الفوري
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex flex-col items-center justify-center text-center p-12 bg-slate-900/40 border border-slate-850 border-dashed rounded-3xl h-96 text-slate-500">
                  <Printer className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="font-bold text-sm leading-relaxed">
                    بمجرد تحصيل قسط بنجاح، سيظهر إيصال استلام النقدية المنسق هنا مباشرة للطباعة وتسليم العميل.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub menu filters for reports */}
          <div className="flex flex-wrap gap-2 bg-slate-900/60 border border-slate-900 p-4 rounded-3xl shadow-md">
            {[
              { id: 'summary', label: 'ملخص المحفظة' },
              { id: 'overdue', label: 'الأقساط المتأخرة' },
              { id: 'collection', label: 'التحصيل اليومي' },
              { id: 'active', label: 'العقود النشطة' },
              { id: 'completed', label: 'العقود المكتملة' },
            ].map(rep => (
              <button
                key={rep.id}
                onClick={() => {
                  setReportType(rep.id);
                  if (rep.id !== 'summary') fetchReports(rep.id);
                }}
                className={`px-5 py-3 rounded-xl font-extrabold text-xs sm:text-sm border transition-all ${reportType === rep.id
                    ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/10'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
              >
                {rep.label}
              </button>
            ))}
          </div>

          {/* Printable Layout with custom design */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden" ref={printRef}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center border-b border-slate-850 pb-5 mb-6 z-10 relative">
              <div>
                <h3 className="text-lg font-black text-slate-100">
                  {reportType === 'summary' && 'تقرير ملخص محفظة التقسيط'}
                  {reportType === 'overdue' && 'تقرير أقساط العملاء المتأخرة'}
                  {reportType === 'collection' && 'تقرير تحصيل الأقساط والمقبوضات اليومية'}
                  {reportType === 'active' && 'تقرير عقود التقسيط النشطة الحالية'}
                  {reportType === 'completed' && 'تقرير عقود التقسيط المكتملة بالكامل'}
                </h3>
                <p className="text-slate-500 text-xs mt-1">توليد تلقائي للبيانات والتحليلات بالسيستم</p>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-slate-100 text-xs font-black px-5 py-3 rounded-xl border border-slate-850 transition-all active:scale-95 shadow-md"
              >
                <Printer className="w-4 h-4 text-red-500" />
                طباعة التقرير الجاري
              </button>
            </div>

            {reportType === 'summary' ? (
              <div className="space-y-6 z-10 relative animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850">
                    <p className="text-slate-500 text-xs font-bold">إجمالي عملاء التقسيط</p>
                    <h3 className="text-2xl font-black text-slate-200 mt-1">{stats.customersCount} عميل</h3>
                  </div>
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850">
                    <p className="text-slate-500 text-xs font-bold">إجمالي الأرباح المتوقعة (الفوائد)</p>
                    <h3 className="text-2xl font-black text-emerald-400 mt-1">{stats.totalProfits} جنيه</h3>
                  </div>
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850">
                    <p className="text-slate-500 text-xs font-bold">إجمالي مبالغ الأقساط القائمة</p>
                    <h3 className="text-2xl font-black text-red-500 mt-1">{stats.totalRemaining} جنيه</h3>
                  </div>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850">
                  <h4 className="text-slate-200 font-bold text-sm mb-4">أهم الشروط والضوابط</h4>
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-2.5 leading-relaxed font-medium">
                    <li>تخضع جميع عقود التقسيط لمتابعة وتدقيق مستمر للأقساط المتأخرة بشكل دوري وساعة بساعة.</li>
                    <li>نسب الفائدة المطبقة بالسيستم يتم حسابها بشكل كلي وتوزيعها على جدول الأقساط بالتساوي عند الإنشاء.</li>
                    <li>يتم إرسال إشعارات وتنبيهات مباشرة لمديري النظام عند تأخر أي قسط عن موعد استحقاقه.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto z-10 relative">
                <table className="w-full text-right border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-black border-b border-slate-850 uppercase">
                      <th className="p-4">رقم العقد</th>
                      <th className="p-4">العميل المستفيد</th>
                      {reportType === 'overdue' && <th className="p-4">القسط المتأخر</th>}
                      {reportType === 'overdue' && <th className="p-4">تاريخ الاستحقاق</th>}
                      {reportType === 'overdue' && <th className="p-4">أيام التأخير</th>}

                      {reportType === 'collection' && <th className="p-4">تاريخ السداد</th>}
                      {reportType === 'collection' && <th className="p-4">طريقة السداد</th>}

                      {(reportType === 'active' || reportType === 'completed') && <th className="p-4">المركبة</th>}
                      {(reportType === 'active' || reportType === 'completed') && <th className="p-4">تاريخ الانتهاء</th>}

                      <th className="p-4">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {loading ? (
                      <tr><td colSpan={6} className="text-center p-8 text-slate-500 font-bold">جاري تحميل وتلخيص بيانات التقرير...</td></tr>
                    ) : reportData.length > 0 ? (
                      reportData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-950/40 text-slate-200 font-semibold transition-colors">
                          <td className="p-4 font-black text-red-500">{row.contractNumber || row.contract?.contractNumber}</td>
                          <td className="p-4 font-black text-slate-100">{row.customerName || row.customer?.name}</td>

                          {reportType === 'overdue' && <td className="p-4 text-amber-500 font-black">قسط رقم {row.installmentNumber}</td>}
                          {reportType === 'overdue' && <td className="p-4 text-slate-400">{new Date(row.dueDate).toLocaleDateString('ar-EG')}</td>}
                          {reportType === 'overdue' && <td className="p-4 text-red-600 font-black">{row.delayDays} يوم تأخير</td>}

                          {reportType === 'collection' && <td className="p-4 text-slate-400">{new Date(row.paymentDate).toLocaleDateString('ar-EG')}</td>}
                          {reportType === 'collection' && <td className="p-4 text-slate-400">{row.paymentMethod === 'cash' ? 'نقدي' : 'بطاقة/تحويل'}</td>}

                          {(reportType === 'active' || reportType === 'completed') && <td className="p-4 text-slate-300">{row.motorcycleBrand} {row.motorcycleModel}</td>}
                          {(reportType === 'active' || reportType === 'completed') && <td className="p-4 text-slate-400">{new Date(row.endDate).toLocaleDateString('ar-EG')}</td>}

                          <td className="p-4 font-black text-slate-100">
                            {row.amount || row.remainingAmount || row.monthlyInstallment} جنيه
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="text-center p-12 text-slate-500 font-black">لا توجد بيانات مسجلة مطابقة لشروط هذا التقرير حالياً بالسيستم</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          MODALS & FORM DRAWERS
         ========================================== */}

      {/* A. Add Installment Customer Modal */}
      {customerModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start border-b border-slate-850 pb-4 z-10 relative">
              <div>
                <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                  <Users className="w-6 h-6 text-red-500 animate-pulse" />
                  تسجيل عميل تقسيط جديد
                </h3>
                <p className="text-slate-400 text-xs mt-1">تعبئة البيانات الشخصية ورفع المستندات الرسمية للعميل</p>
              </div>
              <button onClick={() => setCustomerModalOpen(false)} className="p-2.5 text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-850 rounded-xl transition-all active:scale-95 border border-slate-850">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomerSubmit} className="space-y-5 font-bold text-xs sm:text-sm z-10 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-slate-400">اسم العميل بالكامل</label>
                  <input
                    type="text"
                    required
                    placeholder="أدخل الاسم الرباعي للعميل..."
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-400">رقم الهاتف الجوال</label>
                  <input
                    type="text"
                    required
                    placeholder="رقم الهاتف الأساسي..."
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600 text-left font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                <div className="space-y-2">
                  <label className="text-slate-400">الرقم القومي (14 رقم)</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    placeholder="الرقم القومي من واقع البطاقة..."
                    value={customerForm.nationalId}
                    onChange={(e) => setCustomerForm({ ...customerForm, nationalId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600 text-left font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-400">الوظيفة أو العمل الحالي</label>
                  <input
                    type="text"
                    placeholder="وظيفة العميل ومكان العمل..."
                    value={customerForm.job}
                    onChange={(e) => setCustomerForm({ ...customerForm, job: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-850 pt-4">
                <label className="text-slate-400">محل الإقامة والسكن الحالي بالتفصيل</label>
                <input
                  type="text"
                  placeholder="المحافظة، المدينة، اسم الشارع، أو علامة مميزة..."
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                <div className="space-y-2">
                  <label className="text-slate-400">الضامن الكفيل للعميل</label>
                  <input
                    type="text"
                    placeholder="اسم الضامن بالكامل..."
                    value={customerForm.guarantor}
                    onChange={(e) => setCustomerForm({ ...customerForm, guarantor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-400">رقم هاتف الضامن الجوال</label>
                  <input
                    type="text"
                    placeholder="رقم الهاتف الخاص بالضامن..."
                    value={customerForm.guarantorPhone}
                    onChange={(e) => setCustomerForm({ ...customerForm, guarantorPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600 text-left font-bold"
                  />
                </div>
              </div>

              {/* Uploads Zone with previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                <div className="space-y-2">
                  <label className="text-slate-400">صورة بطاقة الرقم القومي (وجه/ظهر)</label>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 border-dashed p-4 rounded-xl cursor-pointer w-full text-slate-400 transition-colors shadow-inner">
                      <Upload className="w-5 h-5 text-red-500" />
                      <span className="text-xs truncate">
                        {customerFiles.nationalIdImage ? customerFiles.nationalIdImage.name : 'اسحب أو اختر صورة البطاقة...'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'nationalIdImage')}
                        className="hidden"
                      />
                    </label>
                    {nationalIdPreview && (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-850">
                        <img src={nationalIdPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400">صورة عقد الضمان أو الوصل الموقع</label>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 border-dashed p-4 rounded-xl cursor-pointer w-full text-slate-400 transition-colors shadow-inner">
                      <Upload className="w-5 h-5 text-red-500" />
                      <span className="text-xs truncate">
                        {customerFiles.contractImage ? customerFiles.contractImage.name : 'اسحب أو اختر صورة الوصل الموقّع...'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'contractImage')}
                        className="hidden"
                      />
                    </label>
                    {contractDocPreview && (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-850">
                        <img src={contractDocPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
                <button type="button" onClick={() => setCustomerModalOpen(false)} className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 font-bold px-6 py-3.5 rounded-xl active:scale-95 transition-all">إلغاء</button>
                <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-red-600 to-[#991b1b] hover:from-red-500 hover:to-red-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg border border-red-500/25 active:scale-95 transition-all flex items-center gap-2">
                  {isSubmitting ? 'جاري الحفظ...' : 'تأكيد وحفظ العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Create Installment Contract Step-by-Step Modal */}
      {contractModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[95vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start border-b border-slate-850 pb-4 z-10 relative">
              <div>
                <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-red-500 animate-pulse" />
                  إنشاء عقد تقسيط جديد
                </h3>
                <p className="text-slate-400 text-xs mt-1">تحديد شروط وجدولة الدفع المالي للموتوسيكل</p>
              </div>
              <button
                onClick={() => { setContractModalOpen(false); setContractStep(1); }}
                className="p-2.5 text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-850 rounded-xl transition-all active:scale-95 border border-slate-850"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Steps UI indicators */}
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-850/80 z-10 relative text-xs sm:text-sm font-bold">
              {[
                { step: 1, label: 'أولاً: بيانات العميل' },
                { step: 2, label: 'ثانياً: الموتوسيكل وكاش' },
                { step: 3, label: 'ثالثاً: الجدولة والفوائد' }
              ].map((s, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center border font-black transition-all ${contractStep === s.step
                      ? 'bg-red-600 border-red-500 text-white'
                      : contractStep > s.step
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        : 'bg-slate-900 border-slate-850 text-slate-500'
                    }`}>
                    {s.step}
                  </span>
                  <span className={contractStep === s.step ? 'text-slate-100' : 'text-slate-500'}>{s.label}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleContractSubmit} className="space-y-6 font-bold text-xs sm:text-sm z-10 relative">
              {/* Step 1: Customer Info selection */}
              {contractStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-slate-400">اختر عميل التقسيط المستفيد</label>
                    <select
                      required
                      value={contractForm.customerId}
                      onChange={(e) => setContractForm({ ...contractForm, customerId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-100 focus:outline-none focus:border-red-600 font-bold"
                    >
                      <option value="">-- اختر عميل من القائمة المتاحة --</option>
                      {customers.map(c => (
                        <option key={c._id} value={c._id}>{c.name} - الرقم القومي: {c.nationalId} | هاتف: {c.phone}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-400">تاريخ بدء سريان العقد واستحقاق أول قسط</label>
                    <input
                      type="date"
                      required
                      value={contractForm.startDate}
                      onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600 font-bold text-center"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Motorcycle and price */}
              {contractStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-slate-400">ماركة / شركة الموتوسيكل</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: دايون، حلاوة، باجاج، بوكسر..."
                        value={contractForm.motorcycleBrand}
                        onChange={(e) => setContractForm({ ...contractForm, motorcycleBrand: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-400">طراز وموديل الموتوسيكل</label>
                      <input
                        type="text"
                        required
                        placeholder="طراز الموتوسيكل..."
                        value={contractForm.motorcycleModel}
                        onChange={(e) => setContractForm({ ...contractForm, motorcycleModel: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-850 pt-4">
                    <label className="text-slate-400">سعر كاش الموتوسيكل الكلي الأصلي</label>
                    <input
                      type="number"
                      required
                      placeholder="سعر الكاش الفعلي للموتوسيكل..."
                      value={contractForm.cashPrice}
                      onChange={(e) => setContractForm({ ...contractForm, cashPrice: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600 font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Terms and Auto Preview schedule */}
              {contractStep === 3 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-slate-400">المقدم المقبوض المالي</label>
                      <input
                        type="number"
                        required
                        placeholder="المبلغ المقدم المدفوع..."
                        value={contractForm.downPayment}
                        onChange={(e) => setContractForm({ ...contractForm, downPayment: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-400">فترة السداد والشهور</label>
                      <select
                        value={contractForm.monthsCount}
                        onChange={(e) => setContractForm({ ...contractForm, monthsCount: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600 font-bold text-center"
                      >
                        <option value="6">6 شهور</option>
                        <option value="12">12 شهر</option>
                        <option value="18">18 شهر</option>
                        <option value="24">24 شهر</option>
                        <option value="36">36 شهر</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-400">نسبة الفائدة المضافة</label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          value={contractForm.interestRate}
                          onChange={(e) => setContractForm({ ...contractForm, interestRate: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600 font-bold text-center pr-8"
                        />
                        <span className="absolute right-3 top-3 text-slate-500">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Calculations Preview Zone */}
                  <div className="bg-slate-950 p-5 rounded-3xl border border-red-500/10 space-y-4">
                    <h4 className="text-slate-200 text-xs font-black border-b border-slate-900 pb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-red-500" />
                      جدول التدقيق المالي وجدول السداد
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold leading-relaxed">
                      <div>
                        <span className="text-slate-500">المبلغ الأساسي (قبل الفائدة)</span>
                        <p className="text-slate-200 text-base font-black mt-1">{contractPreview().principal} جنيه</p>
                      </div>
                      <div>
                        <span className="text-slate-500">مجموع الفائدة الإجمالي</span>
                        <p className="text-red-500 text-base font-black mt-1">+{contractPreview().interestAmt} جنيه</p>
                      </div>
                      <div>
                        <span className="text-slate-500">المتبقي الكلي المجدول</span>
                        <p className="text-emerald-400 text-base font-black mt-1">{contractPreview().totalRemaining} جنيه</p>
                      </div>
                      <div>
                        <span className="text-slate-500">قيمة القسط الشهري</span>
                        <p className="text-slate-100 text-lg font-black mt-1 text-emerald-400">{contractPreview().monthly} جنيه/شهر</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation button between Steps */}
              <div className="flex justify-between items-center border-t border-slate-855 pt-4">
                <div>
                  {contractStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setContractStep(prev => prev - 1)}
                      className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 font-bold px-5 py-3 rounded-xl border border-slate-850 transition-all active:scale-95"
                    >
                      <ChevronRight className="w-5 h-5" /> العودة
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setContractModalOpen(false); setContractStep(1); }}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 font-bold px-6 py-3 rounded-xl active:scale-95 transition-all"
                  >
                    إلغاء
                  </button>

                  {contractStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (contractStep === 1 && !contractForm.customerId) {
                          return toast.error('يرجى اختيار العميل أولاً');
                        }
                        if (contractStep === 2 && (!contractForm.motorcycleBrand || !contractForm.motorcycleModel || !contractForm.cashPrice)) {
                          return toast.error('يرجى ملء تفاصيل الموتوسيكل والسعر');
                        }
                        setContractStep(prev => prev + 1);
                      }}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-[#991b1b] hover:from-red-500 hover:to-red-600 text-white font-bold px-6 py-3 rounded-xl shadow-md border border-red-500/20 active:scale-95 transition-all"
                    >
                      التالي <ChevronLeft className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-red-600 to-[#991b1b] hover:from-red-500 hover:to-red-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg border border-red-500/25 active:scale-95 transition-all"
                    >
                      {isSubmitting ? 'جاري الإنشاء...' : 'تأكيد وتوقيع العقد'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. Quick Payment / Collection Trigger Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start border-b border-slate-850 pb-4 z-10 relative">
              <div>
                <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  إثبات تحصيل قسط تقسيط
                </h3>
                <p className="text-slate-400 text-xs mt-1">تسجيل المقبوضات وتحديث حساب العميل الكلي</p>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="p-2.5 text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-850 rounded-xl transition-all active:scale-95 border border-slate-850">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 font-bold text-xs sm:text-sm z-10 relative">
              <div className="space-y-2">
                <label className="text-slate-400">طريقة السداد واستلام النقدية</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-100 focus:outline-none focus:border-red-600 font-bold"
                >
                  <option value="cash">نقداً (كاش المحل)</option>
                  <option value="card">بطاقة دفع بنكية (فيزا / ماستركارد)</option>
                  <option value="transfer">تحويل محفظة (فودافون كاش / إنستاباي)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400">ملاحظات إضافية حول القسط (اختياري)</label>
                <textarea
                  placeholder="أدخل أي ملاحظات كفروقات التحصيل أو التواريخ..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full h-24 bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-855 pt-4">
                <button type="button" onClick={() => setPaymentModalOpen(false)} className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 font-bold px-5 py-3 rounded-xl active:scale-95 transition-all">إلغاء</button>
                <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg border border-emerald-500/25 active:scale-95 transition-all">
                  {isSubmitting ? 'جاري الحفظ...' : 'تأكيد السداد والتحصيل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom simple fallback wrapper for close icon
function X({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
