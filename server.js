// server.js
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// =====================================================
// AI MARI — GEMINI API
// =====================================================

app.post('/api/chat', async (req, res) => {

    try {

        const message = req.body.message;

        if (!message) {
            return res.status(400).json({
                error: 'Message is required'
            });
        }

        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
            process.env.GEMINI_API_KEY,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: message
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            console.error('Gemini API Error:', data);

            return res.status(response.status).json({
                error: 'Gemini API request failed'
            });
        }

        const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {

            return res.status(500).json({
                error: 'No AI response received'
            });
        }

        res.json({
            reply: reply
        });

    } catch (error) {

        console.error('Server Error:', error);

        res.status(500).json({
            error: 'AI server error'
        });
    }

});


// =====================================================
// START SERVER
// =====================================================

app.listen(
    process.env.PORT || 3000,
    () => {
        console.log(
            `Sociology Connect server running on port ${
                process.env.PORT || 3000
            }`
        );
    }
);
