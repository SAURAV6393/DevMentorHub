const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/api/ai-hint", async (req, res) => {
  const { code, instruction } = req.body;

  const prompt = `The user is working on: ${instruction}\nTheir code is:\n${code}\n\nGive a helpful hint or fix suggestion.`;

  try {
    const aiResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // or "gpt-4"
      messages: [{ role: "user", content: prompt }],
    });

    const result = aiResponse.data.choices[0].message.content;
    res.json({ reply: result });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "AI error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
