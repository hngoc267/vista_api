const { Session, Message, Product, Product_variant, Category } = require("../models/schema");

// ─────────────────────────────────────────────
// HELPER: sinh ID tăng dần theo convention dự án
// ─────────────────────────────────────────────
async function genSessionId() {
  const count = await Session.countDocuments();
  return `SES_${String(count + 1).padStart(3, "0")}`;
}
async function genMessageId() {
  const count = await Message.countDocuments();
  return `MSG_${String(count + 1).padStart(3, "0")}`;
}

// ─────────────────────────────────────────────
// 1. TẠO SESSION MỚI
// POST /api/chatbot/sessions
// ─────────────────────────────────────────────
exports.createSession = async (req, res) => {
  try {
    const Session_id = await genSessionId();
    const session = await Session.create({
      Session_id,
      User_id: req.user.User_id,
      Title: "Cuộc trò chuyện mới",
      Create_at: new Date(),
      Updated_at: new Date(),
    });
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// 2. LẤY DANH SÁCH SESSION CỦA USER (sidebar)
// GET /api/chatbot/sessions
// ─────────────────────────────────────────────
exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ User_id: req.user.User_id })
      .sort({ Updated_at: -1 })
      .lean();
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// 3. LẤY TIN NHẮN CỦA 1 SESSION
// GET /api/chatbot/sessions/:sessionId/messages
// ─────────────────────────────────────────────
exports.getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Bảo mật: chỉ lấy nếu session thuộc về user đang đăng nhập
    const session = await Session.findOne({
      Session_id: sessionId,
      User_id: req.user.User_id,
    }).lean();
    if (!session) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện" });
    }

    const messages = await Message.find({ Session_id: sessionId })
      .sort({ Created_at: 1 })
      .lean();

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// 4. GỬI TIN NHẮN & NHẬN PHẢN HỒI AI
// POST /api/chatbot/sessions/:sessionId/messages
// Body: { content: "Tìm laptop dưới 20 triệu" }
// ─────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: "Nội dung tin nhắn không được để trống" });
    }

    // Bảo mật: kiểm tra session thuộc user
    const session = await Session.findOne({
      Session_id: sessionId,
      User_id: req.user.User_id,
    });
    if (!session) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện" });
    }

    // Lưu tin nhắn của user xuống DB
    const userMsgId = await genMessageId();
    await Message.create({
      Message_id: userMsgId,
      Session_id: sessionId,
      Content: content,
      Sender_type: "user",
      Created_at: new Date(),
    });

    // Tự đặt tiêu đề session theo câu hỏi đầu tiên
    if (session.Title === "Cuộc trò chuyện mới") {
      const shortTitle = content.length > 50 ? content.slice(0, 50) + "..." : content;
      session.Title = shortTitle;
    }

    // Lấy lịch sử hội thoại gần nhất (tối đa 10 tin nhắn) để đưa vào context Groq
    const recentMessages = await Message.find({ Session_id: sessionId })
      .sort({ Created_at: -1 })
      .limit(10)
      .lean();
    const historyForGroq = recentMessages.reverse().map((m) => ({
      role: m.Sender_type === "user" ? "user" : "assistant",
      content: m.Content,
    }));

    // ── Gọi Groq ─────────────────────────────
    const systemPrompt = `Bạn là VISTA AI Assistant, chuyên tư vấn sản phẩm công nghệ tại cửa hàng VISTA.
Nhiệm vụ: Phân tích yêu cầu khách hàng và trả về JSON duy nhất (không giải thích, không markdown).

JSON phải có cấu trúc:
{
  "reply": "<câu trả lời tự nhiên thân thiện bằng tiếng Việt, dưới 120 từ>",
  "category": "<Laptop|Smartphone|Tablet|Thiết bị âm thanh|Phụ kiện công nghệ|Thiết bị gaming|null>",
  "maxPrice": <số nguyên (đơn vị VNĐ) hoặc null>,
  "keywords": ["<từ khóa 1>", "<từ khóa 2>"],
  "hasProducts": <true nếu cần tìm sản phẩm, false nếu chỉ hỏi thông thường>,
  "suggestions": ["<gợi ý câu hỏi tiếp theo ngắn gọn 1>", "<gợi ý 2>", "<gợi ý 3>", "<gợi ý 4>"]
}

Quy tắc suggestions: sinh ra 4 gợi ý ngắn (dưới 40 ký tự) phù hợp ngữ cảnh câu vừa trả lời.`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 600,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          ...historyForGroq,
        ],
      }),
    });

    const groqData = await groqRes.json();

    if (!groqData.choices?.[0]) {
      throw new Error("Groq API không phản hồi: " + JSON.stringify(groqData));
    }

    // Parse JSON từ Groq (bỏ markdown fence nếu có)
    const raw = groqData.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();
    const aiResult = JSON.parse(raw);
    console.log("Chatbot AI result:", JSON.stringify(aiResult, null, 2));

    // ── Tìm sản phẩm từ DB nếu AI xác định cần ─
    let products = [];
    if (aiResult.hasProducts === true) {
      const filter = { Status: "on_sale" };

      if (aiResult.category && aiResult.category !== "null") {
        const cat = await Category.findOne({
          Category_name: { $regex: aiResult.category, $options: "i" },
        }).lean();
        if (cat) filter.Category_id = cat.Category_id;
      }

      let found = await Product.find(filter).lean();

      // Gán giá cho từng sản phẩm
      found = await Promise.all(
        found.map(async (p) => {
          const variant = await Product_variant.findOne({
            Product_id: p.Product_id,
            Status: "active",
          })
            .sort({ Price: 1 })
            .lean();
          return { ...p, min_price: variant?.Price || 0 };
        })
      );

      // Lọc giá nếu có
      if (aiResult.maxPrice) {
        found = found.filter((p) => p.min_price <= aiResult.maxPrice);
      }

      // Gán badge AI và giới hạn 4 sản phẩm
      const badges = ["AI Match", "Phù hợp nhu cầu", "Smart Pick", "Giải pháp thay thế"];
      products = found.slice(0, 4).map((p, i) => ({
        ...p,
        aiTag: badges[i] || "Gợi ý",
        matchScore: Math.max(96 - i * 4, 75),
      }));
    }

    // Lưu tin nhắn AI (chỉ lưu phần reply text, không lưu JSON products)
    const aiMsgId = await genMessageId();
    const aiMessage = await Message.create({
      Message_id: aiMsgId,
      Session_id: sessionId,
      Content: aiResult.reply,
      Products_json: products.length > 0 ? JSON.stringify(products) : null,
      Sender_type: "ai",
      Created_at: new Date(),
    });

    // Cập nhật Updated_at + Title của session
    session.Updated_at = new Date();
    await session.save();

    res.json({
      success: true,
      data: {
        message: aiMessage,
        products,
        suggestions: aiResult.suggestions || [],
      },
    });
  } catch (error) {
    console.error("Chatbot sendMessage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// 5. XÓA SESSION
// DELETE /api/chatbot/sessions/:sessionId
// ─────────────────────────────────────────────
exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      Session_id: sessionId,
      User_id: req.user.User_id,
    });
    if (!session) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện" });
    }

    // Xóa toàn bộ tin nhắn trong session trước
    await Message.deleteMany({ Session_id: sessionId });
    await Session.deleteOne({ Session_id: sessionId });

    res.json({ success: true, message: "Đã xóa cuộc trò chuyện" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendGuestMessage = async (req, res) => {
  try {
    const { content, history = [] } = req.body;
    // Dùng lại systemPrompt + gọi Groq giống sendMessage
    // Không lưu DB, chỉ trả về reply + products + suggestions
    // (copy logic Groq từ sendMessage, bỏ phần lưu Message/Session)
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};