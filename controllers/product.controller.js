const { Product, Product_variant, Category, Brand, Review, Order_detail, Order, User } = require("../models/schema");
const DEFAULT_MOCK_REVIEW_COUNT = Number(process.env.DEFAULT_MOCK_REVIEW_COUNT || 67);

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function parseReviewImages(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => parseReviewImages(item)).filter(Boolean))];
  }

  if (!value) {
    return [];
  }

  if (typeof value === 'object') {
    const image = cleanText(
      value.url
      || value.src
      || value.preview
      || value.dataUrl
      || value.dataURL
      || value.fileUrl
      || value.file_url
      || value.path
      || value.image
      || value.video
      || value.media
      || ''
    );
    return image ? [image] : [];
  }

  const raw = String(value || '').trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return parseReviewImages(parsed);
  } catch {
    return [raw];
  }
}

function maskReviewerName(value) {
  const text = cleanText(value);
  if (!text) {
    return 'Khách hàng VISTA';
  }

  const parts = text.split(' ');
  if (parts.length === 1) {
    return parts[0] + ' ***';
  }

  return parts.slice(0, 2).join(' ') + ' ***';
}

async function getPersistedReviewsByProductId(productId) {
  const variants = await Product_variant.find({ Product_id: productId })
    .select('Product_variant_id Variant_name')
    .lean();
  const variantIds = variants.map((item) => item.Product_variant_id).filter(Boolean);

  if (!variantIds.length) {
    return [];
  }

  const orderDetails = await Order_detail.find({ Product_variant_id: { $in: variantIds } }).lean();
  const orderDetailIds = orderDetails.map((item) => item.Order_detail_id).filter(Boolean);

  if (!orderDetailIds.length) {
    return [];
  }

  const reviews = await Review.find({ Order_detail_id: { $in: orderDetailIds } })
    .sort({ Created_at: -1 })
    .lean();

  const orderIds = [...new Set(orderDetails.map((item) => item.Order_id).filter(Boolean))];
  const orders = await Order.find({ Order_id: { $in: orderIds } })
    .select('Order_id User_id')
    .lean();
  const userIds = [...new Set(orders.map((item) => item.User_id).filter(Boolean))];
  const users = await User.find({ User_id: { $in: userIds } })
    .select('User_id Full_name Username')
    .lean();

  const detailMap = new Map(orderDetails.map((item) => [item.Order_detail_id, item]));
  const orderMap = new Map(orders.map((item) => [item.Order_id, item]));
  const userMap = new Map(users.map((item) => [item.User_id, item]));

  return reviews.map((review) => {
    const detail = detailMap.get(review.Order_detail_id) || {};
    const order = orderMap.get(detail.Order_id) || {};
    const user = userMap.get(order.User_id) || {};

    return {
      Review_id: review.Review_id,
      Order_detail_id: review.Order_detail_id,
      Product_variant_id: detail.Product_variant_id || '',
      User_name: maskReviewerName(user.Full_name || user.Username || review.User_name || ''),
      Rating: review.Rating,
      Comment: review.Comment || '',
      Images: parseReviewImages(review.Images),
      Created_at: review.Created_at,
    };
  });
}

// 1. LẤY TẤT CẢ SẢN PHẨM
exports.getAllProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, search, page = 1, limit = 12, sort = "newest", isAI, isNew, isPromo } = req.query;

    const filter = { Status: "on_sale" };
    if (category) filter.Category_id = category;
    
    if (brand) {
      const brandDoc = await Brand.findOne({ Brand_name: { $regex: new RegExp(`^${brand}$`, 'i') } }).lean();
      if (brandDoc) {
        filter.Brand_id = brandDoc.Brand_id;
      } else {
        filter.Brand_id = "NOT_FOUND";
      }
    }
    if (search) filter.Product_name = { $regex: search, $options: "i" };
    
    // LOGIC CHUẨN:
    if (req.query.isFlashSale === 'true') {
        filter.Is_Flash_Sale = true;
    } else if (isPromo === 'true') {
        filter.Discount = { $gt: 0 };
        filter.Is_Flash_Sale = { $ne: true }; 
        filter.Is_AI = { $ne: true };
    } else if (isAI === 'true') {
        filter.Is_AI = true;
        // Có thể thêm filter.Discount = 0 nếu sếp muốn AI không được giảm giá
    } else if (isNew === 'true') {
        filter.Discount = 0;                  // BẮT BUỘC: Hàng mới không được có giảm giá
        filter.Is_Flash_Sale = { $ne: true };
        filter.Is_AI = { $ne: true };
    }
    
    let products = await Product.find(filter).lean();

    // TÍNH GIÁ CHUẨN 100% TỪ DATABASE
    let productsWithPrice = await Promise.all(
      products.map(async (product) => {
        const variants = await Product_variant.find({
          Product_id: product.Product_id,
          Status: "active",
        }).sort({ Price: 1 }).lean();

        const originalPrice = variants[0]?.Price || 0;
        const discount = product.Discount || 0;

        const finalPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;

        return {
          ...product,
          min_price: originalPrice,
          final_price: finalPrice, 
          variants: variants,
        };
      })
    );

    // LỌC VÀ SẮP XẾP GIÁ...
    if (minPrice || maxPrice) {
      productsWithPrice = productsWithPrice.filter((p) => {
        if (minPrice && p.final_price < Number(minPrice)) return false;
        if (maxPrice && p.final_price > Number(maxPrice)) return false;
        return true;
      });
    } 

    if (sort === "price_asc") {
      productsWithPrice.sort((a, b) => a.final_price - b.final_price);
    } else if (sort === "price_desc") {
      productsWithPrice.sort((a, b) => b.final_price - a.final_price);
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
    const reviews = await getPersistedReviewsByProductId(req.params.id);
    const totalReviews = Number(product.Total_reviews || 0);
    const mockReviewCount = totalReviews > reviews.length
      ? totalReviews - reviews.length
      : (reviews.length > 0 ? DEFAULT_MOCK_REVIEW_COUNT : 0);

    res.json({
      success: true,
      data: {
        ...product,
        Total_reviews: mockReviewCount + reviews.length,
        variants,
        category,
        brand,
        Reviews: reviews,
        Review_summary: {
          persistedCount: reviews.length,
          mockReviewCount,
          totalReviews: mockReviewCount + reviews.length,
        },
      },
    });
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
    const products = await Product.find({ Status: "on_sale", Is_Flash_Sale: true })
  .sort({ Discount: -1 })
  .limit(16)
  .lean();
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
