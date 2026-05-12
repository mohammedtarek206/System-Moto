import { createContext, useContext, useState, useEffect } from 'react';

const LangContext = createContext(null);

const translations = {
  ar: {
    // Nav
    dashboard: 'لوحة التحكم', products: 'المنتجات', sales: 'المبيعات',
    pos: 'الكاشير', customers: 'العملاء', suppliers: 'الموردين',
    inventory: 'المخزن', reports: 'التقارير', settings: 'الإعدادات',
    notifications: 'الإشعارات', users: 'المستخدمين', logout: 'تسجيل الخروج',
    // Common
    add: 'إضافة', edit: 'تعديل', delete: 'حذف', save: 'حفظ', cancel: 'إلغاء',
    search: 'بحث', filter: 'فلتر', export: 'تصدير', print: 'طباعة',
    loading: 'جاري التحميل...', noData: 'لا توجد بيانات', confirm: 'تأكيد',
    actions: 'إجراءات', status: 'الحالة', date: 'التاريخ', notes: 'ملاحظات',
    total: 'الإجمالي', name: 'الاسم', phone: 'الهاتف', email: 'البريد الإلكتروني',
    address: 'العنوان', price: 'السعر', quantity: 'الكمية', category: 'التصنيف',
    // Dashboard
    todaySales: 'مبيعات اليوم', monthSales: 'مبيعات الشهر', totalProfit: 'إجمالي الأرباح',
    totalProducts: 'إجمالي المنتجات', lowStock: 'مخزون منخفض', recentSales: 'أحدث المبيعات',
    topProducts: 'أكثر مبيعاً', outOfStock: 'نفد المخزون',
    // Products
    productName: 'اسم المنتج', sku: 'الرمز', barcode: 'الباركود', buyPrice: 'سعر الشراء',
    sellPrice: 'سعر البيع', motoType: 'نوع الموتسيكل', minQty: 'الحد الأدنى', unit: 'الوحدة',
    image: 'الصورة', addProduct: 'إضافة منتج', editProduct: 'تعديل منتج',
    // Sales
    invoice: 'فاتورة', invoiceNo: 'رقم الفاتورة', customer: 'العميل', paymentMethod: 'طريقة الدفع',
    cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل', credit: 'آجل',
    discount: 'خصم', tax: 'ضريبة', subtotal: 'المجموع', paid: 'المدفوع', change: 'الباقي',
    completed: 'مكتملة', pending: 'معلقة', cancelled: 'ملغاة',
    // Auth
    login: 'تسجيل الدخول', register: 'إنشاء حساب', password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور', forgotPassword: 'نسيت كلمة المرور',
    role: 'الصلاحية', admin: 'مدير', cashier: 'كاشير', warehouse: 'موظف مخزن',
    // Settings
    shopName: 'اسم المحل', currency: 'العملة', taxRate: 'نسبة الضريبة',
    lowStockThreshold: 'حد المخزون المنخفض', language: 'اللغة', theme: 'المظهر',
    logo: 'الشعار', invoiceFooter: 'تذييل الفاتورة',
  },
  en: {
    dashboard: 'Dashboard', products: 'Products', sales: 'Sales',
    pos: 'POS Cashier', customers: 'Customers', suppliers: 'Suppliers',
    inventory: 'Inventory', reports: 'Reports', settings: 'Settings',
    notifications: 'Notifications', users: 'Users', logout: 'Logout',
    add: 'Add', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel',
    search: 'Search', filter: 'Filter', export: 'Export', print: 'Print',
    loading: 'Loading...', noData: 'No data found', confirm: 'Confirm',
    actions: 'Actions', status: 'Status', date: 'Date', notes: 'Notes',
    total: 'Total', name: 'Name', phone: 'Phone', email: 'Email',
    address: 'Address', price: 'Price', quantity: 'Quantity', category: 'Category',
    todaySales: "Today's Sales", monthSales: "Month Sales", totalProfit: 'Total Profit',
    totalProducts: 'Total Products', lowStock: 'Low Stock', recentSales: 'Recent Sales',
    topProducts: 'Top Products', outOfStock: 'Out of Stock',
    productName: 'Product Name', sku: 'SKU', barcode: 'Barcode', buyPrice: 'Buy Price',
    sellPrice: 'Sell Price', motoType: 'Moto Type', minQty: 'Min Qty', unit: 'Unit',
    image: 'Image', addProduct: 'Add Product', editProduct: 'Edit Product',
    invoice: 'Invoice', invoiceNo: 'Invoice No.', customer: 'Customer', paymentMethod: 'Payment',
    cash: 'Cash', card: 'Card', transfer: 'Transfer', credit: 'Credit',
    discount: 'Discount', tax: 'Tax', subtotal: 'Subtotal', paid: 'Paid', change: 'Change',
    completed: 'Completed', pending: 'Pending', cancelled: 'Cancelled',
    login: 'Login', register: 'Register', password: 'Password',
    confirmPassword: 'Confirm Password', forgotPassword: 'Forgot Password',
    role: 'Role', admin: 'Admin', cashier: 'Cashier', warehouse: 'Warehouse',
    shopName: 'Shop Name', currency: 'Currency', taxRate: 'Tax Rate',
    lowStockThreshold: 'Low Stock Threshold', language: 'Language', theme: 'Theme',
    logo: 'Logo', invoiceFooter: 'Invoice Footer',
  }
};

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('moto_lang') || 'ar');

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('moto_lang', lang);
  }, [lang]);

  const t = (key) => translations[lang][key] || key;
  const toggleLang = () => setLang(l => l === 'ar' ? 'en' : 'ar');
  const isRTL = lang === 'ar';

  return (
    <LangContext.Provider value={{ lang, t, toggleLang, isRTL }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
};
