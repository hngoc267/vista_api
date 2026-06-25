const express = require('express');
const router = express.Router();
const {
  createReturnOrder,
  getReturnOrderByOrderId,
} = require('../controllers/return-order.controller');

router.post('/', createReturnOrder);
router.get('/:orderId', getReturnOrderByOrderId);

module.exports = router;
