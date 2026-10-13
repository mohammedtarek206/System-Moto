const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory, updateCategory, deleteCategory,
  getLowStock, scanBarcode, getInventoryStats,
  getCashierPrices, updateCashierPrice, bulkUpdateCashierPrices
} = require('../controllers/productController');
const upload = require('../middleware/upload');

router.get('/', protect, getProducts);
router.get('/low-stock', protect, getLowStock);
router.get('/inventory-stats', protect, getInventoryStats);
router.get('/categories', protect, getCategories);
router.get('/scan/:barcode', protect, scanBarcode);
router.post('/categories', protect, authorize('admin', 'warehouse', 'cashier'), createCategory);
router.put('/categories/:id', protect, authorize('admin', 'warehouse', 'cashier'), updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), deleteCategory);

// Cashier Prices Management
router.get('/cashier-prices', protect, authorize('admin', 'warehouse'), getCashierPrices);
router.put('/cashier-prices/bulk', protect, authorize('admin'), bulkUpdateCashierPrices);
router.put('/:id/cashier-price', protect, authorize('admin', 'warehouse'), updateCashierPrice);

router.get('/:id', protect, getProduct);

// Smart upload middleware: handles both JSON and multipart/form-data
// Support multiple images (up to 5)
const smartUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.array('images', 5)(req, res, (err) => {
      if (err) {
        // fallback to single upload
        upload.single('image')(req, res, next);
      } else {
        next();
      }
    });
  } else {
    next(); // JSON body already parsed by express.json()
  }
};

router.post('/', protect, authorize('admin', 'warehouse', 'cashier'), smartUpload, createProduct);
router.put('/:id', protect, authorize('admin', 'warehouse', 'cashier'), smartUpload, updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
