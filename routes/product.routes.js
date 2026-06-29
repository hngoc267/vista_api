const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");

// Lấy tất cả danh mục
router.get("/categories", productController.getAllCategories);

// Lấy sản phẩm nổi bật (trang chủ)
router.get("/featured", productController.getFeaturedProducts);

// Lấy sản phẩm Flash Sale (THÊM MỚI)
router.get("/flash-sale", productController.getFlashSaleProducts);

// Lấy sản phẩm VISTA AI Gợi ý (THÊM MỚI)
router.get("/ai-suggest", productController.getAISuggestedProducts);

// Smart Search AI
router.post("/smart-search", productController.smartSearch);

// Lấy tất cả sản phẩm (có lọc, tìm kiếm, phân trang)
router.get("/", productController.getAllProducts);

// Lấy sản phẩm theo danh mục
router.get("/category/:categoryId", productController.getProductsByCategory);

// Lấy sản phẩm liên quan
router.get("/:id/related", productController.getRelatedProducts);

// Lấy chi tiết 1 sản phẩm
router.get("/:id", productController.getProductById);

module.exports = router;