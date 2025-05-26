// File: geminiClient.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
const YOUR_API_KEY = process.env.GEMNI_API_KEY;
const genAI = new GoogleGenerativeAI(YOUR_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function callGeminiAPI(prompt) {
  try {
    const result = await model.generateContent({ contents: [{ parts: [{ text: prompt }] }] });
    const output = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    return output || '';
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    throw new Error("Failed to generate content from Gemini API");
  }
}

module.exports = { callGeminiAPI };

