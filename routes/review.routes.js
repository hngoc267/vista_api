const express = require('express');
const router = express.Router();
const {
  createReview,
  getReviewByOrderDetailId,
  getReviewsByProductId,
} = require('../controllers/review.controller');

router.post('/', createReview);
router.get('/product/:productId', getReviewsByProductId);
router.get('/order-detail/:orderDetailId', getReviewByOrderDetailId);

module.exports = router;
