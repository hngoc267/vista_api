const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/schema");

async function generateUniqueUserId() {
  const users = await User.find({ User_id: /^USR_\d+$/ }).select("User_id").lean();
  const maxNumber = users.reduce((max, user) => {
    const match = String(user.User_id || "").match(/^USR_(\d+)$/);
    return match ? Math.max(max, Number(match[1]) || 0) : max;
  }, 0);

  let nextNumber = maxNumber + 1;
  let candidate = `USR_${String(nextNumber).padStart(3, "0")}`;

  while (await User.exists({ User_id: candidate })) {
    nextNumber += 1;
    candidate = `USR_${String(nextNumber).padStart(3, "0")}`;
  }

  return candidate;
}

// Đăng ký
exports.register = async (req, res) => {
  try {
    const { Username, Email, Password, Full_name, Phone_number } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingEmail = await User.findOne({ Email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email đã được sử dụng" });
    }

    // Kiểm tra username đã tồn tại chưa
    const existingUsername = await User.findOne({ Username });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: "Tên đăng nhập đã được sử dụng" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Tạo User_id
    const User_id = await generateUniqueUserId();

    // Tạo user mới
    const newUser = await User.create({
      User_id,
      Username,
      Email,
      Password: hashedPassword,
      Full_name,
      Phone_number,
      Status: "active",
      Created_at: new Date(),
    });

    // Tạo token
    const token = jwt.sign(
      { User_id: newUser.User_id, Email: newUser.Email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
      token,
      user: {
        User_id: newUser.User_id,
        Username: newUser.Username,
        Email: newUser.Email,
        Full_name: newUser.Full_name,
        Phone_number: newUser.Phone_number,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    // Tìm user theo email
    const user = await User.findOne({ Email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    // Kiểm tra tài khoản bị khóa
    if (user.Status === "blocked") {
      return res.status(403).json({ success: false, message: "Tài khoản đã bị khóa" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    // Tạo token
    const token = jwt.sign(
      { User_id: user.User_id, Email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Đăng nhập thành công!",
      token,
      user: {
        User_id: user.User_id,
        Username: user.Username,
        Email: user.Email,
        Full_name: user.Full_name,
        Phone_number: user.Phone_number,
        Total_spent: user.Total_spent
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy thông tin user hiện tại
exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne(
      { User_id: req.user.User_id },
      { Password: 0 } // ẩn password
    );
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật hồ sơ (Đã bổ sung nhận Điểm Thành Viên)
exports.updateProfile = async (req, res) => {
  try {
    // 1. Lấy thêm totalSpent từ Frontend gửi xuống
    const { Full_name, Phone_number, totalSpent } = req.body;

    // 2. Tạo một object chứa các trường cần update
    const updateData = {};
    if (Full_name !== undefined) updateData.Full_name = Full_name;
    if (Phone_number !== undefined) updateData.Phone_number = Phone_number;
    
    // 3. Nếu Frontend có gửi điểm lên thì map nó vào cột Total_spent trong DB
    if (totalSpent !== undefined) {
      updateData.Total_spent = totalSpent;
    }

    // 4. Update bằng $set để không làm mất dữ liệu cũ
    const user = await User.findOneAndUpdate(
      { User_id: req.user.User_id },
      { $set: updateData },
      { new: true, projection: { Password: 0 } }
    );

    res.json({ success: true, message: "Cập nhật thành công!", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findOne({ User_id: req.user.User_id });

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.Password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Mật khẩu cũ không đúng" });
    }

    // Cập nhật mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate(
      { User_id: req.user.User_id },
      { Password: hashedPassword }
    );

    res.json({ success: true, message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const nodemailer = require("nodemailer");

// Cấu hình cấu hình hệ thống gửi mail tự động (Sử dụng Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Email của hệ thống VISTA
    pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng (App Password) của Gmail
  },
});

// 1. API QUÊN MẬT KHẨU: Tạo mã OTP và gửi Email
exports.forgotPassword = async (req, res) => {
  try {
    const { Email } = req.body;

    // Kiểm tra xem email có tồn tại trong hệ thống chưa
    const user = await User.findOne({ Email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Email này không tồn tại trên hệ thống!" });
    }

    // Sinh mã OTP ngẫu nhiên gồm 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Thiết lập thời gian hết hạn cho OTP (5 phút kể từ bây giờ)
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    // Lưu mã OTP và thời gian hết hạn trực tiếp vào document của User bằng $set
    await User.findOneAndUpdate(
      { Email },
      { $set: { Reset_otp: otp, Reset_otp_expires: otpExpires } }
    );

    // Nội dung Email gửi cho khách hàng
    const mailOptions = {
      from: `"VISTA Support" <${process.env.EMAIL_USER}>`,
      to: Email,
      subject: "[VISTA] - Mã xác thực đặt lại mật khẩu tài khoản",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px;">
          <h2 style="color: #2563b0; text-align: center;">XÁC THỰC MẬT KHẨU VISTA</h2>
          <p>Xin chào <strong>${user.Full_name}</strong>,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu từ bạn. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quy trình:</p>
          <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2563b0; border-radius: 8px; margin: 24px 0;">
            ${otp}
          </div>
          <p style="color: #ef4444; font-size: 13px;">* Lưu ý: Mã OTP này chỉ có hiệu lực trong vòng 5 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Đây là email tự động từ hệ thống VISTA, vui lòng không phản hồi email này.</p>
        </div>
      `,
    };

    // Tiến hành gửi email đi
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Mã OTP đã được gửi đến email của bạn!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. API XÁC THỰC MÃ OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { Email, otpCode } = req.body;

    const user = await User.findOne({ 
      Email,
      Reset_otp: otpCode,
      Reset_otp_expires: { $gt: new Date() } // Kiểm tra xem thời gian hết hạn có lớn hơn hiện tại không
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Mã OTP không chính xác hoặc đã hết hạn!" });
    }

    res.json({ success: true, message: "Xác thực mã OTP thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. API ĐẶT LẠI MẬT KHẨU MỚI
exports.resetPassword = async (req, res) => {
  try {
    const { Email, otpCode, Password } = req.body;

    // Kiểm tra lại một lần nữa tính hợp lệ của OTP trước khi cho đổi pass
    const user = await User.findOne({ 
      Email,
      Reset_otp: otpCode,
      Reset_otp_expires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Yêu cầu đã hết hạn. Vui lòng thao tác lại từ đầu!" });
    }

    // Mã hóa mật khẩu mới bằng Bcrypt
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Lưu mật khẩu mới và xóa sạch dấu vết OTP cũ đi
    await User.findOneAndUpdate(
      { Email },
      { 
        $set: { Password: hashedPassword },
        $unset: { Reset_otp: "", Reset_otp_expires: "" } // Xóa bỏ 2 trường này khỏi DB sau khi xong việc
      }
    );

    res.json({ success: true, message: "Đặt lại mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
