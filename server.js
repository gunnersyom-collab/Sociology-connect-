require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
    res.send('Sociology Connect Server is running');
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    try {
        // Asitti 'systemInstruction' dabalameera
        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            systemInstruction: "You are an AI assistant for the 'Sociology Connect' website created by Horsa Gowe (Yomif). Your purpose is to provide information ONLY about the content of this website, Sociology, and Social Work. If the user asks about anything else, politely decline and remind them that you only discuss Sociology and Social Work related to this website."
        });

        const result = await model.generateContent(message);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
