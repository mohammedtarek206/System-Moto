import { createContext, useContext, useState, useEffect } from 'react';

const LangContext = createContext(null);

const translations = {
  ar: {
    // Nav
    dashboard: 'لوحة التحكم', products: 'المنتجات', sales: 'المبيعات', barcodes: 'طباعة الباركود',
    pos: 'الكاشير', installments: 'نظام التقسيط', customers: 'العملاء', suppliers: 'الموردين', purchases: 'المشتريات',
    inventory: 'المخزن', reports: 'التقارير', settings: 'الإعدادات',
    notifications: 'الإشعارات', users: 'المستخدمين', logout: 'تسجيل الخروج',
    motorcycles: 'الموتسيكلات', scooters: 'السكوترات',
    capital: 'دورة رأس المال', expenses: 'المصروفات', revenues: 'الإيرادات',
    oilReports: 'تقارير الزيوت', sparePartsReports: 'تقارير قطع الغيار',
    motorcycleReports: 'تقارير الموتسيكلات', scooterReports: 'تقارير السكوترات',
    // Common
    add: 'إضافة', edit: 'تعديل', delete: 'حذف', save: 'حفظ', cancel: 'إلغاء',
    search: 'بحث', filter: 'فلتر', export: 'تصدير', print: 'طباعة',
    loading: 'جاري التحميل...', noData: 'لا توجد بيانات', confirm: 'تأكيد',
    actions: 'إجراءات', status: 'الحالة', date: 'التاريخ', notes: 'ملاحظات',
    total: 'الإجمالي', name: 'الاسم', phone: 'الهاتف', email: 'البريد الإلكتروني',
    address: 'العنوان', price: 'السعر', quantity: 'الكمية', category: 'التصنيف',
    exportPDF: 'تصدير PDF', exportExcel: 'تصدير Excel', exportCSV: 'تصدير CSV',
    fromDate: 'من تاريخ', toDate: 'إلى تاريخ', allTime: 'كل الوقت',
    today: 'اليوم', thisWeek: 'هذا الأسبوع', thisMonth: 'هذا الشهر', thisYear: 'هذه السنة',
    // Dashboard
    todaySales: 'مبيعات اليوم', monthSales: 'مبيعات الشهر', totalProfit: 'إجمالي الأرباح',
    totalProducts: 'إجمالي المنتجات', lowStock: 'مخزون منخفض', recentSales: 'أحدث المبيعات',
    topProducts: 'أكثر مبيعاً', outOfStock: 'نفد المخزون',
    currentCapital: 'رأس المال الحالي', netProfit: 'صافي الأرباح',
    totalRevenue: 'إجمالي الإيرادات', totalExpenses: 'إجمالي المصروفات',
    bestCustomers: 'أفضل العملاء', latestInvoices: 'آخر الفواتير',
    // Products
    productName: 'اسم المنتج', sku: 'الرمز', barcode: 'الباركود', buyPrice: 'سعر الشراء',
    sellPrice: 'سعر البيع', motoType: 'نوع الموتسيكل', minQty: 'الحد الأدنى', unit: 'الوحدة',
    image: 'الصورة', addProduct: 'إضافة منتج', editProduct: 'تعديل منتج',
    productType: 'نوع المنتج',
    // Product types
    spare_parts: 'قطع غيار', oils: 'زيوت', batteries: 'بطاريات',
    tires: 'إطارات', accessories: 'إكسسوارات', extras: 'كماليات', other: 'أخرى',
    // Motorcycle / Scooter fields
    brand: 'الماركة', model: 'الموديل', year: 'سنة الصنع', color: 'اللون',
    engineCC: 'السعة (CC)', chassisNo: 'رقم الشاسيه', engineNo: 'رقم الموتور',
    condition: 'الحالة', conditionNew: 'جديد', conditionUsed: 'مستعمل',
    purchaseDate: 'تاريخ الشراء', description: 'الوصف', supplier: 'المورد',
    addMotorcycle: 'إضافة موتسيكل', editMotorcycle: 'تعديل موتسيكل',
    addScooter: 'إضافة سكوتر', editScooter: 'تعديل سكوتر',
    // Sales
    invoice: 'فاتورة', invoiceNo: 'رقم الفاتورة', customer: 'العميل', paymentMethod: 'طريقة الدفع',
    cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل', credit: 'آجل',
    discount: 'خصم', tax: 'ضريبة', subtotal: 'المجموع', paid: 'المدفوع', change: 'الباقي',
    completed: 'مكتملة', pending: 'معلقة', cancelled: 'ملغاة', refunded: 'مُستردة',
    sortBy: 'ترتيب حسب', newest: 'الأحدث', oldest: 'الأقدم',
    highestPrice: 'الأعلى سعراً', lowestPrice: 'الأقل سعراً',
    minPrice: 'أقل سعر', maxPrice: 'أعلى سعر',
    customerPhone: 'هاتف العميل', cashier: 'الكاشير',
    // Inventory
    lowStockItems: 'منتجات ناقصة', outOfStockItems: 'منتجات منتهية', stagnantItems: 'منتجات راكدة',
    // Capital
    expenseCategory: 'فئة المصروف', amount: 'القيمة', responsible: 'المسؤول',
    attachment: 'المرفق', addExpense: 'إضافة مصروف', editExpense: 'تعديل مصروف',
    rent: 'إيجار', electricity: 'كهرباء', water: 'مياه', salaries: 'مرتبات',
    maintenance: 'صيانة', purchase: 'شراء بضاعة', transport: 'نقل', taxes: 'ضرائب',
    grossProfit: 'الربح الإجمالي', cashFlow: 'التدفق النقدي', currentBalance: 'الرصيد الحالي',
    // Reports
    totalSold: 'إجمالي المباع', avgSellPrice: 'متوسط سعر البيع', lastSale: 'آخر عملية بيع',
    topCustomer: 'أكثر عميل اشترى', currentStock: 'الكمية الحالية',
    saleCount: 'عدد مرات البيع', byBrand: 'حسب الماركة', byModel: 'حسب الموديل',
    // Auth
    login: 'تسجيل الدخول', register: 'إنشاء حساب', password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور', forgotPassword: 'نسيت كلمة المرور',
    role: 'الصلاحية', admin: 'مدير', cashier2: 'كاشير', warehouse: 'موظف مخزن',
    // Settings
    shopName: 'اسم المحل', currency: 'جنيه مصري', taxRate: 'نسبة الضريبة',
    lowStockThreshold: 'حد المخزون المنخفض', language: 'اللغة', theme: 'المظهر',
    logo: 'الشعار', invoiceFooter: 'تذييل الفاتورة',
  },
  en: {
    dashboard: 'Dashboard', products: 'Products', sales: 'Sales', barcodes: 'Barcodes',
    pos: 'POS Cashier', installments: 'Installments', customers: 'Customers', suppliers: 'Suppliers', purchases: 'Purchases',
    inventory: 'Inventory', reports: 'Reports', settings: 'Settings',
    notifications: 'Notifications', users: 'Users', logout: 'Logout',
    motorcycles: 'Motorcycles', scooters: 'Scooters',
    capital: 'Capital Cycle', expenses: 'Expenses', revenues: 'Revenues',
    oilReports: 'Oil Reports', sparePartsReports: 'Spare Parts Reports',
    motorcycleReports: 'Motorcycle Reports', scooterReports: 'Scooter Reports',
    add: 'Add', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel',
    search: 'Search', filter: 'Filter', export: 'Export', print: 'Print',
    loading: 'Loading...', noData: 'No data found', confirm: 'Confirm',
    actions: 'Actions', status: 'Status', date: 'Date', notes: 'Notes',
    total: 'Total', name: 'Name', phone: 'Phone', email: 'Email',
    address: 'Address', price: 'Price', quantity: 'Quantity', category: 'Category',
    exportPDF: 'Export PDF', exportExcel: 'Export Excel', exportCSV: 'Export CSV',
    fromDate: 'From Date', toDate: 'To Date', allTime: 'All Time',
    today: 'Today', thisWeek: 'This Week', thisMonth: 'This Month', thisYear: 'This Year',
    todaySales: "Today's Sales", monthSales: "Month Sales", totalProfit: 'Total Profit',
    totalProducts: 'Total Products', lowStock: 'Low Stock', recentSales: 'Recent Sales',
    topProducts: 'Top Products', outOfStock: 'Out of Stock',
    currentCapital: 'Current Capital', netProfit: 'Net Profit',
    totalRevenue: 'Total Revenue', totalExpenses: 'Total Expenses',
    bestCustomers: 'Best Customers', latestInvoices: 'Latest Invoices',
    productName: 'Product Name', sku: 'SKU', barcode: 'Barcode', buyPrice: 'Buy Price',
    sellPrice: 'Sell Price', motoType: 'Moto Type', minQty: 'Min Qty', unit: 'Unit',
    image: 'Image', addProduct: 'Add Product', editProduct: 'Edit Product',
    productType: 'Product Type',
    spare_parts: 'Spare Parts', oils: 'Oils', batteries: 'Batteries',
    tires: 'Tires', accessories: 'Accessories', extras: 'Extras', other: 'Other',
    brand: 'Brand', model: 'Model', year: 'Year', color: 'Color',
    engineCC: 'Engine CC', chassisNo: 'Chassis No.', engineNo: 'Engine No.',
    condition: 'Condition', conditionNew: 'New', conditionUsed: 'Used',
    purchaseDate: 'Purchase Date', description: 'Description', supplier: 'Supplier',
    addMotorcycle: 'Add Motorcycle', editMotorcycle: 'Edit Motorcycle',
    addScooter: 'Add Scooter', editScooter: 'Edit Scooter',
    invoice: 'Invoice', invoiceNo: 'Invoice No.', customer: 'Customer', paymentMethod: 'Payment',
    cash: 'Cash', card: 'Card', transfer: 'Transfer', credit: 'Credit',
    discount: 'Discount', tax: 'Tax', subtotal: 'Subtotal', paid: 'Paid', change: 'Change',
    completed: 'Completed', pending: 'Pending', cancelled: 'Cancelled', refunded: 'Refunded',
    sortBy: 'Sort By', newest: 'Newest', oldest: 'Oldest',
    highestPrice: 'Highest Price', lowestPrice: 'Lowest Price',
    minPrice: 'Min Price', maxPrice: 'Max Price',
    customerPhone: 'Customer Phone', cashier: 'Cashier',
    lowStockItems: 'Low Stock Items', outOfStockItems: 'Out of Stock', stagnantItems: 'Stagnant Items',
    expenseCategory: 'Expense Category', amount: 'Amount', responsible: 'Responsible',
    attachment: 'Attachment', addExpense: 'Add Expense', editExpense: 'Edit Expense',
    rent: 'Rent', electricity: 'Electricity', water: 'Water', salaries: 'Salaries',
    maintenance: 'Maintenance', purchase: 'Purchase', transport: 'Transport', taxes: 'Taxes',
    grossProfit: 'Gross Profit', cashFlow: 'Cash Flow', currentBalance: 'Current Balance',
    totalSold: 'Total Sold', avgSellPrice: 'Avg. Sell Price', lastSale: 'Last Sale',
    topCustomer: 'Top Customer', currentStock: 'Current Stock',
    saleCount: 'Sale Count', byBrand: 'By Brand', byModel: 'By Model',
    login: 'Login', register: 'Register', password: 'Password',
    confirmPassword: 'Confirm Password', forgotPassword: 'Forgot Password',
    role: 'Role', admin: 'Admin', cashier2: 'Cashier', warehouse: 'Warehouse',
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
