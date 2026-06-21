const { Address } = require("../models/schema");

exports.getUserAddresses = async (req, res) => {
  try {
    const userId = String(req.params.userId || "").trim();

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã người dùng.",
      });
    }

    const addresses = await Address.find({ User_id: userId })
      .sort({ Is_default: -1, _id: -1 })
      .lean();

    return res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
