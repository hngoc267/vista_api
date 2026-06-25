const express = require("express");
const router = express.Router();

const orderHistoryController = require("../controllers/order-history.controller");

// Xóa middleware đi, thêm tham số :userId vào URL
router.get("/:userId", orderHistoryController.getOrderHistory);
router.patch("/:orderId/received", orderHistoryController.markOrderReceived);

// SỬA DÒNG NÀY
router.put('/mark-reviewed', orderHistoryController.markOrderReviewed); 

module.exports = router;