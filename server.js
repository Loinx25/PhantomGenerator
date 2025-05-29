// 1. Load environment variables from .env file
require('dotenv').config();

// 2. Debug line (optional for development)
console.log('OpenAI API Key from env (should be your key):', process.env.OPENAI_API_KEY);

const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();
const port = 3000;

// 3. Instantiate the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint
app.post('/ask', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is missing in the request body.' });
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    if (chatCompletion.choices && chatCompletion.choices.length > 0 && chatCompletion.choices[0].message) {
      const answer = chatCompletion.choices[0].message.content;
      res.json({ answer });
    } else {
      console.error('OpenAI response format unexpected:', chatCompletion);
      res.status(500).json({ error: 'Unexpected response format from OpenAI.' });
    }
  } catch (error) {
    console.error('Error calling OpenAI API:');
    if (error instanceof OpenAI.APIError) {
      console.error('Status:', error.status);
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      console.error('Type:', error.type);
      res.status(error.status || 500).json({
        error: 'OpenAI API Error',
        details: error.message,
        code: error.code,
      });
    } else {
      console.error('Non-OpenAI error:', error);
      res.status(500).json({ error: 'Something went wrong on the server.' });
    }
  }
});

// Fallback route for SPA support
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'phanreal.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY is not set. OpenAI calls will likely fail.');
  } else {
    console.log('OpenAI API Key appears to be loaded.');
    console.log(`Frontend (phanreal.html) should be accessible at http://localhost:${port}/`);
    console.log('Fallback route is now active (using regex) and serving phanreal.html.');
  }
});
