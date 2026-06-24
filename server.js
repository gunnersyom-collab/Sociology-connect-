require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Gemini API setup (Version v1 akka ta'uuf library-n ofumaan godha)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
    res.send('Sociology Connect Server is running');
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    try {
        // Model "gemini-1.5-flash" fayyadamuu akka ta'e mirkaneessi. 
        // Kun v1 irratti baay'ee tasgabbaa'aadha.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();
        res.json({ reply: text });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server-ichi port ${PORT} irratti hojjechaa jira`);
});
