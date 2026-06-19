const { v4: uuidv4 } = require("uuid");
const { Cart, Cart_item, Product, Product_variant } = require("../models/schema");

function getStringValue(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function parseQuantity(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildColorLabel(color) {
  if (!color) {
    return "";
  }

  const normalized = String(color).trim().toLowerCase();
  const colorMap = {
    black: "đen",
    white: "trắng",
    silver: "bạc",
    gray: "xám",
    grey: "xám",
    graphite: "xám than",
    navy: "xanh navy",
    blue: "xanh dương",
    green: "xanh lá",
    pink: "hồng",
    red: "đỏ",
    gold: "vàng",
    beige: "be",
    midnight: "đen midnight",
    starlight: "trắng starlight",
    titanium: "titanium",
    "space black": "đen space black",
    "space gray": "xám space gray",
    "space grey": "xám space grey",
    "desert titanium": "desert titanium",
    "natural silver": "bạc tự nhiên",
    "indie black": "đen",
    "awesome navy": "xanh navy",
    "obsidian black": "đen",
    "natural silver": "bạc tự nhiên",
    "liquid silver": "bạc",
    "mint green": "xanh bạc hà",
    "moonstone gray": "xám đá",
    "deep black": "đen",
    "piano black": "đen",
    "storm grey": "xám bão",
    "storm gray": "xám bão",
    "arctic grey": "xám bắc cực",
    "arctic gray": "xám bắc cực",
    "obsidian": "đen",
    silver: "bạc",
    black: "đen"
  };

  return colorMap[normalized] || normalized;
}

function buildSpecs(product, variant) {
  const specs = [];
  const tech = product?.Technical_specs || {};
  const attributes = variant?.Attributes || {};

  const cpu = tech.CPU || tech.Chipset;
  if (cpu) {
    specs.push(cpu);
  }

  const ram = tech.RAM || attributes.RAM;
  if (ram) {
    specs.push(`RAM ${ram}`);
  }

  const storage = tech.Storage || tech.ROM || attributes.Storage;
  if (storage) {
    specs.push(storage);
  }

  const camera = tech.Camera;
  if (!specs.length && camera) {
    specs.push(camera);
  }

  const connection = tech.Connection || tech.Sensor || tech.Type || tech.Screen_Type;
  if (!specs.length && connection) {
    specs.push(connection);
  }

  const color = attributes.Color;
  if (!specs.length && color) {
    specs.push(`Màu ${buildColorLabel(color)}`);
  }

  if (!specs.length && variant?.Variant_name) {
    specs.push(variant.Variant_name);
  }

  return specs.join(" / ");
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ User_id: userId });

  if (!cart) {
    cart = await Cart.create({
      Cart_id: `CRT_${uuidv4()}`,
      User_id: userId,
      Total_product: 0,
      Total_price: 0,
    });
  }

  return cart;
}

async function buildCartResponse(cart) {
  const rawItems = await Cart_item.find({ Cart_id: cart.Cart_id }).sort({ _id: 1 }).lean();
  const variantIds = [...new Set(rawItems.map((item) => item.Product_variant_id))];

  const variants = variantIds.length
    ? await Product_variant.find({ Product_variant_id: { $in: variantIds } }).lean()
    : [];
  const variantMap = new Map(variants.map((variant) => [variant.Product_variant_id, variant]));

  const productIds = [...new Set(variants.map((variant) => variant.Product_id))];
  const products = productIds.length
    ? await Product.find({ Product_id: { $in: productIds } }).lean()
    : [];
  const productMap = new Map(products.map((product) => [product.Product_id, product]));
  const activeVariants = productIds.length
    ? await Product_variant.find({
        Product_id: { $in: productIds },
        Status: "active",
      })
        .sort({ Price: 1 })
        .lean()
    : [];
  const variantOptionsByProduct = new Map();
  activeVariants.forEach((variant) => {
    const product = productMap.get(variant.Product_id) || null;
    const productOptions = variantOptionsByProduct.get(variant.Product_id) || [];
    productOptions.push({
      productVariantId: variant.Product_variant_id,
      variantName: buildSpecs(product, variant) || variant.Variant_name,
      price: Number(variant.Price) || 0,
      stock: Number(variant.Stock_quantity) || 0,
    });
    variantOptionsByProduct.set(variant.Product_id, productOptions);
  });

  const items = rawItems.map((item) => {
    const variant = variantMap.get(item.Product_variant_id) || null;
    const product = variant ? (productMap.get(variant.Product_id) || null) : null;
    const unitPrice = Number(item.Price) || 0;
    const quantity = Number(item.Quantity) || 0;
    const lineTotal = unitPrice * quantity;

    return {
      cartItemId: item.Cart_item_id,
      cartId: item.Cart_id,
      productVariantId: item.Product_variant_id,
      productId: product?.Product_id || variant?.Product_id || null,
      productName: product?.Product_name || variant?.Variant_name || "Sản phẩm",
      variantName: variant?.Variant_name || "",
      specs: buildSpecs(product, variant),
      image: Array.isArray(product?.Images) && product.Images.length > 0 ? product.Images[0] : "",
      unitPrice,
      quantity,
      stockQuantity: Number(variant?.Stock_quantity) || 0,
      lineTotal,
      variantOptions: product?.Product_id ? variantOptionsByProduct.get(product.Product_id) || [] : [],
    };
  });

  const totalProduct = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.lineTotal, 0);

  await Cart.findOneAndUpdate(
    { Cart_id: cart.Cart_id },
    {
      Total_product: totalProduct,
      Total_price: totalPrice,
    }
  );

  const refreshedCart = await Cart.findOne({ Cart_id: cart.Cart_id }).lean();

  return {
    cart: refreshedCart || {
      Cart_id: cart.Cart_id,
      User_id: cart.User_id,
      Total_product: totalProduct,
      Total_price: totalPrice,
    },
    items,
  };
}

