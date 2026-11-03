const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Load cấu hình test an toàn từ .env.test
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

const { User } = require("../models/schema");
const authMiddleware = require("../middleware/auth.middleware");
const authController = require("../controllers/auth.controller");

const TEST_USER_1_ID = "TEST_SEC_USR_001";
const TEST_USER_2_ID = "TEST_SEC_USR_002";
const INITIAL_PASSWORD_PLAIN = "SecurePass123!";
const INITIAL_SPENT_1 = 500000;
const INITIAL_SPENT_2 = 1000000;

let testTokenUser1 = "";

function createMockRes(onFinish) {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      if (onFinish) onFinish(this);
      return this;
    },
  };
}

async function callProfileApi(token, body) {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (resObj) => {
      if (!resolved) {
        resolved = true;
        resolve(resObj);
      }
    };

    const req = {
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body,
    };
    const res = createMockRes(finish);

    authMiddleware(req, res, async (err) => {
      if (err) {
        res.status(500).json({ success: false, message: err.message });
        return;
      }
      try {
        await authController.updateProfile(req, res);
      } catch (handlerErr) {
        res.status(500).json({ success: false, message: handlerErr.message });
      }
    });
  });
}

test.before(async () => {
  // 1. Kiểm tra an toàn database
  const mongoUri = process.env.MONGODB_URI || "";
  if (!mongoUri.includes("vista_test")) {
    throw new Error(
      `ABORT: Database URI must target 'vista_test'. Refusing to run on: ${mongoUri}`
    );
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  const dbName = mongoose.connection.name;
  if (dbName !== "vista_test") {
    throw new Error(
      `ABORT: Connected database name is '${dbName}', expected 'vista_test'!`
    );
  }

  // 2. Dọn dẹp user test cũ nếu còn sót
  await User.deleteMany({
    User_id: { $in: [TEST_USER_1_ID, TEST_USER_2_ID] },
  });

  const hashedPassword = await bcrypt.hash(INITIAL_PASSWORD_PLAIN, 10);

  // 3. Tạo User fixture 1
  await User.create({
    User_id: TEST_USER_1_ID,
    Username: "test_sec_user_001",
    Email: "test_sec_user_001@vista.test.local",
    Password: hashedPassword,
    Full_name: "Nguyễn Văn Test Ban Đầu",
    Phone_number: "0912345678",
    Role: "Customer",
    Status: "active",
    Total_spent: INITIAL_SPENT_1,
    Failed_Login_Count: 0,
    Locked_Until: null,
    Reset_otp: null,
    Reset_otp_expires: null,
    Admin_reset_otp_hash: null,
    Admin_reset_otp_expires: null,
  });

  // 4. Tạo User fixture 2 (dùng cho test SEC-10)
  await User.create({
    User_id: TEST_USER_2_ID,
    Username: "test_sec_user_002",
    Email: "test_sec_user_002@vista.test.local",
    Password: hashedPassword,
    Full_name: "User Phụ Khác Không Thể Chạm",
    Phone_number: "0987654321",
    Role: "Customer",
    Status: "active",
    Total_spent: INITIAL_SPENT_2,
  });

  // 5. Khởi tạo JWT Token cho User 1
  testTokenUser1 = jwt.sign(
    { User_id: TEST_USER_1_ID, Email: "test_sec_user_001@vista.test.local", Role: "Customer" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
});

test.after(async () => {
  // Dọn dẹp an toàn các user test
  await User.deleteMany({
    User_id: { $in: [TEST_USER_1_ID, TEST_USER_2_ID] },
  });
  await mongoose.disconnect();
});

// ==========================================
// TEST CASES: SEC-01 ĐẾN SEC-14
// ==========================================

test("SEC-01: Khách hàng cập nhật Full_name hợp lệ thành công", async () => {
  const newName = "Nguyễn Văn Hợp Lệ Mới";
  const res = await callProfileApi(testTokenUser1, { Full_name: newName });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.Full_name, newName);

  // Xác minh DB
  const dbUser = await User.findOne({ User_id: TEST_USER_1_ID }).lean();
  assert.equal(dbUser.Full_name, newName);
});

test("SEC-02: Khách hàng cập nhật Phone_number hợp lệ thành công", async () => {
  const newPhone = "0933112233";
  const res = await callProfileApi(testTokenUser1, { Phone_number: newPhone });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.Phone_number, newPhone);

  // Xác minh DB
  const dbUser = await User.findOne({ User_id: TEST_USER_1_ID }).lean();
  assert.equal(dbUser.Phone_number, newPhone);
});

test("SEC-03: Khách hàng cập nhật đồng thời Full_name và Phone_number hợp lệ", async () => {
  const updatedName = "Nguyễn Văn Hoàn Chỉnh";
  const updatedPhone = "0944556677";
  const res = await callProfileApi(testTokenUser1, {
    Full_name: updatedName,
    Phone_number: updatedPhone,
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.Full_name, updatedName);
  assert.equal(res.body.data.Phone_number, updatedPhone);

  // Xác minh DB
  const dbUser = await User.findOne({ User_id: TEST_USER_1_ID }).lean();
  assert.equal(dbUser.Full_name, updatedName);
  assert.equal(dbUser.Phone_number, updatedPhone);
});

test("SEC-04: Gửi thêm Total_spent/totalSpent -> Database Total_spent không thay đổi", async () => {
  const res = await callProfileApi(testTokenUser1, {
    Full_name: "Tên Đổi Khi Cài Cắm Chi Tiêu",
    totalSpent: 999999999,
    Total_spent: 888888888,
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);

  // Database verification
  const dbUser = await User.findOne({ User_id: TEST_USER_1_ID }).lean();
  assert.equal(
    dbUser.Total_spent,
    INITIAL_SPENT_1,
    `Total_spent in DB must remain ${INITIAL_SPENT_1}, but got ${dbUser.Total_spent}`
  );
  assert.equal(dbUser.Full_name, "Tên Đổi Khi Cài Cắm Chi Tiêu");
});

test("SEC-05: Gửi thêm Role: 'Manager' -> Database Role không thay đổi (giữ Customer)", async () => {
  const res = await callProfileApi(testTokenUser1, {
    Full_name: "Tên Đổi Khi Cài Cắm Quyền Quản Trị",
    Role: "Manager",
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);

  // Database verification
  const dbUser = await User.findOne({ User_id: TEST_USER_1_ID }).lean();
  assert.equal(
    dbUser.Role,
    "Customer",
    `Role in DB must remain Customer, but got ${dbUser.Role}`
  );
  assert.equal(dbUser.Full_name, "Tên Đổi Khi Cài Cắm Quyền Quản Trị");
});

test("SEC-06: Gửi thêm Status: 'blocked' -> Database Status không thay đổi (giữ active)", async () => {
  const res = await callProfileApi(testTokenUser1, {
    Full_name: "Tên Đổi Khi Cài Cắm Trạng Thái",
    Status: "blocked",
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);

  // Database verification
  const dbUser = await User.findOne({ User_id: TEST_USER_1_ID }).lean();
  assert.equal(
    dbUser.Status,
    "active",
    `Status in DB must remain active, but got ${dbUser.Status}`
  );
});

test("SEC-07: Gửi thêm Password -> Database Password hash không thay đổi", async () => {
  const res = await callProfileApi(testTokenUser1, {
    Full_name: "Tên Đổi Khi Cài Cắm Mật Khẩu",
    Password: "MaliciousPassword999!",
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  // Response không được trả Password
  assert.equal(res.body.data.Password, undefined);

  // Database verification: Kiểm tra password hash trong DB vẫn khớp với mật khẩu ban đầu
  const dbUser = await User.findOne({ User_id: TEST_USER_1_ID }).lean();
  const isMatchOriginal = await bcrypt.compare(INITIAL_PASSWORD_PLAIN, dbUser.Password);
  assert.equal(isMatchOriginal, true, "Original password hash must still be valid");

  const isMatchMalicious = await bcrypt.compare("MaliciousPassword999!", dbUser.Password);
  assert.equal(isMatchMalicious, false, "Malicious password must NOT match in DB");
});

test("SEC-08: Gửi Failed_Login_Count và Locked_Until -> Các trường không thay đổi trong DB", async () => {
  const res = await callProfileApi(testTokenUser1, {
    Full_name: "Tên Đổi Khi Cài Cắm Khóa Đăng Nhập",
    Failed_Login_Count: 10,
    Locked_Until: new Date("2035-01-01T00:00:00Z"),
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);

  // Database verification
  const dbUser = await User.findOne({ User_id: TEST_USER_1_ID }).lean();
  assert.equal(dbUser.Failed_Login_Count, 0);
  assert.equal(dbUser.Locked_Until, null);
});

test("SEC-09: Gửi trường OTP và Admin OTP -> Các trường OTP trong DB không thay đổi", async () => {
  const res = await callProfileApi(testTokenUser1, {
    Full_name: "Tên Đổi Khi Cài Cắm OTP",
    Reset_otp: "999888",
    Reset_otp_expires: new Date("2030-01-01T00:00:00Z"),
    Admin_reset_otp_hash: "malicious_admin_hash",
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  // Response không được chứa các trường OTP
  assert.equal(res.body.data.Reset_otp, undefined);
  assert.equal(res.body.data.Admin_reset_otp_hash, undefined);

  // Database verification
  const dbUser = await User.findOne({ User_id: TEST_USER_1_ID }).lean();
  assert.equal(dbUser.Reset_otp, null);
  assert.equal(dbUser.Reset_otp_expires, null);
  assert.equal(dbUser.Admin_reset_otp_hash, null);
});

test("SEC-10: Gửi User_id của user khác trong body -> Không thể cập nhật user khác", async () => {
  const res = await callProfileApi(testTokenUser1, {
    User_id: TEST_USER_2_ID,
    Full_name: "Hacked User 2 Name",
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);

  // Database verification: User 2 hoàn toàn không bị ảnh hưởng
  const user2 = await User.findOne({ User_id: TEST_USER_2_ID }).lean();
  assert.equal(
    user2.Full_name,
    "User Phụ Khác Không Thể Chạm",
    "User 2 profile must remain untouched"
  );

  // Tên chỉ được cập nhật cho User 1 (chủ nhân của token)
  const user1 = await User.findOne({ User_id: TEST_USER_1_ID }).lean();
  assert.equal(user1.Full_name, "Hacked User 2 Name");
});

test("SEC-11: Không truyền token -> Trả về lỗi 401 Unauthorized từ middleware", async () => {
  const res = await callProfileApi(null, { Full_name: "Tên Bất Hợp Pháp" });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Vui lòng đăng nhập/);
});

test("SEC-12: Token không hợp lệ -> Trả về lỗi 401 Unauthorized", async () => {
  const res = await callProfileApi("invalid.token.tampered", { Full_name: "Tên Bất Hợp Pháp" });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Token không hợp lệ hoặc đã hết hạn/);
});

test("SEC-13: Gửi body không hợp lệ (null, mảng, kiểu nguyên thủy) -> Trả về lỗi 400 Bad Request", async () => {
  // Test body null
  let res = await callProfileApi(testTokenUser1, null);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);

  // Test body mảng
  res = await callProfileApi(testTokenUser1, ["malicious", "payload"]);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);

  // Test body chuỗi thô
  res = await callProfileApi(testTokenUser1, "just_a_string");
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);

  // Test Full_name là chuỗi rỗng
  res = await callProfileApi(testTokenUser1, { Full_name: "   " });
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("SEC-14: Gửi request không có trường hợp lệ nào (hoặc chỉ gửi trường cấm) -> Trả về 400, không ghi dữ liệu", async () => {
  // Gửi object rỗng
  let res = await callProfileApi(testTokenUser1, {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Không có trường thông tin hợp lệ để cập nhật/);

  // Chỉ gửi trường bị cấm
  res = await callProfileApi(testTokenUser1, {
    totalSpent: 123456789,
    Role: "Manager",
    Status: "blocked",
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Không có trường thông tin hợp lệ để cập nhật/);

  // Xác minh DB vẫn giữ nguyên giá trị
  const dbUser = await User.findOne({ User_id: TEST_USER_1_ID }).lean();
  assert.equal(dbUser.Total_spent, INITIAL_SPENT_1);
  assert.equal(dbUser.Role, "Customer");
  assert.equal(dbUser.Status, "active");
});

