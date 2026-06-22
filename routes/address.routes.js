const express = require("express");
const router = express.Router();
const addressController = require("../controllers/address.controller");

router.get("/:userId", addressController.getUserAddresses);

module.exports = router;
