const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');

// Đường dẫn: GET /api/vouchers
router.get('/', voucherController.getAllVouchers);

module.exports = router;