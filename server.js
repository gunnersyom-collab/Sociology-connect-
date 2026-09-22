require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(__dirname));

// Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Chat history (server memory)
let history = [];

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({
      reply: "Please enter a message."
    });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash"
    });

    const prompt = `
You are AI Mari, the official Sociology Connect Assistant for Arsi University.

Rules:
- Reply in Afaan Oromoo if the user writes Afaan Oromoo.
- Reply in Amharic if the user writes Amharic.
- Reply in English if the user writes English.
- Help with Sociology, Social Work, assignments, university questions, and general knowledge.
- Be friendly, respectful, and concise.

Previous conversation:
${history.map(h => `${h.role}: ${h.text}`).join("\n")}

User: ${message}
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    // Save history
    history.push({ role: "User", text: message });
    history.push({ role: "AI Mari", text: reply });

    // Keep only last 20 messages
    if (history.length > 20) {
      history = history.slice(-20);
    }

    res.json({ reply });

  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      reply: "Sorry, AI Mari is temporarily unavailable."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