async function getCartForUser(userId) {
  const cart = await getOrCreateCart(userId);
  return buildCartResponse(cart);
}

exports.getCart = async (req, res) => {
  try {
    const userId = getStringValue(req.params.userId, req.query.userId, req.body?.userId, req.body?.User_id);

    if (!userId) {
      return res.status(400).json({ success: false, message: "Thiếu mã người dùng" });
    }

    const data = await getCartForUser(userId);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addItem = async (req, res) => {
  try {
    const userId = getStringValue(req.body.userId, req.body.User_id);
    const productVariantId = getStringValue(req.body.productVariantId, req.body.Product_variant_id);
    const quantity = parseQuantity(req.body.quantity, 1);

    if (!userId || !productVariantId) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin giỏ hàng" });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Số lượng phải lớn hơn 0" });
    }

    const variant = await Product_variant.findOne({ Product_variant_id: productVariantId }).lean();
    if (!variant) {
      return res.status(404).json({ success: false, message: "Không tìm thấy biến thể sản phẩm" });
    }

    if (variant.Status && variant.Status !== "active") {
      return res.status(400).json({ success: false, message: "Biến thể sản phẩm hiện không khả dụng" });
    }

    const cart = await getOrCreateCart(userId);
    const existingItem = await Cart_item.findOne({
      Cart_id: cart.Cart_id,
      Product_variant_id: productVariantId,
    });

    const nextQuantity = (existingItem?.Quantity || 0) + quantity;
    const stock = Number(variant.Stock_quantity) || 0;

    if (stock > 0 && nextQuantity > stock) {
      return res.status(400).json({ success: false, message: "Số lượng vượt quá tồn kho" });
    }

    if (existingItem) {
      existingItem.Quantity = nextQuantity;
      existingItem.Price = Number(variant.Price) || 0;
      await existingItem.save();
    } else {
      await Cart_item.create({
        Cart_item_id: `CRT_I_${uuidv4()}`,
        Cart_id: cart.Cart_id,
        Product_variant_id: productVariantId,
        Quantity: quantity,
        Price: Number(variant.Price) || 0,
      });
    }

    const data = await buildCartResponse(cart);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const cartItemId = getStringValue(req.params.cartItemId);
    const quantity = parseQuantity(req.body.quantity, 0);

    if (!cartItemId) {
      return res.status(400).json({ success: false, message: "Thiếu mã chi tiết giỏ hàng" });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Số lượng phải lớn hơn 0" });
    }

    const item = await Cart_item.findOne({ Cart_item_id: cartItemId });
    if (!item) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ hàng" });
    }

    const variant = await Product_variant.findOne({ Product_variant_id: item.Product_variant_id }).lean();
    if (!variant) {
      return res.status(404).json({ success: false, message: "Không tìm thấy biến thể sản phẩm" });
    }

    const stock = Number(variant.Stock_quantity) || 0;
    if (stock > 0 && quantity > stock) {
      return res.status(400).json({ success: false, message: "Số lượng vượt quá tồn kho" });
    }

    item.Quantity = quantity;
    item.Price = Number(variant.Price) || 0;
    await item.save();

    const cart = await Cart.findOne({ Cart_id: item.Cart_id });
    const data = await buildCartResponse(cart || { Cart_id: item.Cart_id, User_id: "" });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const cartItemId = getStringValue(req.params.cartItemId);

    if (!cartItemId) {
      return res.status(400).json({ success: false, message: "Thiếu mã chi tiết giỏ hàng" });
    }

    const item = await Cart_item.findOne({ Cart_item_id: cartItemId });
    if (!item) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ hàng" });
    }

    const cartDoc = await Cart.findOne({ Cart_id: item.Cart_id });
    await Cart_item.deleteOne({ Cart_item_id: cartItemId });

    const data = await buildCartResponse(cartDoc || { Cart_id: item.Cart_id, User_id: "" });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeSelectedItems = async (req, res) => {
  try {
    const userId = getStringValue(req.params.userId, req.body.userId, req.body.User_id);
    const cartItemIds = Array.isArray(req.body.cartItemIds) ? req.body.cartItemIds.filter(Boolean) : [];

    if (!userId) {
      return res.status(400).json({ success: false, message: "Thiếu mã người dùng" });
    }

    if (cartItemIds.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu danh sách sản phẩm cần xóa" });
    }

    const cart = await getOrCreateCart(userId);
    await Cart_item.deleteMany({
      Cart_id: cart.Cart_id,
      Cart_item_id: { $in: cartItemIds },
    });

    const data = await buildCartResponse(cart);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
