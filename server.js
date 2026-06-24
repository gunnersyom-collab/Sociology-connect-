require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Librariin kun akka jiru mirkaneessi
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// CORS hundaaf akka banamuuf
app.use(cors({
    origin: '*', // Bakka '*' kana gara 'https://gunnersyom-collab.github.io' jijjiiruun filatamaadha
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
    res.send('Sociology Connect Server is running');
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    try {
        // Maqaa model-ichaa hordofi
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();
        res.json({ reply: text });
    } catch (error) {
        console.error("Gemini Error:", error); // Logs kee irratti dogoggora ifatti argachuuf
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server-ichi port ${PORT} irratti hojjechaa jira`);
});
