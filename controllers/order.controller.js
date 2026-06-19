const {
  Address,
  Delivery,
  Order,
  Order_detail,
  Payment,
  Product_variant,
} = require("../models/schema");

function cleanString(value) {
  return String(value || "").trim();
}

function normalizeOrderDetail(detail, orderId, variant) {
  const quantity = Math.max(1, Number(detail.Quantity) || 1);
  const price = Number(detail.Price ?? variant.Price ?? 0);

  return {
    Order_detail_id: cleanString(detail.Order_detail_id),
    Product_variant_id: cleanString(detail.Product_variant_id),
    Order_id: orderId,
    Variant_name: cleanString(detail.Variant_name) || variant.Variant_name,
    Price: price,
    Quantity: quantity,
    Total_price: price * quantity,
  };
}

exports.createOrder = async (req, res) => {
  try {
    const { order, orderDetails, address, delivery, payment } = req.body || {};

    if (!order || !Array.isArray(orderDetails) || orderDetails.length === 0 || !address || !delivery || !payment) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin tạo đơn hàng.",
      });
    }

    const orderId = cleanString(order.Order_id);
    const userId = cleanString(order.User_id);

    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã đơn hàng hoặc mã người dùng.",
      });
    }

    if (
      !cleanString(address.Receiver_name) ||
      !cleanString(address.Receiver_phone) ||
      !cleanString(address.Email) ||
      !cleanString(address.Province) ||
      !cleanString(address.District) ||
      !cleanString(address.Ward) ||
      !cleanString(address.Specific_address)
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin nhận hàng.",
      });
    }

    const variantIds = [...new Set(orderDetails.map((item) => cleanString(item.Product_variant_id)).filter(Boolean))];
    const variants = await Product_variant.find({
      Product_variant_id: { $in: variantIds },
      Status: "active",
    }).lean();
    const variantMap = new Map(variants.map((variant) => [variant.Product_variant_id, variant]));

    if (variantIds.length !== variants.length) {
      return res.status(400).json({
        success: false,
        message: "Một số phiên bản sản phẩm không còn khả dụng.",
      });
    }

    const normalizedDetails = orderDetails.map((detail) => {
      const variant = variantMap.get(cleanString(detail.Product_variant_id));
      return normalizeOrderDetail(detail, orderId, variant);
    });

    const outOfStockItem = normalizedDetails.find((detail) => {
      const variant = variantMap.get(detail.Product_variant_id);
      const stock = Number(variant.Stock_quantity) || 0;
      return stock > 0 && detail.Quantity > stock;
    });

    if (outOfStockItem) {
      return res.status(400).json({
        success: false,
        message: "Số lượng đặt mua vượt quá tồn kho.",
      });
    }

    const totalItemsPrice = normalizedDetails.reduce((sum, item) => sum + item.Total_price, 0);
    const discountAmount = Math.max(0, Number(order.Discount_amount) || 0);
    const totalAmount = Math.max(0, Number(order.Total_amount) || (totalItemsPrice - discountAmount + Number(delivery.Shipping_fee || 0)));

    await Order.create({
      Order_id: orderId,
      User_id: userId,
      Voucher_id: cleanString(order.Voucher_id) || null,
      Total_items_price: totalItemsPrice,
      Discount_amount: discountAmount,
      Total_amount: totalAmount,
      Order_notes: cleanString(order.Order_notes),
      Created_at: order.Created_at ? new Date(order.Created_at) : new Date(),
    });

    await Order_detail.insertMany(normalizedDetails);

    if (address.Is_default) {
      await Address.updateMany(
        { User_id: userId, Address_id: { $ne: cleanString(address.Address_id) } },
        { Is_default: false }
      );
    }

    await Address.findOneAndUpdate(
      { Address_id: cleanString(address.Address_id) },
      {
        Address_id: cleanString(address.Address_id),
        User_id: userId,
        Receiver_name: cleanString(address.Receiver_name),
        Receiver_phone: cleanString(address.Receiver_phone),
        Email: cleanString(address.Email),
        Province: cleanString(address.Province),
        District: cleanString(address.District),
        Ward: cleanString(address.Ward),
        Specific_address: cleanString(address.Specific_address),
        Is_default: !!address.Is_default,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Delivery.create({
      Delivery_id: cleanString(delivery.Delivery_id),
      Order_id: orderId,
      Shipping_partner: cleanString(delivery.Shipping_partner),
      Tracking_number: cleanString(delivery.Tracking_number),
      Shipping_fee: Number(delivery.Shipping_fee) || 0,
      Estimated_delivery_date: delivery.Estimated_delivery_date ? new Date(delivery.Estimated_delivery_date) : null,
      Status: delivery.Status || "pending",
    });

    await Payment.create({
      Payment_id: cleanString(payment.Payment_id),
      Order_id: orderId,
      Payment_type: payment.Payment_type,
      Payment_status: payment.Payment_status || "pending",
    });

    await Promise.all(
      normalizedDetails.map((detail) =>
        Product_variant.updateOne(
          { Product_variant_id: detail.Product_variant_id },
          { $inc: { Stock_quantity: -detail.Quantity } }
        )
      )
    );

    return res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công.",
      data: {
        orderId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
