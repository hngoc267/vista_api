// ============================================================
// VISTA — MongoDB Schema Definitions
// Dựa theo ERD đã thiết kế
// Công nghệ: MongoDB (Mongoose ODM cho Node.js)
// ============================================================

const mongoose = require("mongoose");
const { Schema } = mongoose;

// ============================================================
// 1. USER — Người dùng
// ============================================================
const UserSchema = new Schema(
  {
    User_id: { type: String, required: true, unique: true },
    Username: { type: String, required: true, unique: true, trim: true },
    Password: { type: String, required: true }, // bcrypt hash
    Phone_number: { type: String, trim: true },
    Email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    Full_name: { type: String, trim: true },
    Status: { type: String, enum: ["active", "blocked"], default: "active" },
    Created_at: { type: Date, default: Date.now },
    Reset_otp: { type: String, default: null },
    Reset_otp_expires: { type: Date, default: null } 
  },
  { collection: "User" }
);

// ============================================================
// 2. ADDRESS — Địa chỉ giao hàng
// ============================================================
const AddressSchema = new Schema(
  {
    Address_id: { type: String, required: true, unique: true },
    User_id: { type: String, required: true, ref: "User" }, // FK → User
    Receiver_name: { type: String, required: true },
    Receiver_phone: { type: String, required: true },
    Email: { type: String, trim: true },
    Province: { type: String, required: true },
    District: { type: String, required: true },
    Ward: { type: String, required: true },
    Specific_address: { type: String, required: true },
    Is_default: { type: Boolean, default: false },
  },
  { collection: "Address" }
);

// ============================================================
// 3. CATEGORY — Danh mục sản phẩm
// ============================================================
const CategorySchema = new Schema(
  {
    Category_id: { type: String, required: true, unique: true },
    Category_name: { type: String, required: true },
    Description: { type: String },
  },
  { collection: "Category" }
);

// ============================================================
// 4. BRAND — Thương hiệu
// ============================================================
const BrandSchema = new Schema(
  {
    Brand_id: { type: String, required: true, unique: true },
    Brand_name: { type: String, required: true },
    Description: { type: String },
    Origin_country: { type: String },
  },
  { collection: "Brand" }
);

// ============================================================
// 5. PRODUCT — Sản phẩm
// ============================================================
const ProductSchema = new Schema(
  {
    Product_id: { type: String, required: true, unique: true },
    Category_id: { type: String, required: true, ref: "Category" }, // FK → Category
    Brand_id: { type: String, required: true, ref: "Brand" },       // FK → Brand
    Product_name: { type: String, required: true },
    Description: { type: String },
    Images: [{ type: String }], // mảng URL ảnh
    Average_rating: { type: Number, default: 0, min: 0, max: 5 },
    Total_reviews: { type: Number, default: 0 },
    // Technical_specs: lưu dạng object linh hoạt theo từng loại sản phẩm
    // Laptop: { CPU, GPU, RAM, Storage, Screen_Size, Battery, Weight, Refresh_Rate }
    // Smartphone: { Chipset, RAM, ROM, Camera, Battery, Screen_Type, Refresh_Rate, Display_Size }
    // Có thêm AI tags: { Usage_Type, User_Segment, Performance_Level, Portability, Gaming_Support, AI_Tag }
    Technical_specs: { type: Schema.Types.Mixed },
    Status: {
      type: String,
      enum: ["on_sale", "out_of_stock"],
      default: "on_sale",
    },
    Discount: { type: Number, default: 0 },            // Phần trăm giảm giá (vd: 10, 15, 30)
    Is_Flash_Sale: { type: Boolean, default: false },   // Đánh dấu sản phẩm thuộc cụm Flash Sale
    Is_AI: { type: Boolean, default: false },           // Đánh dấu sản phẩm được AI gợi ý
  },
  { collection: "Product" }
);

// ============================================================
// 6. PRODUCT_VARIANT — Phiên bản sản phẩm
// ============================================================
const ProductVariantSchema = new Schema(
  {
    Product_variant_id: { type: String, required: true, unique: true },
    Product_id: { type: String, required: true, ref: "Product" }, // FK → Product
    Variant_name: { type: String, required: true }, // vd: "128GB - Đen"
    Attributes: { type: Schema.Types.Mixed },       // { Color: "Đen", Storage: "128GB" }
    Price: { type: Number, required: true },
    Stock_quantity: { type: Number, required: true, default: 0 },
    Status: {
      type: String,
      enum: ["active", "out_of_stock"],
      default: "active",
    },
  },
  { collection: "Product_variant" }
);

