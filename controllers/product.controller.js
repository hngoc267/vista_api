  const { Product, Product_variant, Category, Brand, Review, Order_detail, Order, User } = require("../models/schema");
  const DEFAULT_MOCK_REVIEW_COUNT = Number(process.env.DEFAULT_MOCK_REVIEW_COUNT || 67);

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function cleanMediaValue(value) {
    return String(value || '').trim();
  }

  function parseReviewImages(value) {
    if (Array.isArray(value)) {
      return [...new Set(value.flatMap((item) => parseReviewImages(item)).filter(Boolean))];
    }

    if (!value) {
      return [];
    }

    if (typeof value === 'object') {
      const image = cleanMediaValue(
        value.url
        || value.src
        || value.preview
        || value.dataUrl
        || value.dataURL
        || value.fileUrl
        || value.file_url
        || value.filePath
        || value.file_path
        || value.path
        || value.Location
        || value.location
        || value.secure_url
        || value.image
        || value.Image
        || value.video
        || value.Video
        || value.media
        || value.Media
        || value.attachment
        || value.Attachment
        || value.base64
        || value.Base64
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

  // 9. SMART SEARCH — Tìm kiếm thông minh bằng AI (Đã sửa lỗi lệch giá do Discount khuyến mãi & Thêm thông báo khi rỗng)
  exports.smartSearch = async (req, res) => {
    try {
      const { query } = req.body;
      const flashKeywords = [
        'ưu đãi', 'uu dai', 'flash sale', 'giảm giá', 'giam gia',
        'khuyến mãi', 'khuyen mai', 'sale hôm nay', 'sale hom nay',
        'đang giảm', 'dang giam', 'hàng sale', 'hang sale'
      ];
      const isFlashIntent = flashKeywords.some(kw =>
        query.toLowerCase().includes(kw)
      );

      if (isFlashIntent) {
        let flashProducts = await Product.find({ Status: 'on_sale', Is_Flash_Sale: true }).lean();
        flashProducts = await Promise.all(flashProducts.map(async (p) => {
          const variant = await Product_variant.findOne({
            Product_id: p.Product_id, Status: 'active'
          }).sort({ Price: 1 }).lean();
          return { ...p, min_price: variant?.Price || 0 };
        }));

        const badges = ['⚡ Flash Sale', '🔥 Giá sốc', '💥 Hot Deal', 'Ưu đãi hôm nay'];
        flashProducts = flashProducts.slice(0, 8).map((p, i) => ({
          ...p,
          aiTag: badges[i % badges.length],
          matchScore: 98
        }));

        return res.json({
          success: true,
          data: flashProducts,
          message: `Tìm thấy ${flashProducts.length} sản phẩm đang Flash Sale hôm nay!`,
          intent: { isFlashSale: true }
        });
      }
      if (!query) return res.status(400).json({ success: false, message: "Thiếu query" });
  
      // BƯỚC 0: Tự detect brand từ query — không phụ thuộc AI để tăng độ chính xác
      const brandList = [
        "Apple", "Samsung", "Xiaomi", "ASUS", "HP",
        "Dell", "Lenovo", "Acer", "Sony", "JBL",
        "Oppo", "Vivo", "Realme", "LG", "MSI"
      ];
      const detectedBrand = brandList.find(b =>
        query.toLowerCase().includes(b.toLowerCase())
      );
      console.log("Detected brand from query:", detectedBrand || "none");
  
      // BƯỚC 1: Gọi Groq AI phân tích intent (Hỗ trợ lọc khoảng giá minPrice và maxPrice chính xác)
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}` 
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          response_format: { type: "json_object" }, // Bắt buộc trả về JSON
          max_tokens: 256,
          temperature: 0.1, // Giảm tối đa sự sáng tạo để tăng tính chính xác logic
          messages: [{
            role: "user",
            content: `Bạn là một trợ lý AI phân tích ý định mua sắm đồ công nghệ. Hãy phân tích yêu cầu của người dùng và trả về một JSON object duy nhất.

  Yêu cầu của người dùng: "${query}"
  
  Định dạng JSON bắt buộc phải theo cấu trúc dưới đây:
  {
    "minPrice": <số nguyên hoặc null. Giá trị tối thiểu khi người dùng yêu cầu giá 'trên', 'khoảng từ', 'hơn'. Ví dụ: "trên 30 triệu" -> 30000000, "từ 15tr" -> 15000000, không có thì để null>,
    "maxPrice": <số nguyên hoặc null. Giá trị tối đa khi người dùng yêu cầu giá 'dưới', 'tầm', 'tối đa'. Ví dụ: "dưới 30 triệu" -> 30000000, "khoảng 15tr trở xuống" -> 15000000, không có thì để null>,
    "category": "<Laptop|Smartphone|Tablet|Thiết bị âm thanh|Phụ kiện công nghệ|Thiết bị gaming|null>",
    "priority": "<performance|price|portability|camera|null>",
    "keyword": "<Từ khóa mô tả dòng sản phẩm, model cụ thể hoặc thông số phần cứng cốt lõi của máy. Hãy lọc bỏ tên hãng thương hiệu, bỏ các cụm từ chỉ giá cả và từ thừa như 'tìm kiếm', 'mua', 'cần'. Ví dụ: 
    - 'mua laptop asus vivobook 15 giá rẻ' -> 'vivobook 15'
    - 'iphone 15 pro max titan tự nhiên' -> '15 pro max'
    - 'tai nghe chụp tai sony wh-1000xm4' -> 'wh-1000xm4'
    - 'máy tính lenovo core i5' -> 'core i5'
    - 'tìm điện thoại s24 ultra dưới 25tr' -> 's24 ultra'
    - Nếu chỉ ghi chung chung 'laptop sinh viên' không có model -> 'sinh viên'
    - Nếu không có từ khóa đặc trưng -> null>"
  }

  Chú ý: Phải phân biệt rõ ràng giữa "minPrice" (Ví dụ: trên 30 triệu) và "maxPrice" (Ví dụ: dưới 30 triệu). Nếu người dùng nói khoảng giá (Ví dụ: "từ 15 đến 20 triệu") thì điền cả hai trường.`
          }]
        })
      });
  
      const groqData = await groqRes.json();
      if (!groqData.choices || !groqData.choices[0]) {
        return res.status(500).json({ success: false, message: "Groq API lỗi" });
      }
  
      const raw = groqData.choices[0].message.content.trim();
      const intent = JSON.parse(raw);
      
      // Gán brand từ detection thủ công vào intent
      intent.brand = detectedBrand || null;
      console.log("Intent final phân tích bởi AI:", intent);
  
      // BƯỚC 2: Build filter chính xác
      const filter = { Status: "on_sale" };
  
      // 1. Áp dụng filter Hãng (Brand) nếu tìm thấy
      let brandNameApplied = null;
      if (intent.brand) {
        const brandDoc = await Brand.findOne({
          Brand_name: { $regex: intent.brand, $options: "i" }
        }).lean();
        if (brandDoc) {
          filter.Brand_id = brandDoc.Brand_id;
          brandNameApplied = brandDoc.Brand_name;
          console.log("-> Đã thêm lọc theo Hãng:", brandDoc.Brand_name);
        } else {
          filter.Brand_id = "NOT_FOUND";
          console.log("-> Không tìm thấy Hãng trong DB:", intent.brand);
        }
      }
  
      // 2. Áp dụng filter Danh mục (Category) nếu tìm thấy
      let categoryNameApplied = null;
      if (intent.category && intent.category !== "null") {
        const cat = await Category.findOne({
          Category_name: { $regex: intent.category, $options: "i" }
        }).lean();
        if (cat) {
          filter.Category_id = cat.Category_id;
          categoryNameApplied = cat.Category_name;
          console.log("-> Đã thêm lọc theo Danh mục:", cat.Category_name);
        }
      }
  
      // 3. Chuẩn hóa keyword
      let cleanedKeyword =
        intent.keyword &&
        intent.keyword !== "null"
          ? intent.keyword.trim()
          : null;

      // Backup: nếu AI lỡ trả kèm tên hãng thì loại bỏ
      if (cleanedKeyword && intent.brand) {
        cleanedKeyword = cleanedKeyword.replace(
          new RegExp(`\\b${intent.brand}\\b`, "ig"),
          ""
        ).trim();
      }

      // Loại keyword cảm tính
      const semanticKeywords = [
        "siêu mạnh",
        "mạnh",
        "gaming",
        "đồ họa",
        "cao cấp",
        "mượt",
        "nhẹ",
        "gọn",
        "đẹp",
        "pin trâu",
        "học tập",
        "văn phòng",
        "chơi game"
      ];

      const containsOnlySemantic =
        cleanedKeyword &&
        semanticKeywords.includes(
          cleanedKeyword.toLowerCase()
        );

      // Áp dụng filter Product_name
      if (
        cleanedKeyword &&
        !containsOnlySemantic
      ) {

        filter.Product_name = {
          $regex: cleanedKeyword,
          $options: "i"
        };

        console.log(
          "-> Lọc theo keyword:",
          cleanedKeyword
        );

      } else if (
        !cleanedKeyword &&
        !filter.Brand_id &&
        !filter.Category_id
      ) {

        filter.Product_name = {
          $regex: query,
          $options: "i"
        };

        console.log(
          "-> Fallback query"
        );

      } else {

        console.log(
          "-> Chỉ lọc theo brand/category"
        );

      }
      let products = await Product.find(filter).lean();
      // Thực hiện truy vấn danh sách sản phẩm thô từ Database
      if (intent.priority === "performance") {
        products.sort((a, b) => {
          const scoreA =
            (a.Average_rating || 0) * 0.6 +
            (a.Price || 0) * 0.4;

          const scoreB =
            (b.Average_rating || 0) * 0.6 +
            (b.Price || 0) * 0.4;

          return scoreB - scoreA;
        });
      }
      console.log("Mongoose Filter ứng dụng:", JSON.stringify(filter));
      console.log("Số lượng sản phẩm tìm thấy sơ bộ:", products.length);
  
      // BƯỚC 3: Gán giá gốc thấp nhất từ các biến thể (variants) & TÍNH TOÁN GIÁ BÁN THỰC TẾ sau khi trừ Discount
      let results = await Promise.all(products.map(async (p) => {
        const variant = await Product_variant.findOne({ Product_id: p.Product_id, Status: "active" }).sort({ Price: 1 }).lean();
        const originalPrice = variant?.Price || 0;
        
        // Tính toán giá thực tế sau khi giảm giá để làm căn cứ so sánh chính xác với khoảng giá người dùng yêu cầu
        const discountPercent = p.Discount || 0;
        const finalPrice = originalPrice - (originalPrice * discountPercent / 100);

        return { 
          ...p, 
          min_price: originalPrice, // Giữ nguyên giá gốc để Frontend tiếp tục tính toán render, không gây lỗi lặp discount
          final_price: finalPrice   // Thuộc tính mới phục vụ việc lọc so sánh ở Backend
        };
      }));
  
      // BƯỚC 4: Lọc giá linh hoạt (So sánh chuẩn dựa trên GIÁ THỰC TẾ final_price)
      if (intent.minPrice) {
        results = results.filter(p => p.final_price >= intent.minPrice);
        console.log("Số lượng sản phẩm sau khi lọc giá tối thiểu thực tế (>= " + intent.minPrice + "):", results.length);
      }
      if (intent.maxPrice) {
        results = results.filter(p => p.final_price <= intent.maxPrice);
        console.log("Số lượng sản phẩm sau khi lọc giá tối đa thực tế (<= " + intent.maxPrice + "):", results.length);
      }
  
      // BƯỚC 5: Sắp xếp theo mức độ đánh giá (Rating) cao giảm dần
      results.sort((a, b) => (b.Average_rating || 0) - (a.Average_rating || 0));
  
      // BƯỚC 6: Gán badge nhãn AI Đề xuất
      results = results.map((p) => {
        const {
          final_price,
          min_price,
          ...cleanProduct
        } = p;

        return {
          ...cleanProduct,

          // giá frontend dùng
          min_price: final_price,

          // giữ lại để hiển thị gạch ngang
          original_price: min_price,

          aiTag: "✦ AI đề xuất"
        };
      });
  
      // Giới hạn số lượng kết quả hiển thị phù hợp với giao diện frontend
      const resultLimit = intent.brand ? 4 : intent.category ? 6 : 4;
      const finalData = results.slice(0, resultLimit);

      // BƯỚC 7: Trả về thông báo thông minh khi không có kết quả phù hợp
      let responseMessage = "Thành công";
      if (finalData.length === 0) {
        const parts = [];
        if (categoryNameApplied) parts.push(categoryNameApplied);
        if (brandNameApplied) parts.push(`hãng ${brandNameApplied}`);
        if (intent.keyword && intent.keyword !== "null") parts.push(`theo từ khóa "${intent.keyword}"`);
        
        let priceDesc = "";
        if (intent.minPrice && intent.maxPrice) {
          priceDesc = `trong tầm giá từ ${intent.minPrice.toLocaleString('vi-VN')}đ đến ${intent.maxPrice.toLocaleString('vi-VN')}đ`;
        } else if (intent.minPrice) {
          priceDesc = `có giá bán trên ${intent.minPrice.toLocaleString('vi-VN')}đ`;
        } else if (intent.maxPrice) {
          priceDesc = `có giá bán dưới ${intent.maxPrice.toLocaleString('vi-VN')}đ`;
        }

        if (priceDesc) parts.push(priceDesc);

        const subject = parts.join(" ") || "sản phẩm";
        responseMessage = `Rất tiếc, VISTA AI chưa tìm thấy sản phẩm ${subject} tại hệ thống cửa hàng. Bạn vui lòng điều chỉnh lại từ khóa hoặc khoảng giá nhé!`;
      }

      res.json({ 
        success: true, 
        data: finalData, 
        intent,
        message: responseMessage 
      });
  
    } catch (error) {
      console.error("Smart Search error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };