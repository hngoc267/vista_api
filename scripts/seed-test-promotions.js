/**
 * seed-test-promotions.js
 * Script tạo dữ liệu khuyến mãi mẫu cho môi trường kiểm thử (TEST DATABASE ONLY).
 * 
 * NGUYÊN TẮC BẢO VỆ TUYỆT ĐỐI:
 * 1. CHỈ CHẠY TRÊN DATABASE: "vista_test".
 * 2. Hỗ trợ chế độ --dry-run (chạy thử mô phỏng, không ghi dữ liệu).
 * 3. Idempotent: Sử dụng $setOnInsert để không ghi đè dữ liệu hiện có.
 * 4. Tuyệt đối không delete dữ liệu.
 */

const mongoose = require("mongoose");
const path = require("path");

const isDryRun = process.argv.includes("--dry-run");

const testVouchersData = [
  // 1. Voucher phần trăm legacy (bóc tách từ benefits, trần 500k)
  {
    code: "VISTA10",
    title: "Giảm 10%",
    condition: "Cho đơn hàng từ 5.000.000đ",
    type: "percent",
    category: "discount",
    status: "expiring",
    expiry: "20/06/2026",
    description: "Giảm 10% toàn đơn hàng",
    benefits: ["Giảm 10% giá trị đơn hàng.", "Giảm tối đa 500.000đ."],
    conditions: ["Đơn hàng từ 5.000.000đ.", "Áp dụng cho tất cả sản phẩm trên hệ thống."],
    startDate: "01/01/2026",
    usage_limit: 100,
    used_count: 10,
    usage_limit_per_customer: 1,
    usageLimit: "Mỗi tài khoản sử dụng 1 lần.",
    statusText: "Còn hiệu lực.",
  },
  // 2. Voucher Freeship có giới hạn tối đa (30.000đ)
  {
    code: "VISTA30",
    title: "Giảm 30K",
    condition: "Cho đơn hàng từ 2.000.000đ",
    type: "shipping",
    category: "freeship",
    status: "expiring",
    expiry: "20/06/2026",
    description: "Giảm 30.000đ phí vận chuyển",
    benefits: ["Giảm trực tiếp 30.000đ phí vận chuyển.", "Áp dụng khi thanh toán đơn hàng hợp lệ."],
    conditions: ["Đơn hàng từ 2.000.000đ.", "Áp dụng cho đơn giao hàng toàn quốc."],
    startDate: "01/01/2026",
    maxDiscountAmount: 30000,
    discountValue: 30000,
    usage_limit: 0,
    used_count: 5,
    usage_limit_per_customer: 1,
    usageLimit: "Mỗi tài khoản sử dụng 1 lần.",
    statusText: "Còn hiệu lực.",
  },
  // 3. Voucher Freeship không giới hạn mức giảm (Uncapped Freeship)
  {
    code: "FREESHIP",
    title: "Freeship toàn quốc",
    condition: "Đơn từ 5.000.000đ",
    type: "shipping",
    category: "freeship",
    status: "available",
    expiry: "31/12/2026",
    description: "Miễn phí vận chuyển toàn quốc",
    benefits: ["Miễn phí vận chuyển cho đơn hàng hợp lệ."],
    conditions: ["Đơn hàng từ 5.000.000đ.", "Áp dụng toàn quốc."],
    startDate: "01/01/2026",
    maxDiscountAmount: 0,
    discountValue: 0,
    usage_limit: 0,
    used_count: 12,
    usage_limit_per_customer: 1,
    usageLimit: "Mỗi tài khoản sử dụng 1 lần.",
    statusText: "Còn hiệu lực.",
  },
  // 4. Voucher Combo sản phẩm
  {
    code: "COMBO10",
    title: "Combo sản phẩm",
    condition: "Mua từ 2 sản phẩm trở lên",
    type: "percent",
    category: "discount",
    status: "available",
    expiry: "31/12/2026",
    description: "Giảm 10% khi mua combo sản phẩm",
    benefits: ["Giảm 10% giá trị đơn hàng.", "Áp dụng khi mua từ 2 sản phẩm trở lên."],
    conditions: ["Mua tối thiểu 2 sản phẩm.", "Áp dụng cho các sản phẩm trên hệ thống."],
    startDate: "01/01/2026",
    discountValue: 10,
    usage_limit: 200,
    used_count: 0,
    usage_limit_per_customer: 1,
    usageLimit: "Mỗi tài khoản sử dụng 1 lần.",
    statusText: "Còn hiệu lực.",
  },
  // 5. Voucher Khách hàng mới
  {
    code: "WELCOME10",
    title: "Giảm 10%",
    condition: "Cho đơn đầu tiên",
    type: "percent",
    category: "discount",
    status: "available",
    expiry: "31/12/2026",
    description: "Giảm 10% cho đơn hàng đầu tiên",
    benefits: ["Giảm 10% giá trị đơn hàng đầu tiên.", "Giảm tối đa 300.000đ."],
    conditions: ["Chỉ áp dụng cho đơn hàng đầu tiên.", "Áp dụng cho tài khoản mới."],
    startDate: "01/01/2026",
    discountValue: 10,
    maxDiscountAmount: 300000,
    usage_limit: 500,
    used_count: 25,
    usage_limit_per_customer: 1,
    usageLimit: "Mỗi tài khoản sử dụng 1 lần.",
    statusText: "Còn hiệu lực.",
  },
  // 6. Voucher Ngày cuối
  {
    code: "LASTDAY",
    title: "Giảm 15%",
    condition: "Chỉ hôm nay",
    type: "percent",
    category: "discount",
    status: "expiring",
    expiry: "31/12/2026",
    description: "Giảm 15% chỉ trong hôm nay",
    benefits: ["Giảm 15% giá trị đơn hàng.", "Giảm tối đa 700.000đ."],
    conditions: ["Áp dụng cho đơn hàng hợp lệ.", "Không áp dụng đồng thời với mã giảm giá khác."],
    startDate: "01/01/2026",
    discountValue: 15,
    maxDiscountAmount: 700000,
    usage_limit: 50,
    used_count: 2,
    usage_limit_per_customer: 1,
    usageLimit: "Mỗi tài khoản sử dụng 1 lần.",
    statusText: "Sắp hết hạn.",
  },
  // 7. Voucher LAPTOP150 (Đặc thù: seed khai báo type percent nhưng ưu đãi thực tế là giảm 150.000đ tiền mặt)
  {
    code: "LAPTOP150",
    title: "Giảm 150.000đ Laptop",
    condition: "Đơn hàng từ 8.000.000đ",
    type: "percent",
    category: "discount",
    status: "used",
    expiry: "31/12/2026",
    description: "Voucher đã sử dụng 1",
    benefits: ["Giảm trực tiếp 150.000đ."],
    conditions: ["Đơn hàng từ 8.000.000đ.", "Áp dụng cho danh mục Laptop."],
    startDate: "01/01/2026",
    usage_limit: 1,
    used_count: 1,
    usage_limit_per_customer: 1,
    usageLimit: "Đơn hàng: DH202606021\nNgày sử dụng: 08/06/2026\nGiá trị giảm: 150.000đ",
    statusText: "Đã sử dụng.",
  },
  // 8. Voucher ACC20 (Giảm 20% phụ kiện)
  {
    code: "ACC20",
    title: "Giảm 20% Phụ kiện",
    condition: "Đơn hàng từ 1.000.000đ",
    type: "percent",
    category: "discount",
    status: "used",
    expiry: "31/12/2026",
    description: "Voucher đã sử dụng 2",
    benefits: ["Giảm 20% giá trị sản phẩm phụ kiện.", "Giảm tối đa 200.000đ."],
    conditions: ["Đơn hàng từ 1.000.000đ.", "Áp dụng cho tai nghe, chuột, bàn phím, loa."],
    startDate: "01/01/2026",
    discountValue: 20,
    maxDiscountAmount: 200000,
    usage_limit: 1,
    used_count: 1,
    usage_limit_per_customer: 1,
    usageLimit: "Đơn hàng: DH202606037\nNgày sử dụng: 12/06/2026\nGiá trị giảm: 180.000đ",
    statusText: "Đã sử dụng.",
  },
  // 9. Voucher loại FIXED_AMOUNT chuẩn
  {
    code: "FIXED50",
    title: "Giảm 50.000đ",
    condition: "Đơn hàng từ 500.000đ",
    type: "fixed_amount",
    category: "discount",
    status: "active",
    expiry: "31/12/2026",
    description: "Giảm 50.000đ cho mọi đơn hàng",
    benefits: ["Giảm trực tiếp 50.000đ."],
    conditions: ["Đơn hàng từ 500.000đ."],
    startDate: "01/01/2026",
    discountValue: 50000,
    minOrderValue: 500000,
    usage_limit: 100,
    used_count: 5,
    usage_limit_per_customer: 1,
  },
  // 10. Voucher mang alias 'fixed' để kiểm tra chuẩn hóa alias
  {
    code: "FIXED_RAW",
    title: "Giảm 25.000đ (Alias fixed)",
    condition: "Đơn hàng từ 200.000đ",
    type: "fixed",
    category: "discount",
    status: "active",
    expiry: "31/12/2026",
    description: "Test alias fixed -> fixed_amount",
    benefits: ["Giảm trực tiếp 25.000đ."],
    conditions: ["Đơn hàng từ 200.000đ."],
    startDate: "01/01/2026",
    discountValue: 25000,
    minOrderValue: 200000,
    usage_limit: 50,
    used_count: 0,
    usage_limit_per_customer: 1,
  },
  // 11. Voucher đã hết lượt (out_of_quota)
  {
    code: "QUOTA_FULL",
    title: "Mã giới hạn 5 lượt",
    condition: "Đơn hàng từ 1.000.000đ",
    type: "fixed_amount",
    category: "discount",
    status: "active",
    expiry: "31/12/2026",
    description: "Voucher đã sử dụng hết 5/5 lượt",
    benefits: ["Giảm 100.000đ."],
    conditions: ["Đơn từ 1.000.000đ."],
    startDate: "01/01/2026",
    discountValue: 100000,
    usage_limit: 5,
    used_count: 5,
    usage_limit_per_customer: 1,
  },
  // 12. Voucher tạm dừng (paused)
  {
    code: "PAUSED_TEST",
    title: "Chương trình tạm dừng",
    condition: "Đơn hàng từ 500.000đ",
    type: "percent",
    category: "discount",
    status: "paused",
    expiry: "31/12/2026",
    description: "Voucher đang tạm dừng áp dụng",
    benefits: ["Giảm 10%."],
    conditions: ["Đơn từ 500.000đ."],
    startDate: "01/01/2026",
    discountValue: 10,
    usage_limit: 100,
    used_count: 0,
    usage_limit_per_customer: 1,
  },
  // 13. Voucher bản nháp (draft)
  {
    code: "DRAFT_TEST",
    title: "Chương trình bản nháp",
    condition: "Đơn hàng từ 500.000đ",
    type: "percent",
    category: "discount",
    status: "draft",
    expiry: "31/12/2026",
    description: "Voucher chưa phát hành",
    benefits: ["Giảm 15%."],
    conditions: ["Đơn từ 500.000đ."],
    startDate: "01/01/2026",
    discountValue: 15,
    usage_limit: 100,
    used_count: 0,
    usage_limit_per_customer: 1,
  },
  // 14. Voucher sắp diễn ra (upcoming)
  {
    code: "UPCOMING_TEST",
    title: "Khuyến mãi tết 2027",
    condition: "Đơn hàng từ 2.000.000đ",
    type: "percent",
    category: "discount",
    status: "active",
    expiry: "31/12/2027",
    description: "Khởi động vào năm 2027",
    benefits: ["Giảm 20%."],
    conditions: ["Đơn từ 2.000.000đ."],
    startDate: "2027-01-01T00:00:00+07:00",
    discountValue: 20,
    usage_limit: 100,
    used_count: 0,
    usage_limit_per_customer: 1,
  },
  // 15. Voucher đã quá hạn thời gian (expired)
  {
    code: "EXPIRED_TEST",
    title: "Khuyến mãi năm cũ",
    condition: "Đơn hàng từ 500.000đ",
    type: "fixed_amount",
    category: "discount",
    status: "available",
    expiry: "01/01/2024",
    description: "Đã quá hạn ngày 01/01/2024",
    benefits: ["Giảm 50.000đ."],
    conditions: ["Đơn từ 500.000đ."],
    startDate: "01/01/2023",
    discountValue: 50000,
    usage_limit: 100,
    used_count: 0,
    usage_limit_per_customer: 1,
  },
];

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.includes("vista_test")) {
    console.error("BẢO VỆ TUYỆT ĐỐI: MONGODB_URI không trỏ tới 'vista_test'!");
    process.exit(1);
  }

  console.log(`[SEED-TEST] Kết nối tới database: ${uri.replace(/:\/\/.*@/, "://***:***@")}`);
  await mongoose.connect(uri);

  const dbName = mongoose.connection.name;
  if (dbName !== "vista_test") {
    console.error(`BẢO VỆ AN TOÀN: Database hiện tại là '${dbName}', KHÔNG PHẢI 'vista_test'. Ngừng ngay lập tức!`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`[SEED-TEST] Đã xác nhận database mục tiêu: '${dbName}'`);
  console.log(`[SEED-TEST] Chế độ chạy: ${isDryRun ? "DRY-RUN (Chỉ mô phỏng, không ghi)" : "LIVE EXECUTION (Ghi an toàn không xóa)"}`);

  const Voucher = mongoose.connection.collection("Voucher");
  let insertedCount = 0;
  let skippedCount = 0;

  for (const v of testVouchersData) {
    const existing = await Voucher.findOne({ code: v.code });
    if (existing) {
      console.log(`  [BỎ QUA] Mã '${v.code}' đã tồn tại (giữ nguyên dữ liệu hiện có).`);
      skippedCount++;
      continue;
    }

    if (isDryRun) {
      console.log(`  [DRY-RUN] Sẽ chèn mã mới: ${v.code} (${v.title}) | Type: ${v.type} | Status: ${v.status}`);
      insertedCount++;
    } else {
      await Voucher.insertOne({
        ...v,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`  [ĐÃ CHÈN] Mã '${v.code}' (${v.title})`);
      insertedCount++;
    }
  }

  console.log("\n==========================================");
  console.log(`[TỔNG KẾT SEED VOUCHER TEST]:`);
  console.log(`  - Tổng số mẫu định nghĩa: ${testVouchersData.length}`);
  console.log(`  - Số mẫu ${isDryRun ? "mô phỏng chèn" : "đã chèn thực tế"}: ${insertedCount}`);
  console.log(`  - Số mẫu đã tồn tại (giữ nguyên): ${skippedCount}`);
  console.log("==========================================\n");

  await mongoose.disconnect();
  console.log("[SEED-TEST] Đã đóng kết nối an toàn.");
}

runSeed().catch((err) => {
  console.error("[SEED-TEST ERROR]:", err);
  process.exit(1);
});

