// =====================================================
// SOCIOLOGY CONNECT
// SERVER.JS
// AI MARI — GROQ
// =====================================================

const express = require("express");
const cors = require("cors");

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());
app.use(express.static("."));


// =====================================================
// HOME / SERVER STATUS
// =====================================================

app.get("/", (req, res) => {

  res.json({
    status: "API is running. Use POST for chat."
  });

});


// =====================================================
// AI MARI — GROQ API
// =====================================================

app.post("/api/chat", async (req, res) => {

  try {

    const message = req.body?.message;

    if (!message) {

      return res.status(400).json({
        error: "Message is required"
      });

    }


    // =================================================
    // CHECK GROQ API KEY
    // =================================================

    if (!process.env.GROQ_API_KEY) {

      console.error(
        "GROQ_API_KEY is missing"
      );

      return res.status(500).json({
        error: "Groq API key is not configured"
      });

    }


    // =================================================
    // REQUEST TIMEOUT
    // =================================================

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);


    // =================================================
    // SEND REQUEST TO GROQ
    // =================================================

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.GROQ_API_KEY}`
        },

        signal: controller.signal,

        body: JSON.stringify({

          model: "openai/gpt-oss-20b",

          messages: [

            {
              role: "system",

              content:
  "You are AI Mari, the official academic research assistant of Sociology Connect – Arsi University – Sociology & Social Work. The website was created by Horsa Gowe. If a user asks who created, developed, owns, or made this website, answer clearly: 'Sociology Connect was created by Horsa Gowe.' Answer clearly in Afaan Oromoo, Amharic, or English depending on the user's language. Help students with research, sociology, social work, assignments, academic writing, research methods, APA 7, and related academic questions. Never claim that OpenAI, ChatGPT, or another person created Sociology Connect unless the user explicitly asks about the AI technology itself."


    // =================================================
    // CLEAR TIMEOUT
    // =================================================

    clearTimeout(timeout);


    // =================================================
    // READ GROQ RESPONSE
    // =================================================

    const data = await response.json();


    // =================================================
    // GROQ ERROR
    // =================================================

    if (!response.ok) {

      console.error(
        "Groq API Error:",
        data
      );

      return res.status(response.status).json({

        error:
          data?.error?.message ||
          "Groq API request failed"

      });

    }


    // =================================================
    // GET AI TEXT
    // =================================================

    const reply =
      data?.choices?.[0]?.message?.content;


    if (!reply) {

      console.error(
        "Groq returned no text:",
        JSON.stringify(data)
      );

      return res.status(500).json({

        error:
          "No AI response received"

      });

    }


    // =================================================
    // SEND RESPONSE TO WEBSITE
    // =================================================

    return res.json({

      reply: reply

    });


  } catch (error) {

    // =================================================
    // TIMEOUT ERROR
    // =================================================

    if (error.name === "AbortError") {

      console.error(
        "Groq request timed out."
      );

      return res.status(504).json({

        error:
          "AI Mari took too long to respond. Please try again."

      });

    }


    // =================================================
    // SERVER ERROR
    // =================================================

    console.error(
      "Server Error:",
      error
    );

    return res.status(500).json({

      error:
        error.message ||
        "AI server error"

    });

  }

});


// =====================================================
// START SERVER
// =====================================================

const PORT =
  process.env.PORT || 3000;


app.listen(
  PORT,
  () => {

    console.log(
      `🚀 Sociology Connect server running on port ${PORT}`
    );

  }
);

