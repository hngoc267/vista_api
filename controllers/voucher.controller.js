const {
  Category,
  Order,
  Product,
  Product_variant,
  Voucher,
} = require("../models/schema");

function cleanString(value) {
  return String(value || "").trim();
}

function normalizeText(value) {
  return cleanString(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createVoucherError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseVietnameseDate(value) {
  if (!value) return null;

  const raw = cleanString(value);
  const parts = raw.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map((part) => Number(part));
    if (day && month && year) {
      return new Date(year, month - 1, day);
    }
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function endOfDay(date) {
  if (!date) return null;
  const cloned = new Date(date);
  cloned.setHours(23, 59, 59, 999);
  return cloned;
}

function getDaysLeft(expiry) {
  const expiryDate = parseVietnameseDate(expiry);
  if (!expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
}

function isVoucherExpired(voucher) {
  const expiryDate = endOfDay(parseVietnameseDate(voucher?.expiry));
  return !!expiryDate && expiryDate < new Date();
}

function parseMoney(value) {
  const text = normalizeText(value);
  const millionMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(trieu|tr)\b/i);
  if (millionMatch) {
    return Math.round(Number(millionMatch[1].replace(",", ".")) * 1000000);
  }

  const kMatch = text.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
  if (kMatch) {
    return Math.round(Number(kMatch[1].replace(",", ".")) * 1000);
  }

  const moneyMatch = text.match(/(\d{1,3}(?:[.\s]\d{3})+|\d+)\s*(d|vnd|vnd)?\b/i);
  if (!moneyMatch) {
    return 0;
  }

  return Number(String(moneyMatch[1]).replace(/[.\s]/g, "")) || 0;
}

function parsePercent(value) {
  const match = cleanString(value).match(/(\d+(?:[.,]\d+)?)\s*%/);
  return match ? Number(match[1].replace(",", ".")) : 0;
}

function voucherTexts(voucher) {
  return [
    voucher?.title,
    voucher?.condition,
    voucher?.description,
    ...(Array.isArray(voucher?.benefits) ? voucher.benefits : []),
    ...(Array.isArray(voucher?.conditions) ? voucher.conditions : []),
    voucher?.usageLimit,
    voucher?.statusText,
  ].filter(Boolean);
}

function getMinOrderValue(voucher) {
  const explicit = Number(voucher?.minOrderValue) || 0;
  if (explicit > 0) {
    return explicit;
  }

  for (const text of voucherTexts(voucher)) {
    const normalized = normalizeText(text);
    const looksLikeMinimum =
      normalized.includes("don hang tu") ||
      normalized.includes("don tu") ||
      normalized.includes("toi thieu") ||
      normalized.includes("tu ");

    if (looksLikeMinimum) {
      const value = parseMoney(text);
      if (value > 0) {
        return value;
      }
    }
  }

  return 0;
}

function getMaxDiscountAmount(voucher) {
  const explicit = Number(voucher?.maxDiscountAmount) || 0;
  if (explicit > 0) {
    return explicit;
  }

  for (const text of voucherTexts(voucher)) {
    const normalized = normalizeText(text);
    if (normalized.includes("toi da")) {
      const value = parseMoney(text);
      if (value > 0) {
        return value;
      }
    }
  }

  return 0;
}

function getPercentDiscountValue(voucher) {
  const explicit = Number(voucher?.discountValue) || 0;
  if (voucher?.type === "percent" && explicit > 0 && explicit <= 100) {
    return explicit;
  }

  for (const text of voucherTexts(voucher)) {
    const percent = parsePercent(text);
    if (percent > 0) {
      return percent;
    }
  }

  return 0;
}

function getFixedDiscountAmount(voucher) {
  const explicit = Number(voucher?.discountValue) || 0;
  if (voucher?.type !== "percent" && explicit > 0) {
    return explicit;
  }

  const texts = [
    voucher?.title,
    voucher?.description,
    ...(Array.isArray(voucher?.benefits) ? voucher.benefits : []),
  ].filter(Boolean);

  for (const text of texts) {
    const normalized = normalizeText(text);
    if (!normalized.includes("giam")) {
      continue;
    }

    const value = parseMoney(text);
    if (value > 0) {
      return value;
    }
  }

  return 0;
}

function hasComboRule(voucher) {
  return voucherTexts(voucher).some((text) => {
    const normalized = normalizeText(text);
    return (
      normalized.includes("combo") ||
      normalized.includes("mua tu 2") ||
      normalized.includes("2 san pham") ||
      normalized.includes("toi thieu 2 san pham")
    );
  });
}

function hasFirstOrderRule(voucher) {
  return voucherTexts(voucher).some((text) => {
    const normalized = normalizeText(text);
    return normalized.includes("don dau tien") || normalized.includes("tai khoan moi");
  });
}

function detectRequiredCategoryAliases(voucher) {
  const text = normalizeText(voucherTexts(voucher).join(" "));
  const aliases = [];

  if (text.includes("laptop")) {
    aliases.push("laptop");
  }

  if (text.includes("phu kien")) {
    aliases.push("phu kien", "chuot", "ban phim", "sac", "cap", "hub");
  }

  if (text.includes("tai nghe") || text.includes("loa")) {
    aliases.push("tai nghe", "loa", "thiet bi am thanh");
  }

  if (text.includes("gaming")) {
    aliases.push("gaming");
  }

  return [...new Set(aliases)];
}

async function getEligibleSubtotal(voucher, orderItems, fallbackSubtotal) {
  const aliases = detectRequiredCategoryAliases(voucher);
  if (aliases.length === 0 || !Array.isArray(orderItems) || orderItems.length === 0) {
    return fallbackSubtotal;
  }

  const normalizedItems = orderItems
    .map((item) => ({
      productVariantId: cleanString(item.productVariantId || item.Product_variant_id),
      quantity: Math.max(1, Number(item.quantity || item.Quantity) || 1),
      price: Number(item.price || item.Price) || 0,
    }))
    .filter((item) => item.productVariantId);

  if (normalizedItems.length === 0) {
    return fallbackSubtotal;
  }

  const variants = await Product_variant.find({
    Product_variant_id: { $in: normalizedItems.map((item) => item.productVariantId) },
  }).lean();
  const variantMap = new Map(variants.map((variant) => [variant.Product_variant_id, variant]));
  const productIds = [...new Set(variants.map((variant) => variant.Product_id).filter(Boolean))];
  const products = productIds.length
    ? await Product.find({ Product_id: { $in: productIds } }).lean()
    : [];
  const productMap = new Map(products.map((product) => [product.Product_id, product]));
  const categoryIds = [...new Set(products.map((product) => product.Category_id).filter(Boolean))];
  const categories = categoryIds.length
    ? await Category.find({ Category_id: { $in: categoryIds } }).lean()
    : [];
  const categoryMap = new Map(categories.map((category) => [category.Category_id, category]));

  const eligibleSubtotal = normalizedItems.reduce((sum, item) => {
    const variant = variantMap.get(item.productVariantId);
    const product = variant ? productMap.get(variant.Product_id) : null;
    const category = product ? categoryMap.get(product.Category_id) : null;
    const searchable = normalizeText(
      `${category?.Category_name || ""} ${product?.Product_name || ""} ${variant?.Variant_name || ""}`
    );
    const isEligible = aliases.some((alias) => searchable.includes(alias));
    return isEligible ? sum + item.price * item.quantity : sum;
  }, 0);

  if (eligibleSubtotal <= 0) {
    throw createVoucherError("Mã giảm giá không áp dụng cho sản phẩm trong đơn hàng này.");
  }

  return eligibleSubtotal;
}

async function assertVoucherCanBeUsed(voucher, { userId, totalItemsPrice, totalQuantity }) {
  if (!voucher) {
    throw createVoucherError("Mã giảm giá không tồn tại.", 404);
  }

  if (isVoucherExpired(voucher)) {
    throw createVoucherError("Mã giảm giá đã hết hạn.");
  }

  if (voucher.status === "used") {
    throw createVoucherError("Mã giảm giá này đã được sử dụng.");
  }

  const minOrderValue = getMinOrderValue(voucher);
  if (minOrderValue > 0 && totalItemsPrice < minOrderValue) {
    throw createVoucherError(
      `Đơn hàng cần tối thiểu ${minOrderValue.toLocaleString("vi-VN")}đ để áp dụng mã này.`
    );
  }

  if (hasComboRule(voucher) && totalQuantity < 2) {
    throw createVoucherError("Mã combo chỉ áp dụng khi mua từ 2 sản phẩm trở lên.");
  }

  if (hasFirstOrderRule(voucher)) {
    if (!userId) {
      throw createVoucherError("Bạn cần đăng nhập để áp dụng mã cho đơn đầu tiên.");
    }

    const hasAnyOrder = await Order.exists({ User_id: userId });
    if (hasAnyOrder) {
      throw createVoucherError("Mã này chỉ áp dụng cho đơn hàng đầu tiên.");
    }
  }

  if (userId && normalizeText(voucher.usageLimit).includes("moi tai khoan")) {
    const usedByUser = await Order.exists({
      User_id: userId,
      $or: [{ Voucher_id: voucher.code }, { Voucher_code: voucher.code }],
    });

    if (usedByUser) {
      throw createVoucherError("Tài khoản của bạn đã sử dụng mã giảm giá này.");
    }
  }
}

async function calculateVoucherDiscount({
  voucher,
  voucherCode,
  totalItemsPrice,
  shippingFee,
  totalQuantity,
  userId,
  orderItems,
}) {
  const normalizedCode = cleanString(voucherCode || voucher?.code).toUpperCase();
  const foundVoucher =
    voucher ||
    (normalizedCode
      ? await Voucher.findOne({
          code: { $regex: new RegExp(`^${escapeRegExp(normalizedCode)}$`, "i") },
        }).lean()
      : null);

  await assertVoucherCanBeUsed(foundVoucher, {
    userId: cleanString(userId),
    totalItemsPrice: Number(totalItemsPrice) || 0,
    totalQuantity: Number(totalQuantity) || 0,
  });

  const orderSubtotal = Math.max(0, Number(totalItemsPrice) || 0);
  const originalShippingFee = Math.max(0, Number(shippingFee) || 0);
  const eligibleSubtotal = await getEligibleSubtotal(foundVoucher, orderItems, orderSubtotal);
  const maxDiscountAmount = getMaxDiscountAmount(foundVoucher);
  let discountAmount = 0;
  let shippingDiscount = 0;

  if (foundVoucher.type === "shipping" || foundVoucher.category === "freeship") {
    const fixedShippingDiscount = getFixedDiscountAmount(foundVoucher);
    shippingDiscount =
      fixedShippingDiscount > 0
        ? Math.min(fixedShippingDiscount, originalShippingFee)
        : originalShippingFee;
  } else {
    const percent = getPercentDiscountValue(foundVoucher);
    if (percent > 0) {
      discountAmount = Math.round((eligibleSubtotal * percent) / 100);
      if (maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, maxDiscountAmount);
      }
    } else {
      const fixedDiscount = getFixedDiscountAmount(foundVoucher);
      discountAmount = Math.min(fixedDiscount, eligibleSubtotal);
    }
  }

  return {
    voucherId: foundVoucher.code,
    code: foundVoucher.code,
    title: foundVoucher.title,
    discountAmount: Math.max(0, Math.min(discountAmount, orderSubtotal)),
    shippingDiscount: Math.max(0, Math.min(shippingDiscount, originalShippingFee)),
    minOrderValue: getMinOrderValue(foundVoucher),
    maxDiscountAmount,
  };
}

function getVoucherListUnavailableReason(voucher, context = {}) {
  const normalizedCode = cleanString(voucher?.code).toUpperCase();

  if (isVoucherExpired(voucher)) {
    return "Mã giảm giá đã hết hạn.";
  }

  if (voucher?.status === "used") {
    return "Mã giảm giá này đã được sử dụng.";
  }

  if (hasFirstOrderRule(voucher) && context.userHasAnyOrder) {
    return "Mã này chỉ áp dụng cho đơn hàng đầu tiên.";
  }

  if (
    context.userId &&
    normalizeText(voucher?.usageLimit).includes("moi tai khoan") &&
    context.usedVoucherCodes?.has(normalizedCode)
  ) {
    return "Tài khoản của bạn đã sử dụng mã giảm giá này.";
  }

  return "";
}

function mapVoucherForClient(voucher, context = {}) {
  const daysLeft = getDaysLeft(voucher.expiry);
  const unavailableReason = getVoucherListUnavailableReason(voucher, context);
  const isExpired = isVoucherExpired(voucher);
  const status = unavailableReason
    ? (isExpired ? "expired" : "used")
    : (daysLeft !== null && daysLeft <= 3 && voucher.status === "available" ? "expiring" : voucher.status);

  return {
    code: voucher.code,
    title: voucher.title,
    condition: voucher.condition,
    type: voucher.type,
    category: voucher.category,
    status,
    expiry: voucher.expiry,
    daysLeft,
    description: voucher.description,
    benefits: voucher.benefits || [],
    conditions: voucher.conditions || [],
    startDate: voucher.startDate,
    minOrderValue: voucher.minOrderValue || getMinOrderValue(voucher),
    maxDiscountAmount: voucher.maxDiscountAmount || getMaxDiscountAmount(voucher),
    discountValue: voucher.discountValue || getPercentDiscountValue(voucher) || getFixedDiscountAmount(voucher),
    usageLimit: voucher.usageLimit,
    canApply: !unavailableReason,
    unavailableReason,
    statusText: unavailableReason || voucher.statusText || "Còn hiệu lực.",
  };
}

exports.getMyVouchers = async (req, res) => {
  try {
    const userId = cleanString(req.query.userId);
    const vouchers = await Voucher.find({}).sort({ createdAt: 1 }).lean();
    let userHasAnyOrder = false;
    let usedVoucherCodes = new Set();

    if (userId) {
      const orders = await Order.find({ User_id: userId })
        .select("Voucher_id Voucher_code")
        .lean();

      userHasAnyOrder = orders.length > 0;
      usedVoucherCodes = new Set(
        orders
          .flatMap((order) => [order.Voucher_id, order.Voucher_code])
          .map((code) => cleanString(code).toUpperCase())
          .filter(Boolean)
      );
    }

    const data = vouchers.map((voucher) =>
      mapVoucherForClient(voucher, {
        userId,
        userHasAnyOrder,
        usedVoucherCodes,
      })
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.applyVoucher = async (req, res) => {
  try {
    const voucherCode = cleanString(req.body.voucherCode).toUpperCase();
    const totalItemsPrice = Number(req.body.totalItemsPrice) || 0;
    const shippingFee = Number(req.body.shippingFee) || 0;
    const totalQuantity = Number(req.body.totalQuantity) || 0;
    const userId = cleanString(req.body.userId);
    const orderItems = Array.isArray(req.body.orderItems) ? req.body.orderItems : [];

    if (!voucherCode) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mã giảm giá.",
      });
    }

    const result = await calculateVoucherDiscount({
      voucherCode,
      totalItemsPrice,
      shippingFee,
      totalQuantity,
      userId,
      orderItems,
    });

    return res.json({
      success: true,
      message: `Đã áp dụng mã ${result.code}.`,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.calculateVoucherDiscount = calculateVoucherDiscount;
exports.isVoucherExpired = isVoucherExpired;
