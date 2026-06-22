// ============================================================
// VISTA — seed.js
// Dữ liệu mẫu: Brands, Categories, Products, Variants, Users, Vouchers
// Chạy: node seed.js
// ============================================================
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");

const models = require("./models/schema");
const User = models.User;
const Category = models.Category;
const Brand = models.Brand;
const Product = models.Product;
const Product_variant = models.Product_variant;
const Cart = models.Cart;
const Voucher = models.Voucher;

const connectDB = require("./config/db");
// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const uid = (prefix, n) => `${prefix}_${String(n).padStart(3, "0")}`;

// ─────────────────────────────────────────────
// 1. CATEGORIES
// ─────────────────────────────────────────────
const categoriesData = [
  { Category_id: "CAT_001", Category_name: "Laptop",             Description: "Máy tính xách tay các loại" },
  { Category_id: "CAT_002", Category_name: "Smartphone",         Description: "Điện thoại thông minh" },
  { Category_id: "CAT_003", Category_name: "Tablet",             Description: "Máy tính bảng" },
  { Category_id: "CAT_004", Category_name: "Thiết bị âm thanh",  Description: "Tai nghe, loa Bluetooth, microphone" },
  { Category_id: "CAT_005", Category_name: "Phụ kiện công nghệ", Description: "Sạc dự phòng, cáp, hub, bàn phím, chuột" },
  { Category_id: "CAT_006", Category_name: "Thiết bị gaming",    Description: "Chuột gaming, bàn phím cơ, màn hình gaming, tay cầm" },
];

// ─────────────────────────────────────────────
// 2. BRANDS
// ─────────────────────────────────────────────
const brandsData = [
  // Laptop
  { Brand_id: "BRD_001", Brand_name: "Apple",    Origin_country: "Mỹ",    Description: "Thương hiệu công nghệ cao cấp của Mỹ" },
  { Brand_id: "BRD_002", Brand_name: "ASUS",     Origin_country: "Đài Loan", Description: "Hãng máy tính hàng đầu Đài Loan" },
  { Brand_id: "BRD_003", Brand_name: "Dell",     Origin_country: "Mỹ",    Description: "Thương hiệu máy tính doanh nghiệp" },
  { Brand_id: "BRD_004", Brand_name: "HP",       Origin_country: "Mỹ",    Description: "Hewlett-Packard - đa dạng dòng laptop" },
  { Brand_id: "BRD_005", Brand_name: "Lenovo",   Origin_country: "Trung Quốc", Description: "Hãng máy tính lớn nhất thế giới" },
  { Brand_id: "BRD_006", Brand_name: "Acer",     Origin_country: "Đài Loan", Description: "Laptop phổ thông đến gaming" },
  // Smartphone
  { Brand_id: "BRD_007", Brand_name: "Samsung",  Origin_country: "Hàn Quốc", Description: "Tập đoàn điện tử lớn nhất Hàn Quốc" },
  { Brand_id: "BRD_008", Brand_name: "Xiaomi",   Origin_country: "Trung Quốc", Description: "Smartphone giá tốt hiệu năng cao" },
  { Brand_id: "BRD_009", Brand_name: "OPPO",     Origin_country: "Trung Quốc", Description: "Chuyên về camera và thiết kế" },
  { Brand_id: "BRD_010", Brand_name: "Vivo",     Origin_country: "Trung Quốc", Description: "Smartphone mỏng nhẹ, pin tốt" },
  // Audio
  { Brand_id: "BRD_011", Brand_name: "JBL",      Origin_country: "Mỹ",    Description: "Loa và tai nghe chất lượng cao" },
  { Brand_id: "BRD_012", Brand_name: "Sony",     Origin_country: "Nhật Bản", Description: "Âm thanh premium, tai nghe chống ồn" },
  { Brand_id: "BRD_013", Brand_name: "Logitech", Origin_country: "Thụy Sĩ", Description: "Phụ kiện máy tính và âm thanh" },
  // Gaming
  { Brand_id: "BRD_014", Brand_name: "HyperX",   Origin_country: "Mỹ",    Description: "Thiết bị gaming chuyên nghiệp" },
  { Brand_id: "BRD_015", Brand_name: "Razer",    Origin_country: "Mỹ/Singapore", Description: "Thương hiệu gaming cao cấp" },
  { Brand_id: "BRD_016", Brand_name: "Anker",    Origin_country: "Trung Quốc", Description: "Phụ kiện sạc và kết nối" },
];

// ─────────────────────────────────────────────
// 3. PRODUCTS + VARIANTS
// ─────────────────────────────────────────────

