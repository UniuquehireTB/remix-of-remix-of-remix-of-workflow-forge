const express = require('express');
const router = express.Router();
const sheetController = require('../controllers/sheetController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protect all sheet routes with auth middleware
router.use(authMiddleware);

router.get('/', sheetController.getSheets);
router.get('/:id', sheetController.getSheetById);
router.post('/', sheetController.createSheet);
router.put('/:id', sheetController.updateSheet);
router.delete('/:id', sheetController.deleteSheet);
router.post('/:id/share', sheetController.shareSheet);

module.exports = router;
