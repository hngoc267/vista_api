const { Order } = require('../models/schema');

const getOrderHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    const statusFilter = req.query.status;
    const matchStage = { User_id: userId };

    let orders = await Order.aggregate([
      { $match: matchStage },
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
      { $sort: { Created_at: -1 } }
    ]);

    let formattedOrders = orders.map((order, index) => {
      // Bóc tách thông tin Payment
      const paymentInfo = order.PaymentInfo && order.PaymentInfo.length > 0 ? order.PaymentInfo[0] : null;
      const paymentStatus = paymentInfo ? paymentInfo.Payment_status : 'pending';
      const paymentType = paymentInfo ? paymentInfo.Payment_type : 'COD';
                            
      let currentStatus = paymentStatus === 'paid' ? 'processing' : 'pending_payment';
      if (order.Status) currentStatus = order.Status; 

      return {
        Order_id: index + 1, 
        Order_code: order.Order_id, 
        Created_at: order.Created_at,
        Status: currentStatus,
        Review_status: order.Review_status || 'not_reviewed',
        
        // --- THÊM CÁC TRƯỜNG DỮ LIỆU ĐỂ HIỂN THỊ LÊN MODAL CHI TIẾT ---
        Total_items_price: order.Total_items_price || 0,
        Discount_amount: order.Discount_amount || 0,
        Total_amount: order.Total_amount || 0,
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
            Product_name: productName,
            Variant_name: item.Variant_name,
            Price: item.Price,
            Quantity: item.Quantity,
            Image: productImage
          };
        })
      };
    });

    if (statusFilter && statusFilter !== 'all') {
      formattedOrders = formattedOrders.filter(o => o.Status === statusFilter);
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

module.exports = {
  getOrderHistory
};