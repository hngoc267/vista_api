const {
  Order,
  Order_detail,
  Product,
  Product_variant,
  Review,
} = require('../models/schema');

const REVIEWABLE_ORDER_STATUSES = new Set(['delivered', 'review']);

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanMultiline(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
}

function normalizeOrderStatus(value) {
  const normalized = normalizeText(value);

  if (['da giao', 'da nhan hang', 'da nhan duoc hang', 'delivered'].includes(normalized)) {
    return 'delivered';
  }

  if (['danh gia', 'review'].includes(normalized)) {
    return 'review';
  }

  return normalized;
}

function buildReviewId() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return 'RVW_' + Date.now() + '_' + random;
}

function normalizeImagesPayload(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map(extractImageValue).filter(Boolean))];
  }

  if (value && typeof value === 'object') {
    const image = extractImageValue(value);
    return image ? [image] : [];
  }

  const raw = String(value || '').trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeImagesPayload(parsed);
  } catch {
    return [raw];
  }
}

function extractImageValue(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'object') {
    return cleanText(
      value.url
      || value.src
      || value.preview
      || value.dataUrl
      || value.dataURL
      || value.fileUrl
      || value.file_url
      || value.path
      || value.image
      || value.video
      || value.media
      || ''
    );
  }

  return cleanText(value);
}

function parseImagesValue(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => parseImagesValue(item)).filter(Boolean))];
  }

  if (value && typeof value === 'object') {
    const image = extractImageValue(value);
    return image ? [image] : [];
  }

  const raw = String(value || '').trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return parseImagesValue(parsed);
  } catch {
    return [raw];
  }
}

async function updateOrderReviewStatus(orderId) {
  const orderDetails = await Order_detail.find({ Order_id: orderId })
    .select('Order_detail_id')
    .lean();

  const orderDetailIds = orderDetails.map((item) => item.Order_detail_id).filter(Boolean);
  if (!orderDetailIds.length) {
    return;
  }

  const reviewCount = await Review.countDocuments({
    Order_detail_id: { $in: orderDetailIds },
  });

  const isFullyReviewed = reviewCount >= orderDetailIds.length;
  const update = {
    Review_status: isFullyReviewed ? 'reviewed' : 'not_reviewed',
  };

  if (isFullyReviewed) {
    update.Status = 'review';
  }

  await Order.updateOne({ Order_id: orderId }, { $set: update });
}

async function updateProductRatingAfterCreate(productVariantId, rating) {
  const variant = await Product_variant.findOne({ Product_variant_id: productVariantId }).lean();
  if (!variant?.Product_id) {
    return null;
  }

  const product = await Product.findOne({ Product_id: variant.Product_id }).lean();
  const currentTotalReviews = Math.max(0, Number(product?.Total_reviews || 0));
  const currentAverageRating = Math.max(0, Math.min(5, Number(product?.Average_rating || 0)));
  const nextTotalReviews = currentTotalReviews + 1;
  const nextAverageRating = Number(
    (((currentAverageRating * currentTotalReviews) + Number(rating || 0)) / nextTotalReviews).toFixed(1)
  );

  await Product.updateOne(
    { Product_id: variant.Product_id },
    {
      $set: {
        Average_rating: nextAverageRating,
        Total_reviews: nextTotalReviews,
      },
    }
  );

  return {
    Product_id: variant.Product_id,
    Average_rating: nextAverageRating,
    Total_reviews: nextTotalReviews,
  };
}

const createReview = async (req, res) => {
  try {
    const orderDetailId = cleanText(req.body?.Order_detail_id || req.body?.orderDetailId);
    const rating = Number(req.body?.Rating ?? req.body?.rating);
    const comment = cleanMultiline(req.body?.Comment ?? req.body?.comment);
    const images = normalizeImagesPayload(req.body?.Images ?? req.body?.images);

    if (!orderDetailId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã chi tiết đơn hàng cần đánh giá.',
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Số sao đánh giá phải từ 1 đến 5.',
      });
    }

    const orderDetail = await Order_detail.findOne({ Order_detail_id: orderDetailId }).lean();
    if (!orderDetail) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi tiết đơn hàng cần đánh giá.',
      });
    }

    const order = await Order.findOne({ Order_id: orderDetail.Order_id }).lean();
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng của sản phẩm cần đánh giá.',
      });
    }

    const currentStatus = normalizeOrderStatus(order.Status);
    if (!REVIEWABLE_ORDER_STATUSES.has(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ đơn hàng đã giao mới có thể đánh giá sản phẩm.',
      });
    }

    const existingReview = await Review.findOne({ Order_detail_id: orderDetailId }).lean();
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'Sản phẩm này đã được đánh giá trước đó.',
        data: {
          ...existingReview,
          Images: parseImagesValue(existingReview.Images),
        },
      });
    }

    const createdReview = await Review.create({
      Review_id: buildReviewId(),
      Order_detail_id: orderDetailId,
      Rating: rating,
      Comment: comment,
      Images: images,
      Created_at: new Date(),
    });

    await updateOrderReviewStatus(orderDetail.Order_id);
    const productReviewSummary = await updateProductRatingAfterCreate(orderDetail.Product_variant_id, rating);

    return res.status(201).json({
      success: true,
      message: 'Đã gửi đánh giá sản phẩm thành công.',
      data: {
        Review_id: createdReview.Review_id,
        Order_detail_id: createdReview.Order_detail_id,
        Rating: createdReview.Rating,
        Comment: createdReview.Comment,
        Images: parseImagesValue(createdReview.Images),
        Created_at: createdReview.Created_at,
        Product_review_summary: productReviewSummary,
      },
    });
  } catch (error) {
    console.error('Lỗi khi tạo đánh giá sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi hệ thống khi gửi đánh giá sản phẩm.',
    });
  }
};

const getReviewByOrderDetailId = async (req, res) => {
  try {
    const orderDetailId = cleanText(req.params.orderDetailId);
    if (!orderDetailId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã chi tiết đơn hàng.',
      });
    }

    const review = await Review.findOne({ Order_detail_id: orderDetailId }).lean();
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm này chưa có đánh giá.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...review,
        Images: parseImagesValue(review.Images),
      },
    });
  } catch (error) {
    console.error('Lỗi khi tải đánh giá sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi hệ thống khi tải đánh giá sản phẩm.',
    });
  }
};

module.exports = {
  createReview,
  getReviewByOrderDetailId,
};
