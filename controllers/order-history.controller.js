const { Order, Payment, Delivery } = require('../models/schema');

const PROCESSING_STATUSES = new Set(['processing']);
const IMMUTABLE_STATUSES = new Set(['returning', 'cancelled', 'delivered']);
const SHIPPING_STATUSES = new Set(['shipping', 'delivering']);
const REVIEW_DISPLAY_STATUSES = new Set(['review', 'delivered']);
const PENDING_PAYMENT_AUTO_CANCEL_MS = 24 * 60 * 60 * 1000;

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeStatusValue(value) {
  const normalized = cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!normalized) {
    return '';
  }

  if (['dang giao', 'dang van chuyen', 'delivering', 'shipping'].includes(normalized)) {
    return 'shipping';
  }

  if (['da giao', 'da nhan duoc hang', 'delivered'].includes(normalized)) {
    return 'delivered';
  }

  if (['cho xu ly', 'processing'].includes(normalized)) {
    return 'processing';
  }

  if (['cho thanh toan', 'pending_payment'].includes(normalized)) {
    return 'pending_payment';
  }

  if (['danh gia', 'review'].includes(normalized)) {
    return 'review';
  }

  if (['da huy', 'cancelled', 'cancel'].includes(normalized)) {
    return 'cancelled';
  }

  if (['tra hang', 'returning'].includes(normalized)) {
    return 'returning';
  }

  return normalized;
}

function normalizePaymentType(value) {
  const normalized = cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

  if (['cod', 'cash', 'tien mat', 'tienmat', 'thanh toan tien mat', 'thanh toan khi nhan hang'].includes(normalized)) {
    return 'COD';
  }

  if (['banktransfer', 'qr', 'chuyen khoan', 'chuyen khoan qr', 'chuyen khoan ngan hang'].includes(normalized)) {
    return 'BankTransfer';
  }

  return cleanText(value) || 'COD';
}

function buildShippingAddress(addressInfo) {
  if (!addressInfo) {
    return '';
  }

  return [
    addressInfo.Specific_address,
    addressInfo.Ward,
    addressInfo.District,
    addressInfo.Province,
  ]
    .map(cleanText)
    .filter(Boolean)
    .join(', ');
}

function resolveHistoryStatus(order, paymentInfo) {
  const paymentType = normalizePaymentType(paymentInfo?.Payment_type);
  const paymentStatus = cleanText(paymentInfo?.Payment_status || 'pending');
  const currentStatus = normalizeStatusValue(order?.Status);
  const processingStartedAt = order?.Processing_started_at ? new Date(order.Processing_started_at) : null;
  const createdAt = order?.Created_at ? new Date(order.Created_at) : null;
  const isBankTransfer = paymentType === 'BankTransfer';

  if (IMMUTABLE_STATUSES.has(currentStatus)) {
    return currentStatus;
  }

  let nextStatus = currentStatus;

  if (isBankTransfer) {
    if (paymentStatus === 'paid') {
      nextStatus = currentStatus && currentStatus !== 'pending_payment' ? currentStatus : 'processing';
    } else {
      const pendingPaymentAge = createdAt && !Number.isNaN(createdAt.getTime())
        ? Date.now() - createdAt.getTime()
        : null;

      nextStatus = pendingPaymentAge !== null && pendingPaymentAge >= PENDING_PAYMENT_AUTO_CANCEL_MS
        ? 'cancelled'
        : 'pending_payment';
    }
  } else if (currentStatus !== 'shipping' && currentStatus !== 'review') {
    nextStatus = currentStatus === 'shipping' || currentStatus === 'review'
      ? currentStatus
      : 'processing';
  }

  const processingReferenceTime = processingStartedAt && !Number.isNaN(processingStartedAt.getTime())
    ? processingStartedAt
    : createdAt;

  if (PROCESSING_STATUSES.has(nextStatus) && processingReferenceTime && !Number.isNaN(processingReferenceTime.getTime())) {
    const elapsed = Date.now() - processingReferenceTime.getTime();
    if (elapsed >= 10000) {
      nextStatus = 'shipping';
    }
  }

  if (!nextStatus) {
    nextStatus = isBankTransfer ? 'pending_payment' : 'processing';
  }

  return nextStatus;
}

function shouldShowReceivedAction(order) {
  return SHIPPING_STATUSES.has(normalizeStatusValue(order?.Status));
}

function shouldShowReviewStatus(order) {
  return REVIEW_DISPLAY_STATUSES.has(normalizeStatusValue(order?.Status));
}

const getOrderHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    const statusFilter = req.query.status;
    const matchStage = { User_id: userId };

    let orders = await Order.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'User',
          localField: 'User_id',
          foreignField: 'User_id',
          as: 'UserInfo'
        }
      },
      {
        $lookup: {
          from: 'Payment',
          localField: 'Order_id',
          foreignField: 'Order_id',
          as: 'PaymentInfo'
        }
      },
      {
        $lookup: {
          from: 'Delivery',
          localField: 'Order_id',
          foreignField: 'Order_id',
          as: 'DeliveryInfo'
        }
      },
      {
        $lookup: {
          from: 'Order_detail',
          let: { orderId: '$Order_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$Order_id', '$$orderId'] } } },
            {
              $lookup: {
                from: 'Product_variant',
                localField: 'Product_variant_id',
                foreignField: 'Product_variant_id',
                as: 'VariantInfo'
              }
            },
            { $unwind: { path: '$VariantInfo', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'Product',
                localField: 'VariantInfo.Product_id',
                foreignField: 'Product_id',
                as: 'ProductInfo'
              }
            },
            { $unwind: { path: '$ProductInfo', preserveNullAndEmptyArrays: true } }
          ],
          as: 'RawItems'
        }
      },
      {
        $lookup: {
          from: 'Address',
          let: { userId: '$User_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$User_id', '$$userId'] } } },
            { $sort: { Is_default: -1 } },
            { $limit: 1 }
          ],
          as: 'AddressInfo'
        }
      },
      { $sort: { Created_at: -1 } }
    ]);

    let formattedOrders = await Promise.all(orders.map(async (order, index) => {
      const userInfo = order.UserInfo && order.UserInfo.length > 0 ? order.UserInfo[0] : null;
      const paymentInfo = order.PaymentInfo && order.PaymentInfo.length > 0 ? order.PaymentInfo[0] : null;
      const paymentStatus = cleanText(paymentInfo?.Payment_status || 'pending');
      const paymentType = normalizePaymentType(paymentInfo?.Payment_type);
      const deliveryInfo = order.DeliveryInfo && order.DeliveryInfo.length > 0 ? order.DeliveryInfo[0] : null;
      const addressInfo = order.AddressInfo && order.AddressInfo.length > 0 ? order.AddressInfo[0] : null;
      const resolvedStatus = resolveHistoryStatus(order, paymentInfo);
      const currentStatus = cleanText(order.Status);

      if (resolvedStatus && resolvedStatus !== currentStatus) {
        await Order.updateOne(
          { Order_id: order.Order_id },
          { $set: { Status: resolvedStatus } }
        );
      }

      if (resolvedStatus === 'shipping' && normalizeStatusValue(deliveryInfo?.Status) !== 'shipping') {
        await Delivery.updateOne(
          { Order_id: order.Order_id },
          {
            $set: {
              Status: 'shipping',
            }
          }
        );
      }

      return {
        Order_id: index + 1, 
        Order_code: order.Order_id, 
        Created_at: order.Created_at,
        Status: resolvedStatus,
        Review_status: order.Review_status || 'not_reviewed',
        Processing_started_at: order.Processing_started_at || null,
        Customer_name: userInfo?.Full_name || order.Customer_name || '',
        Phone_number: userInfo?.Phone_number || order.Phone_number || '',
        Email: userInfo?.Email || order.Email || '',
        Address: buildShippingAddress(addressInfo) || order.Address || '',
        Receiver_name: addressInfo?.Receiver_name || userInfo?.Full_name || '',
        Receiver_phone: addressInfo?.Receiver_phone || userInfo?.Phone_number || '',
        Province: addressInfo?.Province || '',
        District: addressInfo?.District || '',
        Ward: addressInfo?.Ward || '',
        Specific_address: addressInfo?.Specific_address || '',
        Voucher_id: order.Voucher_id || null,
        Voucher_code: order.Voucher_code || '',
        Voucher_title: order.Voucher_title || '',
        
        // --- THÊM CÁC TRƯỜNG DỮ LIỆU ĐỂ HIỂN THỊ LÊN MODAL CHI TIẾT ---
        Total_items_price: order.Total_items_price || 0,
        Discount_amount: order.Discount_amount || 0,
        Voucher_discount_amount: order.Voucher_discount_amount || 0,
        Voucher_shipping_discount: order.Voucher_shipping_discount || 0,
        Total_amount: order.Total_amount || 0,
        Shipping_fee: deliveryInfo ? Number(deliveryInfo.Shipping_fee) || 0 : 0,
        Delivery_status:
          resolvedStatus === 'shipping'
            ? 'shipping'
            : resolvedStatus === 'delivered'
              ? 'delivered'
              : deliveryInfo
                ? deliveryInfo.Status || 'pending'
                : 'pending',
        Shipping_partner: deliveryInfo?.Shipping_partner || '',
        Tracking_number: deliveryInfo?.Tracking_number || '',
        Estimated_delivery_date: deliveryInfo?.Estimated_delivery_date || null,
        Delivered_at: deliveryInfo?.Delivered_at || deliveryInfo?.Actual_delivery_date || deliveryInfo?.Received_at || deliveryInfo?.Completed_at || null,
        Payment_type: paymentType,
        Payment_status: paymentStatus,
        Order_notes: order.Order_notes || '',
        // --------------------------------------------------------------
        
        Items: order.RawItems.map((item, i) => {
          const productImage = item.ProductInfo && item.ProductInfo.Images && item.ProductInfo.Images.length > 0
            ? `/assets/images/${item.ProductInfo.Images[0]}`
            : '/assets/images/default-product.png';
            
          const productName = item.ProductInfo ? item.ProductInfo.Product_name : item.Variant_name;

          return {
            Product_id: item.ProductInfo ? item.ProductInfo.Product_id : (i + 1), 
            Product_variant_id: item.Product_variant_id || item.VariantInfo?.Product_variant_id || '',
            productVariantId: item.Product_variant_id || item.VariantInfo?.Product_variant_id || '',
            Product_name: productName,
            Variant_name: item.Variant_name,
            Price: item.Price,
            Original_price: item.Original_price || (item.VariantInfo ? item.VariantInfo.Price : 0) || 0,
            Discount_percent: item.Discount_percent || item.ProductInfo?.Discount || 0,
            Quantity: item.Quantity,
            Total_price: item.Total_price || ((item.Price || 0) * (item.Quantity || 0)),
            Image: productImage
          };
        })
      };
    }));

    if (statusFilter && statusFilter !== 'all') {
      formattedOrders = formattedOrders.filter((o) => {
        const normalizedStatus = normalizeStatusValue(o.Status);
        if (statusFilter === 'review') {
          return shouldShowReviewStatus(o);
        }

        return normalizedStatus === statusFilter;
      });
    }

    return res.status(200).json({
      success: true,
      data: formattedOrders
    });

  } catch (error) {
    console.error('Lỗi khi lấy lịch sử đơn hàng:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi hệ thống khi tải lịch sử đơn hàng' 
    });
  }
};

