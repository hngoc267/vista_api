const { Product, Product_variant, Category, Brand } = require("../models/schema");

// 1. LẤY TẤT CẢ SẢN PHẨM
exports.getAllProducts = async (req, res) => {
  try {
    // Thêm 'isNew' vào destructuring từ req.query
    const { category, brand, minPrice, maxPrice, search, page = 1, limit = 12, sort = "newest", isAI, isNew } = req.query;

    const filter = { Status: "on_sale" };
    if (category) filter.Category_id = category;
    
    // --- SỬA LẠI LOGIC LỌC THƯƠNG HIỆU Ở ĐÂY ---
    if (brand) {
      // 1. Tìm trong bảng Brand xem hãng (VD: 'Apple') có mã Brand_id là gì
      // Dùng $regex 'i' để không phân biệt viết hoa viết thường (Apple hay apple đều được)
      const brandDoc = await Brand.findOne({ Brand_name: { $regex: new RegExp(`^${brand}$`, 'i') } }).lean();
      
      if (brandDoc) {
        // 2. Nếu tìm thấy, lấy mã ID để lọc sản phẩm
        filter.Brand_id = brandDoc.Brand_id;
      } else {
        // 3. Nếu khách cố tình gõ sai tên hãng, ép filter tìm 1 mã ảo để trả về mảng rỗng
        filter.Brand_id = "NOT_FOUND";
      }
    }
    if (search) filter.Product_name = { $regex: search, $options: "i" };
    if (req.query.isFlashSale === 'true') filter.Is_Flash_Sale = true;
    if (isAI === 'true') filter.Is_AI = true;

    // THÊM MỚI: Logic lọc sản phẩm Mới (Không sale và không phải AI)
    if (isNew === 'true') {
      filter.Is_Flash_Sale = { $ne: true };
      filter.Is_AI = { $ne: true };
    }
    
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

// 3. SẢN PHẨM NỔI BẬT (Đã chuẩn hóa logic)
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      Status: "on_sale" // Bảo đảm sản phẩm phải đang mở bán
    })
    .sort({ Average_rating: -1 }) // Xếp theo đánh giá cao nhất đổ xuống
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

    res.json({ success: true, data: productsWithPrice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// 9. SO SÁNH SẢN PHẨM (LẤY NHIỀU VARIANT)
exports.compareProducts = async (req, res) => {
  try {
    const { variantIds } = req.query;
    if (!variantIds) {
      return res.status(400).json({ success: false, message: 'Thiếu variantIds' });
    }

    const ids = variantIds.split(',');
    const results = [];

    for (const variantId of ids) {
      // Tìm variant
      const variant = await Product_variant.findOne({ 
        Product_variant_id: variantId,
        Status: 'active'
      }).lean();

      if (!variant) continue;

      // Tìm product cha
      const product = await Product.findOne({ 
        Product_id: variant.Product_id,
        Status: 'on_sale'
      }).lean();

      if (!product) continue;

      // Tìm category và brand
      const category = await Category.findOne({ Category_id: product.Category_id }).lean();
      const brand = await Brand.findOne({ Brand_id: product.Brand_id }).lean();

      results.push({
        ...product,
        selectedVariantId: variantId,
        variants: [variant], // Gửi kèm variant để dễ lấy giá
        category: category,
        brand: brand
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};