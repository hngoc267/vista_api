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