const express = require('express');
const router = express.Router();
const {
  getInstallmentStats,
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  getContracts,
  getContract,
  createContract,
  payInstallment,
  deleteContract,
  getInstallmentReports
} = require('../controllers/installmentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Smart multi-upload middleware for documents
const docsUpload = upload.fields([
  { name: 'nationalIdImage', maxCount: 1 },
  { name: 'contractImage', maxCount: 1 }
]);

// Stats & Dashboard
router.get('/stats', protect, authorize('admin'), getInstallmentStats);

// Customers
router.get('/customers', protect, authorize('admin'), getCustomers);
router.get('/customers/:id', protect, authorize('admin'), getCustomer);
router.post('/customers', protect, authorize('admin'), docsUpload, createCustomer);
router.put('/customers/:id', protect, authorize('admin'), docsUpload, updateCustomer);

// Contracts
router.get('/contracts', protect, authorize('admin'), getContracts);
router.get('/contracts/:id', protect, authorize('admin'), getContract);
router.post('/contracts', protect, authorize('admin', 'sales'), createContract);
router.delete('/contracts/:id', protect, authorize('admin'), deleteContract);

// Payments & Collections
router.post('/pay', protect, authorize('admin', 'collector'), payInstallment);

// Reports
router.get('/reports', protect, authorize('admin'), getInstallmentReports);

module.exports = router;
