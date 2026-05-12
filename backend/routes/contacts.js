const express = require('express');
const router = express.Router();
const { 
  getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier
} = require('../controllers/contactsController');
const { protect } = require('../middleware/auth');

// Customers
router.get('/customers', protect, getCustomers);
router.post('/customers', protect, createCustomer);
router.get('/customers/:id', protect, getCustomer);
router.put('/customers/:id', protect, updateCustomer);
router.delete('/customers/:id', protect, deleteCustomer);

// Suppliers
router.get('/suppliers', protect, getSuppliers);
router.post('/suppliers', protect, createSupplier);
router.put('/suppliers/:id', protect, updateSupplier);
router.delete('/suppliers/:id', protect, deleteSupplier);

module.exports = router;
