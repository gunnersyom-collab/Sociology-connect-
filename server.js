require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Fayyila HTML/CSS/JS hunda akka fe'uuf gargaara
app.use(express.static(__dirname));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    try {
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-pro"
                    
        });
        
        
 const result = await model.generateContent(message);
        const response = await result.response;
        res.json({ reply: response.text() });
        } catch (error) {
        console.error("DETAILED ERROR:", error);
        res.status(500).json({ reply: `Error: ${error.message}` });
    }
    
});

app.listen(process.env.PORT || 3000, () => console.log('Server is running...'));
