// server.js
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('.'));

app.post('/api/chat', async (req, res) => {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: req.body.message }]
        })
    });
    const data = await r.json();
    res.json({ reply: data.choices[0].message.content });
});

app.listen(process.env.PORT || 3000);
