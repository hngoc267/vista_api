const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");

router.get("/:userId", cartController.getCart);
router.post("/items", cartController.addItem);
router.patch("/items/:cartItemId", cartController.updateItem);
router.delete("/items/:cartItemId", cartController.removeItem);
router.delete("/:userId/items", cartController.removeSelectedItems);

module.exports = router;
