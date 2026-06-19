const { Payment } = require("../models/schema");

exports.getPaymentStatus = async (req, res) => {
  try {
    const paymentId = String(req.params.paymentId || "").trim();

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã thanh toán.",
      });
    }

    const payment = await Payment.findOne({ Payment_id: paymentId }).lean();

    return res.json({
      success: true,
      data: {
        paymentStatus: payment?.Payment_status || "pending",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
