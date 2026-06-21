const express = require("express");
const router = express.Router();

const orderHistoryController = require("../controllers/order-history.controller");

// Xóa middleware đi, thêm tham số :userId vào URL
router.get("/:userId", orderHistoryController.getOrderHistory);

module.exports = router;