const productsData = [
  // ============================================================
  // LAPTOP (CAT_001) - 10 sản phẩm
  // ============================================================
  {
    product: {
      Product_id: "PRD_001", Category_id: "CAT_001", Brand_id: "BRD_001", Product_name: "Apple MacBook Air M3 13 inch 2024",
      Description: "MacBook Air M3 siêu mỏng nhẹ, hiệu năng vượt trội với chip Apple M3 tiên tiến, màn hình Liquid Retina 13.6 inch rực rỡ và thời lượng pin ấn tượng lên đến 18 giờ. Đây là thiết bị di động đẳng cấp, lý tưởng cho sinh viên, dân văn phòng và nhà sáng tạo nội dung cần di chuyển nhiều.",
      Images: ["macbook-air-m3-midnight.jpg", "macbook-air-m3-starlight.jpg"], Average_rating: 4.8, Total_reviews: 124, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { CPU: "Apple M3 8-core", GPU: "Apple M3 10-core GPU", RAM: "8GB Unified Memory", Storage: "256GB SSD", Screen_Size: "13.6 inch", Battery: "52.6Wh (~18 giờ)", Weight: "1.24 kg", Refresh_Rate: "60Hz", Resolution: "2560x1664 Liquid Retina", OS: "macOS Sonoma", Usage_Type: "Văn phòng, Học tập, Đồ họa nhẹ", User_Segment: "Sinh viên, Dân văn phòng", Performance_Level: "Cao", Portability: "Rất cao", Gaming_Support: "Không", AI_Tag: "ultrabook, macbook, m3, nhẹ, sinh-viên" }
    },
    variants: [
      { Product_variant_id: "VAR_001", Variant_name: "8GB / 256GB - Midnight", Attributes: { Color: "Midnight", RAM: "8GB", Storage: "256GB" }, Price: 27990000, Stock_quantity: 30 },
      { Product_variant_id: "VAR_002", Variant_name: "8GB / 256GB - Starlight", Attributes: { Color: "Starlight", RAM: "8GB", Storage: "256GB" }, Price: 27990000, Stock_quantity: 25 }
    ]
  },
  {
    product: {
      Product_id: "PRD_002", Category_id: "CAT_001", Brand_id: "BRD_001", Product_name: "Apple MacBook Pro M3 Pro 14 inch 2024",
      Description: "Được định hình là cỗ máy trạm di động chuyên nghiệp, MacBook Pro 14 inch trang bị chip M3 Pro mạnh mẽ cùng màn hình Liquid Retina XDR 120Hz ProMotion siêu mượt. Hệ thống tản nhiệt chủ động cao cấp giúp máy xử lý mượt mà các tác vụ render video 4K, lập trình phần mềm phức tạp và dựng hình mô phỏng 3D.",
      Images: ["macbook-pro-14-m3pro-black.jpg", "macbook-pro-14-m3pro-silver.jpg"], Average_rating: 4.9, Total_reviews: 87, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { CPU: "Apple M3 Pro 11-core", GPU: "Apple M3 Pro 14-core GPU", RAM: "18GB Unified Memory", Storage: "512GB SSD", Screen_Size: "14.2 inch", Battery: "70Wh (~17 giờ)", Weight: "1.61 kg", Refresh_Rate: "120Hz ProMotion", Resolution: "3024x1964 Liquid Retina XDR", OS: "macOS Sonoma", Usage_Type: "Đồ họa kỹ thuật, Video, Lập trình chuyên sâu", User_Segment: "Chuyên gia sáng tạo, Lập trình viên", Performance_Level: "Rất cao", Portability: "Cao", Gaming_Support: "Không", AI_Tag: "macbook-pro, m3-pro, dựng-phim, đồ-họa, lập-trình" }
    },
    variants: [
      { Product_variant_id: "VAR_005", Variant_name: "18GB / 512GB - Space Black", Attributes: { Color: "Space Black", RAM: "18GB", Storage: "512GB" }, Price: 52990000, Stock_quantity: 12 },
      { Product_variant_id: "VAR_006", Variant_name: "18GB / 1TB - Space Black", Attributes: { Color: "Space Black", RAM: "18GB", Storage: "1TB" }, Price: 59990000, Stock_quantity: 8 }
    ]
  },
  {
    product: {
      Product_id: "PRD_003", Category_id: "CAT_001", Brand_id: "BRD_002", Product_name: "ASUS ROG Zephyrus G14 2024",
      Description: "Laptop gaming mỏng nhẹ đỉnh cao với vỏ nhôm CNC tinh xảo. Sức mạnh bộc phá từ CPU AMD Ryzen 9 thế hệ mới kết hợp card rời NVIDIA RTX 4070 giúp chiến mượt mọi tựa game AAA cấu hình cao. Màn hình OLED 3K 120Hz mang đến không gian giải trí đỉnh sắc và độ chính xác màu tuyệt đối cho thiết kế đồ họa.",
      Images: ["rog-zephyrus-g14-eclipse-gray.jpg", "rog-zephyrus-g14-platinum-white.jpg"], Average_rating: 4.7, Total_reviews: 56, Status: "on_sale", Discount: 15, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { CPU: "AMD Ryzen 9 8945HS", GPU: "NVIDIA GeForce RTX 4070 8GB", RAM: "16GB DDR5 6400MHz", Storage: "1TB SSD NVMe", Screen_Size: "14 inch", Battery: "73Wh", Weight: "1.65 kg", Refresh_Rate: "125Hz", Resolution: "2880x1800 OLED", OS: "Windows 11 Home", Usage_Type: "Gaming nặng, Đồ họa 3D, Giải trí", User_Segment: "Game thủ, Designer công nghệ", Performance_Level: "Rất cao", Portability: "Cao", Gaming_Support: "Có", AI_Tag: "gaming, rog, rtx-4070, oled, mỏng-nhẹ" }
    },
    variants: [
      { Product_variant_id: "VAR_008", Variant_name: "16GB / 1TB - Eclipse Gray", Attributes: { Color: "Eclipse Gray", RAM: "16GB", Storage: "1TB" }, Price: 42990000, Stock_quantity: 18 },
      { Product_variant_id: "VAR_009", Variant_name: "32GB / 1TB - Eclipse Gray", Attributes: { Color: "Eclipse Gray", RAM: "32GB", Storage: "1TB" }, Price: 49990000, Stock_quantity: 8 }
    ]
  },
  {
    product: {
      Product_id: "PRD_004", Category_id: "CAT_001", Brand_id: "BRD_002", Product_name: "ASUS VivoBook 15 X1504ZA",
      Description: "Laptop văn phòng phân khúc phổ thông được trang bị chip vi xử lý Intel Core i5 thế hệ 12 mạnh mẽ và ổ cứng SSD 512GB siêu tốc. Thiết kế máy hiện đại, bản lề mở phẳng 180 độ cùng màn hình lớn 15.6 inch chống chói thích hợp cho học tập nhóm, làm việc văn phòng cơ bản mỗi ngày.",
      Images: ["asus-vivobook-15-indie-black.jpg", "asus-vivobook-15-silver.jpg"], Average_rating: 4.2, Total_reviews: 203, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { CPU: "Intel Core i5-1235U", GPU: "Intel Iris Xe Graphics", RAM: "8GB DDR4", Storage: "512GB SSD", Screen_Size: "15.6 inch", Battery: "42Wh (~7 giờ)", Weight: "1.70 kg", Refresh_Rate: "60Hz", Resolution: "1920x1080 FHD", OS: "Windows 11 Home", Usage_Type: "Văn phòng cơ bản, Xem phim, Tra cứu", User_Segment: "Sinh viên, Học sinh, Nhân viên văn phòng", Performance_Level: "Trung bình", Portability: "Cao", Gaming_Support: "Không", AI_Tag: "văn-phòng, giá-rẻ, phổ-thông, học-tập" }
    },
    variants: [{ Product_variant_id: "VAR_011", Variant_name: "8GB / 512GB - Indie Black", Attributes: { Color: "Indie Black", RAM: "8GB", Storage: "512GB" }, Price: 13990000, Stock_quantity: 40 }]
  },
  {
    product: {
      Product_id: "PRD_005", Category_id: "CAT_001", Brand_id: "BRD_003", Product_name: "Dell XPS 15 9530 2024",
      Description: "Kiệt tác công nghệ dành riêng cho giới doanh nhân cao cấp và lập trình viên chuyên nghiệp. Khung máy nhôm CNC bóng bẩy phối cùng đệm tay sợi carbon siêu bền. Màn hình OLED tràn viền InfinityEdge sắc nét kết hợp sức mạnh đồ họa rời GeForce RTX 4060 mang lại hiệu năng đỉnh cao trong một thân máy thời thượng.",
      Images: ["dell-xps-15-platinum.jpg", "dell-xps-15-graphite.jpg"], Average_rating: 4.6, Total_reviews: 45, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { CPU: "Intel Core i7-13700H", GPU: "NVIDIA GeForce RTX 4060 8GB", RAM: "16GB DDR5", Storage: "512GB SSD", Screen_Size: "15.6 inch", Battery: "86Wh (~12 giờ)", Weight: "1.86 kg", Refresh_Rate: "60Hz", Resolution: "3456x2160 OLED 3.5K", OS: "Windows 11 Pro", Usage_Type: "Doanh nhân, Lập trình dữ liệu, Đồ họa", User_Segment: "Quản lý cao cấp, Lập trình viên", Performance_Level: "Cao", Portability: "Trung bình", Gaming_Support: "Có", AI_Tag: "dell-xps, cao-cấp, doanh-nhân, đồ-họa-mạnh" }
    },
    variants: [{ Product_variant_id: "VAR_014", Variant_name: "16GB / 512GB - Platinum Silver", Attributes: { Color: "Platinum Silver", RAM: "16GB", Storage: "512GB" }, Price: 47990000, Stock_quantity: 10 }]
  },
  {
    product: {
      Product_id: "PRD_006", Category_id: "CAT_001", Brand_id: "BRD_005", Product_name: "Lenovo ThinkPad X1 Carbon Gen 12",
      Description: "Huyền thoại laptop doanh nghiệp siêu nhẹ chỉ 1.12kg nhờ chế tác hoàn toàn từ sợi carbon cao cấp cấp độ hàng không. Sở hữu bàn phím ThinkPad trứ danh gõ êm vô địch, cơ chế bảo mật sinh trắc học vân tay, camera hồng ngoại IR và dòng chip Intel Core Ultra 7 tích hợp trí tuệ nhân tạo tối ưu hóa năng suất xử lý.",
      Images: ["thinkpad-x1-carbon-g12-black.jpg"], Average_rating: 4.7, Total_reviews: 39, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { CPU: "Intel Core Ultra 7 165U", GPU: "Intel Arc Graphics", RAM: "16GB LPDDR5x", Storage: "512GB SSD", Screen_Size: "14 inch", Battery: "57Wh (~15 giờ)", Weight: "1.12 kg", Refresh_Rate: "60Hz", Resolution: "1920x1200 IPS", OS: "Windows 11 Pro", Usage_Type: "Doanh nhân di động, Phân tích dữ liệu", User_Segment: "Chuyên gia, Quản lý, Giám đốc", Performance_Level: "Cao", Portability: "Rất cao", Gaming_Support: "Không", AI_Tag: "thinkpad, siêu-nhẹ, doanh-nhân, bảo-mật, ai-core" }
    },
    variants: [{ Product_variant_id: "VAR_017", Variant_name: "16GB / 512GB - Deep Black", Attributes: { Color: "Deep Black", RAM: "16GB", Storage: "512GB" }, Price: 38990000, Stock_quantity: 12 }]
  },
  {
    product: {
      Product_id: "PRD_007", Category_id: "CAT_001", Brand_id: "BRD_006", Product_name: "Acer Nitro V 15 ANV15-51",
      Description: "Chiến binh laptop gaming phân khúc tầm trung lý tưởng cho giới trẻ. Diện mạo máy hầm hố ấn tượng cùng hệ thống quạt tản nhiệt kép làm mát buồng máy siêu tốc. Sự kết hợp giữa bộ vi xử lý Intel i5 dòng H hiệu năng cao và card đồ họa rời RTX 4060 144Hz đem lại khung hình gaming mượt mà, không giật lag.",
      Images: ["acer-nitro-v15-obsidian-black.jpg"], Average_rating: 4.3, Total_reviews: 88, Status: "on_sale", Discount: 10, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { CPU: "Intel Core i5-13420H", GPU: "NVIDIA GeForce RTX 4060 8GB", RAM: "8GB DDR5", Storage: "512GB SSD", Screen_Size: "15.6 inch", Battery: "57Wh", Weight: "2.11 kg", Refresh_Rate: "144Hz", Resolution: "1920x1080 FHD IPS", OS: "Windows 11 Home", Usage_Type: "Chơi game Esport, Thiết kế đồ họa 2D", User_Segment: "Sinh viên công nghệ, Game thủ", Performance_Level: "Cao", Portability: "Trung bình", Gaming_Support: "Có", AI_Tag: "gaming-tầm-trung, acer-nitro, rtx-4060, 144hz" }
    },
    variants: [{ Product_variant_id: "VAR_019", Variant_name: "8GB / 512GB - Obsidian Black", Attributes: { Color: "Obsidian Black", RAM: "8GB", Storage: "512GB" }, Price: 22990000, Stock_quantity: 25 }]
  },
  {
    product: {
      Product_id: "PRD_008", Category_id: "CAT_001", Brand_id: "BRD_004", Product_name: "HP Pavilion 15-eg3088TX 2024",
      Description: "Laptop phổ thông thanh lịch với lớp vỏ nhôm tông màu bạc Natural Silver trang nhã, viền màn hình siêu mỏng Micro-edge tối ưu góc nhìn giải trí. Máy chạy mượt mà toàn bộ các ứng dụng kế toán, Office văn phòng, xử lý ảnh đồ họa bán chuyên cậy nhờ sức mạnh vi xử lý Intel i5 và card đồ họa hỗ trợ MX570.",
      Images: ["hp-pavilion-15-natural-silver.jpg"], Average_rating: 4.1, Total_reviews: 157, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { CPU: "Intel Core i5-1335U", GPU: "NVIDIA GeForce MX570 2GB", RAM: "8GB DDR4", Storage: "512GB SSD", Screen_Size: "15.6 inch", Battery: "43Wh", Weight: "1.75 kg", Refresh_Rate: "60Hz", Resolution: "1920x1080 FHD", OS: "Windows 11 Home", Usage_Type: "Học tập, Kế toán văn phòng, Đồ họa nhẹ", User_Segment: "Sinh viên kinh tế, Dân văn phòng", Performance_Level: "Trung bình", Portability: "Cao", Gaming_Support: "Không", AI_Tag: "hp-pavilion, văn-phòng, phổ-thông, giá-tốt" }
    },
    variants: [{ Product_variant_id: "VAR_022", Variant_name: "8GB / 512GB - Natural Silver", Attributes: { Color: "Natural Silver", RAM: "8GB", Storage: "512GB" }, Price: 16490000, Stock_quantity: 30 }]
  },
  {
    product: {
      Product_id: "PRD_034", Category_id: "CAT_001", Brand_id: "BRD_003", Product_name: "Dell Inspiron 14 5430",
      Description: "Chiếc máy tính xách tay nhỏ gọn 14 inch sở hữu khung hình tỷ lệ vàng 16:10, cung cấp không gian làm việc rộng rãi theo chiều dọc. Bộ nhớ RAM 16GB dung lượng cao giúp xử lý trơn tru các dự án phân tích dữ liệu, chạy code lập trình đa luồng mượt mà, không lo thắt nút cổ chai hệ thống.",
      Images: ["dell-inspiron-14-5430.jpg"], Average_rating: 4.4, Total_reviews: 62, Status: "on_sale", Discount: 12, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { CPU: "Intel Core i5-1335U", GPU: "Intel Iris Xe Graphics", RAM: "16GB DDR4", Storage: "512GB SSD PCIe", Screen_Size: "14 inch", Battery: "54Wh", Weight: "1.55 kg", Refresh_Rate: "60Hz", Resolution: "1920x1200 FHD+", OS: "Windows 11 Home", Usage_Type: "Lập trình, Phân tích số liệu, Học tập", User_Segment: "Sinh viên Hệ thống thông tin, BA", Performance_Level: "Trung bình - Cao", Portability: "Cao", Gaming_Support: "Không", AI_Tag: "dell-inspiron, ram-16gb, lập-trình, tỷ-lệ-16-10" }
    },
    variants: [{ Product_variant_id: "VAR_086", Variant_name: "16GB / 512GB - Silver", Attributes: { Color: "Silver", RAM: "16GB", Storage: "512GB" }, Price: 17990000, Stock_quantity: 20 }]
  },
  {
    product: {
      Product_id: "PRD_035", Category_id: "CAT_001", Brand_id: "BRD_005", Product_name: "Lenovo IdeaPad Slim 3 15AMN8",
      Description: "Sự kết hợp hoàn hảo giữa thiết kế mỏng nhẹ tinh tế và độ bền bỉ cơ học vượt trội đạt tiêu chuẩn quân đội khắt khe MIL-STD-810H. Máy tích hợp dòng vi xử lý AMD Ryzen 5 thế hệ mới tối ưu lượng điện tiêu thụ cực tốt, kéo dài thời lượng pin phục vụ trọn vẹn một ngày dài học nhóm bên ngoài.",
      Images: ["lenovo-ideapad-slim-3.jpg"], Average_rating: 4.3, Total_reviews: 91, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { CPU: "AMD Ryzen 5 7520U", GPU: "AMD Radeon 610M", RAM: "8GB LPDDR5", Storage: "512GB SSD NVMe", Screen_Size: "15.6 inch", Battery: "47Wh (~9 giờ)", Weight: "1.55 kg", Refresh_Rate: "60Hz", Resolution: "1920x1080 FHD IPS", OS: "Windows 11 Home", Usage_Type: "Học tập, Xem phim, Tác vụ văn phòng", User_Segment: "Học sinh, Sinh viên phổ thông", Performance_Level: "Trung bình", Portability: "Cao", Gaming_Support: "Không", AI_Tag: "lenovo-slim, bền-quân-đội, pin-tốt, giá-rẻ" }
    },
    variants: [{ Product_variant_id: "VAR_087", Variant_name: "8GB / 512GB - Arctic Grey", Attributes: { Color: "Arctic Grey", RAM: "8GB", Storage: "512GB" }, Price: 12490000, Stock_quantity: 35 }]
  },

  // ============================================================
  // SMARTPHONE (CAT_002) - 10 sản phẩm
  // ============================================================
  {
    product: {
      Product_id: "PRD_009", Category_id: "CAT_002", Brand_id: "BRD_001", Product_name: "Apple iPhone 16 Pro Max",
      Description: "Flagship cao cấp nhất của Apple sở hữu lớp vỏ bọc bằng chất liệu Titanium bền nhẹ cấp độ vũ trụ. Chip xử lý A18 Pro kiến tạo sức mạnh xử lý các mô hình AI cục bộ cực nhanh, kết hợp nút bấm quay phim chuyên dụng và hệ thống ống kính zoom quang học 5x sắc nét tuyệt hảo.",
      Images: ["iphone-16-promax-black.jpg", "iphone-16-promax-desert.jpg"], Average_rating: 4.9, Total_reviews: 312, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Chipset: "Apple A18 Pro 6-core", RAM: "8GB", ROM: "256GB", Camera: "48MP + 48MP + 12MP (Sau), 12MP (Trước)", Battery: "4685 mAh", Screen_Type: "Super Retina XDR OLED", Refresh_Rate: "120Hz ProMotion", Display_Size: "6.9 inch", OS: "iOS 18", Usage_Type: "Chụp ảnh Pro, Quay video 4K, Đa năng cao cấp", User_Segment: "Người dùng cao cấp, Creator", Performance_Level: "Flagship", Portability: "Rất cao", Gaming_Support: "Có", AI_Tag: "iphone, flagship, titanium, camera-control, apple-ai" }
    },
    variants: [
      { Product_variant_id: "VAR_024", Variant_name: "256GB - Titanium Black", Attributes: { Color: "Titanium Black", Storage: "256GB" }, Price: 34990000, Stock_quantity: 35 },
      { Product_variant_id: "VAR_025", Variant_name: "512GB - Desert Titanium", Attributes: { Color: "Desert Titanium", Storage: "512GB" }, Price: 39990000, Stock_quantity: 20 }
    ]
  },
  {
    product: {
      Product_id: "PRD_010", Category_id: "CAT_002", Brand_id: "BRD_001", Product_name: "Apple iPhone 16",
      Description: "Chiếc iPhone thế hệ mới sở hữu ngôn ngữ thiết kế camera dọc độc đáo hỗ trợ quay video không gian Spatial Video. Tích hợp phím Camera Control cảm ứng lực thông minh và dòng vi xử lý chip A18 băng thông cao, sẵn sàng phục vụ toàn bộ các tính năng trợ lý ảo thông minh.",
      Images: ["iphone-16-black.jpg", "iphone-16-teal.jpg"], Average_rating: 4.7, Total_reviews: 241, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Chipset: "Apple A18 6-core", RAM: "8GB", ROM: "128GB", Camera: "48MP + 12MP (Sau), 12MP (Trước)", Battery: "3561 mAh", Screen_Type: "Super Retina XDR OLED", Refresh_Rate: "60Hz", Display_Size: "6.1 inch", OS: "iOS 18", Usage_Type: "Mạng xã hội, Chụp hình, Giải trí hằng ngày", User_Segment: "Giới trẻ, Sinh viên, Người dùng Apple", Performance_Level: "Cao", Portability: "Rất cao", Gaming_Support: "Có", AI_Tag: "iphone-16, apple-intelligence, camera-control, gọn-nhẹ" }
    },
    variants: [{ Product_variant_id: "VAR_029", Variant_name: "128GB - Black", Attributes: { Color: "Black", Storage: "128GB" }, Price: 22990000, Stock_quantity: 45 }]
  },
  {
    product: {
      Product_id: "PRD_011", Category_id: "CAT_002", Brand_id: "BRD_007", Product_name: "Samsung Galaxy S25 Ultra",
      Description: "Siêu phẩm tối cao của thế giới Android nổi bật với thiết kế vuông vức nam tính và màn hình phẳng Dynamic AMOLED 2X rực rỡ chống lóa. Trọng tâm cốt lõi nằm ở hệ thống camera zoom viễn vọng phân giải khủng 200MP và tính năng trợ lý ảo hỗ trợ dịch thuật trực tiếp.",
      Images: ["samsung-s25-ultra-titanium-black.jpg"], Average_rating: 4.8, Total_reviews: 198, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Chipset: "Snapdragon 8 Elite 8-core", RAM: "12GB", ROM: "256GB", Camera: "200MP + 50MP + 50MP + 10MP (Sau), 12MP (Trước)", Battery: "5000 mAh", Screen_Type: "Dynamic AMOLED 2X", Refresh_Rate: "120Hz", Display_Size: "6.9 inch", OS: "Android 15, One UI 7", Usage_Type: "Đa nhiệm hiệu suất, Chụp ảnh zoom, Ghi chú S-Pen", User_Segment: "Doanh nhân, Tín đồ Android, Chuyên gia", Performance_Level: "Flagship", Portability: "Cao", Gaming_Support: "Có", AI_Tag: "samsung-ultra, galaxy-ai, s-pen, camera-200mp" }
    },
    variants: [{ Product_variant_id: "VAR_034", Variant_name: "12GB / 256GB - Titanium Black", Attributes: { Color: "Titanium Black", RAM: "12GB", Storage: "256GB" }, Price: 31990000, Stock_quantity: 28 }]
  },
  {
    product: {
      Product_id: "PRD_012", Category_id: "CAT_002", Brand_id: "BRD_007", Product_name: "Samsung Galaxy A55 5G",
      Description: "Dòng sản phẩm smartphone tầm trung xuất sắc sở hữu khung viền kim loại cứng cáp tinh xảo và mặt lưng kính bóng bẩy. Máy được trang bị hệ thống tản nhiệt buồng hơi lớn giúp tối ưu hiệu năng chơi game ổn định trên nền mạng di động 5G tốc độ cao.",
      Images: ["samsung-a55-awesome-navy.jpg"], Average_rating: 4.4, Total_reviews: 276, Status: "on_sale", Discount: 20, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Chipset: "Exynos 1480 8-core", RAM: "8GB", ROM: "128GB", Camera: "50MP + 12MP + 5MP (Sau), 32MP (Trước)", Battery: "5000 mAh", Screen_Type: "Super AMOLED", Refresh_Rate: "120Hz", Display_Size: "6.6 inch", OS: "Android 14, One UI 6.1", Usage_Type: "Giải trí, Chụp ảnh du lịch, Xem phim", User_Segment: "Sinh viên, Người dùng phổ thông", Performance_Level: "Trung bình - Cao", Portability: "Rất cao", Gaming_Support: "Có", AI_Tag: "samsung-a55, pin-trâu, màn-120hz, giá-tầm-trung" }
    },
    variants: [{ Product_variant_id: "VAR_038", Variant_name: "8GB / 128GB - Awesome Navy", Attributes: { Color: "Awesome Navy", RAM: "8GB", Storage: "128GB" }, Price: 9990000, Stock_quantity: 50 }]
  },
  {
    product: {
      Product_id: "PRD_013", Category_id: "CAT_002", Brand_id: "BRD_008", Product_name: "Xiaomi 14T Pro",
      Description: "Flagship killer chuyên trị nhiếp ảnh đường phố nhờ sự hợp tác thấu kính độc quyền cùng hãng camera Leica danh tiếng. Sở hữu tấm nền màn hình tần số quét khủng 144Hz siêu mượt và công nghệ sạc pin HyperCharge thần tốc công suất lên tới 120W.",
      Images: ["xiaomi-14t-pro-black-titanium.jpg"], Average_rating: 4.6, Total_reviews: 143, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Chipset: "MediaTek Dimensity 9300+ 8-core", RAM: "12GB", ROM: "256GB", Camera: "50MP (Leica) + 50MP + 12MP (Sau), 32MP (Trước)", Battery: "5000 mAh (Sạc 120W)", Screen_Type: "AMOLED 1.5K", Refresh_Rate: "144Hz", Display_Size: "6.67 inch", OS: "Android 14, HyperOS", Usage_Type: "Nhiếp ảnh Leica, Chiến game cấu hình cao, Sạc nhanh", User_Segment: "Tín đồ công nghệ, Gen Z cá tính", Performance_Level: "Rất cao", Portability: "Rất cao", Gaming_Support: "Có", AI_Tag: "xiaomi, ống-kính-leica, sạc-120w, màn-144hz" }
    },
    variants: [{ Product_variant_id: "VAR_041", Variant_name: "12GB / 256GB - Black Titanium", Attributes: { Color: "Black Titanium", RAM: "12GB", Storage: "256GB" }, Price: 15990000, Stock_quantity: 30 }]
  },
  {
    product: {
      Product_id: "PRD_014", Category_id: "CAT_002", Brand_id: "BRD_009", Product_name: "OPPO Reno 12 Pro 5G",
      Description: "Được mệnh danh là chuyên gia chụp ảnh chân dung thế hệ mới tích hợp sâu các thuật toán AI thông minh độc quyền giúp tự động xóa vật thể thừa, chỉnh sửa ảnh nhắm mắt khi chụp tập thể và tối ưu hóa bắt sóng di động thông minh.",
      Images: ["oppo-reno12-pro-sunset-gold.jpg"], Average_rating: 4.3, Total_reviews: 97, Status: "on_sale", Discount: 15, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Chipset: "MediaTek Dimensity 7300 Energy", RAM: "12GB", ROM: "256GB", Camera: "50MP + 50MP + 8MP (Sau), 50MP AI (Trước)", Battery: "5000 mAh (Sạc 80W)", Screen_Type: "AMOLED cong 3D", Refresh_Rate: "120Hz", Display_Size: "6.7 inch", OS: "Android 14, ColorOS 14", Usage_Type: "Chụp ảnh chân dung, Selfie nét cao, Thiết kế mỏng nhẹ", User_Segment: "Gen Z yêu chụp ảnh, Phái đẹp", Performance_Level: "Trung bình - Cao", Portability: "Rất cao", Gaming_Support: "Có", AI_Tag: "oppo-reno, chuyên-gia-chân-dung, ai-retouch, thiết-kế-đẹp" }
    },
    variants: [{ Product_variant_id: "VAR_044", Variant_name: "12GB / 256GB - Sunset Gold", Attributes: { Color: "Sunset Gold", RAM: "12GB", Storage: "256GB" }, Price: 13490000, Stock_quantity: 25 }]
  },
  {
    product: {
      Product_id: "PRD_036", Category_id: "CAT_002", Brand_id: "BRD_010", Product_name: "Vivo V40 Pro 5G",
      Description: "Điện thoại tập trung toàn diện vào trải nghiệm camera cao cấp đồng thiết kế cùng thấu kính ZEISS danh tiếng, mang lại hiệu ứng chụp ảnh chân dung xóa phông bokeh nghệ thuật chân thực như trên máy ảnh chuyên dụng.",
      Images: ["vivo-v40-pro-blue.jpg"], Average_rating: 4.5, Total_reviews: 58, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Chipset: "MediaTek Dimensity 9200+ 8-core", RAM: "12GB", ROM: "512GB", Camera: "50MP (ZEISS) + 50MP + 50MP (Sau), 50MP (Trước)", Battery: "5500 mAh", Screen_Type: "AMOLED 120Hz", Refresh_Rate: "120Hz", Display_Size: "6.78 inch", OS: "Android 14, Funtouch OS 14", Usage_Type: "Chụp ảnh chân dung nghệ thuật, Lưu trữ dung lượng lớn", User_Segment: "Người dùng đam mê nhiếp ảnh di động", Performance_Level: "Cao", Portability: "Rất cao", Gaming_Support: "Có", AI_Tag: "vivo-v40, camera-zeiss, bộ-nhớ-512gb, pin-khủng" }
    },
    variants: [{ Product_variant_id: "VAR_088", Variant_name: "12GB / 512GB - Meteor Blue", Attributes: { Color: "Meteor Blue", RAM: "12GB", Storage: "512GB" }, Price: 16990000, Stock_quantity: 15 }]
  },
  {
    product: {
      Product_id: "PRD_037", Category_id: "CAT_002", Brand_id: "BRD_001", Product_name: "Apple iPhone 15 128GB",
      Description: "Sự lựa chọn kinh tế tối ưu trong hệ sinh thái Apple sở hữu tính năng Dynamic Island biến đổi thông minh, cổng sạc kết nối chuẩn USB-C hiện đại tiện lợi và cụm ống kính camera chính nâng cấp vượt bậc lên độ phân giải 48MP.",
      Images: ["iphone-15-black.jpg"], Average_rating: 4.6, Total_reviews: 189, Status: "on_sale", Discount: 25, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Chipset: "Apple A16 Bionic 6-core", RAM: "6GB", ROM: "128GB", Camera: "48MP + 12MP (Sau), 12MP TrueDepth (Trước)", Battery: "3349 mAh", Screen_Type: "Super Retina XDR OLED", Refresh_Rate: "60Hz", Display_Size: "6.1 inch", OS: "iOS 17 (Lên được iOS 18)", Usage_Type: "Sử dụng hằng ngày, Quay vlog, Gọn nhẹ tối giản", User_Segment: "Người dùng tìm kiếm iPhone giá tốt", Performance_Level: "Cao", Portability: "Rất cao", Gaming_Support: "Có", AI_Tag: "iphone-15, dynamic-island, cổng-typec, giá-hợp-lý" }
    },
    variants: [{ Product_variant_id: "VAR_089", Variant_name: "128GB - Black", Attributes: { Color: "Black", RAM: "6GB", Storage: "128GB" }, Price: 19990000, Stock_quantity: 22 }]
  },
  {
    product: {
      Product_id: "PRD_038", Category_id: "CAT_002", Brand_id: "BRD_007", Product_name: "Samsung Galaxy Z Fold6",
      Description: "Thiết bị điện thoại màn hình gập đỉnh cao định hình lại phong cách làm việc di động. Bản lề Flex cơ khí khép kín tinh xảo cho độ mỏng ấn tượng, mở ra không gian hiển thị rộng lớn như máy tính bảng tối ưu hóa đa nhiệm nhiều ứng dụng.",
      Images: ["samsung-z-fold6-silver.jpg"], Average_rating: 4.7, Total_reviews: 42, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Chipset: "Snapdragon 8 Gen 3 for Galaxy", RAM: "12GB", ROM: "512GB", Camera: "50MP + 12MP + 10MP (Sau), 10MP + 4MP dưới màn hình", Battery: "4400 mAh", Screen_Type: "Dynamic AMOLED 2X Gập", Refresh_Rate: "120Hz LTPO", Display_Size: "7.6 inch (Mở ra), 6.3 inch (Đóng lại)", OS: "Android 14, One UI 6.1.1", Usage_Type: "Đa nhiệm văn phòng chuyên sâu, Ghi chú nhanh, Khẳng định vị thế", User_Segment: "Doanh nhân, Lãnh đạo, Tech-guy đam mê cơ khí", Performance_Level: "Flagship", Portability: "Trung bình", Gaming_Support: "Có", AI_Tag: "samsung-fold, màn-hình-gập, đa-nhiệm-văn-phòng, đẳng-cấp" }
    },
    variants: [{ Product_variant_id: "VAR_090", Variant_name: "12GB / 512GB - Elegant Silver", Attributes: { Color: "Elegant Silver", RAM: "12GB", Storage: "512GB" }, Price: 43990000, Stock_quantity: 10 }]
  },
  {
    product: {
      Product_id: "PRD_039", Category_id: "CAT_002", Brand_id: "BRD_008", Product_name: "Xiaomi Redmi Note 13 Pro 4G",
      Description: "Ông vua doanh số phân khúc smartphone phổ thông sở hữu cụm camera thông số siêu cao 200MP chống rung quang học OSL sắc nét, tấm nền AMOLED viền mỏng 120Hz mượt mà mang lại không gian giải trí cày game tuyệt vời trong tầm giá.",
      Images: ["xiaomi-redmi-note13-pro-black.jpg"], Average_rating: 4.5, Total_reviews: 310, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Chipset: "MediaTek Helio G99-Ultra", RAM: "8GB", ROM: "128GB", Camera: "200MP + 8MP + 2MP (Sau), 16MP (Trước)", Battery: "5000 mAh (Sạc nhanh 67W)", Screen_Type: "AMOLED 120Hz", Refresh_Rate: "120Hz", Display_Size: "6.67 inch", OS: "Android 13, MIUI 14", Usage_Type: "Chơi game MOBA phổ thông, Chụp ảnh nét, Pin sạc nhanh", User_Segment: "Học sinh, Sinh viên đại trà, Tài xế công nghệ", Performance_Level: "Trung bình", Portability: "Rất cao", Gaming_Support: "Có", AI_Tag: "redmi-note, camera-200mp, giá-sinh-viên, sạc-67w" }
    },
    variants: [{ Product_variant_id: "VAR_091", Variant_name: "8GB / 128GB - Midnight Black", Attributes: { Color: "Midnight Black", RAM: "8GB", Storage: "128GB" }, Price: 5990000, Stock_quantity: 60 }]
  },

  // ============================================================
  // TABLET (CAT_003) - 10 sản phẩm
  // ============================================================
  {
    product: {
      Product_id: "PRD_015", Category_id: "CAT_003", Brand_id: "BRD_001", Product_name: "Apple iPad Pro M4 13 inch 2024",
      Description: "Thiết bị máy tính bảng mỏng nhất lịch sử Apple, mang trong mình sức mạnh xử lý phần cứng vượt trội từ chip M4 thế hệ mới và tấm nền công nghệ màn hình tối tân Ultra Retina XDR OLED Tandem xếp chồng hai lớp siêu sáng.",
      Images: ["ipad-pro-m4-13-silver.jpg"], Average_rating: 4.9, Total_reviews: 68, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Chipset: "Apple M4 9-core", RAM: "8GB Architecture", ROM: "256GB NVMe", Camera: "12MP Rộng + Cảm biến LiDAR (Sau), 12MP Siêu rộng (Trước)", Battery: "40.88Wh (~10 giờ)", Screen_Type: "Ultra Retina XDR OLED Tandem", Refresh_Rate: "120Hz ProMotion", Display_Size: "13.0 inch", OS: "iPadOS 17 (Lên được iPadOS 18)", Usage_Type: "Vẽ minh họa chuyên nghiệp, Thiết kế đồ họa, Biên tập Video", User_Segment: "Họa sĩ kỹ thuật số, Designer chuyên nghiệp, Giới thượng lưu", Performance_Level: "Đỉnh cao", Gaming_Support: "Có", AI_Tag: "ipad-pro, m4, oled-tandem, apple-pencil-pro, vẽ-đồ-họa" }
    },
    variants: [{ Product_variant_id: "VAR_046", Variant_name: "256GB Wi-Fi - Silver", Attributes: { Color: "Silver", Storage: "256GB", Connectivity: "Wi-Fi" }, Price: 31990000, Stock_quantity: 15 }]
  },
  {
    product: {
      Product_id: "PRD_016", Category_id: "CAT_003", Brand_id: "BRD_001", Product_name: "Apple iPad Air M2 11 inch",
      Description: "Sự cân bằng hoàn mĩ giữa giá thành đầu tư và hiệu năng xử lý phần cứng nhờ trang bị con chip M2 mạnh mẽ, tương thích hoàn toàn chiếc bút cảm ứng thông minh Apple Pencil Pro phục vụ hoàn hảo các nhu cầu học tập, vẽ phác thảo ghi chú bài giảng.",
      Images: ["ipad-air-m2-11-starlight.jpg"], Average_rating: 4.7, Total_reviews: 112, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Chipset: "Apple M2 8-core", RAM: "8GB Architecture", ROM: "128GB", Camera: "12MP (Sau), 12MP Siêu rộng đặt cạnh ngang (Trước)", Battery: "28.93Wh (~10 giờ)", Screen_Type: "Liquid Retina IPS LCD", Refresh_Rate: "60Hz", Display_Size: "11.0 inch", OS: "iPadOS 17", Usage_Type: "Ghi chú học tập, Vẽ phác thảo, Xem bài giảng đa nhiệm", User_Segment: "Sinh viên đại học, Nhân viên văn phòng năng động", Performance_Level: "Cao", Gaming_Support: "Có", AI_Tag: "ipad-air, chip-m2, học-tập, ghi-chú, vẽ-vời" }
    },
    variants: [{ Product_variant_id: "VAR_050", Variant_name: "128GB Wi-Fi - Starlight", Attributes: { Color: "Starlight", Storage: "128GB", Connectivity: "Wi-Fi" }, Price: 18990000, Stock_quantity: 25 }]
  },
  {
    product: {
      Product_id: "PRD_017", Category_id: "CAT_003", Brand_id: "BRD_007", Product_name: "Samsung Galaxy Tab S10+ 5G",
      Description: "Chiếc máy tính bảng Android cao cấp mở rộng tối đa năng suất làm việc nhờ chiếc bút S-Pen quyền năng tặng kèm sẵn trong hộp, khả năng kháng nước bụi bền bỉ chuẩn IP68 và chế độ giao diện Samsung DeX biến hình linh hoạt như máy tính.",
      Images: ["galaxy-tab-s10plus-moonstone-gray.jpg"], Average_rating: 4.6, Total_reviews: 54, Status: "on_sale", Discount: 10, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Chipset: "Snapdragon 8 Gen 3 for Galaxy", RAM: "12GB", ROM: "256GB", Camera: "13MP + 8MP (Sau), 12MP Siêu rộng (Trước)", Battery: "10090 mAh", Screen_Type: "Dynamic AMOLED 2X", Refresh_Rate: "120Hz", Display_Size: "12.4 inch", OS: "Android 14, One UI 6.1", Usage_Type: "Đa nhiệm văn phòng DeX, Vẽ thiết kế Android, Kháng nước di động", User_Segment: "Kỹ sư công trường, Thiết kế đồ họa Android, BA", Performance_Level: "Rất cao", Gaming_Support: "Có", AI_Tag: "samsung-tab, bút-s-pen, amoled-120hz, kháng-nước-ip68" }
    },
    variants: [{ Product_variant_id: "VAR_054", Variant_name: "12GB / 256GB 5G - Moonstone Gray", Attributes: { Color: "Moonstone Gray", RAM: "12GB", Storage: "256GB", Connectivity: "5G" }, Price: 22990000, Stock_quantity: 12 }]
  },
  {
    product: {
      Product_id: "PRD_018", Category_id: "CAT_003", Brand_id: "BRD_008", Product_name: "Xiaomi Pad 7 Pro",
      Description: "Sản phẩm phá đảo phân khúc tầm trung với cấu hình phần cứng cực khủng vi xử lý Snapdragon 8s Gen 3, tấm nền hiển thị tần số quét 144Hz siêu mượt và hệ thống cấu trúc âm thanh vòm 4 loa lập thể Dolby Atmos sống động.",
      Images: ["xiaomi-pad7-pro-black.jpg"], Average_rating: 4.4, Total_reviews: 78, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Chipset: "Snapdragon 8s Gen 3 8-core", RAM: "8GB", ROM: "256GB", Camera: "50MP (Sau), 32MP (Trước)", Battery: "10100 mAh (Sạc 67W)", Screen_Type: "LCD IPS chuyên nghiệp", Refresh_Rate: "144Hz", Display_Size: "11.2 inch", OS: "Android 14, HyperOS", Usage_Type: "Cày phim chất lượng cao, Chiến game nặng, Pin sạc nhanh", User_Segment: "Game thủ mobile, Giới trẻ cày phim, Sinh viên giải trí", Performance_Level: "Cao", Gaming_Support: "Có", AI_Tag: "xiaomi-pad, màn-144hz, cấu-hình-mạnh, sạc-67w" }
    },
    variants: [{ Product_variant_id: "VAR_057", Variant_name: "8GB / 256GB Wi-Fi - Obsidian Black", Attributes: { Color: "Obsidian Black", RAM: "8GB", Storage: "256GB", Connectivity: "Wi-Fi" }, Price: 10490000, Stock_quantity: 30 }]
  },
  {
    product: {
      Product_id: "PRD_040", Category_id: "CAT_003", Brand_id: "BRD_001", Product_name: "Apple iPad Gen 10 10.9 inch",
      Description: "Chiếc máy tính bảng quốc dân thế hệ mới sở hữu thiết kế vuông vức thời thượng loại bỏ nút Home vật lý, thay thế bằng cổng kết nối Type-C đồng bộ xu hướng hiện đại và dải loa kép lập thể phục vụ hoàn hảo nhu cầu học tập online.",
      Images: ["ipad-gen10-blue.jpg"], Average_rating: 4.5, Total_reviews: 145, Status: "on_sale", Discount: 15, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Chipset: "Apple A14 Bionic 6-core", RAM: "4GB", ROM: "64GB", Camera: "12MP (Sau), 12MP Siêu rộng góc ngang (Trước)", Battery: "28.6Wh (~10 giờ)", Screen_Type: "Liquid Retina IPS LCD", Refresh_Rate: "60Hz", Display_Size: "10.9 inch", OS: "iPadOS 16 (Lên được iPadOS 18)", Usage_Type: "Học trực tuyến, Xem phim giải trí, Đọc tài liệu PDF", User_Segment: "Học sinh, Sinh viên đại trà, Phụ huynh đọc báo", Performance_Level: "Trung bình - Khá", Gaming_Support: "Có", AI_Tag: "ipad-gen-10, cổng-typec, thiết-kế-mới, học-online" }
    },
    variants: [{ Product_variant_id: "VAR_092", Variant_name: "64GB Wi-Fi - Pastel Blue", Attributes: { Color: "Pastel Blue", Storage: "64GB", Connectivity: "Wi-Fi" }, Price: 9990000, Stock_quantity: 40 }]
  },
  {
    product: {
      Product_id: "PRD_041", Category_id: "CAT_003", Brand_id: "BRD_007", Product_name: "Samsung Galaxy Tab A9",
      Description: "Sản phẩm tablet phân khúc phổ thông siêu nhỏ gọn với màn hình 8.7 inch dễ dàng cầm nắm và thao tác bằng một tay tiện lợi, lớp vỏ kim loại nhám chống bám vân tay thích hợp làm quà tặng công nghệ cho trẻ nhỏ hoặc người cao tuổi.",
      Images: ["galaxy-tab-a9-silver.jpg"], Average_rating: 4.2, Total_reviews: 88, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Chipset: "MediaTek Helio G99 8-core", RAM: "4GB", ROM: "64GB", Camera: "8MP (Sau), 2MP (Trước)", Battery: "5100 mAh", Screen_Type: "TFT LCD gọn nhẹ", Refresh_Rate: "60Hz", Display_Size: "8.7 inch", OS: "Android 13, One UI 5.1", Usage_Type: "Đọc báo, Xem video Youtube, Học tiếng Anh trẻ em", User_Segment: "Trẻ em học tập, Phụ huynh lớn tuổi, Tài xế tra bản đồ", Performance_Level: "Cơ bản", Gaming_Support: "Không", AI_Tag: "samsung-tab-a, giá-rẻ, nhỏ-gọn-8.7-inch, đọc-báo" }
    },
    variants: [{ Product_variant_id: "VAR_093", Variant_name: "4GB / 64GB Wi-Fi - Sleek Silver", Attributes: { Color: "Sleek Silver", RAM: "4GB", Storage: "64GB", Connectivity: "Wi-Fi" }, Price: 3490000, Stock_quantity: 50 }]
  },
  {
    product: {
      Product_id: "PRD_042", Category_id: "CAT_003", Brand_id: "BRD_008", Product_name: "Xiaomi Pad 6",
      Description: "Thiết kế nhôm nguyên khối siêu mỏng mang lại diện mạo vô cùng sang trọng, màn hình cao cấp độ phân giải 2.8K siêu mịn tích hợp chip xử lý Snapdragon 870 huyền thoại cực kỳ mát máy và ổn định khi cày game MOBA liên tục nhiều giờ.",
      Images: ["xiaomi-pad6-gold.jpg"], Average_rating: 4.5, Total_reviews: 120, Status: "on_sale", Discount: 18, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Chipset: "Snapdragon 870 8-core", RAM: "8GB", ROM: "128GB", Camera: "13MP (Sau), 8MP (Trước)", Battery: "8840 mAh (Sạc 33W)", Screen_Type: "IPS LCD 2.8K sắc nét", Refresh_Rate: "144Hz", Display_Size: "11.0 inch", OS: "Android 13, MIUI Pad 14", Usage_Type: "Chơi game cày cuốc, Làm việc văn phòng di động, Xem phim nét", User_Segment: "Game thủ Android, Dân công nghệ ưa thông số", Performance_Level: "Cao", Gaming_Support: "Có", AI_Tag: "xiaomi-pad-6, chip-snap-870, màn-2.8k, vỏ-nhôm" }
    },
    variants: [{ Product_variant_id: "VAR_094", Variant_name: "8GB / 128GB Wi-Fi - Luxury Gold", Attributes: { Color: "Luxury Gold", RAM: "8GB", Storage: "128GB", Connectivity: "Wi-Fi" }, Price: 7990000, Stock_quantity: 20 }]
  },
  {
    product: {
      Product_id: "PRD_043", Category_id: "CAT_003", Brand_id: "BRD_005", Product_name: "Lenovo Tab P12",
      Description: "Mở rộng không gian hiển thị thông tin với kích thước màn hình khổng lồ lên đến 12.7 inch chuẩn phân giải 3K. Thiết bị này tối ưu hoàn hảo cho các trải nghiệm chia nhỏ màn hình đọc file tài liệu phân tích biểu đồ hệ thống.",
      Images: ["lenovo-tab-p12-grey.jpg"], Average_rating: 4.4, Total_reviews: 34, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Chipset: "MediaTek Dimensity 7050 8-core", RAM: "8GB", ROM: "128GB", Camera: "13MP (Sau), 12MP Siêu rộng (Trước)", Battery: "10200 mAh", Screen_Type: "LCD LTPS 3K khổng lồ", Refresh_Rate: "60Hz", Display_Size: "12.7 inch", OS: "Android 13", Usage_Type: "Đọc tài liệu Excel, Xem biểu đồ hệ thống, Xem phim loa JBL", User_Segment: "Sinh viên IS, Business Analyst cần đọc file, Quản lý", Performance_Level: "Trung bình - Khá", Gaming_Support: "Không", AI_Tag: "lenovo-tab, màn-khổng-lồ-12.7, loa-jbl, xem-biểu-đồ" }
    },
    variants: [{ Product_variant_id: "VAR_095", Variant_name: "8GB / 128GB Wi-Fi - Storm Grey", Attributes: { Color: "Storm Grey", RAM: "8GB", Storage: "128GB", Connectivity: "Wi-Fi" }, Price: 8990000, Stock_quantity: 15 }]
  },
  {
    product: {
      Product_id: "PRD_044", Category_id: "CAT_003", Brand_id: "BRD_001", Product_name: "Apple iPad Mini 6 Wi-Fi",
      Description: "Sức mạnh hiệu năng xử lý phần cứng khổng lồ từ chip A15 Bionic ẩn giấu bên trong một thân hình nhỏ nhắn vuông vức 8.3 inch vừa vặn hai lòng bàn tay, hỗ trợ bút Apple Pencil 2 hít nam tính bên hông cực kỳ tiện dụng.",
      Images: ["ipad-mini6-spacegrey.jpg"], Average_rating: 4.7, Total_reviews: 95, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Chipset: "Apple A15 Bionic 6-core", RAM: "4GB", ROM: "64GB", Camera: "12MP (Sau), 12MP Siêu rộng góc trung tâm (Trước)", Battery: "19.3Wh (~10 giờ)", Screen_Type: "Liquid Retina IPS", Refresh_Rate: "60Hz", Display_Size: "8.3 inch", OS: "iPadOS 15 (Lên được iOS 18)", Usage_Type: "Chơi game bằng 2 tay, Ghi chú di động, Đọc sách chuyên sâu", User_Segment: "Gamer mobile thích nhỏ gọn, Bác sĩ, Kỹ sư di chuyển", Performance_Level: "Cao", Gaming_Support: "Có", AI_Tag: "ipad-mini, chip-a15, nhỏ-gọn, apple-pencil-2" }
    },
    variants: [{ Product_variant_id: "VAR_096", Variant_name: "64GB Wi-Fi - Space Grey", Attributes: { Color: "Space Grey", Storage: "64GB", Connectivity: "Wi-Fi" }, Price: 12990000, Stock_quantity: 18 }]
  },
  {
    product: {
      Product_id: "PRD_045", Category_id: "CAT_003", Brand_id: "BRD_007", Product_name: "Samsung Galaxy Tab S9 FE",
      Description: "Phiên bản Fan Edition cao cấp nhưng sở hữu mức giá vô cùng hợp lý, kế thừa trọn vẹn khả năng chống nước, chống bụi bẩn tuyệt hảo chuẩn IP68 và chiếc bút S-Pen ghi chú thông minh đi kèm sẵn sàng phục vụ học tập.",
      Images: ["galaxy-tab-s9fe-mint.jpg"], Average_rating: 4.5, Total_reviews: 67, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Chipset: "Exynos 1380 8-core", RAM: "6GB", ROM: "128GB", Camera: "8MP (Sau), 12MP Siêu rộng (Trước)", Battery: "8000 mAh (Sạc 45W)", Screen_Type: "IPS LCD hiển thị chuẩn màu", Refresh_Rate: "90Hz", Display_Size: "10.9 inch", OS: "Android 14, One UI 6", Usage_Type: "Học tập vẽ minh họa, Ghi chú ngoài trời, Kháng nước an toàn", User_Segment: "Sinh viên mỹ thuật, Học sinh học tập di động", Performance_Level: "Trung bình - Cao", Gaming_Support: "Có", AI_Tag: "samsung-fe, bút-s-pen, kháng-nước-ip68, màn-90hz" }
    },
    variants: [{ Product_variant_id: "VAR_097", Variant_name: "6GB / 128GB Wi-Fi - Mint Green", Attributes: { Color: "Mint Green", RAM: "6GB", Storage: "128GB", Connectivity: "Wi-Fi" }, Price: 9990000, Stock_quantity: 25 }]
  },

  // ============================================================
  // THIẾT BỊ ÂM THANH (CAT_004) - 10 sản phẩm
  // ============================================================
  {
    product: {
      Product_id: "PRD_019", Category_id: "CAT_004", Brand_id: "BRD_012", Product_name: "Sony WH-1000XM5",
      Description: "Tai nghe chụp tai Bluetooth sở hữu công nghệ cấu trúc chống ồn chủ động thông minh hàng đầu thế giới cản sạch mọi tạp âm cuộc sống, tích hợp âm thanh độ phân giải cao Hi-Res Audio mang lại trải nghiệm âm nhạc tinh khiết.",
      Images: ["sony-wh1000xm5-black.jpg"], Average_rating: 4.8, Total_reviews: 187, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Type: "Tai nghe chụp tai Over-ear", Driver: "30mm Neodymium tinh chỉnh", Frequency: "4Hz - 40000Hz", ANC: "Chống ồn chủ động Adaptive ANC thông minh", Battery: "30 giờ bật ANC (Sạc nhanh 3 phút dùng 3 giờ)", Connectivity: "Bluetooth 5.2, Jack 3.5mm đa điểm", Microphone: "8 Micro tích hợp thuật toán AI lọc gió", Weight: "250g", Usage_Type: "Nghe nhạc Hi-Fi, Cách âm làm việc văn phòng, Đi máy bay", User_Segment: "Audiophile, Người làm việc tập trung, Doanh nhân", Performance_Level: "Premium Cao cấp", AI_Tag: "tai-nghe-sony, chống-ồn-đỉnh-cao, hi-res-audio, pin-30-giờ" }
    },
    variants: [{ Product_variant_id: "VAR_060", Variant_name: "Midnight Black", Attributes: { Color: "Midnight Black" }, Price: 8490000, Stock_quantity: 35 }]
  },
  {
    product: {
      Product_id: "PRD_020", Category_id: "CAT_004", Brand_id: "BRD_011", Product_name: "JBL Tune 770NC",
      Description: "Tai nghe chụp tai Bluetooth sở hữu chất âm bass dày dặn uy lực JBL Pure Bass đặc trưng. Thiết kế đệm tai mềm mại có thể gập gọn gàng cùng thời lượng pin bền bỉ ấn tượng lên đến 44 giờ nghe nhạc liên tục khi bật chống ồn.",
      Images: ["jbl-tune770nc-black.jpg"], Average_rating: 4.4, Total_reviews: 134, Status: "on_sale", Discount: 30, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Type: "Tai nghe chụp tai Over-ear", Driver: "40mm Driver động", Frequency: "20Hz - 20000Hz", ANC: "Chống ồn chủ động ANC cơ bản", Battery: "44 giờ bật ANC (70 giờ tắt ANC)", Connectivity: "Bluetooth 5.3, Hỗ trợ dây 3.5mm", Microphone: "1 Mic đàm thoại rõ ràng", Weight: "220g", Usage_Type: "Nghe nhạc trẻ bass mạnh, Học online, Giải trí hằng ngày", User_Segment: "Sinh viên, Người dùng phổ thông chuộng Bass", Performance_Level: "Tầm trung giá tốt", AI_Tag: "tai-nghe-jbl, jbl-pure-bass, pin-trâu-44h, giá-sinh-viên" }
    },
    variants: [{ Product_variant_id: "VAR_062", Variant_name: "Matte Black", Attributes: { Color: "Matte Black" }, Price: 2490000, Stock_quantity: 50 }]
  },
  {
    product: {
      Product_id: "PRD_021", Category_id: "CAT_004", Brand_id: "BRD_014", Product_name: "HyperX Cloud Alpha Wireless",
      Description: "Tai nghe gaming chụp tai không dây sở hữu thời lượng pin kỷ lục thế giới lên tới 300 giờ chỉ với một lần sạc đầy. Màng loa buồng đôi Dual Chamber độc quyền bóc tách chi tiết âm thanh chân thực giúp game thủ định vị tiếng bước chân.",
      Images: ["hyperx-cloud-alpha-wireless-black-red.jpg"], Average_rating: 4.7, Total_reviews: 89, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Type: "Tai nghe Gaming chụp tai không dây", Driver: "50mm Buồng đôi Dual Chamber", Frequency: "15Hz - 21000Hz", ANC: "Không có cách âm chủ động", Battery: "300 giờ sử dụng liên tục (Kỷ lục thế giới)", Connectivity: "Không dây Wireless 2.4GHz qua USB Dongle độ trễ 0", Microphone: "Micro tháo rời có mút lọc khử tạp âm nền", Weight: "335g", Usage_Type: "Chơi game bắn súng FPS, Livestream game, Cày giải đấu", User_Segment: "Gamer PC chuyên nghiệp, Streamer game", Performance_Level: "Chuyên nghiệp", AI_Tag: "tai-nghe-gaming, pin-300-giờ, không-trễ-2.4ghz, định-vị-âm-thanh" }
    },
    variants: [{ Product_variant_id: "VAR_065", Variant_name: "Black Red - Pro Edition", Attributes: { Color: "Black Red" }, Price: 3990000, Stock_quantity: 25 }]
  },
  {
    product: {
      Product_id: "PRD_022", Category_id: "CAT_004", Brand_id: "BRD_011", Product_name: "JBL Charge 5 Wi-Fi",
      Description: "Loa Bluetooth di động ngoài trời bền bỉ tích hợp công nghệ kháng nước, kháng bụi bẩn chuẩn IP67 cực tốt. Phiên bản nâng cấp Wi-Fi hỗ trợ truyền tải nhạc chất lượng cao Lossless và tính năng kết nối đa loa AirPlay tiện lợi.",
      Images: ["jbl-charge5-wifi-black.jpg"], Average_rating: 4.6, Total_reviews: 98, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Type: "Loa di động không dây Bluetooth + Wi-Fi", Driver: "Woofer hình đường đua 52x90mm + Tweeter 20mm", Frequency: "60Hz - 20000Hz", ANC: "Không có", Battery: "20 giờ nghe nhạc liên tục (Tích hợp sạc ngược Powerbank)", Connectivity: "Bluetooth 5.3, Wi-Fi băng tần kép, AirPlay 2", WaterResistance: "Chống nước bụi chuẩn IP67 tuyệt đối", Microphone: "Không tích hợp micro", Weight: "960g", Usage_Type: "Tiệc tùng bể bơi, Du lịch ngoài trời, Loa phát nhạc gia đình", User_Segment: "Người dùng năng động, Giới trẻ thích tụ tập dã ngoại", Performance_Level: "Cao cấp di động", AI_Tag: "loa-jbl, chống-nước-ip67, loa-wifi, kiêm-sạc-dự-phòng" }
    },
    variants: [{ Product_variant_id: "VAR_066", Variant_name: "Graphite Black", Attributes: { Color: "Graphite Black" }, Price: 3990000, Stock_quantity: 30 }]
  },
  {
    product: {
      Product_id: "PRD_023", Category_id: "CAT_004", Brand_id: "BRD_013", Product_name: "Logitech Blue Yeti USB Microphone",
      Description: "Microphone kết nối USB tiêu chuẩn công nghiệp dành riêng cho giới Streamer, Podcaster chuyên nghiệp. Hệ thống 3 viên nang tụ điện độc quyền hỗ trợ linh hoạt 4 chế độ thu âm khác nhau mang lại dải giọng nói rõ nét hoàn hảo.",
      Images: ["logitech-blue-yeti-blackout.jpg"], Average_rating: 4.5, Total_reviews: 76, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Type: "Microphone thu âm USB ngưng tụ (Condenser)", Driver: "3 viên nang tụ điện 14mm độc quyền Blue", Frequency: "20Hz - 20000Hz", SampleRate: "48kHz / 16-bit độ nét cao", Connectivity: "Dây cáp kết nối USB, cổng tai nghe 3.5mm monitor không trễ", Pattern: "4 chế độ: Cardioid (Đơn hướng), Omnidirectional (Đa hướng), Figure-8 (Hai chiều), Stereo", Weight: "1200g tính cả đế đứng", Usage_Type: "Thu âm Podcast, Livestream game, Ghi âm giọng đọc ASMR", User_Segment: "Streamer, Podcaster, Nhà sáng tạo nội dung", Performance_Level: "Tiêu chuẩn studio", AI_Tag: "micro-thu-âm, logitech-yeti, cắm-là-chạy, podcast-stream" }
    },
    variants: [{ Product_variant_id: "VAR_068", Variant_name: "Blackout Edition", Attributes: { Color: "Blackout" }, Price: 3290000, Stock_quantity: 20 }]
  },
  {
    product: {
      Product_id: "PRD_046", Category_id: "CAT_004", Brand_id: "BRD_012", Product_name: "Sony WF-1000XM5 True Wireless",
      Description: "Tai nghe nhét tai không dây sở hữu chip xử lý chống ồn V2 độc quyền cản sạch tạp âm đường phố. Màng loa Dynamic Driver X rộng tái tạo dải âm treble cực trong trẻo, vocal chân thực cùng cảm biến truyền xương đàm thoại đỉnh cao.",
      Images: ["sony-wf1000xm5-black.jpg"], Average_rating: 4.7, Total_reviews: 110, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Type: "Tai nghe nhét tai True Wireless in-ear", Driver: "Dynamic Driver X công nghệ mới độc quyền", Frequency: "20Hz - 40000Hz (Hi-Res Wireless)", ANC: "Chống ồn chủ động đỉnh cao tích hợp chip xử lý V2", Battery: "8 giờ tai nghe + 16 giờ hộp sạc (Có sạc không dây Qi)", Connectivity: "Bluetooth 5.3, Hỗ trợ codec LDAC truyền nhạc chất lượng cao", Microphone: "6 Mic chống ồn + Cảm biến truyền xương nhạy giọng nói", Weight: "5.9g mỗi bên tai", Usage_Type: "Nghe nhạc chất lượng cao di động, Đàm thoại công việc, Tập thể thao", User_Segment: "Doanh nhân văn phòng, Người yêu nhạc chất lượng cao", Performance_Level: "Flagship True Wireless", AI_Tag: "tai-nghe-nhét-tai, sony-wf, chống-ồn-đỉnh, truyền-xương" }
    },
    variants: [{ Product_variant_id: "VAR_098", Variant_name: "Piano Black", Attributes: { Color: "Piano Black" }, Price: 5990000, Stock_quantity: 24 }]
  },
  {
    product: {
      Product_id: "PRD_047", Category_id: "CAT_004", Brand_id: "BRD_011", Product_name: "JBL Live Pro 2 True Wireless",
      Description: "Tai nghe nhét tai không dây hình cuống thời trang ôm khít ống tai êm ái. Tích hợp công nghệ chống ồn tự thích ứng môi trường True Adaptive ANC và cấu trúc 6 micro thu âm chùm tia giúp mọi cuộc gọi hội thoại công việc sắc nét hoàn hảo.",
      Images: ["jbl-live-pro2-silver.jpg"], Average_rating: 4.5, Total_reviews: 74, Status: "on_sale", Discount: 25, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Type: "Tai nghe nhét tai True Wireless in-ear", Driver: "11mm Driver động chất âm mãnh liệt", Frequency: "20Hz - 20000Hz", ANC: "True Adaptive ANC tự thích ứng môi trường thông minh", Battery: "10 giờ tai nghe + 30 giờ hộp sạc tổng cộng 40h", Connectivity: "Bluetooth 5.2 kết nối đa điểm chuyển đổi thiết bị nhanh", Microphone: "6 Micro chùm tia lọc tạp âm đàm thoại sắc nét", Weight: "4.8g mỗi bên tai", Usage_Type: "Họp hành trực tuyến, Nghe nhạc tập gym năng động, Gọi điện thoại", User_Segment: "Nhân viên văn phòng, Người họp hành nhiều, Sinh viên", Performance_Level: "Tầm trung cao cấp", AI_Tag: "jbl-live, chống-ồn-tự-động, đàm-thoại-6-mic, pin-40-giờ" }
    },
    variants: [{ Product_variant_id: "VAR_099", Variant_name: "Liquid Silver", Attributes: { Color: "Liquid Silver" }, Price: 2990000, Stock_quantity: 30 }]
  },
  {
    product: {
      Product_id: "PRD_048", Category_id: "CAT_004", Brand_id: "BRD_001", Product_name: "Apple AirPods Pro 2 Type-C",
      Description: "Tai nghe không dây phân khúc cao cấp nhất của Apple trang bị chip H2 tối tân nâng cấp cơ chế cản tiếng ồn gấp 2 lần. Hộp sạc tích hợp cổng loa phát âm thanh tìm kiếm Find My tiện lợi và chuẩn sạc kết nối Type-C đồng bộ thời đại.",
      Images: ["apple-airpods-pro2-typec.jpg"], Average_rating: 4.8, Total_reviews: 215, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Type: "Tai nghe nhét tai True Wireless in-ear", Driver: "Driver Apple độ biến dạng thấp tùy chỉnh", Frequency: "Băng thông rộng thích ứng âm học thông minh", ANC: "Chống ồn chủ động ANC chip H2 tăng hiệu năng gấp đôi", Battery: "6 giờ tai nghe + 24 giờ hộp sạc MagSafe Type-C", Connectivity: "Bluetooth 5.3 kết nối đồng bộ tức thì hệ sinh thái Apple", Microphone: "Micro đôi định hướng chùm sóng thu giọng nói trong", Weight: "5.3g mỗi bên tai", Usage_Type: "Đồng bộ thiết bị Apple làm việc giải trí, Chống ồn cao", User_Segment: "Tín đồ Apple, Dân văn phòng cao cấp, Người hay di chuyển", Performance_Level: "Premium Cao cấp", AI_Tag: "airpods-pro, chip-h2, chống-ồn-x2, cổng-typec, sạc-magsafe" }
    },
    variants: [{ Product_variant_id: "VAR_100", Variant_name: "White Standard", Attributes: { Color: "White" }, Price: 5690000, Stock_quantity: 40 }]
  },
  {
    product: {
      Product_id: "PRD_049", Category_id: "CAT_004", Brand_id: "BRD_012", Product_name: "Sony SRS-XE200 Wireless Speaker",
      Description: "Loa di động không dây sở hữu bộ khuếch tán hình tuyến tính Line-Shape Diffuser độc đáo giúp phân tán dải âm thanh trải rộng, đều khắp mọi góc không gian tiệc tùng mà không làm méo hay giảm suy suy giảm chất lượng nhạc.",
      Images: ["sony-srs-xe200-orange.jpg"], Average_rating: 4.3, Total_reviews: 49, Status: "on_sale", Discount: 15, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Type: "Loa di động không dây Bluetooth cầm tay", Driver: "Màng loa X-Balanced độc quyền tăng áp suất âm thanh", Frequency: "20Hz - 20000Hz", ANC: "Không có", Battery: "16 giờ nghe nhạc liên tục (Có sạc nhanh 10 phút dùng 70 phút)", Connectivity: "Bluetooth 5.2 hỗ trợ tính năng kết nối nhiều loa Party Connect", WaterResistance: "Kháng nước bụi tuyệt hảo IP67 + Kháng chấn động va đập", Microphone: "Micro tích hợp công nghệ khử tiếng vọng Echo Cancelling", Weight: "800g có dây treo tiện lợi", Usage_Type: "Mang đi dã ngoại, Đạp xe ngoài trời nghe nhạc, Tiệc nhỏ trong phòng", User_Segment: "Giới trẻ thích xê dịch, Phượt thủ, Sinh viên tụ tập dã ngoại", Performance_Level: "Tầm trung bền bỉ", AI_Tag: "loa-sony, khuếch-tán-âm, chống-nước-ip67, chống-va-đập" }
    },
    variants: [{ Product_variant_id: "VAR_101", Variant_name: "Energy Orange", Attributes: { Color: "Energy Orange" }, Price: 2450000, Stock_quantity: 15 }]
  },
  {
    product: {
      Product_id: "PRD_050", Category_id: "CAT_004", Brand_id: "BRD_016", Product_name: "Anker Soundcore Motion+",
      Description: "Sản phẩm loa Bluetooth đạt chứng nhận âm thanh độ phân giải cao Hi-Res Audio vô địch phân khúc giá rẻ. Thiết kế góc nghiêng 15 độ hướng thẳng âm thanh đến tai người nghe, công nghệ loa 3 đường tiếng tái tạo chi tiết dải nhạc sống động.",
      Images: ["anker-soundcore-motion-plus-black.jpg"], Average_rating: 4.6, Total_reviews: 135, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Type: "Loa di động không dây để bàn Bluetooth", Driver: "2 Tweeter siêu cao tần + 2 Woofer trầm + 1 Màng cộng hưởng thụ động", Frequency: "50Hz - 40000Hz (Dải tần siêu rộng chuẩn Hi-Res)", Power: "30W Siêu lớn lấp đầy phòng", Battery: "12 giờ nghe nhạc liên tục viên pin 6700mAh", Connectivity: "Bluetooth 5.0 hỗ trợ codec Qualcomm aptX âm thanh nét", WaterResistance: "Chống nước chuẩn IPX7 an toàn lỡ dính mưa", Weight: "1050g đầm chắc", Usage_Type: "Loa nghe nhạc phòng ngủ, Loa trợ giảng, Xem phim laptop bự", User_Segment: "Người chuộng thông số âm thanh, Sinh viên nghe nhạc phòng trọ", Performance_Level: "Phổ thông xuất sắc", AI_Tag: "loa-anker, hi-res-audio, công-suất-30w, giá-rẻ-chất-cao" }
    },
    variants: [{ Product_variant_id: "VAR_102", Variant_name: "Matte Black", Attributes: { Color: "Black" }, Price: 1990000, Stock_quantity: 35 }]
  },

  // ============================================================
  // PHỤ KIỆN CÔNG NGHỆ (CAT_005) - 10 sản phẩm
  // ============================================================
  {
    product: {
      Product_id: "PRD_024", Category_id: "CAT_005", Brand_id: "BRD_016", Product_name: "Anker 737 Power Bank 24000mAh",
      Description: "Sạc dự phòng dung lượng khủng tích hợp màn hình màu thông minh LCD hiển thị thời gian thực công suất dòng điện. Khả năng xả dòng cực đại công suất 140W nạp năng lượng nhanh chóng cho cả máy tính xách tay Laptop và MacBook.",
      Images: ["anker-737-powerbank-black.jpg"], Average_rating: 4.7, Total_reviews: 143, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Type: "Pin sạc dự phòng cao cấp", Capacity: "24000 mAh dung lượng lõi", MaxOutput: "140W Sạc nhanh PD 3.1", Ports: "2 cổng USB-C (140W), 1 cổng USB-A (22.5W)", Security: "Hệ thống bảo vệ nhiệt thông minh ActiveShield 2.0", Display: "Màn hình kỹ thuật số hiển thị thông số dòng sạc", Weight: "622g đầm tay", Usage_Type: "Sạc cứu sinh Laptop khi đi công tác, Du lịch dài ngày sạc đa thiết bị", User_Segment: "Kỹ sư hệ thống, Người đi công tác nhiều, Coder di động", Performance_Level: "Đỉnh cao phụ kiện", AI_Tag: "sạc-dự-phòng, anker-140w, dung-lượng-khủng, màn-hình-lcd" }
    },
    variants: [{ Product_variant_id: "VAR_070", Variant_name: "Anker 737 Black", Attributes: { Color: "Black" }, Price: 2290000, Stock_quantity: 40 }]
  },
  {
    product: {
      Product_id: "PRD_025", Category_id: "CAT_005", Brand_id: "BRD_016", Product_name: "Anker 655 USB-C Hub 8-in-1",
      Description: "Thiết bị cổng chuyển đổi mở rộng kết nối toàn diện bọc da PU thời trang tinh tế. Hỗ trợ xuất hình ảnh ra màn hình lớn chuẩn phân giải 4K 60Hz mượt mà, truyền file siêu tốc khe cắm thẻ nhớ SD và hỗ trợ nhận nguồn sạc ngược 100W PD.",
      Images: ["anker-655-hub-black.jpg"], Average_rating: 4.5, Total_reviews: 87, Status: "on_sale", Discount: 20, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Type: "Cổng chuyển đổi mở rộng USB-C Hub", Ports: "1 HDMI (4K@60Hz), 1 USB-C PD 100W, 3 USB-A 3.2, 1 Ethernet RJ45, 1 khe SD, 1 khe microSD", PowerDelivery: "Hỗ trợ pass-through sạc ngược tối đa 100W", Cable: "Dây cáp bọc vải dù bện chống đứt gập giấu gọn", Material: "Khung hợp kim bọc da PU nhám sang trọng", Weight: "115g nhẹ nhàng", Usage_Type: "Mở rộng cổng kết nối cho MacBook mỏng, Xuất màn hình thuyết trình", User_Segment: "Sinh viên MacBook làm đồ án, Dân văn phòng chuyên nghiệp", Performance_Level: "Tầm trung cao cấp", AI_Tag: "hub-chuyển-đổi, anker-hub, xuất-hình-4k-60hz, macbook-hub" }
    },
    variants: [{ Product_variant_id: "VAR_071", Variant_name: "Midnight Black", Attributes: { Color: "Midnight Black" }, Price: 990000, Stock_quantity: 60 }]
  },
  {
    product: {
      Product_id: "PRD_026", Category_id: "CAT_005", Brand_id: "BRD_013", Product_name: "Logitech MX Keys S",
      Description: "Bàn phím không dây cao cấp thiết kế công thái học ôm trọn các đầu ngón tay mang lại cảm giác gõ phím vô cùng êm ái, yên tĩnh tĩnh lặng tuyệt đối. Hệ thống đèn thông minh tự động phát sáng khi tay bạn tiến đến gần bàn phím.",
      Images: ["logitech-mx-keys-s-graphite.jpg"], Average_rating: 4.6, Total_reviews: 112, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Type: "Bàn phím không dây cao cấp full-size", Switch: "Cấu trúc phím cắt kéo Scissor Perfect-Stroke lõm tròn", Backlight: "Đèn nền thông minh tự động thay đổi độ sáng theo môi trường", Connectivity: "Bluetooth Low Energy, Đầu thu Logi Bolt USB bảo mật cao", MultiDevice: "Kết nối và chuyển đổi nhanh giữa 3 thiết bị đồng thời Easy-Switch", Battery: "Sạc Type-C, dùng 10 ngày bật đèn hoặc 5 tháng tắt đèn", Weight: "810g đầm chắc chống trượt", Usage_Type: "Gõ code lập trình lâu dài, Soạn thảo văn bản chuyên sâu đa thiết bị", User_Segment: "Lập trình viên chuyên nghiệp, Business Analyst, Nhà văn", Performance_Level: "Premium Cốt lõi", AI_Tag: "bàn-phím-logitech, mx-keys, gõ-êm, kết-nối-3-máy, đèn-thông-minh" }
    },
    variants: [{ Product_variant_id: "VAR_073", Variant_name: "Graphite Dark", Attributes: { Color: "Graphite" }, Price: 2690000, Stock_quantity: 30 }]
  },
  {
    product: {
      Product_id: "PRD_027", Category_id: "CAT_005", Brand_id: "BRD_013", Product_name: "Logitech MX Master 3S",
      Description: "Chuột không dây công thái học đỉnh cao nhất hỗ trợ nâng đỡ cổ tay chống đau mỏi khi làm việc cường độ dài. Bánh xe lăn cuộn điện từ MagSpeed cuộn nhanh 1000 dòng Excel trong nháy mắt, nút click không tiếng động tĩnh lặng.",
      Images: ["logitech-mx-master3s-graphite.jpg"], Average_rating: 4.8, Total_reviews: 156, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Type: "Chuột không dây công thái học tay phải", Sensor: "Mắt đọc quang học Darkfield theo dấu trên mọi mặt phẳng kể cả kính", DPI: "Tùy chỉnh linh hoạt từ 200 đến 8000 DPI", Buttons: "7 nút bấm chức năng có thể lập trình gán lệnh theo ứng dụng", Scroll: "Bánh xe cuộn điện từ thép MagSpeed siêu tốc + Bánh xe cuộn ngón cái", Connectivity: "Bluetooth LE, Đầu thu không dây Logi Bolt", Battery: "Pin sạc Type-C dùng liên tục lên đến 70 ngày", Weight: "141g công thái học", Usage_Type: "Thiết kế layout phần mềm, Phân tích dữ liệu Excel, Edit đồ họa", User_Segment: "Lập trình viên, Designer đồ họa, Quản trị viên hệ thống", Performance_Level: "Đỉnh cao chuột công sở", AI_Tag: "chuột-công-thái-học, mx-master-3s, cuộn-điện-từ, di-trên-kính" }
    },
    variants: [{ Product_variant_id: "VAR_075", Variant_name: "Graphite Grey", Attributes: { Color: "Graphite" }, Price: 1990000, Stock_quantity: 45 }]
  },
  {
    product: {
      Product_id: "PRD_051", Category_id: "CAT_005", Brand_id: "BRD_016", Product_name: "Anker Nano Power Bank 30W",
      Description: "Pin sạc dự phòng mini nhỏ gọn kích thước hình thỏi son tích hợp sẵn đầu dây sạc cáp chuẩn Type-C dính liền thân máy vô cùng tiện nghi, công suất xả 30W sạc nhanh cấp tốc cho các thiết bị smartphone thế hệ mới.",
      Images: ["anker-nano-powerbank-mint.jpg"], Average_rating: 4.6, Total_reviews: 82, Status: "on_sale", Discount: 15, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Type: "Pin sạc dự phòng mini cầm tay", Capacity: "10000 mAh dung lượng thực tế", MaxOutput: "30W Sạc nhanh Power Delivery", Ports: "Tích hợp sẵn 1 dây cáp gắn liền Type-C + 1 cổng USB-C in/out", Security: "Hệ thống kiểm soát nhiệt độ an toàn thông minh", Size: "Kích thước bỏ túi quần nhỏ gọn", Weight: "215g siêu nhẹ", Usage_Type: "Sạc nhanh điện thoại dự phòng khi đi học, đi chơi chụp hình nhiều", User_Segment: "Gen Z năng động, Nữ giới chuộng thiết kế nhỏ xinh, Sinh viên", Performance_Level: "Phổ thông tiện ích", AI_Tag: "sạc-dự-phòng-mini, anker-nano, dây-sạc-liền-thân, sạc-nhanh-30w" }
    },
    variants: [{ Product_variant_id: "VAR_103", Variant_name: "Mint Green Edition", Attributes: { Color: "Mint Green" }, Price: 790000, Stock_quantity: 50 }]
  },
  {
    product: {
      Product_id: "PRD_052", Category_id: "CAT_005", Brand_id: "BRD_001", Product_name: "Apple Magic Mouse 2024",
      Description: "Chuột không dây chính hãng Apple sở hữu cấu trúc bề mặt phẳng gương sang trọng hỗ trợ toàn diện các cử chỉ vuốt lướt vuốt chạm cảm ứng thông minh Multi-Touch mượt mà trên nền hệ điều hành macOS thiết kế đồ họa.",
      Images: ["apple-magic-mouse-white.jpg"], Average_rating: 4.2, Total_reviews: 65, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Type: "Chuột không dây cảm ứng Bluetooth", Sensor: "Mắt đọc quang học chuẩn Apple di mượt", Connectivity: "Bluetooth tự động đồng bộ kết nối tức thì máy Mac", Gesture: "Hỗ trợ vuốt lướt cảm ứng đa điểm cuộn dọc ngang, đổi tab ứng dụng", Battery: "Tích hợp pin sạc Lithium-ion dùng liên tục vài tuần", Weight: "99g tối giản", Usage_Type: "Lướt thiết kế UI/UX, Duyệt tài liệu máy Mac, Làm việc văn phòng sạch gọn", User_Segment: "Người dùng iMac, MacBook Pro, Thiết kế UI chuyên nghiệp", Performance_Level: "Cao cấp tối giản", AI_Tag: "chuột-apple, magic-mouse, cảm-ứng-đa-điểm, đồng-bộ-macbook" }
    },
    variants: [{ Product_variant_id: "VAR_104", Variant_name: "White Magic", Attributes: { Color: "White" }, Price: 2190000, Stock_quantity: 20 }]
  },
  {
    product: {
      Product_id: "PRD_053", Category_id: "CAT_005", Brand_id: "BRD_013", Product_name: "Logitech Pebble Keys 2 K380s",
      Description: "Bàn phím không dây thiết kế siêu mỏng thanh lịch gọn nhẹ chế tác từ nguồn nhựa tái chế bảo vệ môi trường sinh thái. Các nút phím bo tròn giả lập viên sỏi tinh tế gõ nhẹ nhàng, không gây ồn phù hợp mang theo làm việc mọi nơi.",
      Images: ["logitech-pebble-keys2-pink.jpg"], Average_rating: 4.5, Total_reviews: 114, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Type: "Bàn phím không dây mỏng nhẹ nhỏ gọn", Switch: "Phím tròn mỏng hành trình ngắn gõ tĩnh lặng silent click", Connectivity: "Bluetooth Low Energy kết nối đa nền tảng (iOS, Android, Windows, Mac)", MultiDevice: "Nút bấm Easy-Switch ghi nhớ kết nối luân chuyển sượt 3 thiết bị", Battery: "Sử dụng 2 viên pin AAA thời lượng chờ lên tới 3 năm", Weight: "415g siêu gọn nhẹ bỏ vừa balo", Usage_Type: "Mang đi cafe học bài, Gõ văn bản trên máy tính bảng iPad nhanh", User_Segment: "Nữ giới văn phòng, Sinh viên thích dịch chuyển làm việc cafe", Performance_Level: "Phổ thông thời trang", AI_Tag: "bàn-phím-logitech, pebble-keys, bàn-phím-tròn, mỏng-nhẹ-cafe" }
    },
    variants: [{ Product_variant_id: "VAR_105", Variant_name: "Rose Pink Studio", Attributes: { Color: "Rose Pink" }, Price: 850000, Stock_quantity: 30 }]
  },
  {
    product: {
      Product_id: "PRD_054", Category_id: "CAT_005", Brand_id: "BRD_016", Product_name: "Anker Prime 100W GaN Wall Charger",
      Description: "Củ sạc nhanh công nghệ vật liệu bán dẫn GaN thế hệ mới thu nhỏ kích thước củ sạc xuống siêu gọn gàng bằng hộp tai nghe nhưng mang trong mình tổng công suất xả dòng điện sạc khổng lồ lên tới 100W an toàn.",
      Images: ["anker-prime-100w-gan.jpg"], Average_rating: 4.8, Total_reviews: 93, Status: "on_sale", Discount: 10, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Type: "Củ sạc nhanh công nghệ bán dẫn GaNPrime", TotalPower: "100W Đầu ra thông minh phân bổ dòng", Ports: "2 cổng USB-C sạc nhanh máy tính, 1 cổng USB-A đa năng sạc pin phụ kiện", Security: "Hệ thống kiểm soát cảm biến nhiệt độ an toàn ActiveShield 2.0", Plug: "Chân cắm dẹt có thể gập gọn gàng chống gãy xước", Weight: "180g siêu nhỏ", Usage_Type: "Củ sạc đơn thay thế toàn bộ cục sạc cồng kềnh trong balo khi đi học", User_Segment: "Học sinh, Sinh viên công nghệ, Lập trình viên di động nhiều", Performance_Level: "Phụ kiện thiết yếu cao cấp", AI_Tag: "củ-sạc-nhanh, anker-prime, công-nghệ-gan-100w, sạc-laptop-điện-thoại" }
    },
    variants: [{ Product_variant_id: "VAR_106", Variant_name: "Anker Prime Black", Attributes: { Color: "Black", Power: "100W" }, Price: 1450000, Stock_quantity: 40 }]
  },
  {
    product: {
      Product_id: "PRD_055", Category_id: "CAT_005", Brand_id: "BRD_002", Product_name: "ASUS ROG Strix Scope RX TKL",
      Description: "Bàn phím cơ gaming thiết kế rút gọn layout Tenkeyless cắt bỏ phần phím số mở rộng không gian vẩy chuột chiến game FPS. Khung kim loại nhôm phay xước cứng cáp cùng công nghệ switch RX quang học phản hồi tốc độ ánh sáng.",
      Images: ["asus-rog-strix-scope-tkl.jpg"], Average_rating: 4.6, Total_reviews: 37, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Type: "Bàn phím cơ gaming cơ học rút gọn TKL", Switch: "Switch quang cơ độc quyền ROG RX Red quang học phản hồi nhanh", Backlight: "Hệ thống đèn Aura Sync RGB từng phím tùy biến sắc màu lung linh", Keycap: "Nhựa ABS phủ lớp nhám chống mài mòn bóng phím", Feature: "Phím Ctrl bên trái làm rộng gấp đôi chuẩn chống bấm trượt khi combat", Weight: "880g cứng cáp vỏ thép", Usage_Type: "Chiến game competitive phản hồi siêu tốc, Trang trí góc gaming", User_Segment: "Gamer FPS, Sinh viên đam mê cơ học bàn phím cơ", Performance_Level: "Gaming chuyên sâu", AI_Tag: "bàn-phím-cơ-rog, switch-quang-học, layout-tkl, phím-gaming" }
    },
    variants: [{ Product_variant_id: "VAR_107", Variant_name: "ROG RX Red Switch", Attributes: { Switch: "ROG RX Red" }, Price: 2890000, Stock_quantity: 15 }]
  },
  {
    product: {
      Product_id: "PRD_056", Category_id: "CAT_005", Brand_id: "BRD_016", Product_name: "Cáp Sạc Anker PowerLine III USB-C to USB-C",
      Description: "Sợi dây cáp sạc truyền dữ liệu 'nồi đồng cối đá' được bọc lớp vỏ silicon siêu mềm mại chống rối dây đỉnh cao. Phần lõi cấu trúc được gia cố bằng sợi chống đạn chịu lực bẻ cong vặn xoắn bền bỉ lên tới hơn 25000 lần sạc.",
      Images: ["anker-powerline-3-white.jpg"], Average_rating: 4.7, Total_reviews: 410, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Interface: "Chuẩn kết nối hai đầu Type-C to Type-C", Length: "0.9 mét tiêu chuẩn chống rối", PowerMax: "Hỗ trợ tải dòng công suất sạc tối đa 60W chuẩn sạc nhanh PD", DataTransfer: "Tốc độ truyền dữ liệu file đạt 480 Mbps ổn định", Durability: "Chịu lực kéo uốn nắn lên đến 25.000 lần test phòng thí nghiệm", Material: "Lõi đồng nguyên chất gia cố, vỏ bọc silicon dẻo mềm mịn", Weight: "35g siêu bền", Usage_Type: "Dây cáp sạc nhanh cắm điện thoại, máy tính bảng iPad hằng ngày", User_Segment: "Tất cả mọi đối tượng người dùng sở hữu thiết bị cổng Type-C", Performance_Level: "Phổ thông siêu bền", AI_Tag: "cáp-sạc-anker, cáp-typec-to-typec, siêu-bền-chống-đứt, sạc-nhanh-60w" }
    },
    variants: [{ Product_variant_id: "VAR_108", Variant_name: "PowerLine III White 60W", Attributes: { Color: "White", Length: "0.9m" }, Price: 150000, Stock_quantity: 100 }]
  },

  // ============================================================
  // THIẾT BỊ GAMING (CAT_006) - 10 sản phẩm
  // ============================================================
  {
    product: {
      Product_id: "PRD_028", Category_id: "CAT_006", Brand_id: "BRD_015", Product_name: "Razer DeathAdder V3 HyperSpeed",
      Description: "Dòng chuột gaming không dây huyền thoại được tái sinh với trọng lượng siêu nhẹ chỉ 88g không đục lỗ vỏ thân máy. Cảm biến Focus X 26.000 DPI siêu chuẩn xác tuyệt đối kết hợp công nghệ không dây HyperSpeed không độ trễ tín hiệu.",
      Images: ["razer-deathadder-v3-black.jpg"], Average_rating: 4.7, Total_reviews: 93, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Sensor: "Mắt đọc quang học Razer Focus X 26K DPI siêu chuẩn", Switch: "Razer Optical Mouse Switches Gen-3 bền bỉ 100 triệu click chống double click", Battery: "90 giờ chơi liên tục chế độ HyperSpeed không dây", Connectivity: "Không dây không độ trễ Razer HyperSpeed Wireless 2.4GHz + Cáp rời", Buttons: "6 nút gán macro lập trình lệnh qua phần mềm Synapse", Weight: "88g Siêu nhẹ không lỗ vỏ", Usage_Type: "Chiến game FPS competitive chuyên sâu (Valorant, CS2), Esports", User_Segment: "Gamer bắn súng FPS chuyên nghiệp, Vận động viên Esports", Performance_Level: "Đỉnh cao chuột Gaming", AI_Tag: "chuột-gaming-razer, deathadder-v3, chuột-fps-siêu-nhẹ, không-dây-hyperspeed" }
    },
    variants: [{ Product_variant_id: "VAR_077", Variant_name: "Razer Black Edition", Attributes: { Color: "Black" }, Price: 1890000, Stock_quantity: 35 }]
  },
  {
    product: {
      Product_id: "PRD_029", Category_id: "CAT_006", Brand_id: "BRD_014", Product_name: "HyperX Alloy Origins 65 Mechanical Keyboard",
      Description: "Bàn phím cơ chơi game layout 65% nhỏ gọn tối giản giữ lại cụm phím điều hướng mũi tên thiết yếu. Khung vỏ chế tác nhôm nguyên khối đầm chắc chắn chống dịch chuyển phím cùng hệ thống dải đèn LED RGB rực rỡ per-key sắc nét.",
      Images: ["hyperx-alloy-origins-65.jpg"], Average_rating: 4.6, Total_reviews: 67, Status: "on_sale", Discount: 15, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Layout: "65% Gọn gàng (68 phím giữ cụm mũi tên điều hướng)", Switch: "Switch cơ học độc quyền HyperX Aqua gõ đanh nịnh tai phản hồi tốt", Backlight: "Đèn LED RGB chiếu sáng per-key rực rỡ với phần mềm NGENUITY", Body: "Vỏ nhôm nguyên khối chuẩn hàng không chịu lực đập gõ mạnh", Keycap: "Nhựa PBT double-shot siêu bền bỉ chống bóng mờ phím chữ", Connectivity: "Dây cáp kết nối rời chuẩn USB Type-C bọc vải dù chống đứt", Weight: "825g đầm chắc", Usage_Type: "Gõ phím chiến game buổi đêm, setup góc chơi game tối giản, gõ văn bản văn phòng", User_Segment: "Game thủ chuộng layout gọn, Lập trình viên thích phím cơ compact", Performance_Level: "Cao cấp cơ học", AI_Tag: "bàn-phím-cơ-hyperx, layout-65, switch-aqua-linear, nhôm-nguyên-khối" }
    },
    variants: [{ Product_variant_id: "VAR_078", Variant_name: "Black - Aqua Switch", Attributes: { Color: "Black", Switch: "HyperX Aqua" }, Price: 2290000, Stock_quantity: 25 }]
  },
  {
    product: {
      Product_id: "PRD_030", Category_id: "CAT_006", Brand_id: "BRD_015", Product_name: "Razer Huntsman V3 Pro TKL",
      Description: "Vũ khí tối thượng của các game thủ Esport thi đấu chuyên nghiệp. Trang bị dòng công nghệ switch quang học Analog thế hệ mới nhận diện thông minh độ sâu nhấn phím và tính năng Rapid Trigger reset phím siêu tốc đỉnh cao vẩy súng.",
      Images: ["razer-huntsman-v3-pro-tkl.jpg"], Average_rating: 4.8, Total_reviews: 41, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Layout: "Tenkeyless rút gọn (87 phím cắt bỏ numpad số phải)", Switch: "Razer Analog Optical Switches Gen-2 nhận diện lực nhấn nông sâu tùy chỉnh", Feature: "Tính năng Rapid Trigger phản hồi nhả phím lập tức chuyên trị game FPS", Control: "Núm xoay điều khiển âm lượng đa phương tiện bằng kim loại cao cấp", Backlight: "Hệ thống Razer Chroma RGB tỏa sáng rực rỡ đồng bộ game", Connectivity: "Dây cáp bọc vải dù Type-C tháo rời linh hoạt di chuyển", Weight: "920g cứng cáp chuyên nghiệp", Usage_Type: "Thi đấu game FPS competitive Valorant CS2 chuyên nghiệp, vẩy góc strafe súng", User_Segment: "Pro Player thi đấu giải đấu, Gamer chuyên sâu mong muốn thông số đỉnh", Performance_Level: "Flagship tối thượng bàn phím", AI_Tag: "bàn-phím-cơ-razer, huntsman-v3, công-nghệ-rapid-trigger, switch-quang-analog" }
    },
    variants: [{ Product_variant_id: "VAR_080", Variant_name: "Blackout Pro TKL", Attributes: { Color: "Black", Switch: "Analog Optical" }, Price: 4990000, Stock_quantity: 15 }]
  },
  {
    product: {
      Product_id: "PRD_031", Category_id: "CAT_006", Brand_id: "BRD_015", Product_name: "Razer Blade 16 Gaming Laptop 2025",
      Description: "Quái vật phần cứng tối thượng của làng laptop gaming thế giới. Ẩn giấu bên trong lớp vỏ nhôm đen nhám nguyên khối mỏng thanh lịch như ultrabook là bộ đôi chip Core Ultra 9 và siêu card đồ họa GeForce RTX 5090 màn Mini-LED 240Hz.",
      Images: ["razer-blade-16-2025.jpg"], Average_rating: 4.9, Total_reviews: 28, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { CPU: "Intel Core Ultra 9 275HX 24 nhân xử lý", GPU: "NVIDIA GeForce RTX 5090 Laptop 16GB GDDR7 thế hệ mới", RAM: "32GB DDR5 Bus 5600MHz", Storage: "2TB SSD NVMe PCIe 4.0", Screen_Size: "16.0 inch", Battery: "95.2Wh Khủng", Weight: "2.45 kg", Refresh_Rate: "240Hz Siêu mượt", Resolution: "2560x1600 QHD+ tấm nền Mini-LED siêu sáng rực", OS: "Windows 11 Pro", Usage_Type: "Chiến game AAA max cấu hình độ phân giải cao, Làm phim 8K, Đồ họa 3D trạm", User_Segment: "Đại gia công nghệ, Streamer danh tiếng, Chuyên gia dựng hình 3D", Performance_Level: "Flagship Vô địch cỗ máy", AI_Tag: "razer-blade, laptop-gaming-rtx-5090, màn-mini-led-240hz, khủng-long-hiệu-năng" }
    },
    variants: [{ Product_variant_id: "VAR_081", Variant_name: "32GB / 2TB - Black", Attributes: { Color: "Black", RAM: "32GB", Storage: "2TB" }, Price: 119990000, Stock_quantity: 5 }]
  },
  {
    product: {
      Product_id: "PRD_032", Category_id: "CAT_006", Brand_id: "BRD_013", Product_name: "Logitech G Pro X Superlight 2",
      Description: "Chuột gaming không dây có trọng lượng siêu nhẹ kinh ngạc chỉ 60g chuẩn mực vàng của toàn bộ giới Pro Player bắn súng FPS thế giới. Trang bị mắt đọc HERO 2 thông minh và switch bấm hybrid cơ quang phản hồi không độ trễ.",
      Images: ["logitech-gpro-x-superlight2-white.jpg"], Average_rating: 4.9, Total_reviews: 118, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Sensor: "Mắt đọc quang học tối tân HERO 2 độc quyền Logitech G", DPI: "Độ phân giải siêu nhạy lên tới 32000 DPI bám sát chuyển động tốt", Switch: "LIGHTFORCE Hybrid quang học cơ học click đanh sắc, phản hồi lập tức", Battery: "95 giờ sử dụng liên tục (Có công nghệ sạc không dây qua lót chuột Powerplay)", Connectivity: "Không dây độc quyền LIGHTSPEED 2.4GHz tốc độ phản hồi 2000Hz polling rate", Weight: "60g Siêu nhẹ vô địch", Usage_Type: "Vẩy chuột tâm súng FPS Valorant CS2 chính xác cao, đấu giải Esports", User_Segment: "Game thủ Hardcore chuyên nghiệp, Tuyển thủ FPS thi đấu chuyên nghiệp", Performance_Level: "Đỉnh cao chuột thi đấu", AI_Tag: "chuột-gaming-logitech, superlight-2, chuột-60g, không-dây-lightspeed" }
    },
    variants: [{ Product_variant_id: "VAR_083", Variant_name: "Ghost White Edition", Attributes: { Color: "White" }, Price: 2990000, Stock_quantity: 22 }]
  },
  {
    product: {
      Product_id: "PRD_033", Category_id: "CAT_006", Brand_id: "BRD_015", Product_name: "Razer Kishi V2 Pro Mobile Controller",
      Description: "Tay cầm điều khiển gaming di động kết nối trực tiếp qua cổng cắm cứng USB-C loại bỏ hoàn toàn độ trễ truyền phát tín hiệu, nút bấm switch cơ học nảy tanh tách biến chiếc điện thoại thành máy chơi game cầm tay chuyên dụng.",
      Images: ["razer-kishi-v2-pro-black.jpg"], Average_rating: 4.5, Total_reviews: 55, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Type: "Tay cầm chơi game gắn điện thoại di động di động", Interface: "Kết nối cứng trực tiếp qua cổng cắm USB-C chống trễ tín hiệu hoàn toàn", Switch: "Nút bấm cơ học công nghệ Razer Mecha-Tactile và d-pad phản hồi tốt", Feature: "Hỗ trợ cổng sạc pass-through sạc ngược cho điện thoại khi chơi và jack 3.5mm", Compatibility: "Hỗ trợ toàn diện điện thoại Android và dòng iPhone 15/16 Series cổng C", Weight: "138g nhỏ gọn ôm tay", Usage_Type: "Chơi game giả lập PSP, Mobile game Genshin Impact, Cloud Gaming Xbox", User_Segment: "Gamer Mobile cày game mọi nơi, Tín đồ Cloud Gaming di động", Performance_Level: "Cao cấp phụ kiện mobile", AI_Tag: "tay-cầm-razer, kishi-v2-pro, tay-cầm-chống-trễ, điện-thoại-gaming" }
    },
    variants: [{ Product_variant_id: "VAR_085", Variant_name: "Black - Universal USB-C", Attributes: { Color: "Black", Interface: "Type-C" }, Price: 2490000, Stock_quantity: 20 }]
  },
  {
    product: {
      Product_id: "PRD_057", Category_id: "CAT_006", Brand_id: "BRD_002", Product_name: "Tai nghe nhét tai ASUS ROG Cetra True Wireless",
      Description: "Dòng tai nghe nhét tai gaming không dây TWS hiếm hoi trên thị trường tối ưu riêng cho game thủ với chế độ Gaming Mode giảm độ trễ tín hiệu âm học xuống cực thấp, tích hợp chống ồn chủ động ANC cản sạch tạp âm khi chơi game cafe.",
      Images: ["asus-rog-cetra-tws.jpg"], Average_rating: 4.4, Total_reviews: 43, Status: "on_sale", Discount: 12, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Type: "Tai nghe nhét tai Gaming True Wireless in-ear", Driver: "10mm Driver ASUS Essence độc quyền tinh chỉnh", Frequency: "20Hz - 20000Hz", ANC: "Chống ồn chủ động ANC ngăn tạp âm môi trường quán cafe", Battery: "4.8 giờ tai nghe + 21.8 giờ hộp sạc (Có sạc không dây tiện lợi)", Latency: "Chế độ Gaming mode kích hoạt giảm độ trễ âm thanh xuống cực thấp", WaterResistance: "Kháng nước nhẹ chuẩn IPX4 an toàn mồ hôi khi đeo", Weight: "5.2g mỗi bên tai", Usage_Type: "Chơi game PUBG Mobile không trễ tiếng súng, Nghe nhạc EDM bass tốt di động", User_Segment: "Gamer Mobile, Người thích tai nghe nhỏ gọn đậm chất ROG", Performance_Level: "Gaming TWS chuyên dụng", AI_Tag: "tai-nghe-gaming-rog, cetra-tws, độ-trễ-thấp, chống-ồn-anc" }
    },
    variants: [{ Product_variant_id: "VAR_109", Variant_name: "ROG Cetra Black", Attributes: { Color: "Black" }, Price: 1850000, Stock_quantity: 30 }]
  },
  {
    product: {
      Product_id: "PRD_058", Category_id: "CAT_006", Brand_id: "BRD_014", Product_name: "Microphone HyperX QuadCast S",
      Description: "Cực phẩm Microphone chuyên dụng cho góc Livestream game thủ nổi bật với dải đèn LED RGB chuyển màu Chroma rực rỡ ảo diệu. Tích hợp màng lọc pop filter chống rè giọng bè và giá chống sốc đàn hồi loại bỏ rung chấn mặt bàn.",
      Images: ["hyperx-quadcast-s.jpg"], Average_rating: 4.7, Total_reviews: 65, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: true,
      Technical_specs: { Type: "Microphone thu âm chuyên dụng cổng kết nối USB", Pattern: "4 chế độ cực tùy chỉnh linh hoạt: Cardioid, Omnidirectional, Stereo, Bidirectional", Feature: "Cảm biến chạm tắt âm nhanh Tap-to-mute trên đầu với đèn LED báo hiệu rõ ràng", Backlight: "Đèn LED RGB lung linh có thể tùy chỉnh hiệu ứng qua phần mềm HyperX", Mount: "Đi kèm giá chống sốc đệm cao su giảm chấn động va quẹt mặt bàn làm việc", SampleRate: "48kHz / 16-bit thu giọng ấm mượt", Weight: "710g cả cụm chân đứng vững", Usage_Type: "Livestream đàm thoại Discord game đội nhóm, Thu âm giọng đọc stream game, bình luận", User_Segment: "Streamer danh tiếng, Creator video game, Game thủ cần voice rõ", Performance_Level: "Tiêu chuẩn Streamer cao cấp", AI_Tag: "micro-gaming, hyperx-quadcast, micro-rgb, tap-to-mute, livestream-game" }
    },
    variants: [{ Product_variant_id: "VAR_110", Variant_name: "RGB Black Edition", Attributes: { Color: "Black" }, Price: 3690000, Stock_quantity: 12 }]
  },
  {
    product: {
      Product_id: "PRD_059", Category_id: "CAT_006", Brand_id: "BRD_013", Product_name: "Logitech G502 X Plus Wireless Gaming Mouse",
      Description: "Sự tái sinh hoàn hảo của dòng chuột chơi game bán chạy nhất thế giới. Form dáng công thái học cầm đầy đặn tay, nâng cấp hệ thống switch bấm lai hybrid quang cơ LIGHTFORCE bất tử không lo double click cùng dải LED RGB 8 vùng lộng lẫy.",
      Images: ["logitech-g502x-plus.jpg"], Average_rating: 4.8, Total_reviews: 104, Status: "on_sale", Discount: 20, Is_Flash_Sale: true, Is_AI: false,
      Technical_specs: { Sensor: "Mắt đọc quang học thế hệ mới HERO 25K bám sát hoàn hảo", DPI: "Dải DPI rộng tùy biến tự do từ 100 đến 25600 DPI siêu nhạy", Switch: "LIGHTFORCE Hybrid Quang-Cơ học phản hồi giòn giã sắc bén, tuổi thọ vô cực", Backlight: "Hệ thống đèn LED LIGHTSYNC RGB 8 vùng phát màu tùy biến động thông minh", Connectivity: "Không dây LIGHTSPEED cải tiến tốc độ phản hồi nhanh hơn 68% bản cũ", Buttons: "13 nút bấm chức năng có thể gán macro qua phần mềm G HUB chuyên sâu", Weight: "106g công thái học đầm tay", Usage_Type: "Chơi game thế giới mở RPG, game MOBA cần nhiều phím tắt gán lệnh macro nhanh", User_Segment: "Gamer MOBA LOL, Người dùng chuộng thiết kế cơ bắp nhiều nút bấm phụ", Performance_Level: "Premium Gaming chuột", AI_Tag: "chuột-gaming-logitech, g502x-plus, switch-hybrid-quang-cơ, không-dây-lightspeed" }
    },
    variants: [{ Product_variant_id: "VAR_111", Variant_name: "Black Lightspeed Wireless", Attributes: { Color: "Black" }, Price: 3590000, Stock_quantity: 18 }]
  },
  {
    product: {
      Product_id: "PRD_060", Category_id: "CAT_006", Brand_id: "BRD_015", Product_name: "Razer BlackShark V2 Pro 2024 Edition",
      Description: "Chiếc tai nghe gaming không dây chuẩn mực cao cấp phục vụ các giải đấu Esports chuyên nghiệp bắn súng. Nổi bật với cụm Microphone thu âm dải siêu rộng HyperClear tháo rời truyền tải chất giọng đàm thoại rõ nét như studio.",
      Images: ["razer-blackshark-v2-pro-white.jpg"], Average_rating: 4.7, Total_reviews: 79, Status: "on_sale", Discount: 0, Is_Flash_Sale: false, Is_AI: false,
      Technical_specs: { Type: "Tai nghe Gaming chụp tai không dây Esport", Driver: "Màng loa cao cấp độc quyền Razer TriForce Titanium 50mm tách biệt âm sắc", Frequency: "12Hz - 28000Hz dải tần âm rộng lớn chi tiết", Sound: "Hỗ trợ giả lập âm thanh vòm không gian THX Spatial Audio định vị hướng", Battery: "Thời lượng pin khủng lên đến 70 giờ chơi game liên tục (Sạc Type-C nhanh)", Connectivity: "Không dây Razer HyperSpeed 2.4GHz không trễ + Bluetooth 5.2 linh hoạt", Microphone: "Siêu Micro băng thông siêu rộng HyperClear 9.9mm thu tiếng cực trong trẻo", Weight: "320g đệm tai vải dệt thoáng khí cách âm tốt", Usage_Type: "Đấu giải game bắn súng FPS, Đàm thoại chiến thuật Discord voice rõ mượt", User_Segment: "Gamer competitive chuyên sâu FPS, Tuyển thủ Esport chuyên nghiệp", Performance_Level: "Tiêu chuẩn giải đấu Esport", AI_Tag: "tai-nghe-gaming-razer, blackshark-v2-pro, micro-siêu-nét, tai-nghe-esport" }
    },
    variants: [{ Product_variant_id: "VAR_112", Variant_name: "Pro White Edition", Attributes: { Color: "White" }, Price: 4690000, Stock_quantity: 15 }]
  }
];

