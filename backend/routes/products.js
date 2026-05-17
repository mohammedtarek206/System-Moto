const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories, createCategory, updateCategory, deleteCategory, getLowStock, scanBarcode } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getProducts);
router.get('/low-stock', protect, getLowStock);
router.get('/categories', protect, getCategories);
router.get('/scan/:barcode', protect, scanBarcode);
router.post('/categories', protect, authorize('admin', 'warehouse'), createCategory);
router.put('/categories/:id', protect, authorize('admin', 'warehouse'), updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), deleteCategory);
router.get('/:id', protect, getProduct);

// Smart upload middleware: handles both JSON and multipart/form-data
const smartUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('image')(req, res, next);
  } else {
    next(); // JSON body already parsed by express.json()
  }
};

router.post('/', protect, authorize('admin', 'warehouse'), smartUpload, createProduct);
router.put('/:id', protect, authorize('admin', 'warehouse'), smartUpload, updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
