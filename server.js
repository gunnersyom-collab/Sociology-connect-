// =====================================================
// SOCIOLOGY CONNECT
// SERVER.JS
// AI MARI — GEMINI
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
// AI MARI — GEMINI API
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
    // CHECK GEMINI API KEY
    // =================================================

    if (!process.env.GEMINI_API_KEY) {

      console.error(
        "GEMINI_API_KEY is missing"
      );

      return res.status(500).json({
        error: "Gemini API key is not configured"
      });

    }


    // =================================================
    // REQUEST TIMEOUT
    // =================================================

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);


    // =================================================
    // SEND REQUEST TO GEMINI
    // =================================================

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },

        signal: controller.signal,

        body: JSON.stringify({

          contents: [

            {
              role: "user",

              parts: [

                {
                  text: message
                }

              ]

            }

          ],

          generationConfig: {

            thinkingConfig: {
              thinkingLevel: "low"
            },

            maxOutputTokens: 800

          }

        })

      }
    );


    // =================================================
    // CLEAR TIMEOUT
    // =================================================

    clearTimeout(timeout);


    // =================================================
    // READ GEMINI RESPONSE
    // =================================================

    const data = await response.json();


    // =================================================
    // GEMINI ERROR
    // =================================================

    if (!response.ok) {

      console.error(
        "Gemini API Error:",
        data
      );

      return res.status(response.status).json({

        error:
          data?.error?.message ||
          "Gemini API request failed"

      });

    }


    // =================================================
    // GET AI TEXT
    // =================================================

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;


    if (!reply) {

      console.error(
        "Gemini returned no text:",
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
        "Gemini request timed out."
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
