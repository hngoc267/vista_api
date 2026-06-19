const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

router.get("/:paymentId/status", paymentController.getPaymentStatus);

module.exports = router;