const markOrderReceived = async (req, res) => {
  try {
    const orderId = cleanText(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã đơn hàng.',
      });
    }

    const order = await Order.findOne({ Order_id: orderId }).lean();
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng.',
      });
    }

    const currentStatus = normalizeStatusValue(order.Status);
    if (!shouldShowReceivedAction(order)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ đơn hàng đang vận chuyển mới có thể xác nhận đã nhận hàng.',
      });
    }

    const payment = await Payment.findOne({ Order_id: orderId }).lean();
    const normalizedPaymentType = normalizePaymentType(payment?.Payment_type);
    const deliveredAt = new Date();

    if (payment && normalizedPaymentType === 'COD') {
      const paymentUpdate = {
        Payment_status: 'paid',
      };

      if (!payment.Paid_at) {
        paymentUpdate.Paid_at = deliveredAt;
      }

      await Payment.updateOne(
        { Order_id: orderId },
        { $set: paymentUpdate }
      );
    }

    const delivery = await Delivery.findOne({ Order_id: orderId }).lean();
    if (delivery) {
      const deliveryUpdate = {
        Status: 'delivered',
        Delivered_at: deliveredAt,
      };

      await Delivery.updateOne(
        { Order_id: orderId },
        { $set: deliveryUpdate }
      );
    }

    await Order.updateOne(
      { Order_id: orderId },
      { $set: { Status: 'delivered' } }
    );

    return res.status(200).json({
      success: true,
      message: 'Đã ghi nhận đơn hàng đã được nhận.',
      data: {
        Order_id: orderId,
        Status: 'delivered',
        previousStatus: currentStatus,
        Delivery_status: 'delivered',
        Payment_status: payment && normalizedPaymentType === 'COD'
          ? 'paid'
          : cleanText(payment?.Payment_status || 'pending'),
        Delivered_at: delivery ? deliveredAt : null,
        Processing_started_at: order.Processing_started_at || null,
      },
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận đã nhận hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi hệ thống khi xác nhận đã nhận hàng',
    });
  }
};

module.exports = {
  getOrderHistory,
  markOrderReceived
};
