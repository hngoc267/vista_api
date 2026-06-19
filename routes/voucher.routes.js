const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucher.controller");

router.get("/my-vouchers", voucherController.getMyVouchers);
router.post("/apply", voucherController.applyVoucher);

module.exports = router;
