const express = require('express');
const router = express.Router();
const {
  createReview,
  getReviewByOrderDetailId,
} = require('../controllers/review.controller');

router.post('/', createReview);
router.get('/order-detail/:orderDetailId', getReviewByOrderDetailId);

module.exports = router;
