const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Health check route
app.get('/', (req, res) => {
  res.send('👋 Welcome to the Smart Presenter Hub backend!');
});

// 🧠 OLD route (you can remove this if unused)
app.post('/generate', async (req, res) => {
  const { content,title } = req.body;
  const prompt = content;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    

    res.json({ result: text, source: "gemini-api",title });
  } catch (err) {
    console.error("Gemini API error:", err.message || err);
    res.status(500).json({ error: "Failed to generate content" });
  }
});
// IGhkN0PbkxD2s3J2heaZbpg2fi8O3teH-5I3t6cT
// ✅ NEW route your frontend expects
app.post('/api/presentation', async (req, res) => {
  const { title, content, slideBySlide, apiKey } = req.body;

  try {
    const prompt = slideBySlide
      ? `Generate a detailed presentation slide-by-slide based on this topic: "${title}". Each slide should begin with "Slide X: Title" followed by the content. Content: ${content}. Each slide should only have 3-4 lines and not more than that. Do not use formatting in the lines. Also, start the presentation content directly without saying informal sentences like 'okay'.`
      : `Create a detailed presentation about "${title}". Break the content into an introduction, 3–5 key points, and a conclusion. Output format should be:
        Slide 1: Title
        Content
        Slide 2: ...`;

    const customGenAI = new GoogleGenerativeAI(apiKey);
    const model = customGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ result: text, source: "gemini-api", title });
  } catch (err) {
    console.error("Gemini API error:", err.message || err);
    res.status(500).json({ error: "Failed to generate presentation" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
