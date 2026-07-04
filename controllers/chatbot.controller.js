const { Session, Message, Product, Product_variant, Category, Voucher } = require("../models/schema");

// ─────────────────────────────────────────────
// HELPER: sinh ID tăng dần theo convention dự án
// ─────────────────────────────────────────────
async function genSessionId() {
  // Tìm session có Session_id lớn nhất (sắp xếp giảm dần -1)
  const lastSession = await Session.findOne().sort({ Session_id: -1 }).lean();
  
  if (!lastSession || !lastSession.Session_id) {
    return "SES_001"; // Nếu DB chưa có gì, bắt đầu từ 001
  }

  // Tách lấy phần số (Ví dụ: "SES_007" -> "007" -> 7)
  const lastNum = parseInt(lastSession.Session_id.replace("SES_", ""), 10);
  const nextNum = lastNum + 1;

  return `SES_${String(nextNum).padStart(3, "0")}`;
}

async function genMessageId() {
  const lastMessage = await Message.findOne().sort({ Message_id: -1 }).lean();
  
  if (!lastMessage || !lastMessage.Message_id) {
    return "MSG_001";
  }

  const lastNum = parseInt(lastMessage.Message_id.replace("MSG_", ""), 10);
  const nextNum = lastNum + 1;

  return `MSG_${String(nextNum).padStart(3, "0")}`;
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
    // ── GROQ LẦN 1: Chỉ trích intent ────────────
    const intentPrompt = `Phân tích yêu cầu sau và trả về JSON duy nhất, không giải thích:
    Yêu cầu: "${content}"

    {
      "category": "<Laptop|Smartphone|Tablet|Thiết bị âm thanh|Phụ kiện công nghệ|Thiết bị gaming|null>",
      "maxPrice": <số nguyên VNĐ hoặc null>,
      "hasProducts": <true nếu cần tìm sản phẩm, false nếu hỏi thông thường>,
      "suggestions": ["<gợi ý 1 ngắn dưới 40 ký tự>", "<gợi ý 2>", "<gợi ý 3>", "<gợi ý 4>"]
    }`;

    const intentRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 300,
        temperature: 0.1,
        messages: [{ role: "user", content: intentPrompt }],
      }),
    });

    const intentData = await intentRes.json();
    const intentRaw = intentData.choices[0].message.content
      .replace(/```json|```/g, "").trim();
    let intent;
    try {
      intent = JSON.parse(intentRaw);
      // Nếu Groq trả về format lạ (không có hasProducts) thì reset
      if (!('hasProducts' in intent)) {
        intent = { category: null, maxPrice: null, hasProducts: false, suggestions: [] };
      }
    } catch {
      intent = { category: null, maxPrice: null, hasProducts: false, suggestions: [] };
    }
    console.log("Intent:", JSON.stringify(intent, null, 2));

    // ── QUERY DB ─────────────────────────────────
    let products = [];
    let voucherResults = [];
    const voucherKeywords = ['voucher', 'mã giảm giá', 'mã khuyến mãi', 'coupon', 'chương trình ưu đãi'];
    const isVoucherIntent = voucherKeywords.some(kw => content.toLowerCase().includes(kw));
    const flashKeywords = ['flash sale', 'sale hôm nay', 'hàng sale', 'sản phẩm đang sale', 
  'sản phẩm giảm giá', 'đang giảm giá', 'có giảm giá', 'sản phẩm sale', 'ưu đãi hôm nay'];
    const isFlashIntent = !isVoucherIntent && flashKeywords.some(kw => content.toLowerCase().includes(kw));
    const crossCategoryTypes = ['chuột', 'bàn phím', 'tai nghe', 'loa', 'microphone', 'tay cầm'];
    const crossMatch = crossCategoryTypes.find(t => content.toLowerCase().includes(t));

    let overrideReply = null;
    if (isVoucherIntent) {
      voucherResults = await Voucher.find({ status: { $ne: 'used' } }).limit(5).lean();
      if (voucherResults.length > 0) {
        const list = voucherResults.map(v => `${v.code} (${v.title})`).join(", ");
        overrideReply = `Hiện VISTA có ${voucherResults.length} mã giảm giá: ${list}. Xem chi tiết bên dưới nhé!`;
      } else {
        overrideReply = "Hiện tại VISTA chưa có mã giảm giá nào khả dụng, bạn quay lại sau nhé!";
      }

    } else if (isFlashIntent) {
      let flashProducts = await Product.find({ Status: 'on_sale', Is_Flash_Sale: true }).lean();
      flashProducts = await Promise.all(flashProducts.map(async (p) => {
        const variant = await Product_variant.findOne({ Product_id: p.Product_id, Status: 'active' }).sort({ Price: 1 }).lean();
        return { ...p, min_price: variant?.Price || 0 };
      }));
      products = flashProducts.slice(0, 4).map(p => ({ ...p, aiTag: "⚡ Flash Sale" }));
      overrideReply = `VISTA đang có ${flashProducts.length} sản phẩm Flash Sale hôm nay, giảm giá cực sốc!`;

    } else if (crossMatch) {
      let crossProducts = await Product.find({
        Status: "on_sale",
        Product_name: { $regex: crossMatch, $options: 'i' }
      }).lean();

      crossProducts = await Promise.all(crossProducts.map(async (p) => {
        const variant = await Product_variant.findOne({ Product_id: p.Product_id, Status: "active" }).sort({ Price: 1 }).lean();
        return { ...p, min_price: variant?.Price || 0 };
      }));

      if (intent.maxPrice) crossProducts = crossProducts.filter(p => p.min_price <= intent.maxPrice);
      crossProducts.sort((a, b) => (b.Average_rating || 0) - (a.Average_rating || 0));

      products = crossProducts.slice(0, 6).map((p, i) => ({
        ...p,
        aiTag: "AI Đề xuất",
        matchScore: Math.max(96 - i * 3, 75),
      }));

    } else if (intent.hasProducts === true || (intent.category && intent.category !== "null")) {
      const filter = { Status: "on_sale" };
      const subKeywords = ['chuột', 'bàn phím', 'tai nghe', 'loa', 'sạc', 'hub', 'màn hình'];
      const matchedSub = subKeywords.find(kw => content.toLowerCase().includes(kw));
      if (matchedSub) {
        filter.Product_name = { $regex: matchedSub, $options: 'i' };
      }
      if (intent.category && intent.category !== "null") {
        const cat = await Category.findOne({
          Category_name: { $regex: intent.category, $options: "i" },
        }).lean();
        if (cat) filter.Category_id = cat.Category_id;
      }

      let found = await Product.find(filter).lean();
      found = await Promise.all(found.map(async (p) => {
        const variant = await Product_variant.findOne({
          Product_id: p.Product_id, Status: "active",
        }).sort({ Price: 1 }).lean();
        return { ...p, min_price: variant?.Price || 0 };
      }));

      if (intent.maxPrice) {
        found = found.filter(p => p.min_price <= intent.maxPrice);
      }

      products = found.slice(0, 4).map((p, i) => ({
        ...p,
        aiTag: "AI Đề xuất",
        matchScore: Math.max(96 - i * 4, 75),
      }));
    }
    // ── GROQ LẦN 2: Viết reply dựa trên sản phẩm thật ──
    let finalReply = overrideReply;

    if (!overrideReply) {
      // Chuẩn bị context sản phẩm thật để đưa vào prompt
      const productContext = products.length > 0
        ? `Danh sách sản phẩm THẬT đang bán tại VISTA:\n` +
          products.map((p, i) =>
            `${i + 1}. ${p.Product_name} - ${(p.min_price || 0).toLocaleString('vi-VN')}đ - CPU: ${p.Technical_specs?.CPU || p.Technical_specs?.Chipset || 'N/A'}`
          ).join("\n")
        : "Không có sản phẩm cụ thể nào cần đề cập.";

      // Lấy lịch sử chat để Groq có context
      const historyForGroq2 = recentMessages.map(m => ({
        role: m.Sender_type === "user" ? "user" : "assistant",
        content: m.Content,
      }));

      const replySystemPrompt = products.length > 0
        ? `Bạn là VISTA AI Assistant. 
      Câu hỏi của user: "${content}"
      Danh sách sản phẩm THẬT đang bán tại VISTA:
      ${productContext}

      Hãy CHỈ đề cập đến sản phẩm phù hợp với câu hỏi (ví dụ: nếu hỏi chuột thì chỉ nhắc sản phẩm là chuột, không nhắc bàn phím hay phụ kiện khác).
      TUYỆT ĐỐI không bịa tên sản phẩm ngoài danh sách trên.
      Viết ngắn gọn, thân thiện tiếng Việt, dưới 80 từ.`
        : `Bạn là VISTA AI Assistant. VISTA chưa có sản phẩm phù hợp. Xin lỗi và gợi ý liên hệ shop. KHÔNG tự đề xuất tên sản phẩm cụ thể.`;

      const replyRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 300,
          temperature: 0.4,
          messages: [
            { role: "system", content: replySystemPrompt },
            ...historyForGroq2,
            { role: "user", content: content },
          ],
        }),
      });

      const replyData = await replyRes.json();
      finalReply = replyData.choices?.[0]?.message?.content?.trim() || "Mình đã tìm được một số sản phẩm phù hợp cho bạn!";
    }

    console.log("Final reply:", finalReply);

    // Lưu tin nhắn AI (chỉ lưu phần reply text, không lưu JSON products)
    const aiMsgId = await genMessageId();
    const aiMessage = await Message.create({
      Message_id: aiMsgId,
      Session_id: sessionId,
      Content: finalReply,
      Products_json: products.length > 0 ? JSON.stringify(products) : null,
      Vouchers_json: voucherResults.length > 0 ? JSON.stringify(voucherResults) : null,
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
        vouchers: voucherResults,
        suggestions: intent.suggestions || [],
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
