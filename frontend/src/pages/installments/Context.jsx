import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const InstallmentsContext = createContext();

export function useInstallments() {
    return useContext(InstallmentsContext);
}

export function InstallmentsProvider({ children }) {
    const printRef = useRef(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [contractStep, setContractStep] = useState(1);
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
    const [searchQuery, setSearchQuery] = useState('');
    const [collectionSearch, setCollectionSearch] = useState('');
    const [selectedContract, setSelectedContract] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [contractModalOpen, setContractModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    const [nationalIdPreview, setNationalIdPreview] = useState(null);
    const [contractDocPreview, setContractDocPreview] = useState(null);

    const [customerForm, setCustomerForm] = useState({
        name: '', phone: '', nationalId: '', address: '', job: '', guarantor: '', guarantorPhone: ''
    });
    const [customerFiles, setCustomerFiles] = useState({ nationalIdImage: null, contractImage: null });
    const [contractForm, setContractForm] = useState({
        customerId: '', motorcycleBrand: '', motorcycleModel: '', cashPrice: '', downPayment: '',
        monthsCount: '12', interestRate: '15', startDate: new Date().toISOString().split('T')[0]
    });
    const [paymentForm, setPaymentForm] = useState({
        contractId: '', installmentNumber: '', paymentMethod: 'cash', notes: ''
    });

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

    useEffect(() => {
        fetchStats();
        fetchCustomers();
        fetchContracts();
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/installments/stats');
            if (res.data.success) setStats(res.data.data);
        } catch (err) { }
    };

    const fetchCustomers = async (search = '') => {
        try {
            const res = await api.get(`/installments/customers?search=${search}`);
            if (res.data.success) setCustomers(res.data.data);
        } catch (err) { }
    };

    const fetchContracts = async (search = '') => {
        try {
            const res = await api.get(`/installments/contracts?search=${search}`);
            if (res.data.success) setContracts(res.data.data);
        } catch (err) { }
    };

    const fetchReports = async (type) => {
        setLoading(true);
        try {
            const res = await api.get(`/installments/reports?reportType=${type}`);
            if (res.data.success) setReportData(res.data.data);
        } catch (err) {
            toast.error('خطأ في تحميل التقرير');
        } finally {
            setLoading(false);
        }
    };

    const handleCollectionSearch = async () => {
        if (!collectionSearch.trim()) return;
        try {
            const res = await api.get(`/installments/contracts?search=${collectionSearch}`);
            if (res.data.success) {
                setSearchResults(res.data.data);
                if (res.data.data.length === 0) toast.error('لا يوجد عقود مطابقة لهذا البحث');
            }
        } catch (err) { toast.error('خطأ في البحث'); }
    };

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

    const handleCustomerSubmit = async (e) => {
        e.preventDefault();
        if (!customerForm.name || !customerForm.phone || !customerForm.nationalId) return toast.error('يرجى ملء الاسم الكامل، رقم الهاتف والرقم القومي');
        setIsSubmitting(true);
        const formData = new FormData();
        Object.keys(customerForm).forEach(key => formData.append(key, customerForm[key]));
        if (customerFiles.nationalIdImage) formData.append('nationalIdImage', customerFiles.nationalIdImage);
        if (customerFiles.contractImage) formData.append('contractImage', customerFiles.contractImage);

        try {
            const res = await api.post('/installments/customers', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) {
                toast.success('تم تسجيل العميل بنجاح');
                setCustomerModalOpen(false);
                setCustomerForm({ name: '', phone: '', nationalId: '', address: '', job: '', guarantor: '', guarantorPhone: '' });
                setCustomerFiles({ nationalIdImage: null, contractImage: null });
                setNationalIdPreview(null);
                setContractDocPreview(null);
                fetchCustomers();
            }
        } catch (err) { toast.error(err.response?.data?.message || 'فشل في حفظ العميل'); }
        finally { setIsSubmitting(false); }
    };

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
                setContractForm({ customerId: '', motorcycleBrand: '', motorcycleModel: '', cashPrice: '', downPayment: '', monthsCount: '12', interestRate: '15', startDate: new Date().toISOString().split('T')[0] });
                fetchContracts();
            }
        } catch (err) { toast.error(err.response?.data?.message || 'فشل في إنشاء العقد'); }
        finally { setIsSubmitting(false); }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await api.post('/pay', paymentForm);
            if (res.data.success) {
                toast.success('تم دفع القسط بنجاح وتسجيل عملية التحصيل!');
                setPaymentModalOpen(false);
                const updatedContract = res.data.data;
                const currentInst = updatedContract.installments.find(i => i.installmentNumber === Number(paymentForm.installmentNumber));
                setReceiptData({
                    contractNumber: updatedContract.contractNumber, customerName: updatedContract.customer?.name || 'عميل تقسيط',
                    phone: updatedContract.customer?.phone, brand: updatedContract.motorcycleBrand, model: updatedContract.motorcycleModel,
                    amount: currentInst.amount, installmentNumber: currentInst.installmentNumber, remainingAmount: updatedContract.remainingAmount,
                    paymentMethod: paymentForm.paymentMethod, paymentDate: new Date().toLocaleString('ar-EG'), notes: paymentForm.notes || 'سداد قسط دوري'
                });
                if (selectedContract) {
                    const freshContract = await api.get(`/installments/contracts/${selectedContract._id}`);
                    if (freshContract.data.success) setSelectedContract(freshContract.data.data);
                }
                handleCollectionSearch();
            }
        } catch (err) { toast.error(err.response?.data?.message || 'فشل تحصيل القسط'); }
        finally { setIsSubmitting(false); }
    };

    const handleDeleteContract = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا العقد وكافة الأقساط وجدول السداد المرتبط به نهائياً؟')) return;
        try {
            const res = await api.delete(`/installments/contracts/${id}`);
            if (res.data.success) {
                toast.success('تم حذف العقد نهائياً');
                setSelectedContract(null);
                fetchContracts();
            }
        } catch (err) { toast.error('فشل في حذف العقد'); }
    };

    return (
        <InstallmentsContext.Provider value={{
            printRef, activeTab, setActiveTab, loading, setLoading, isSubmitting, notifOpen, setNotifOpen,
            contractStep, setContractStep, stats, customers, contracts, searchResults, reportData, reportType, setReportType,
            searchQuery, setSearchQuery, collectionSearch, setCollectionSearch, selectedContract, setSelectedContract,
            selectedCustomer, setSelectedCustomer, customerModalOpen, setCustomerModalOpen, contractModalOpen, setContractModalOpen,
            paymentModalOpen, setPaymentModalOpen, receiptData, setReceiptData, nationalIdPreview, contractDocPreview,
            customerForm, setCustomerForm, contractForm, setContractForm, paymentForm, setPaymentForm,
            contractPreview, fetchReports, handleCollectionSearch, handleFileChange, handleCustomerSubmit,
            handleContractSubmit, handlePaymentSubmit, handleDeleteContract
        }}>
            {children}
        </InstallmentsContext.Provider>
    );
}