// ============================================================
// 7. CART — Giỏ hàng
// ============================================================
const CartSchema = new Schema(
  {
    Cart_id: { type: String, required: true, unique: true },
    User_id: { type: String, required: true, ref: "User" }, // FK → User
    Total_product: { type: Number, default: 0 },
    Total_price: { type: Number, default: 0 },
  },
  { collection: "Cart" }
);

// ============================================================
// 8. CART_ITEM — Chi tiết giỏ hàng
// ============================================================
const CartItemSchema = new Schema(
  {
    Cart_item_id: { type: String, required: true, unique: true },
    Product_variant_id: { type: String, required: true, ref: "Product_variant" }, // FK → Product_variant
    Cart_id: { type: String, required: true, ref: "Cart" },                        // FK → Cart
    Quantity: { type: Number, required: true, min: 1 },
    Price: { type: Number, required: true }, // giá hiện tại của variant
  },
  { collection: "Cart_item" }
);

// ============================================================
// 9. VOUCHER — Mã giảm giá (Phiên bản Minh Hiển)
// ============================================================
const VoucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    condition: { type: String, required: true },
    type: { type: String, enum: ["percent", "shipping"], required: true },
    category: { type: String, enum: ["freeship", "discount"], required: true },
    status: {
      type: String,
      enum: ["available", "used", "expiring"],
      default: "available",
    },
    expiry: { type: String, required: true },
    daysLeft: { type: Number },
    description: { type: String, default: "" },
    benefits: [{ type: String }],
    conditions: [{ type: String }],
    startDate: { type: String, default: "" },
    usageLimit: { type: String, default: "" },
    statusText: { type: String, default: "" },
  },
  {
    collection: "Voucher",
    timestamps: true,
  }
);

// ============================================================
// 10. ORDER — Đơn hàng
// ============================================================
const OrderSchema = new Schema(
  {
    Order_id: { type: String, required: true, unique: true },
    User_id: { type: String, required: true, ref: "User" },       // FK → User
    Voucher_id: { type: String, ref: "Voucher", default: null },  // FK → Voucher (nullable)
    Total_items_price: { type: Number, required: true },
    Discount_amount: { type: Number, default: 0 },
    Total_amount: { type: Number, required: true },
    Order_notes: { type: String },
    Created_at: { type: Date, default: Date.now },
  },
  { collection: "Order" }
);

// ============================================================
// 11. ORDER_DETAIL — Chi tiết đơn hàng
// ============================================================
const OrderDetailSchema = new Schema(
  {
    Order_detail_id: { type: String, required: true, unique: true },
    Product_variant_id: { type: String, required: true, ref: "Product_variant" }, // FK → Product_variant
    Order_id: { type: String, required: true, ref: "Order" },                      // FK → Order
    Variant_name: { type: String, required: true }, // chụp lại tên lúc mua
    Price: { type: Number, required: true },         // chụp lại giá lúc mua
    Quantity: { type: Number, required: true, min: 1 },
    Total_price: { type: Number, required: true },   // Price × Quantity
  },
  { collection: "Order_detail" }
);

// ============================================================
// 12. PAYMENT — Thanh toán
// ============================================================
const PaymentSchema = new Schema(
  {
    Payment_id: { type: String, required: true, unique: true },
    Order_id: { type: String, required: true, ref: "Order" }, // FK → Order
    Payment_type: {
      type: String,
      enum: ["COD", "MoMo", "VNPay", "BankTransfer"],
      required: true,
    },
    Payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
  },
  { collection: "Payment" }
);

// ============================================================
// 13. DELIVERY — Vận chuyển
// ============================================================
const DeliverySchema = new Schema(
  {
    Delivery_id: { type: String, required: true, unique: true },
    Order_id: { type: String, required: true, ref: "Order" }, // FK → Order
    Shipping_partner: { type: String }, // GHTK, GHN, Viettel Post
    Tracking_number: { type: String },
    Shipping_fee: { type: Number, default: 0 },
    Estimated_delivery_date: { type: Date },
    Status: {
      type: String,
      enum: ["pending", "shipping", "delivered", "failed"],
      default: "pending",
    },
  },
  { collection: "Delivery" }
);

