const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getCapitalSummary
} = require('../controllers/expenseController');

const smartUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('attachment')(req, res, next);
  } else {
    next();
  }
};

// Capital summary
router.get('/summary', protect, getCapitalSummary);

// Expenses CRUD
router.get('/', protect, getExpenses);
router.post('/', protect, authorize('admin'), smartUpload, createExpense);
router.put('/:id', protect, authorize('admin'), smartUpload, updateExpense);
router.delete('/:id', protect, authorize('admin'), deleteExpense);

module.exports = router;
