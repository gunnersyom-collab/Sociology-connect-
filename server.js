require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();

// CORS isaan fayyadaa akka frontend kee sirriitti qunnamu
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Route kana koodii server.js kee keessatti itti dabali
app.get('/', (req, res) => {
  res.send('Sociology Connect Server is running!');
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: "Server-ichi deebii kennuu hin dandeenye." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server-ichi port ${PORT} irratti hojjechaa jira.`);
});
