const { Voucher } = require('../models/schema');

exports.getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find();
    res.status(200).json({
      success: true,
      data: vouchers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};