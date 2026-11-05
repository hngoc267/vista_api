/**
 * init-voucher-counters.js
 * Script khởi tạo bộ đếm used_count và mảng used_user_ids cho voucher cũ trên database test (vista_test).
 * Chỉ chạy khi DB name là "vista_test" để bảo vệ an toàn dữ liệu.
 */

const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const { Voucher, Order } = require("../models/schema");
const { VOUCHER_COUNTED_ORDER_STATUSES } = require("../services/promotion-helper");

async function main() {
  const envTestPath = path.resolve(__dirname, "../.env.test");
  if (fs.existsSync(envTestPath)) {
    require("dotenv").config({ path: envTestPath });
  } else {
    require("dotenv").config();
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("LỖI: MONGODB_URI không tồn tại trong môi trường.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const dbName = mongoose.connection.name;

  console.log(`Đã kết nối MongoDB. Tên database hiện tại: "${dbName}"`);

  // BẢO VỆ TUYỆT ĐỐI: Chỉ cho phép chạy trên vista_test
  if (dbName !== "vista_test") {
    console.error(`BẢO VỆ AN TOÀN: Database hiện tại là "${dbName}", không phải "vista_test". Dừng script!`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("Bắt đầu khởi tạo bộ đếm voucher...");

  // Chỉ lấy những voucher chưa có trường used_count
  const vouchersToInit = await Voucher.find({ used_count: { $exists: false } }).lean();
  console.log(`Tìm thấy ${vouchersToInit.length} voucher cần khởi tạo.`);

  let updatedCount = 0;
  for (const v of vouchersToInit) {
    const actualOrderCount = await Order.countDocuments({
      $or: [{ Voucher_id: v.code }, { Voucher_code: v.code }],
      Status: { $in: VOUCHER_COUNTED_ORDER_STATUSES },
    });

    const distinctUsers = await Order.distinct("User_id", {
      $or: [{ Voucher_id: v.code }, { Voucher_code: v.code }],
      Status: { $in: VOUCHER_COUNTED_ORDER_STATUSES },
    });

    const updateRes = await Voucher.updateOne(
      { _id: v._id, used_count: { $exists: false } },
      {
        $set: {
          used_count: actualOrderCount,
          used_user_ids: distinctUsers.filter(Boolean),
        },
      }
    );

    if (updateRes.modifiedCount > 0) {
      updatedCount++;
      console.log(`  + [${v.code}]: used_count = ${actualOrderCount}, used_user_ids: ${distinctUsers.length} users`);
    }
  }

  console.log(`Hoàn tất khởi tạo ${updatedCount}/${vouchersToInit.length} voucher.`);
  await mongoose.disconnect();
  console.log("Đã ngắt kết nối an toàn.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Lỗi thực thi init-voucher-counters:", err);
    process.exit(1);
  });
}

module.exports = { main };

