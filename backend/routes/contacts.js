const express = require('express');
const router = express.Router();
const {
  getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier
} = require('../controllers/contactsController');
const { protect, authorize } = require('../middleware/auth');

// Customers
router.get('/customers', protect, getCustomers);
router.post('/customers', protect, createCustomer);
router.get('/customers/:id', protect, getCustomer);
router.put('/customers/:id', protect, updateCustomer);
router.delete('/customers/:id', protect, authorize('admin'), deleteCustomer);

// Suppliers
router.get('/suppliers', protect, authorize('admin'), getSuppliers);
router.post('/suppliers', protect, authorize('admin'), createSupplier);
router.put('/suppliers/:id', protect, authorize('admin'), updateSupplier);
router.delete('/suppliers/:id', protect, authorize('admin'), deleteSupplier);

module.exports = router;
