const { Product, Product_variant, Category, Brand } = require("../models/schema");

// 1. LẤY TẤT CẢ SẢN PHẨM
exports.getAllProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, search, page = 1, limit = 12, sort = "newest" } = req.query;

    const filter = { Status: "on_sale" };
    if (category) filter.Category_id = category;
    if (brand) filter.Brand_id = brand;
    if (search) filter.Product_name = { $regex: search, $options: "i" };
    if (req.query.isFlashSale === 'true') filter.Is_Flash_Sale = true;
    
    let products = await Product.find(filter).lean();

    let productsWithPrice = await Promise.all(
      products.map(async (product) => {
        const variants = await Product_variant.find({
          Product_id: product.Product_id,
          Status: "active",
        }).sort({ Price: 1 }).lean();

        return {
          ...product,
          min_price: variants[0]?.Price || 0,
          variants: variants,
        };
      })
    );

    if (minPrice || maxPrice) {
      productsWithPrice = productsWithPrice.filter((p) => {
        if (minPrice && p.min_price < Number(minPrice)) return false;
        if (maxPrice && p.min_price > Number(maxPrice)) return false;
        return true;
      });
    } 

    if (sort === "price_asc") {
      productsWithPrice.sort((a, b) => a.min_price - b.min_price);
    } else if (sort === "price_desc") {
      productsWithPrice.sort((a, b) => b.min_price - a.min_price);
    } else if (sort === "rating") {
      productsWithPrice.sort((a, b) => (b.Average_rating || 0) - (a.Average_rating || 0));
    } else {
      productsWithPrice.sort((a, b) => b._id.toString().localeCompare(a._id.toString()));
    }

    const total = productsWithPrice.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedProducts = productsWithPrice.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. LẤY CHI TIẾT 1 SẢN PHẨM
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ Product_id: req.params.id }).lean();
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    const variants = await Product_variant.find({ Product_id: req.params.id }).sort({ Price: 1 }).lean();
    const category = await Category.findOne({ Category_id: product.Category_id }).lean();
    const brand = await Brand.findOne({ Brand_id: product.Brand_id }).lean();

    res.json({ success: true, data: { ...product, variants, category, brand } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. SẢN PHẨM NỔI BẬT
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
  Is_AI: false
})
.sort({ Average_rating: -1 })
.limit(8)
.lean();

    const productsWithPrice = await Promise.all(
      products.map(async (product) => {
        const variant = await Product_variant.findOne({
          Product_id: product.Product_id,
          Status: "active"
        })
        .sort({ Price: 1 })
        .lean();

        return {
          ...product,
          min_price: variant?.Price || 0
        };
      })
    );

    res.json({
      success: true,
      data: productsWithPrice
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 4. FLASH SALE
exports.getFlashSaleProducts = async (req, res) => {
  try {
    const products = await Product.find({ Status: "on_sale", Is_Flash_Sale: true }).limit(8).lean();
    const productsWithPrice = await Promise.all(
      products.map(async (product) => {
        const variant = await Product_variant.findOne({ Product_id: product.Product_id, Status: "active" }).sort({ Price: 1 }).lean();
        return { ...product, min_price: variant?.Price || 0 };
      })
    );
    res.json({ success: true, data: productsWithPrice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. VISTA AI GỢI Ý (Đã fix lỗi hiển thị giá)
exports.getAISuggestedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      Status: "on_sale",
      Is_AI: true
    }).limit(8).lean();

    const productsWithPrice = await Promise.all(
      products.map(async (product) => {
        const variant = await Product_variant.findOne({
          Product_id: product.Product_id,
          Status: "active"
        })
        .sort({ Price: 1 })
        .lean();

        return {
          ...product,
          min_price: variant?.Price || 0
        };
      })
    );

    res.json({
      success: true,
      data: productsWithPrice
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// 6. LẤY TẤT CẢ DANH MỤC
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. SẢN PHẨM LIÊN QUAN
exports.getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findOne({ Product_id: req.params.id }).lean();
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    const related = await Product.find({ Category_id: product.Category_id, Product_id: { $ne: req.params.id }, Status: "on_sale" }).limit(4).lean();
    const relatedWithPrice = await Promise.all(
      related.map(async (p) => {
        const variant = await Product_variant.findOne({ Product_id: p.Product_id, Status: "active" }).sort({ Price: 1 }).lean();
        return { ...p, min_price: variant?.Price || 0 };
      })
    );
    res.json({ success: true, data: relatedWithPrice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. LẤY THEO DANH MỤC
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ Category_id: req.params.categoryId, Status: "on_sale" }).limit(4).lean();
    const productsWithPrice = await Promise.all(
      products.map(async (product) => {
        const variant = await Product_variant.findOne({ Product_id: product.Product_id, Status: "active" }).sort({ Price: 1 }).lean();
        return { ...product, min_price: variant?.Price || 0 };
      })
    );
    res.json({ success: true, data: productsWithPrice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
