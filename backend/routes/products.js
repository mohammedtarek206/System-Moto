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
router.post('/', protect, authorize('admin', 'warehouse'), upload.single('image'), createProduct);
router.put('/:id', protect, authorize('admin', 'warehouse'), upload.single('image'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
