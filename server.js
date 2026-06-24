require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "Your name is AI Mari. You are the official, simple assistant for the 'Sociology Connect' website. You only answer questions related to Sociology, Social Work, and this website. If the question is outside these topics, politely say you only talk about Sociology Connect topics."
        });

        const result = await model.generateContent(message);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ reply: "AI Mari is currently busy. Please try again." });
    }
});

app.listen(3000, () => console.log('AI Mari is running...'));
