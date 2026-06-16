const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "VISTA API is running!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const productRoutes = require("./routes/product.routes");
app.use("/api/products", productRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

const cartRoutes = require("./routes/cart.routes");
app.use("/api/cart", cartRoutes);

// THÊM MỚI Ở ĐÂY: Đăng ký API cho Voucher
const voucherRoutes = require("./routes/voucher.routes");
app.use("/api/vouchers", voucherRoutes);