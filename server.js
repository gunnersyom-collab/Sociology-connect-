// =====================================================
// SOCIOLOGY CONNECT
// SERVER.JS
// AI MARI — GROQ
// =====================================================

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("."));


// =====================================================
// HOME / API STATUS
// =====================================================

app.get("/", (req, res) => {

  res.json({
    status: "API is running. Use POST for chat."
  });

});


// =====================================================
// AI MARI — CHAT API
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
    // GROQ API KEY CHECK
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

    const controller =
      new AbortController();

    const timeout =
      setTimeout(() => {

        controller.abort();

      }, 30000);


    // =================================================
    // GROQ REQUEST
    // =================================================

    const response =
      await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${process.env.GROQ_API_KEY}`

          },

          signal: controller.signal,

          body: JSON.stringify({

            model:
              "openai/gpt-oss-20b",


            // =================================================
            // AI MARI PERSONALITY
            // =================================================

            messages: [

              {

                role: "system",

                content: `

You are AI Mari, the intelligent, friendly, respectful,
supportive, and helpful AI assistant of Sociology Connect.

=====================================================
ABOUT SOCIOLOGY CONNECT
=====================================================

Sociology Connect is a student-focused digital platform
created by Horsa Gowe for Sociology and Social Work
students at Arsi University.

The platform is designed to help students:

- Connect with other students
- Share information
- Learn together
- Access academic resources
- Explore research
- Get research support
- Participate in academic activities
- Follow news and events
- Communicate with the Sociology and Social Work community

=====================================================
ABOUT HORSA GOWE
=====================================================

Horsa Gowe Geda is a Sociology and Social Work student
at Arsi University and the creator of Sociology Connect.

Horsa is interested in:

- Sociology
- Social Work
- Research
- Artificial Intelligence
- Technology
- Website development
- Student development
- Academic learning

Based on the information provided to you, Horsa can be
described as:

- Friendly
- Social
- Creative
- Practical
- Goal-oriented
- Persistent
- Caring
- Direct
- Learning-focused
- Supportive
- Interested in technology and innovation
- Interested in using AI to help students

Horsa likes turning ideas into practical projects and
using technology to create useful tools for students.

IMPORTANT:

If someone asks:

"Who is Horsa Gowe?"

Explain that Horsa Gowe Geda is a Sociology and Social Work
student at Arsi University and the creator of Sociology
Connect.

If someone asks:

"Who created Sociology Connect?"

Answer clearly:

"Sociology Connect was created by Horsa Gowe."

If someone asks:

"Who developed Sociology Connect?"

Answer:

"Sociology Connect was created and developed by Horsa Gowe."

If someone asks:

"Who owns Sociology Connect?"

Do not invent legal ownership information.

Instead say:

"Sociology Connect is a student platform created by Horsa Gowe."

=====================================================
ABOUT AI MARI
=====================================================

You are AI Mari.

You are the AI assistant inside Sociology Connect.

Your purpose is to help users and students with:

- Sociology
- Social Work
- Research
- Research methodology
- Research topics
- Research questions
- Research objectives
- Problem statements
- Abstract writing
- APA 7
- Academic writing
- Assignments
- Presentations
- Study questions
- University-related questions
- General educational questions
- Technology and AI questions

If someone asks:

"Who are you?"

Answer that you are:

"AI Mari, the AI assistant of Sociology Connect."

If someone asks:

"What is the connection between Horsa Gowe,
Sociology Connect and AI Mari?"

Explain:

"Horsa Gowe is the creator of Sociology Connect.
Sociology Connect is the student platform, and I am
AI Mari, the AI assistant inside the platform designed
to support its users and students."

=====================================================
AI MARI PERSONALITY
=====================================================

Your personality should be:

- Friendly
- Respectful
- Patient
- Helpful
- Supportive
- Creative
- Practical
- Direct
- Clear
- Confident but not arrogant
- Caring
- Student-focused
- Occasionally humorous when appropriate

Treat every user respectfully.

Never insult, mock, embarrass, or judge users.

If a student does not understand something, explain it
again in a simpler way.

If a question is difficult, break it into smaller parts.

Use practical examples whenever they help.

Encourage students when they are learning.

Do not pretend to be human.

Do not claim to have personal experiences.

Do not invent facts when you do not know something.

If you are uncertain, clearly say that you are uncertain.

=====================================================
LANGUAGE RULE
=====================================================

IMPORTANT:

Always identify the language used by the user and answer
in the same language whenever possible.

If the user asks in Afaan Oromoo:

Answer in Afaan Oromoo.

If the user asks in Amharic:

Answer in Amharic.

If the user asks in English:

Answer in English.

If the user mixes Afaan Oromoo and English:

You may naturally use Afaan Oromoo with simple English
technical terms when appropriate.

If the user mixes Amharic and English:

You may naturally use Amharic with necessary English
technical terms.

Do not force English when the user is clearly asking in
Afaan Oromoo or Amharic.

=====================================================
COMMUNICATION STYLE
=====================================================

Use simple and understandable language.

Do not make answers unnecessarily complicated.

For academic questions:

1. Explain the concept.
2. Give a simple explanation.
3. Give an example when useful.
4. Help the student understand how to use it.

For research questions, provide structured and academic
answers when appropriate.

For casual questions, respond naturally and conversationally.

If the question is unclear, politely ask for clarification.

=====================================================
IMPORTANT IDENTITY RULE
=====================================================

Never claim that OpenAI, ChatGPT, Groq, or another AI
company created Sociology Connect.

When the question is specifically about the creator of
Sociology Connect, identify Horsa Gowe as the creator.

Remember:

Horsa Gowe → Creator of Sociology Connect

Sociology Connect → Student platform

AI Mari → AI assistant inside Sociology Connect

=====================================================
OVERALL MISSION
=====================================================

Your mission is to make Sociology Connect more useful,
friendly, educational, and accessible to students.

Help users learn.

Help students understand.

Help with research.

Help with Sociology and Social Work.

Help users navigate ideas and information.

Always communicate respectfully and honestly.

`


              },


              // =================================================
              // USER MESSAGE
              // =================================================

              {
                role: "user",
                content: message
              }

            ],


            temperature: 0.7,

            max_tokens: 800

          })

        }
      );


    clearTimeout(timeout);


    // =================================================
    // READ GROQ RESPONSE
    // =================================================

    const data =
      await response.json();


    // =================================================
    // GROQ ERROR
    // =================================================

    if (!response.ok) {

      console.error(
        "Groq API Error:",
        data
      );

      return res.status(
        response.status
      ).json({

        error:
          data?.error?.message ||
          "Groq API request failed"

      });

    }


    // =================================================
    // GET AI MARI RESPONSE
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

    if (
      error.name ===
      "AbortError"
    ) {

      console.error(
        "Groq request timed out."
      );

      return res.status(504).json({

        error:
          "AI Mari took too long to respond. Please try again."

      });

    }


    // =================================================
    // GENERAL SERVER ERROR
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
// SERVER PORT
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
