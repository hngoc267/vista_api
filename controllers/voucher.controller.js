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

function calculateProductFinalPrice(originalPrice, product) {
  const discount = Math.max(0, Math.min(100, Number(product?.Discount) || 0));
  return Math.round((Number(originalPrice) || 0) * (100 - discount) / 100);
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

function getVietnamDateParts(date = new Date()) {
  const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return {
    day: vietnamTime.getUTCDate(),
    month: vietnamTime.getUTCMonth() + 1,
    year: vietnamTime.getUTCFullYear(),
  };
}

function getDateNumber({ day, month, year }) {
  return year * 10000 + month * 100 + day;
}

function getVoucherExpiryParts(expiry) {
  if (!expiry) return null;

  const raw = cleanString(expiry);
  const slashParts = raw.split("/");
  if (slashParts.length === 3) {
    const [day, month, year] = slashParts.map((part) => Number(part));
    if (day && month && year) {
      return { day, month, year };
    }
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return getVietnamDateParts(parsed);
}

function endOfDay(date) {
  if (!date) return null;
  const cloned = new Date(date);
  cloned.setHours(23, 59, 59, 999);
  return cloned;
}

function getDaysLeft(expiry) {
  const expiryParts = getVoucherExpiryParts(expiry);
  if (!expiryParts) return null;

  const todayParts = getVietnamDateParts();
  const todayUtc = Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day);
  const expiryUtc = Date.UTC(expiryParts.year, expiryParts.month - 1, expiryParts.day);

  return Math.round((expiryUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

function isVoucherExpired(voucher) {
  const expiryParts = getVoucherExpiryParts(voucher?.expiry);
  if (!expiryParts) return false;

  return getDateNumber(expiryParts) < getDateNumber(getVietnamDateParts());
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

function hasPerAccountUsageRule(voucher) {
  return voucherTexts(voucher).some((text) => {
    const normalized = normalizeText(text);
    return (
      normalized.includes("moi tai khoan") ||
      normalized.includes("tai khoan su dung") ||
      normalized.includes("tai khoan cua ban")
    );
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

async function resolveOrderContext(orderItems, fallbackSubtotal, fallbackTotalQuantity) {
  const normalizedItems = Array.isArray(orderItems)
    ? orderItems
        .map((item) => ({
          productVariantId: cleanString(item.productVariantId || item.Product_variant_id),
          quantity: Math.max(1, Number(item.quantity || item.Quantity) || 1),
          clientPrice: Number(item.price || item.Price) || 0,
        }))
        .filter((item) => item.productVariantId)
    : [];

  if (normalizedItems.length === 0) {
    return {
      totalItemsPrice: Math.max(0, Number(fallbackSubtotal) || 0),
      totalQuantity: Math.max(0, Number(fallbackTotalQuantity) || 0),
      orderItems: [],
    };
  }

  const variants = await Product_variant.find({
    Product_variant_id: { $in: normalizedItems.map((item) => item.productVariantId) },
    Status: "active",
  }).lean();
  const variantMap = new Map(variants.map((variant) => [variant.Product_variant_id, variant]));

  if (variants.length !== normalizedItems.length) {
    throw createVoucherError("Một số phiên bản sản phẩm không còn khả dụng.");
  }

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

  const resolvedItems = normalizedItems.map((item) => {
    const variant = variantMap.get(item.productVariantId);
    const product = variant ? productMap.get(variant.Product_id) : null;
    const category = product ? categoryMap.get(product.Category_id) : null;
    const price = calculateProductFinalPrice(variant?.Price, product);

    return {
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      price,
      searchable: normalizeText(
        `${category?.Category_name || ""} ${product?.Product_name || ""} ${variant?.Variant_name || ""}`
      ),
    };
  });

  return {
    totalItemsPrice: resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    totalQuantity: resolvedItems.reduce((sum, item) => sum + item.quantity, 0),
    orderItems: resolvedItems,
  };
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
      searchable: normalizeText(item.searchable),
    }))
    .filter((item) => item.productVariantId);

  if (normalizedItems.length === 0) {
    return fallbackSubtotal;
  }

  if (normalizedItems.every((item) => item.searchable)) {
    const eligibleSubtotal = normalizedItems.reduce((sum, item) => {
      const isEligible = aliases.some((alias) => item.searchable.includes(alias));
      return isEligible ? sum + item.price * item.quantity : sum;
    }, 0);

    if (eligibleSubtotal <= 0) {
      throw createVoucherError("Mã giảm giá không áp dụng cho sản phẩm trong đơn hàng này.");
    }

    return eligibleSubtotal;
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

function getEligibleSubtotalFromResolvedItems(voucher, orderItems, fallbackSubtotal) {
  const aliases = detectRequiredCategoryAliases(voucher);
  if (aliases.length === 0 || !Array.isArray(orderItems) || orderItems.length === 0) {
    return fallbackSubtotal;
  }

  const eligibleSubtotal = orderItems.reduce((sum, item) => {
    const searchable = normalizeText(item.searchable);
    const isEligible = aliases.some((alias) => searchable.includes(alias));
    return isEligible ? sum + (Number(item.price) || 0) * (Number(item.quantity) || 1) : sum;
  }, 0);

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

  if (hasPerAccountUsageRule(voucher)) {
    if (!userId) {
      throw createVoucherError("Bạn cần đăng nhập để áp dụng mã giới hạn theo tài khoản.");
    }

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

  if (!foundVoucher) {
    await assertVoucherCanBeUsed(foundVoucher, {
      userId: cleanString(userId),
      totalItemsPrice: Number(totalItemsPrice) || 0,
      totalQuantity: Number(totalQuantity) || 0,
    });
  }

  const resolvedContext = await resolveOrderContext(orderItems, totalItemsPrice, totalQuantity);
  const orderSubtotal = resolvedContext.totalItemsPrice;
  const orderQuantity = resolvedContext.totalQuantity;

  await assertVoucherCanBeUsed(foundVoucher, {
    userId: cleanString(userId),
    totalItemsPrice: orderSubtotal,
    totalQuantity: orderQuantity,
  });

  const originalShippingFee = Math.max(0, Number(shippingFee) || 0);
  const eligibleSubtotal = await getEligibleSubtotal(foundVoucher, resolvedContext.orderItems, orderSubtotal);
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

  if (discountAmount <= 0 && shippingDiscount <= 0) {
    if (foundVoucher.type === "shipping" || foundVoucher.category === "freeship") {
      throw createVoucherError("Phương thức vận chuyển hiện tại đã miễn phí, vui lòng chọn mã giảm giá khác.");
    }

    throw createVoucherError("Voucher không tạo ra ưu đãi cho đơn hàng hiện tại.");
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
    return "Mã giảm giá này đã hết lượt sử dụng.";
  }

  // --- THÊM LOGIC CHECK HẠNG Ở ĐÂY ---
  if (context.userTierLevel !== undefined) {
    const requiredTier = Number(voucher?.Required_tier) || 0;
    if (context.userTierLevel < requiredTier) {
       const tierNames = ["Bronze", "Silver", "Gold", "Diamond"];
       const requiredName = tierNames[requiredTier] || "Hạng cao hơn";
       return `Mã này dành riêng cho thành viên hạng ${requiredName} trở lên.`;
    }
  }
  // ------------------------------------

  if (context.userId && hasFirstOrderRule(voucher)) {
    if (context.userHasAnyOrder) {
      return "Mã này chỉ áp dụng cho đơn hàng đầu tiên.";
    }
  }

  if (context.userId && context.usedVoucherCodes?.has(normalizedCode)) {
      return "Tài khoản của bạn đã sử dụng mã giảm giá này.";
  }

  if (context.hasOrderContext) {
    const minOrderValue = getMinOrderValue(voucher);
    const totalItemsPrice = Math.max(0, Number(context.totalItemsPrice) || 0);
    const totalQuantity = Math.max(0, Number(context.totalQuantity) || 0);
    const shippingFee = Math.max(0, Number(context.shippingFee) || 0);

    if (minOrderValue > 0 && totalItemsPrice < minOrderValue) {
      return `Đơn hàng cần tối thiểu ${minOrderValue.toLocaleString("vi-VN")}đ để áp dụng mã này.`;
    }

    if (hasComboRule(voucher) && totalQuantity < 2) {
      return "Mã combo chỉ áp dụng khi mua từ 2 sản phẩm trở lên.";
    }

    if (detectRequiredCategoryAliases(voucher).length > 0) {
      const eligibleSubtotal = getEligibleSubtotalFromResolvedItems(
        voucher,
        context.orderItems || [],
        totalItemsPrice
      );

      if (eligibleSubtotal <= 0) {
        return "Mã giảm giá không áp dụng cho sản phẩm trong đơn hàng này.";
      }
    }

    if ((voucher?.type === "shipping" || voucher?.category === "freeship") && shippingFee <= 0) {
      return "Phương thức vận chuyển hiện tại đã miễn phí.";
    }

    const hasDiscountValue =
      voucher?.type === "shipping" ||
      voucher?.category === "freeship" ||
      getPercentDiscountValue(voucher) > 0 ||
      getFixedDiscountAmount(voucher) > 0;

    if (!hasDiscountValue) {
      return "Voucher chưa có giá trị giảm hợp lệ.";
    }
  }

  return "";
}

function buildVoucherStatusText(unavailableReason, daysLeft) {
  if (unavailableReason) {
    return unavailableReason;
  }

  if (daysLeft === 0) {
    return "Còn hiệu lực đến hết hôm nay.";
  }

  if (typeof daysLeft === "number" && daysLeft > 0 && daysLeft <= 3) {
    return `Còn ${daysLeft} ngày.`;
  }

  return "Còn hiệu lực.";
}

function mapVoucherForClient(voucher, context = {}) {
  const daysLeft = getDaysLeft(voucher.expiry);
  const unavailableReason = getVoucherListUnavailableReason(voucher, context);
  const isExpired = isVoucherExpired(voucher);
  
  // 1. Lấy mã voucher viết hoa để so sánh chuẩn xác
  const normalizedCode = cleanString(voucher?.code).toUpperCase();
  
  // 2. Kiểm tra CHÍNH XÁC xem tài khoản này đã từng dùng mã này chưa
  const hasUserUsedIt = context.usedVoucherCodes?.has(normalizedCode);

  let status = voucher.status;

  if (hasUserUsedIt) {
    // Nếu ĐÚNG là user này đã dùng -> Hiện ở tab Đã dùng
    status = "used"; 
  } else if (unavailableReason) {
    // Nếu user chưa dùng nhưng không thỏa mãn điều kiện khác (hết lượt hệ thống, chưa đủ hạng, sai đơn...)
    if (isExpired) {
      status = "expired";
    } else {
      status = "unavailable"; // Sẽ hiển thị là Không khả dụng chứ không bị nhảy vào tab Đã dùng nữa
    }
  } else if (daysLeft !== null && daysLeft <= 3 && voucher.status === "available") {
    status = "expiring";
  }

  return {
    code: voucher.code,
    title: voucher.title,
    condition: voucher.condition,
    type: voucher.type,
    category: voucher.category,
    status, // Trả về status đã được phân loại chuẩn xác
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
    statusText: buildVoucherStatusText(unavailableReason, daysLeft),
  };
}

exports.getMyVouchers = async (req, res) => {
  try {
    const userId = cleanString(req.query.userId);
    const totalItemsPrice = Number(req.query.totalItemsPrice) || 0;
    const shippingFee = Number(req.query.shippingFee) || 0;
    const totalQuantity = Number(req.query.totalQuantity) || 0;
    let queryOrderItems = [];

    if (typeof req.query.orderItems === "string" && req.query.orderItems.trim()) {
      try {
        const parsed = JSON.parse(req.query.orderItems);
        queryOrderItems = Array.isArray(parsed) ? parsed : [];
      } catch {
        queryOrderItems = [];
      }
    }

    const hasOrderContext = totalItemsPrice > 0 || totalQuantity > 0 || queryOrderItems.length > 0;
    const resolvedContext = hasOrderContext
      ? await resolveOrderContext(queryOrderItems, totalItemsPrice, totalQuantity)
      : {
          totalItemsPrice: 0,
          totalQuantity: 0,
          orderItems: [],
        };
    
    // Lấy toàn bộ voucher trong DB
    const vouchers = await Voucher.find({}).sort({ createdAt: 1 }).lean();
    
    let userHasAnyOrder = false;
    let usedVoucherCodes = new Set();
    let userTierLevel = 0; // Mặc định là hạng 0 (Bronze)

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

      // Móc Hạng Thành Viên từ Database User
      const { User } = require("../models/schema");
      const userDoc = await User.findOne({ User_id: userId }).lean();
      if (userDoc) {
          const spent = Number(userDoc.Total_spent) || 0;
          if (spent >= 100000000) userTierLevel = 3;      // Diamond
          else if (spent >= 50000000) userTierLevel = 2;  // Gold
          else if (spent >= 10000000) userTierLevel = 1;  // Silver
      }
    }

    // XỬ LÝ LỌC & ĐÓNG GÓI DATA
    const data = vouchers
      .filter(voucher => {
         // 👇 CHẶN NGAY TỪ ĐẦU: Chỉ cho phép voucher đi qua nếu Hạng của khách >= Hạng yêu cầu
         const requiredTier = Number(voucher.Required_tier) || 0;
         return requiredTier === 0 || requiredTier === userTierLevel;
      })
      .map((voucher) =>
        mapVoucherForClient(voucher, {
          userId,
          userHasAnyOrder,
          usedVoucherCodes,
          hasOrderContext,
          totalItemsPrice: resolvedContext.totalItemsPrice,
          totalQuantity: resolvedContext.totalQuantity,
          shippingFee,
          orderItems: resolvedContext.orderItems,
          userTierLevel
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