// ─────────────────────────────────────────────
// 4. USERS MẪU
// ─────────────────────────────────────────────
const bcrypt = require("bcryptjs");

const usersData = async () => {
  const hashedPassword = await bcrypt.hash("Vista@123", 10);
  return [
    {
      User_id: "USR_001",
      Username: "minhanhgen",
      Password: hashedPassword,
      Phone_number: "0901234567",
      Email: "minhanh@gmail.com",
      Full_name: "Nguyễn Minh Anh",
      Status: "active",
    },
  ];
};

// ─────────────────────────────────────────────
// 5. VOUCHERS MẪU
// ─────────────────────────────────────────────
const vouchersData = [
  {
    code: 'VISTA10',
    title: 'Giảm 10%',
    condition: 'Cho đơn hàng từ 5.000.000',
    type: 'percent',
    category: 'discount',
    status: 'expiring',
    expiry: '20/06/2026', // Đã sửa thành expiry
    description: 'Giảm 10% toàn đơn hàng',
    benefits: ['Giảm 10% giá trị đơn hàng.', 'Giảm tối đa 500.000đ.'],
    conditions: ['Đơn hàng từ 5.000.000đ.', 'Áp dụng cho tất cả sản phẩm trên hệ thống.'],
    startDate: '01/01/2026',
    usageLimit: 'Mỗi tài khoản sử dụng 1 lần.',
    statusText: 'Còn hiệu lực.',
  },
  {
    code: 'VISTA30',
    title: 'Giảm 30K',
    condition: 'Cho đơn hàng từ 2.000.000',
    type: 'shipping',
    category: 'freeship',
    status: 'expiring',
    expiry: '20/06/2026', // Đã sửa thành expiry
    description: 'Giảm 30.000đ phí vận chuyển',
    benefits: ['Giảm trực tiếp 30.000đ phí vận chuyển.', 'Áp dụng khi thanh toán đơn hàng hợp lệ.'],
    conditions: ['Đơn hàng từ 2.000.000đ.', 'Áp dụng cho đơn giao hàng toàn quốc.'],
    startDate: '01/01/2026',
    usageLimit: 'Mỗi tài khoản sử dụng 1 lần.',
    statusText: 'Còn hiệu lực.',
  },
  {
    code: 'FREESHIP',
    title: 'Freeship toàn quốc',
    condition: 'Đơn từ 5.000.000đ',
    type: 'shipping',
    category: 'freeship',
    status: 'available',
    expiry: '31/12/2026',
    description: 'Miễn phí vận chuyển toàn quốc',
    benefits: ['Miễn phí vận chuyển cho đơn hàng hợp lệ.'],
    conditions: ['Đơn hàng từ 5.000.000đ.', 'Áp dụng toàn quốc.'],
    startDate: '01/01/2026',
    usageLimit: 'Mỗi tài khoản sử dụng 1 lần.',
    statusText: 'Còn hiệu lực.',
  },
  {
    code: 'COMBO10',
    title: 'Combo sản phẩm',
    condition: 'Mua từ 2 sản phẩm trở lên',
    type: 'percent',
    category: 'discount',
    status: 'available',
    expiry: '31/12/2026',
    description: 'Giảm 10% khi mua combo sản phẩm',
    benefits: ['Giảm 10% giá trị đơn hàng.', 'Áp dụng khi mua từ 2 sản phẩm trở lên.'],
    conditions: ['Mua tối thiểu 2 sản phẩm.', 'Áp dụng cho các sản phẩm trên hệ thống.'],
    startDate: '01/01/2026',
    usageLimit: 'Mỗi tài khoản sử dụng 1 lần.',
    statusText: 'Còn hiệu lực.',
  },
  {
    code: 'WELCOME10',
    title: 'Giảm 10%',
    condition: 'Cho đơn đầu tiên',
    type: 'percent',
    category: 'discount',
    status: 'available',
    expiry: '31/12/2026',
    description: 'Giảm 10% cho đơn hàng đầu tiên',
    benefits: ['Giảm 10% giá trị đơn hàng đầu tiên.', 'Giảm tối đa 300.000đ.'],
    conditions: ['Chỉ áp dụng cho đơn hàng đầu tiên.', 'Áp dụng cho tài khoản mới.'],
    startDate: '01/01/2026',
    usageLimit: 'Mỗi tài khoản sử dụng 1 lần.',
    statusText: 'Còn hiệu lực.',
  },
  {
    code: 'LASTDAY',
    title: 'Giảm 15%',
    condition: 'Chỉ hôm nay',
    type: 'percent',
    category: 'discount',
    status: 'expiring',
    expiry: '17/06/2026', // Đã sửa thành expiry
    description: 'Giảm 15% chỉ trong hôm nay',
    benefits: ['Giảm 15% giá trị đơn hàng.', 'Giảm tối đa 700.000đ.'],
    conditions: ['Áp dụng cho đơn hàng hợp lệ.', 'Không áp dụng đồng thời với mã giảm giá khác.'],
    startDate: '01/01/2026',
    usageLimit: 'Mỗi tài khoản sử dụng 1 lần.',
    statusText: 'Sắp hết hạn.',
  },
  {
    code: 'LAPTOP150',
    title: 'Giảm 150.000đ Laptop',
    condition: 'Đơn hàng từ 8.000.000đ',
    type: 'percent',
    category: 'discount',
    status: 'used',
    expiry: '31/12/2026',
    description: 'Voucher đã sử dụng 1',
    benefits: ['Giảm trực tiếp 150.000đ.'],
    conditions: ['Đơn hàng từ 8.000.000đ.', 'Áp dụng cho danh mục Laptop.'],
    startDate: '01/01/2026',
    usageLimit: 'Đơn hàng: DH202606021\nNgày sử dụng: 08/06/2026\nGiá trị giảm: 150.000đ',
    statusText: 'Đã sử dụng.',
  },
  {
    code: 'ACC20',
    title: 'Giảm 20% Phụ kiện',
    condition: 'Đơn hàng từ 1.000.000đ',
    type: 'percent',
    category: 'discount',
    status: 'used',
    expiry: '31/12/2026',
    description: 'Voucher đã sử dụng 2',
    benefits: ['Giảm 20% giá trị sản phẩm phụ kiện.', 'Giảm tối đa 200.000đ.'],
    conditions: ['Đơn hàng từ 1.000.000đ.', 'Áp dụng cho tai nghe, chuột, bàn phím, loa.'],
    startDate: '01/01/2026',
    usageLimit: 'Đơn hàng: DH202606037\nNgày sử dụng: 12/06/2026\nGiá trị giảm: 180.000đ',
    statusText: 'Đã sử dụng.',
  }
];

