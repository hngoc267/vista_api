const { Voucher } = require("../models/schema");

function parseVietnameseDate(value) {
  if (!value) return null;

  const [day, month, year] = String(value).split("/");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function getDaysLeft(expiry) {
  const expiryDate = parseVietnameseDate(expiry);
  if (!expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
}

exports.getMyVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({}).sort({ createdAt: 1 }).lean();

    const data = vouchers.map((voucher) => {
      const daysLeft = getDaysLeft(voucher.expiry);

      return {
        code: voucher.code,
        title: voucher.title,
        condition: voucher.condition,
        type: voucher.type,
        category: voucher.category,
        status: voucher.status,
        expiry: voucher.expiry,
        daysLeft: voucher.status === "expiring" ? daysLeft : voucher.daysLeft,
        description: voucher.description,
        benefits: voucher.benefits || [],
        conditions: voucher.conditions || [],
        startDate: voucher.startDate,
        usageLimit: voucher.usageLimit,
        statusText: voucher.statusText,
      };
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

function parseMoney(value) {
  const text = String(value || "").toLowerCase();
  const millionMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tr)/i);
  if (millionMatch) {
    return Math.round(Number(millionMatch[1].replace(",", ".")) * 1000000);
  }

  const kMatch = text.match(/(\d+(?:[.,]\d+)?)\s*k/i);
  if (kMatch) {
    return Math.round(Number(kMatch[1].replace(",", ".")) * 1000);
  }

  const moneyMatch = text.match(/(\d{1,3}(?:[.\s]\d{3})+|\d+)\s*(đ|vnd|vnđ)?/i);
  if (!moneyMatch) {
    return 0;
  }

  return Number(String(moneyMatch[1]).replace(/[.\s]/g, "")) || 0;
}

function parsePercent(value) {
  const match = String(value || "").match(/(\d+(?:[.,]\d+)?)\s*%/);
  return match ? Number(match[1].replace(",", ".")) : 0;
}

function getMinOrderValue(voucher) {
  const texts = [
    voucher.condition,
    voucher.description,
    ...(Array.isArray(voucher.conditions) ? voucher.conditions : []),
  ];

  for (const text of texts) {
    const lower = String(text || "").toLowerCase();
    if (lower.includes("từ") || lower.includes("toi thieu") || lower.includes("tối thiểu")) {
      const value = parseMoney(text);
      if (value > 0) {
        return value;
      }
    }
  }

  return 0;
}

function getMaxDiscountAmount(voucher) {
  const texts = [
    voucher.description,
    ...(Array.isArray(voucher.benefits) ? voucher.benefits : []),
    ...(Array.isArray(voucher.conditions) ? voucher.conditions : []),
  ];

  for (const text of texts) {
    const lower = String(text || "").toLowerCase();
    if (lower.includes("tối đa") || lower.includes("toi da")) {
      const value = parseMoney(text);
      if (value > 0) {
        return value;
      }
    }
  }

  return 0;
}

function getFixedDiscountAmount(voucher) {
  const texts = [voucher.title, voucher.description, voucher.condition];
  for (const text of texts) {
    const value = parseMoney(text);
    if (value > 0) {
      return value;
    }
  }
  return 0;
}

exports.applyVoucher = async (req, res) => {
  try {
    const voucherCode = String(req.body.voucherCode || "").trim().toUpperCase();
    const totalItemsPrice = Number(req.body.totalItemsPrice) || 0;
    const shippingFee = Number(req.body.shippingFee) || 0;

    if (!voucherCode) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mã giảm giá.",
      });
    }

    const voucher = await Voucher.findOne({
      code: { $regex: new RegExp(`^${voucherCode}$`, "i") },
    }).lean();

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Mã giảm giá không tồn tại.",
      });
    }

    if (voucher.status === "used") {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá này đã được sử dụng.",
      });
    }

    const expiryDate = parseVietnameseDate(voucher.expiry);
    if (expiryDate) {
      expiryDate.setHours(23, 59, 59, 999);
      if (expiryDate < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Mã giảm giá đã hết hạn.",
        });
      }
    }

    const minOrderValue = getMinOrderValue(voucher);
    if (minOrderValue > 0 && totalItemsPrice < minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng cần tối thiểu ${minOrderValue.toLocaleString("vi-VN")}đ để áp dụng mã này.`,
      });
    }

    let discountAmount = 0;
    let shippingDiscount = 0;

    if (voucher.type === "shipping" || voucher.category === "freeship") {
      const fixedShippingDiscount = getFixedDiscountAmount(voucher);
      shippingDiscount = fixedShippingDiscount > 0 ? Math.min(fixedShippingDiscount, shippingFee) : shippingFee;
    } else {
      const percent = parsePercent(`${voucher.title} ${voucher.description}`);
      if (percent > 0) {
        discountAmount = Math.round(totalItemsPrice * percent / 100);
        const maxDiscountAmount = getMaxDiscountAmount(voucher);
        if (maxDiscountAmount > 0) {
          discountAmount = Math.min(discountAmount, maxDiscountAmount);
        }
      } else {
        discountAmount = getFixedDiscountAmount(voucher);
      }
    }

    return res.json({
      success: true,
      message: `Đã áp dụng mã ${voucher.code}.`,
      data: {
        voucherId: voucher.code,
        discountAmount,
        shippingDiscount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
