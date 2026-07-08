const express = require("express");
const router = express.Router();

const orderHistoryController = require("../controllers/order-history.controller");

router.get("/:userId", orderHistoryController.getOrderHistory);
router.patch("/:orderId/received", orderHistoryController.markOrderReceived);
router.patch("/:orderId/cancel", orderHistoryController.cancelOrder);

router.put('/mark-reviewed', orderHistoryController.markOrderReviewed); 

module.exports = router;