// ─────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected!");
  console.log("\n Bắt đầu seed dữ liệu VISTA...\n");

  try {
    // Xoá dữ liệu cũ
    console.log(" Xoá dữ liệu cũ...");
    await Promise.all([
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Product.deleteMany({}),
      Product_variant.deleteMany({}),
      User.deleteMany({}),
      Voucher.deleteMany({}),
      Cart.deleteMany({}),
    ]);
    console.log("Đã xoá dữ liệu cũ\n");

    // 1. Seed Categories
    console.log("Seed Categories...");
    await Category.insertMany(categoriesData);
    console.log(` ${categoriesData.length} categories\n`);

    // 2. Seed Brands
    console.log(" Seed Brands...");
    await Brand.insertMany(brandsData);
    console.log(` ${brandsData.length} brands\n`);

    // 3. Seed Products + Variants
    console.log("Seed Products & Variants...");
    let totalVariants = 0;
    for (const item of productsData) {
      await Product.create(item.product);
      const variantsWithProductId = item.variants.map((v) => ({
        ...v,
        Product_id: item.product.Product_id,
        Status: v.Stock_quantity > 0 ? "active" : "out_of_stock",
      }));
      await Product_variant.insertMany(variantsWithProductId);
      totalVariants += item.variants.length;
      console.log(`   + ${item.product.Product_name} (${item.variants.length} variants)`);
    }
    console.log(`\n ${productsData.length} products, ${totalVariants} variants\n`);

    // 4. Seed Users
    console.log("👤 Seed Users...");
    const users = await usersData();
    await User.insertMany(users);
    console.log(` ${users.length} users (password: Vista@123)\n`);

    // 5. Seed Vouchers
    console.log("🎟️  Seed Vouchers...");
    await Voucher.insertMany(vouchersData);
    console.log(` ${vouchersData.length} vouchers\n`);

    // Summary
    console.log("═══════════════════════════════════════════════");
    console.log("SEED HOÀN TẤT!\n");
    console.log("Tổng kết:");
    console.log(`   • Categories  : ${categoriesData.length}`);
    console.log(`   • Brands      : ${brandsData.length}`);
    console.log(`   • Products    : ${productsData.length}`);
    console.log(`   • Variants    : ${totalVariants}`);
    console.log(`   • Users       : ${users.length}`);
    console.log(`   • Vouchers    : ${vouchersData.length}`);
    console.log("\n Phân bổ sản phẩm theo danh mục:");
    const catCount = {};
    productsData.forEach((p) => {
      const cat = categoriesData.find((c) => c.Category_id === p.product.Category_id);
      const name = cat ? cat.Category_name : "Unknown";
      catCount[name] = (catCount[name] || 0) + 1;
    });
    Object.entries(catCount).forEach(([k, v]) => console.log(`   • ${k}: ${v} sản phẩm`));
    console.log("═══════════════════════════════════════════════\n");

  } catch (error) {
    console.error("Lỗi seed:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("Đã đóng kết nối MongoDB");
  }
}

seed().catch(console.error);
