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

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "Please enter a message." });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const result = await model.generateContent(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      reply: "Sorry, AI is temporarily unavailable."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