// ============================================================
// 14. RETURN_ORDER — Yêu cầu hủy/trả hàng
// ============================================================
const ReturnOrderSchema = new Schema(
  {
    Return_order_id: { type: String, required: true, unique: true },
    Order_id: { type: String, required: true, ref: "Order" },                      // FK → Order
    Product_variant_id: { type: String, required: true, ref: "Product_variant" }, // FK → Product_variant
    Reason_type: {
      type: String,
      enum: ["damaged", "wrong_item", "changed_mind", "other"],
      required: true,
    },
    Description: { type: String },
    Evidence_images: [{ type: String }], // mảng URL ảnh/video
    Refund_amount: { type: Number, default: 0 },
    Status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    Created_at: { type: Date, default: Date.now },
  },
  { collection: "Return_order" }
);

// ============================================================
// 15. REVIEW — Đánh giá sản phẩm
// ============================================================
const ReviewSchema = new Schema(
  {
    Review_id: { type: String, required: true, unique: true },
    Order_detail_id: { type: String, required: true, ref: "Order_detail" }, // FK → Order_detail
    Rating: { type: Number, required: true, min: 1, max: 5 },
    Comment: { type: String },
    Images: [{ type: String }], // mảng URL ảnh đính kèm
    Created_at: { type: Date, default: Date.now },
  },
  { collection: "Review" }
);

// ============================================================
// 16. SESSION — Phiên trò chuyện AI
// ============================================================
const SessionSchema = new Schema(
  {
    Session_id: { type: String, required: true, unique: true },
    User_id: { type: String, required: true, ref: "User" }, // FK → User
    Title: { type: String, default: "Cuộc trò chuyện mới" },
    Create_at: { type: Date, default: Date.now },
    Updated_at: { type: Date, default: Date.now },
  },
  { collection: "Session" }
);

// ============================================================
// 17. MESSAGE — Chi tiết tin nhắn
// ============================================================
const MessageSchema = new Schema(
  {
    Message_id: { type: String, required: true, unique: true },
    Session_id: { type: String, required: true, ref: "Session" }, // FK → Session
    Content: { type: String, required: true },
    Created_at: { type: Date, default: Date.now },
    Sender_type: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
  },
  { collection: "Message" }
);

// ============================================================
// 18. AI_COMPARISON — Phân tích so sánh AI
// ============================================================
const AIComparisonSchema = new Schema(
  {
    AI_comparison_id: { type: String, required: true, unique: true },
    User_id: { type: String, required: true, ref: "User" }, // FK → User
    Target_products: [{ type: String, ref: "Product" }],    // mảng Product_id được so sánh
    User_requirements: { type: String },                     // nhu cầu người dùng nhập vào
    Ai_response_summary: { type: String },                   // kết quả phân tích AI trả về
    Created_at: { type: Date, default: Date.now },
  },
  { collection: "AI_comparison" }
);

// ============================================================
// EXPORT TẤT CẢ MODELS
// ============================================================
module.exports = {
  User: mongoose.model("User", UserSchema),
  Address: mongoose.model("Address", AddressSchema),
  Category: mongoose.model("Category", CategorySchema),
  Brand: mongoose.model("Brand", BrandSchema),
  Product: mongoose.model("Product", ProductSchema),
  Product_variant: mongoose.model("Product_variant", ProductVariantSchema),
  Cart: mongoose.model("Cart", CartSchema),
  Cart_item: mongoose.model("Cart_item", CartItemSchema),
  Voucher: mongoose.model("Voucher", VoucherSchema),
  Order: mongoose.model("Order", OrderSchema),
  Order_detail: mongoose.model("Order_detail", OrderDetailSchema),
  Payment: mongoose.model("Payment", PaymentSchema),
  Delivery: mongoose.model("Delivery", DeliverySchema),
  Return_order: mongoose.model("Return_order", ReturnOrderSchema),
  Review: mongoose.model("Review", ReviewSchema),
  Session: mongoose.model("Session", SessionSchema),
  Message: mongoose.model("Message", MessageSchema),
  AI_comparison: mongoose.model("AI_comparison", AIComparisonSchema),
};
