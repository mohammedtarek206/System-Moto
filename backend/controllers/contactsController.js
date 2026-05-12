const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');

// Customers
exports.getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const customers = await Customer.find(query).sort({ name: 1 });
    res.json({ success: true, data: customers });
  } catch (err) { 
    console.error('Get Customers Error:', err);
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    const sales = await Sale.find({ customer: req.params.id }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: { ...customer._doc, sales } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, message: 'تم إضافة العميل بنجاح', data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'تم تحديث بيانات العميل', data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteCustomer = async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Suppliers
exports.getSuppliers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }
    // Correctly call Supplier model
    const suppliers = await Supplier.find(query).sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (err) { 
    console.error('Get Suppliers Error:', err);
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, message: 'تم إضافة المورد بنجاح', data: supplier });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'تم تحديث بيانات المورد', data: supplier });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteSupplier = async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
